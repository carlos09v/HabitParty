"use client";

import { Sparkles, Trophy } from "lucide-react";
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
import {
  type ShowcaseRarityFilter,
  useShowcaseGalleryFilter,
} from "@/hooks/useShowcaseGalleryFilter";
import type {
  AchievementCategory,
  AchievementItemResponseDTO,
  ProfileHighlightResponseDTO,
} from "@/types/showcase";
import { cn } from "@/utils/cn";
import { resolveAchievementCopy } from "@/utils/showcaseUtils";

interface AchievementsGalleryProps {
  achievements: AchievementItemResponseDTO[];
  highlights: ProfileHighlightResponseDTO[];
  isVisitorMode: boolean;
  onPinAchievement: (achievement: AchievementItemResponseDTO) => void;
  onUnpinAchievement?: (achievement: AchievementItemResponseDTO) => void;
}

type StatusFilter = "ALL" | "UNLOCKED" | "LOCKED";
type CategoryFilter = "ALL" | AchievementCategory;

export function AchievementsGallery({
  achievements,
  highlights,
  isVisitorMode,
  onPinAchievement,
  onUnpinAchievement,
}: AchievementsGalleryProps) {
  const t = useTranslations("showcase.gallery");
  const tCategories = useTranslations("showcase.categories");
  const tRarities = useTranslations("showcase.rarities");
  const tCatalog = useTranslations("showcase.catalog");
  const { isGamified } = useExperienceMode();

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const {
    rarityFilter,
    setRarityFilter,
    searchQuery,
    setSearchQuery,
    isPinned,
    rarityOptions,
  } = useShowcaseGalleryFilter({
    highlights,
    highlightType: "ACHIEVEMENT",
    rarities: ACHIEVEMENT_RARITIES,
    rarityAllLabel: t("rarityFilterAll"),
    getRarityLabel: (rarity) => tRarities(rarity),
  });

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
              aria-hidden="true"
            />
            <span>{isGamified ? t("titleGamified") : t("titleEssential")}</span>
          </h2>
          <p className="text-body-s text-neutral-300 mt-0.5">
            {isGamified
              ? t("subtitleGamified", { total: achievements.length })
              : t("subtitleEssential", { total: achievements.length })}
          </p>
        </div>
      </div>

      {/* CATEGORY FILTERS */}
      <fieldset className="border-0 p-0 m-0 flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <legend className="sr-only">{t("categoryFilterAria")}</legend>
        {categoryTabs.map((cat) => {
          const isActive = categoryFilter === cat;
          const label = tCategories(
            (isGamified ? `${cat}.gamified` : `${cat}.essential`) as never,
          );
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={isActive}
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
      </fieldset>

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
                <Sparkles size={14} className="text-amber-800 dark:text-gold" />
              }
              options={rarityOptions}
              value={rarityFilter}
              onChange={(val) => {
                setRarityFilter((val || "ALL") as ShowcaseRarityFilter);
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
                isPinnedInShowcase={isPinned(ach.id, ach.code)}
                isVisitorMode={isVisitorMode}
                onPinToShowcase={onPinAchievement}
                onUnpinFromShowcase={onUnpinAchievement}
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
