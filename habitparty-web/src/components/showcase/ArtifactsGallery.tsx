"use client";

import { Gem, Lock, Pin, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AchievementIcon } from "@/components/showcase/AchievementIcon";
import { FilterBar } from "@/components/ui/FilterBar";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { ACHIEVEMENT_RARITIES, getRarityTheme } from "@/constants/achievements";
import { DEFAULT_TOTAL_ARTIFACTS_COUNT } from "@/constants/artifacts";
import { useDateFormat } from "@/hooks/useDateFormat";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type {
  AchievementRarity,
  ArtifactItemResponseDTO,
  ProfileHighlightResponseDTO,
} from "@/types/showcase";
import { cn, formatShortDate, resolveArtifactCopy } from "@/utils";

interface ArtifactsGalleryProps {
  artifacts: ArtifactItemResponseDTO[];
  highlights: ProfileHighlightResponseDTO[];
  isVisitorMode: boolean;
  onPinArtifact: (artifact: ArtifactItemResponseDTO) => void;
}

type ArtifactFilterMode = "ALL" | "UNLOCKED" | "MERIT" | "EXPLORATION";
type RarityFilter = "ALL" | AchievementRarity;

export function ArtifactsGallery({
  artifacts,
  highlights,
  isVisitorMode,
  onPinArtifact,
}: ArtifactsGalleryProps) {
  const locale = useLocale() as AppLocale;
  const { dateFormat } = useDateFormat();
  const userTimeZone = useUserStore((s) => s.user?.timezone);
  const t = useTranslations("showcase.artifacts.gallery");
  const tSource = useTranslations("showcase.artifacts.sourceLabels");
  const tArtifacts = useTranslations("showcase.artifacts");
  const tRarities = useTranslations("showcase.rarities");
  const { isGamified } = useExperienceMode();

  const [filterMode, setFilterMode] = useState<ArtifactFilterMode>("ALL");
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const pinnedArtifactIdsOrCodes = useMemo(() => {
    const set = new Set<string>();
    for (const h of highlights) {
      if (h.highlightType === "ARTIFACT") {
        if (h.referenceId) set.add(h.referenceId);
        if (h.highlightKey) set.add(h.highlightKey);
      }
    }
    return set;
  }, [highlights]);

  const resolvedArtifacts = useMemo(() => {
    return artifacts.map((artifact) => {
      const { name, lore, sourceHint } = resolveArtifactCopy(
        artifact,
        isGamified,
        tArtifacts,
      );
      const originKey = (artifact.obtainedSource ||
        artifact.sourceType) as never;
      const originLabel = tSource.has(originKey)
        ? tSource(originKey)
        : artifact.sourceType;
      return {
        artifact,
        name,
        lore,
        sourceHint,
        originLabel,
        searchHaystack:
          `${name} ${lore} ${sourceHint} ${originLabel}`.toLowerCase(),
      };
    });
  }, [artifacts, isGamified, tArtifacts, tSource]);

  const counts = useMemo(() => {
    let unlocked = 0;
    let merit = 0;
    let exploration = 0;
    for (const item of artifacts) {
      if (item.unlocked) unlocked++;
      if (!isVisitorMode || item.unlocked) {
        if (item.sourceType === "ACHIEVEMENT") merit++;
        if (item.sourceType === "MYSTERY_BOX") exploration++;
      }
    }
    return {
      total: isVisitorMode ? unlocked : artifacts.length,
      unlocked,
      merit,
      exploration,
    };
  }, [artifacts, isVisitorMode]);

  const filteredArtifacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return resolvedArtifacts
      .filter(({ artifact, searchHaystack }) => {
        if (isVisitorMode && !artifact.unlocked) return false;
        if (!isVisitorMode && filterMode === "UNLOCKED" && !artifact.unlocked) {
          return false;
        }
        if (filterMode === "MERIT" && artifact.sourceType !== "ACHIEVEMENT") {
          return false;
        }
        if (
          filterMode === "EXPLORATION" &&
          artifact.sourceType !== "MYSTERY_BOX"
        ) {
          return false;
        }
        if (rarityFilter !== "ALL" && artifact.rarity !== rarityFilter) {
          return false;
        }
        if (query && !searchHaystack.includes(query)) {
          return false;
        }
        return true;
      })
      .slice()
      .sort((a, b) => {
        if (a.artifact.unlocked !== b.artifact.unlocked) {
          return a.artifact.unlocked ? -1 : 1;
        }
        return a.artifact.displayOrder - b.artifact.displayOrder;
      });
  }, [resolvedArtifacts, isVisitorMode, filterMode, rarityFilter, searchQuery]);

  const effectiveFilterMode =
    isVisitorMode && filterMode === "UNLOCKED" ? "ALL" : filterMode;

  const filterOptions = useMemo(() => {
    const base = [
      {
        value: "ALL" as const,
        label: t("filter.ALL", { count: counts.total }),
      },
      ...(!isVisitorMode
        ? [
            {
              value: "UNLOCKED" as const,
              label: t("filter.UNLOCKED", { count: counts.unlocked }),
            },
          ]
        : []),
      {
        value: "MERIT" as const,
        label: t("filter.MERIT", { count: counts.merit }),
      },
      {
        value: "EXPLORATION" as const,
        label: t(
          isGamified ? "filter.EXPLORATION" : "filter.EXPLORATION_ESSENTIAL",
          { count: counts.exploration },
        ),
      },
    ];
    return base;
  }, [t, counts, isGamified, isVisitorMode]);

  const rarityOptions = useMemo(
    () => [
      { value: "ALL", label: t("rarityFilterAll") },
      ...ACHIEVEMENT_RARITIES.filter(
        (rarity) =>
          rarity === "RARE" || rarity === "EPIC" || rarity === "LEGENDARY",
      ).map((rarity) => ({
        value: rarity,
        label: tRarities(rarity),
      })),
    ],
    [t, tRarities],
  );

  const catalogTotal = artifacts.length || DEFAULT_TOTAL_ARTIFACTS_COUNT;

  return (
    <section className="@container flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-body-l font-extrabold text-neutral-50 flex items-center gap-2">
            <Gem
              size={18}
              className="text-amber-700 dark:text-gold shrink-0"
              aria-hidden="true"
            />
            <span>{isGamified ? t("titleGamified") : t("titleEssential")}</span>
          </h2>
          <p className="text-body-s text-neutral-300 mt-0.5">
            {isGamified ? t("subtitleGamified") : t("subtitleEssential")}
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/15 border border-gold/40 text-xs font-extrabold text-amber-800 dark:text-gold shrink-0 self-start sm:self-auto tabular-nums">
          <Sparkles size={13} aria-hidden="true" />
          <span>
            {t("collectionCountBadge", {
              unlocked: counts.unlocked,
              total: catalogTotal,
            })}
          </span>
        </div>
      </div>

      <FilterBar
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: t("searchPlaceholder"),
        }}
        middleActions={
          <SegmentedControl
            options={filterOptions}
            value={effectiveFilterMode}
            onChange={(val) => setFilterMode(val)}
            size="sm"
            className="w-full md:w-auto"
          />
        }
        rightActions={
          <div className="w-full sm:w-44">
            <Select
              compact
              variant="filter"
              className="w-full"
              icon={
                <Sparkles
                  size={14}
                  className="text-amber-800 dark:text-gold"
                  aria-hidden="true"
                />
              }
              options={rarityOptions}
              value={rarityFilter}
              onChange={(val) =>
                setRarityFilter((val || "ALL") as RarityFilter)
              }
              aria-label={t("rarityFilterAll")}
            />
          </div>
        }
      />

      {filteredArtifacts.length === 0 ? (
        <div className="rounded-2xl border border-neutral-700 dark:border-primary/20 bg-card dark:bg-surface/40 p-8 text-center">
          <p className="text-body-s text-neutral-300">
            {isVisitorMode ? t("emptyVisitor") : t("emptySearch")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-4 gap-4">
          {filteredArtifacts.map(
            ({ artifact, name, lore, sourceHint, originLabel }) => {
              const theme = getRarityTheme(artifact.rarity);
              const isPinned =
                pinnedArtifactIdsOrCodes.has(artifact.id) ||
                pinnedArtifactIdsOrCodes.has(artifact.code);
              const isNewRelic =
                artifact.unlocked && !artifact.seen && !isVisitorMode;
              const formattedDate = artifact.unlockedAt
                ? formatShortDate(artifact.unlockedAt, {
                    includeYear: true,
                    monthFormat: "short",
                    locale,
                    dateFormat,
                    timeZone: userTimeZone,
                  })
                : null;

              return (
                <article
                  key={artifact.id || artifact.code}
                  className={cn(
                    "relative overflow-hidden rounded-2xl border p-4 flex flex-col justify-between gap-3 transition-colors",
                    artifact.unlocked
                      ? cn(
                          "bg-card dark:bg-surface/60",
                          theme.cardBorder,
                          theme.cardGlow,
                        )
                      : "border-neutral-700 bg-surface/55 dark:border-primary/15 dark:bg-surface/20",
                  )}
                >
                  {artifact.unlocked && (
                    <div
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-20 dark:opacity-50",
                        theme.accentGradient,
                      )}
                    />
                  )}

                  <div className="relative z-10 flex items-start justify-between gap-2.5">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl border flex items-center justify-center shrink-0",
                        artifact.unlocked
                          ? cn(theme.iconBg, theme.iconText)
                          : "bg-neutral-300/75 border-neutral-400/50 dark:bg-neutral-800/90 dark:border-neutral-700/80",
                      )}
                    >
                      <AchievementIcon
                        iconKey={artifact.iconName}
                        size={24}
                        fallback="sparkles"
                        className={
                          artifact.unlocked
                            ? undefined
                            : "[filter:brightness(0)] opacity-35 dark:opacity-55"
                        }
                      />
                    </div>

                    <div className="flex flex-col items-end gap-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        {isNewRelic && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                            {t("newBadge")}
                          </span>
                        )}
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                            artifact.unlocked
                              ? cn(
                                  theme.badgeBg,
                                  theme.badgeText,
                                  theme.badgeBorder,
                                )
                              : "bg-surface text-neutral-300 border-neutral-600/60",
                          )}
                        >
                          {tRarities(artifact.rarity)}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-300 text-right break-words">
                        {!artifact.unlocked && (
                          <Lock size={10} aria-hidden="true" />
                        )}
                        <span>{originLabel}</span>
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 flex-1 flex flex-col gap-1 min-w-0">
                    <h3
                      className={cn(
                        "text-body-s font-extrabold break-words",
                        artifact.unlocked
                          ? "text-neutral-50"
                          : "text-neutral-300",
                      )}
                    >
                      {name}
                    </h3>
                    <p className="text-tiny text-neutral-300 leading-relaxed break-words">
                      {artifact.unlocked ? lore : sourceHint}
                    </p>
                  </div>

                  <div className="relative z-10 pt-2.5 border-t border-neutral-700 dark:border-primary/15 flex flex-wrap items-center justify-between gap-2">
                    {artifact.unlocked ? (
                      <>
                        <span className="text-[11px] text-neutral-400">
                          {formattedDate
                            ? t("unlockedOn", { date: formattedDate })
                            : t("unlockedBadge")}
                        </span>

                        {!isVisitorMode && (
                          <button
                            type="button"
                            onClick={() => onPinArtifact(artifact)}
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer whitespace-nowrap shrink-0",
                              isPinned
                                ? "bg-gold/20 border-gold text-amber-700 dark:text-gold"
                                : "bg-surface/70 border-neutral-700 text-neutral-200 hover:border-gold/50 hover:text-amber-700 dark:border-primary/25 dark:text-neutral-300 dark:hover:text-gold",
                            )}
                          >
                            <Pin size={11} aria-hidden="true" />
                            <span>
                              {isPinned
                                ? t("pinnedInShowcase")
                                : t("pinToShowcase")}
                            </span>
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400">
                        <Lock size={11} aria-hidden="true" />
                        <span>{t("lockedBadge")}</span>
                      </span>
                    )}
                  </div>
                </article>
              );
            },
          )}
        </div>
      )}
    </section>
  );
}
