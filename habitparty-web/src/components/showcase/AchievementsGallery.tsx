"use client";

import { Sparkles, Trophy, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { AchievementCard } from "@/components/showcase/AchievementCard";
import { FilterBar } from "@/components/ui/FilterBar";
import { Pagination } from "@/components/ui/Pagination";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENT_RARITIES,
  ACHIEVEMENTS_PER_PAGE,
} from "@/constants/achievements";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type {
  AchievementCategory,
  AchievementItemResponseDTO,
  AchievementRarity,
  ProfileHighlightResponseDTO,
} from "@/types/showcase";
import { cn, resolveAchievementCopy } from "@/utils";
import { soundEffects } from "@/utils/soundEffects";

interface AchievementsGalleryProps {
  achievements: AchievementItemResponseDTO[];
  highlights: ProfileHighlightResponseDTO[];
  isVisitorMode: boolean;
  onPinAchievement: (achievement: AchievementItemResponseDTO) => void;
}

type StatusFilter = "ALL" | "UNLOCKED" | "LOCKED";
type CategoryFilter = "ALL" | AchievementCategory;
type RarityFilter = "ALL" | AchievementRarity;

export function AchievementsGallery({
  achievements,
  highlights,
  isVisitorMode,
  onPinAchievement,
}: AchievementsGalleryProps) {
  const t = useTranslations("showcase.gallery");
  const tCategories = useTranslations("showcase.categories");
  const tRarities = useTranslations("showcase.rarities");
  const tCatalog = useTranslations("showcase.catalog");
  const { isGamified } = useExperienceMode();

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pinnedAchievementIdsOrCodes = useMemo(() => {
    const set = new Set<string>();
    for (const h of highlights) {
      if (h.highlightType === "ACHIEVEMENT") {
        if (h.referenceId) set.add(h.referenceId);
        if (h.highlightKey) set.add(h.highlightKey);
      }
    }
    return set;
  }, [highlights]);

  const baseCategoryAchievements = useMemo(() => {
    return achievements.filter((ach) => {
      if (categoryFilter !== "ALL" && ach.category !== categoryFilter) {
        return false;
      }
      if (rarityFilter !== "ALL" && ach.rarity !== rarityFilter) {
        return false;
      }
      return true;
    });
  }, [achievements, categoryFilter, rarityFilter]);

  const unlockedCount = useMemo(
    () => baseCategoryAchievements.filter((a) => a.unlocked).length,
    [baseCategoryAchievements],
  );
  const totalCategoryCount = baseCategoryAchievements.length;
  const lockedCount = totalCategoryCount - unlockedCount;

  const searchHaystackById = useMemo(() => {
    const secretHaystack = t("secretTitle").toLowerCase();
    const map = new Map<string, string>();
    for (const ach of achievements) {
      if (ach.isSecret && !ach.unlocked) {
        map.set(ach.id, secretHaystack);
      } else {
        const { title, description } = resolveAchievementCopy(
          ach,
          isGamified,
          tCatalog,
        );
        map.set(ach.id, `${title}\n${description}`.toLowerCase());
      }
    }
    return map;
  }, [achievements, isGamified, t, tCatalog]);

  const filteredAchievements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return baseCategoryAchievements.filter((ach) => {
      if (isVisitorMode && !ach.unlocked) {
        return false;
      }
      if (!isVisitorMode) {
        if (statusFilter === "UNLOCKED" && !ach.unlocked) {
          return false;
        }
        if (statusFilter === "LOCKED" && ach.unlocked) {
          return false;
        }
      }
      if (query) {
        return searchHaystackById.get(ach.id)?.includes(query) ?? false;
      }
      return true;
    });
  }, [
    baseCategoryAchievements,
    statusFilter,
    searchQuery,
    isVisitorMode,
    searchHaystackById,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAchievements.length / ACHIEVEMENTS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const paginatedAchievements = useMemo(
    () =>
      filteredAchievements.slice(
        (safePage - 1) * ACHIEVEMENTS_PER_PAGE,
        safePage * ACHIEVEMENTS_PER_PAGE,
      ),
    [filteredAchievements, safePage],
  );

  const statusOptions = useMemo(
    () => [
      {
        value: "ALL" as const,
        label: t("statusFilter.ALL", { count: totalCategoryCount }),
      },
      {
        value: "UNLOCKED" as const,
        label: t("statusFilter.UNLOCKED", { count: unlockedCount }),
      },
      {
        value: "LOCKED" as const,
        label: t("statusFilter.LOCKED", { count: lockedCount }),
      },
    ],
    [t, totalCategoryCount, unlockedCount, lockedCount],
  );

  const rarityOptions = useMemo(
    () => [
      { value: "ALL", label: t("rarityFilterAll") },
      ...ACHIEVEMENT_RARITIES.map((rarity) => ({
        value: rarity,
        label: tRarities(rarity),
      })),
    ],
    [t, tRarities],
  );

  const categoryTabs: CategoryFilter[] = ["ALL", ...ACHIEVEMENT_CATEGORIES];

  return (
    <section className="@container flex flex-col gap-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-body-l font-extrabold text-neutral-50 flex items-center gap-2">
            <Trophy
              size={18}
              className="text-amber-700 dark:text-gold shrink-0"
            />
            <span>{isGamified ? t("titleGamified") : t("titleEssential")}</span>
          </h2>
          <p className="text-body-s text-neutral-300 mt-0.5">
            {isGamified ? t("subtitleGamified") : t("subtitleEssential")}
          </p>
        </div>

        {!isVisitorMode && (
          <button
            type="button"
            onClick={() => soundEffects.playAchievementUnlockSound("LEGENDARY")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-card hover:bg-surface border border-neutral-700 text-neutral-200 hover:border-gold/45 hover:text-amber-700 dark:bg-surface/70 dark:border-primary/25 dark:hover:text-gold shadow-2xs dark:shadow-none transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Volume2 size={14} className="text-amber-700 dark:text-gold" />
            <span>{t("testSoundButton")}</span>
          </button>
        )}
      </div>

      {/* CATEGORY TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {categoryTabs.map((cat) => {
          const isActive = categoryFilter === cat;
          const label = tCategories(
            (isGamified ? `${cat}.gamified` : `${cat}.essential`) as never,
          );
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategoryFilter(cat);
                setCurrentPage(1);
              }}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0",
                isActive
                  ? "bg-gold/15 border-gold text-amber-700 dark:text-gold shadow-glow-gold-xs"
                  : "bg-card border-neutral-700 text-neutral-300 hover:border-primary/40 hover:text-neutral-100 shadow-2xs dark:bg-surface/50 dark:border-primary/20 dark:shadow-none",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* FILTER BAR: SEARCH + STATUS + RARITY */}
      <FilterBar
        search={{
          value: searchQuery,
          onChange: (val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          },
          placeholder: t("searchPlaceholder"),
        }}
        middleActions={
          !isVisitorMode ? (
            <SegmentedControl
              options={statusOptions}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              size="sm"
              className="w-full md:w-auto"
            />
          ) : undefined
        }
        rightActions={
          <div className="w-full sm:w-44">
            <Select
              compact
              variant="filter"
              className="w-full"
              icon={
                <Sparkles size={14} className="text-amber-600 dark:text-gold" />
              }
              options={rarityOptions}
              value={rarityFilter}
              onChange={(val) => {
                setRarityFilter((val || "ALL") as RarityFilter);
                setCurrentPage(1);
              }}
              aria-label={t("rarityFilterAll")}
            />
          </div>
        }
      />

      {/* GRID OF ACHIEVEMENT CARDS */}
      {filteredAchievements.length === 0 ? (
        <div className="rounded-2xl border border-neutral-700 dark:border-primary/20 bg-card dark:bg-surface/35 shadow-2xs dark:shadow-none p-6 sm:p-10 text-center text-body-s text-neutral-400">
          {isVisitorMode ? t("emptyVisitorGallery") : t("emptySearch")}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 @xl:grid-cols-2 @4xl:grid-cols-3 gap-4">
            {paginatedAchievements.map((ach) => (
              <AchievementCard
                key={ach.code}
                achievement={ach}
                isPinnedInShowcase={
                  pinnedAchievementIdsOrCodes.has(ach.id) ||
                  pinnedAchievementIdsOrCodes.has(ach.code)
                }
                isVisitorMode={isVisitorMode}
                onPinToShowcase={onPinAchievement}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={filteredAchievements.length}
              itemsPerPage={ACHIEVEMENTS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}
    </section>
  );
}
