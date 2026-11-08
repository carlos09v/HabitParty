"use client";

import { Plus, SlidersHorizontal, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AchievementIcon } from "@/components/showcase/AchievementIcon";
import {
  MAX_SHOWCASE_HIGHLIGHTS,
  RARITY_THEMES,
} from "@/constants/achievements";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type {
  AchievementItemResponseDTO,
  ProfileHighlightResponseDTO,
  ShowcaseStatsResponseDTO,
} from "@/types/showcase";
import type { UserResponseDTO } from "@/types/user";
import { cn, resolveHighlightSlotCard, resolveUserLevelState } from "@/utils";

interface ShowcaseHighlightsSectionProps {
  user: UserResponseDTO;
  stats: ShowcaseStatsResponseDTO;
  highlights: ProfileHighlightResponseDTO[];
  achievements: AchievementItemResponseDTO[];
  isVisitorMode: boolean;
  onOpenPicker: (slotIndex: number) => void;
  isCompact?: boolean;
}

export function ShowcaseHighlightsSection({
  user,
  stats,
  highlights,
  achievements,
  isVisitorMode,
  onOpenPicker,
  isCompact = false,
}: ShowcaseHighlightsSectionProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("showcase.highlights");
  const tRarities = useTranslations("showcase.rarities");
  const tCatalog = useTranslations("showcase.catalog");
  const tBadges = useTranslations("showcase.accountBadges");
  const tMetrics = useTranslations("showcase.statMetrics");
  const { isGamified } = useExperienceMode();

  const { currentXp, levelTitle } = resolveUserLevelState(
    user,
    locale,
    isGamified,
    stats.totalXp,
  );

  const slots = Array.from({ length: MAX_SHOWCASE_HIGHLIGHTS }, (_, index) => {
    const highlight = highlights.find((h) => h.displayOrder === index) || null;
    const resolved = resolveHighlightSlotCard(highlight, {
      achievements,
      stats,
      isGamified,
      levelTitle,
      currentXp,
      tCatalog,
      tBadges,
      tMetrics,
    });
    return { index, highlight, resolved };
  });

  const hasAnyHighlight = slots.some((s) => s.resolved !== null);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-body-l font-extrabold text-neutral-50 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-700 dark:text-gold" />
            <span>{isGamified ? t("titleGamified") : t("titleEssential")}</span>
          </h2>
          <p className="text-body-s text-neutral-300 mt-0.5">
            {isGamified ? t("subtitleGamified") : t("subtitleEssential")}
          </p>
        </div>

        {!isVisitorMode && (
          <button
            type="button"
            onClick={() => onOpenPicker(0)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gold/15 text-amber-700 dark:text-gold border border-gold/40 hover:bg-gold/25 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <SlidersHorizontal size={14} />
            <span>{t("customizeButton")}</span>
          </button>
        )}
      </div>

      {isVisitorMode && !hasAnyHighlight ? (
        <div className="rounded-2xl border border-neutral-700 dark:border-primary/20 bg-card dark:bg-surface/40 shadow-2xs dark:shadow-none p-6 text-center text-body-s text-neutral-400">
          {t("emptyVisitorText")}
        </div>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
            isCompact ? "gap-3" : "gap-4",
          )}
        >
          {slots.map(({ index, highlight, resolved }) => {
            if (!resolved || !highlight) {
              if (isVisitorMode) {
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-neutral-700 dark:border-primary/10 bg-card/50 dark:bg-surface/20 p-4 flex flex-col items-center justify-center min-h-[132px] opacity-50 dark:opacity-40"
                  >
                    <span className="text-tiny text-neutral-400">
                      {t("slotLabel", { index: index + 1 })}
                    </span>
                  </div>
                );
              }

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onOpenPicker(index)}
                  className="group relative rounded-2xl border-2 border-dashed border-neutral-600 hover:border-gold/60 bg-card/60 hover:bg-card dark:border-primary/25 dark:bg-surface/25 dark:hover:bg-gold/5 p-4 flex flex-col items-center justify-center text-center gap-2 min-h-[140px] transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 group-hover:bg-gold/20 border border-primary/25 group-hover:border-gold/40 flex items-center justify-center text-neutral-400 group-hover:text-amber-700 dark:text-neutral-300 dark:group-hover:text-gold transition-colors">
                    <Plus size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-200 group-hover:text-neutral-50">
                      {t("emptySlotTitle")} #{index + 1}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5 max-w-[180px]">
                      {t("emptySlotCta")}
                    </p>
                  </div>
                </button>
              );
            }

            const theme = RARITY_THEMES[resolved.rarity] || RARITY_THEMES.RARE;

            const cardContent = (
              <>
                <div
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-20 dark:opacity-55",
                    theme.accentGradient,
                  )}
                />

                <div className="relative z-10 flex items-start justify-between gap-2 w-full">
                  <div
                    className={cn(
                      "w-11 h-11 rounded-xl border flex items-center justify-center shrink-0",
                      theme.iconBg,
                      theme.iconText,
                    )}
                  >
                    <AchievementIcon iconKey={resolved.iconKey} size={22} />
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                        theme.badgeBg,
                        theme.badgeText,
                        theme.badgeBorder,
                      )}
                    >
                      {t(`typeBadge.${highlight.highlightType}`)} •{" "}
                      {tRarities(resolved.rarity)}
                    </span>

                    {resolved.extraBadge && (
                      <span className="text-[11px] font-bold text-amber-700 dark:text-gold">
                        {resolved.extraBadge}
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative z-10 w-full text-left">
                  <h3 className="text-body-s font-extrabold text-neutral-50 line-clamp-1">
                    {resolved.title}
                  </h3>
                  <p className="text-tiny text-neutral-300 line-clamp-2 mt-0.5 leading-snug">
                    {resolved.subtitle}
                  </p>
                </div>
              </>
            );

            if (isVisitorMode) {
              return (
                <article
                  key={`slot-${index}`}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border p-4 flex flex-col justify-between gap-3 min-h-[140px] bg-card dark:bg-surface/60 transition-colors",
                    theme.cardBorder,
                    theme.cardGlow,
                  )}
                >
                  {cardContent}
                </article>
              );
            }

            return (
              <button
                key={`slot-${index}`}
                type="button"
                onClick={() => onOpenPicker(index)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-4 flex flex-col justify-between gap-3 min-h-[140px] bg-card dark:bg-surface/60 transition-[transform,border-color,background-color] duration-200 cursor-pointer hover:-translate-y-0.5 text-left",
                  theme.cardBorder,
                  theme.cardGlow,
                )}
              >
                {cardContent}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
