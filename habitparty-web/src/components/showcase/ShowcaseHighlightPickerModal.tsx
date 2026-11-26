"use client";

import { Gem, Search, Sparkles, Trophy, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateMyHighlightsAction } from "@/actions/showcaseActions";
import { HighlightSlotSelectorBar } from "@/components/showcase/HighlightSlotSelectorBar";
import { PickerBadgesSection } from "@/components/showcase/picker/PickerBadgesSection";
import {
  type PickerGridItem,
  PickerItemGrid,
} from "@/components/showcase/picker/PickerItemGrid";
import { PickerMetricsSection } from "@/components/showcase/picker/PickerMetricsSection";
import { BaseModal } from "@/components/ui/BaseModal";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  HIGHLIGHT_MODAL_ITEMS_PER_PAGE,
  MAX_SHOWCASE_HIGHLIGHTS,
} from "@/constants/achievements";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type {
  AchievementItemResponseDTO,
  ArtifactItemResponseDTO,
  HighlightSlotInputDTO,
  HighlightType,
  ProfileHighlightResponseDTO,
  ShowcaseStatsResponseDTO,
  TaskStreakHighlightDTO,
} from "@/types/showcase";
import type { UserResponseDTO } from "@/types/user";
import { resolveUserLevelState } from "@/utils/levels";
import {
  resolveAchievementCopy,
  resolveArtifactCopy,
  resolveHighlightSlotCard,
} from "@/utils/showcaseUtils";
import { soundEffects } from "@/utils/soundEffects";

export type PickerTab = "achievements" | "artifacts" | "badges" | "metrics";

export interface PickerPendingItem {
  highlightType: "ACHIEVEMENT" | "ARTIFACT";
  referenceId: string | null;
  highlightKey: string;
}

interface ShowcaseHighlightPickerModalProps {
  isOpen: boolean;
  initialSlotIndex: number;
  initialTab?: PickerTab;
  initialPendingItem?: PickerPendingItem | null;
  user: UserResponseDTO;
  stats: ShowcaseStatsResponseDTO;
  highlights: ProfileHighlightResponseDTO[];
  achievements: AchievementItemResponseDTO[];
  artifacts?: ArtifactItemResponseDTO[];
  taskStreaks?: TaskStreakHighlightDTO[];
  onClose: () => void;
  onSaved: (updated: ProfileHighlightResponseDTO[]) => void;
}

type DraftHighlightSlot = HighlightSlotInputDTO & {
  taskStreak?: TaskStreakHighlightDTO | null;
};

function buildInitialDraftSlots(
  highlights: ProfileHighlightResponseDTO[],
  initialSlotIndex: number,
  initialPendingItem?: PickerPendingItem | null,
): (DraftHighlightSlot | null)[] {
  const nextSlots: (DraftHighlightSlot | null)[] = [null, null, null, null];
  for (const h of highlights) {
    if (h.displayOrder >= 0 && h.displayOrder < MAX_SHOWCASE_HIGHLIGHTS) {
      nextSlots[h.displayOrder] = {
        displayOrder: h.displayOrder,
        highlightType: h.highlightType,
        referenceId: h.referenceId,
        highlightKey: h.highlightKey,
        taskStreak: h.taskStreak ?? null,
      };
    }
  }

  if (
    initialPendingItem &&
    initialSlotIndex >= 0 &&
    initialSlotIndex < MAX_SHOWCASE_HIGHLIGHTS
  ) {
    const alreadyPinned = nextSlots.some(
      (s) =>
        s &&
        s.highlightType === initialPendingItem.highlightType &&
        ((Boolean(initialPendingItem.referenceId) &&
          s.referenceId === initialPendingItem.referenceId) ||
          (Boolean(initialPendingItem.highlightKey) &&
            s.highlightKey === initialPendingItem.highlightKey)),
    );
    if (!alreadyPinned) {
      nextSlots[initialSlotIndex] = {
        displayOrder: initialSlotIndex,
        highlightType: initialPendingItem.highlightType,
        referenceId: initialPendingItem.referenceId,
        highlightKey: initialPendingItem.highlightKey,
      };
    }
  }

  return nextSlots;
}

export function ShowcaseHighlightPickerModal({
  isOpen,
  initialSlotIndex,
  initialTab = "achievements",
  initialPendingItem = null,
  user,
  stats,
  highlights,
  achievements,
  artifacts = [],
  taskStreaks = [],
  onClose,
  onSaved,
}: ShowcaseHighlightPickerModalProps) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("showcase.pickerModal");
  const tHighlights = useTranslations("showcase.highlights");
  const tGallery = useTranslations("showcase.gallery");
  const tRarities = useTranslations("showcase.rarities");
  const tCatalog = useTranslations("showcase.catalog");
  const tBadges = useTranslations("showcase.accountBadges");
  const tArtifacts = useTranslations("showcase.artifacts");
  const tArtifactSource = useTranslations("showcase.artifacts.sourceLabels");
  const { isGamified } = useExperienceMode();

  const [activeSlot, setActiveSlot] = useState(initialSlotIndex);
  const [activeTab, setActiveTab] = useState<PickerTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [draftSlots, setDraftSlots] = useState<(DraftHighlightSlot | null)[]>(
    () =>
      buildInitialDraftSlots(highlights, initialSlotIndex, initialPendingItem),
  );
  const [isPending, startTransition] = useTransition();

  const mergedTaskStreaks = useMemo(() => {
    const byId = new Map<string, TaskStreakHighlightDTO>();
    for (const streak of taskStreaks) {
      byId.set(streak.id, streak);
    }
    for (const h of highlights) {
      if (h.taskStreak && !byId.has(h.taskStreak.id)) {
        byId.set(h.taskStreak.id, h.taskStreak);
      }
    }
    return Array.from(byId.values());
  }, [taskStreaks, highlights]);

  const { currentXp, levelTitle } = resolveUserLevelState(
    user,
    locale,
    isGamified,
    stats.totalXp,
  );

  const unlockedAchievements = useMemo(
    () => achievements.filter((a) => a.unlocked),
    [achievements],
  );
  const unlockedArtifacts = useMemo(
    () => artifacts.filter((a) => a.unlocked),
    [artifacts],
  );
  const activeTaskStreaks = useMemo(
    () => taskStreaks.filter((task) => (task.currentStreak ?? 0) > 0),
    [taskStreaks],
  );

  const filteredUnlockedAchievements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return unlockedAchievements;
    return unlockedAchievements.filter((ach) => {
      const { title, description } = resolveAchievementCopy(
        ach,
        isGamified,
        tCatalog,
      );
      return (
        title.toLowerCase().includes(query) ||
        description.toLowerCase().includes(query)
      );
    });
  }, [unlockedAchievements, searchQuery, isGamified, tCatalog]);

  const filteredUnlockedArtifacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return unlockedArtifacts;
    return unlockedArtifacts.filter((art) => {
      const { name, lore, sourceHint } = resolveArtifactCopy(
        art,
        isGamified,
        tArtifacts,
      );
      return (
        name.toLowerCase().includes(query) ||
        lore.toLowerCase().includes(query) ||
        sourceHint.toLowerCase().includes(query)
      );
    });
  }, [unlockedArtifacts, searchQuery, isGamified, tArtifacts]);

  const activeListLength =
    activeTab === "artifacts"
      ? filteredUnlockedArtifacts.length
      : filteredUnlockedAchievements.length;

  const totalPages = Math.max(
    1,
    Math.ceil(activeListLength / HIGHLIGHT_MODAL_ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedUnlockedAchievements = useMemo(
    () =>
      filteredUnlockedAchievements.slice(
        (safePage - 1) * HIGHLIGHT_MODAL_ITEMS_PER_PAGE,
        safePage * HIGHLIGHT_MODAL_ITEMS_PER_PAGE,
      ),
    [filteredUnlockedAchievements, safePage],
  );

  const paginatedUnlockedArtifacts = useMemo(
    () =>
      filteredUnlockedArtifacts.slice(
        (safePage - 1) * HIGHLIGHT_MODAL_ITEMS_PER_PAGE,
        safePage * HIGHLIGHT_MODAL_ITEMS_PER_PAGE,
      ),
    [filteredUnlockedArtifacts, safePage],
  );

  const slotTitlesByIndex = useMemo(
    () =>
      draftSlots.map((slotItem) => {
        const resolved = resolveHighlightSlotCard(slotItem, {
          achievements,
          artifacts,
          taskStreaks: mergedTaskStreaks,
          stats,
          isGamified,
          levelTitle,
          currentXp,
          tCatalog,
          tBadges,
          tArtifacts,
          tHighlights,
        });
        return resolved?.title ?? tHighlights("emptySlotTitle");
      }),
    [
      draftSlots,
      achievements,
      artifacts,
      mergedTaskStreaks,
      stats,
      isGamified,
      levelTitle,
      currentXp,
      tCatalog,
      tBadges,
      tArtifacts,
      tHighlights,
    ],
  );

  const getSlotTitle = useCallback(
    (slotItem: HighlightSlotInputDTO | null): string => {
      if (!slotItem) return tHighlights("emptySlotTitle");
      return (
        slotTitlesByIndex[slotItem.displayOrder] ??
        tHighlights("emptySlotTitle")
      );
    },
    [slotTitlesByIndex, tHighlights],
  );

  const equippedSlotLookup = useMemo(() => {
    const map = new Map<string, number>();
    draftSlots.forEach((s, idx) => {
      if (!s) return;
      if (s.highlightType === "ACHIEVEMENT" || s.highlightType === "ARTIFACT") {
        if (s.referenceId) {
          map.set(`${s.highlightType}:ID:${s.referenceId}`, idx);
        }
        if (s.highlightKey) {
          map.set(`${s.highlightType}:KEY:${s.highlightKey}`, idx);
        }
      } else if (s.highlightKey) {
        map.set(`${s.highlightType}:KEY:${s.highlightKey}`, idx);
      }
    });
    return map;
  }, [draftSlots]);

  const findEquippedSlotIndex = useCallback(
    (
      type: HighlightType,
      referenceId?: string | null,
      highlightKey?: string | null,
    ): number => {
      if (referenceId) {
        const byId = equippedSlotLookup.get(`${type}:ID:${referenceId}`);
        if (byId !== undefined) return byId;
      }
      if (highlightKey) {
        const byKey = equippedSlotLookup.get(`${type}:KEY:${highlightKey}`);
        if (byKey !== undefined) return byKey;
      }
      return -1;
    },
    [equippedSlotLookup],
  );

  const handleAssignItem = (
    type: HighlightType,
    referenceId: string | null,
    highlightKey: string | null,
  ) => {
    soundEffects.playCreateSound();
    const updated = [...draftSlots];
    const existingIdx = findEquippedSlotIndex(type, referenceId, highlightKey);

    // Toggle: clicar novamente no item já equipado no slot ativo remove-o do destaque
    if (existingIdx === activeSlot) {
      updated[activeSlot] = null;
      setDraftSlots(updated);
      return;
    }

    if (existingIdx !== -1) {
      updated[existingIdx] = null;
    }

    updated[activeSlot] = {
      displayOrder: activeSlot,
      highlightType: type,
      referenceId,
      highlightKey,
      taskStreak:
        type === "TASK_STREAK" && highlightKey
          ? (mergedTaskStreaks.find((item) => item.id === highlightKey) ?? null)
          : null,
    };

    const nextEmpty = updated.findIndex(
      (s, idx) => s === null && idx !== activeSlot,
    );
    setDraftSlots(updated);
    if (nextEmpty !== -1) {
      setActiveSlot(nextEmpty);
    }
  };

  const handleClearSlot = (slotIdx: number) => {
    setDraftSlots((prev) => {
      const updated = [...prev];
      updated[slotIdx] = null;
      return updated;
    });
  };

  const handleSave = () => {
    if (isPending) return;
    const validItems: HighlightSlotInputDTO[] = [];
    draftSlots.forEach((item, idx) => {
      if (item) {
        validItems.push({
          displayOrder: idx,
          highlightType: item.highlightType,
          referenceId: item.referenceId,
          highlightKey: item.highlightKey,
        });
      }
    });

    startTransition(async () => {
      const res = await updateMyHighlightsAction({ highlights: validItems });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      soundEffects.playTaskCompleteSound();
      toast.success(t("savedToast"));
      useUserStore.getState().triggerAchievementCheck();
      if (res.data) {
        onSaved(res.data);
      }
      onClose();
    });
  };

  const tabOptions = useMemo(
    () => [
      {
        value: "achievements" as const,
        label: t("tabs.achievements", { count: unlockedAchievements.length }),
      },
      {
        value: "artifacts" as const,
        label: t("tabs.artifacts", { count: unlockedArtifacts.length }),
      },
      {
        value: "badges" as const,
        label: t("tabs.badges"),
      },
      {
        value: "metrics" as const,
        label: t("tabs.metrics"),
      },
    ],
    [t, unlockedAchievements.length, unlockedArtifacts.length],
  );

  const showSearch =
    (activeTab === "achievements" && unlockedAchievements.length > 0) ||
    (activeTab === "artifacts" && unlockedArtifacts.length > 0);
  const allSlotsOccupied = draftSlots.every(Boolean);
  const alreadyEquippedLabel = (slot: number) => t("alreadyEquipped", { slot });

  const achievementGridItems: PickerGridItem[] =
    paginatedUnlockedAchievements.map((ach) => {
      const { title, description } = resolveAchievementCopy(
        ach,
        isGamified,
        tCatalog,
      );
      return {
        key: ach.code,
        iconKey: ach.iconName,
        iconFallback: "trophy",
        title,
        subtitle: description,
        rarity: ach.rarity,
        rarityLabel: tRarities(ach.rarity),
        equippedSlot: findEquippedSlotIndex("ACHIEVEMENT", ach.id, ach.code),
        onSelect: () => handleAssignItem("ACHIEVEMENT", ach.id, ach.code),
      };
    });

  const artifactGridItems: PickerGridItem[] = paginatedUnlockedArtifacts.map(
    (artifact) => {
      const { name, lore } = resolveArtifactCopy(
        artifact,
        isGamified,
        tArtifacts,
      );
      const originKey = (artifact.obtainedSource ||
        artifact.sourceType) as never;
      const originLabel = tArtifactSource.has(originKey)
        ? tArtifactSource(originKey)
        : "";
      return {
        key: artifact.code,
        iconKey: artifact.iconName,
        iconFallback: "sparkles",
        title: name,
        titleWraps: true,
        subtitle: originLabel || lore,
        rarity: artifact.rarity,
        rarityLabel: tRarities(artifact.rarity),
        equippedSlot: findEquippedSlotIndex(
          "ARTIFACT",
          artifact.id,
          artifact.code,
        ),
        onSelect: () =>
          handleAssignItem("ARTIFACT", artifact.id, artifact.code),
      };
    },
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      preventClose={isPending}
      maxWidth="max-w-3xl"
      borderColor="border-gold/30"
      headerIcon={<Sparkles size={18} />}
      headerIconClassName="bg-gold/15 border-gold/30 text-amber-700 dark:text-gold"
      title={t("title")}
      description={t("subtitle")}
    >
      <div className="flex flex-col gap-4">
        {/* SELETOR DOS 4 SLOTS */}
        <HighlightSlotSelectorBar
          draftSlots={draftSlots}
          activeSlot={activeSlot}
          onSelectSlot={setActiveSlot}
          onClearSlot={handleClearSlot}
          getSlotTitle={getSlotTitle}
        />

        {allSlotsOccupied && (
          <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
            {t("replaceSlotNotice", { slot: activeSlot + 1 })}
          </p>
        )}

        {/* ABAS DE CATEGORIA + BUSCA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-700 dark:border-primary/15">
          <SegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={(val) => {
              setActiveTab(val);
              setSearchQuery("");
              setCurrentPage(1);
            }}
            size="sm"
            className="w-full sm:w-auto"
          />

          {showSearch && (
            <search className="w-full sm:w-64">
              <Input
                type="search"
                compact
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                icon={<Search size={14} aria-hidden="true" />}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={
                  activeTab === "artifacts"
                    ? t("searchPlaceholderArtifacts")
                    : tGallery("searchPlaceholder")
                }
                aria-label={
                  activeTab === "artifacts"
                    ? t("searchPlaceholderArtifacts")
                    : tGallery("searchPlaceholder")
                }
                className="pr-8"
                endAdornment={
                  searchQuery ? (
                    <button
                      type="button"
                      aria-label={t("searchClearLabel")}
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="p-1 text-neutral-400 hover:text-neutral-100 cursor-pointer rounded-md"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  ) : undefined
                }
              />
            </search>
          )}
        </div>

        {/* LISTA DE OPÇÕES */}
        <div className="min-h-[260px]">
          {activeTab === "achievements" && (
            <PickerItemGrid
              items={achievementGridItems}
              alreadyEquippedLabel={alreadyEquippedLabel}
              emptyState={{
                icon: (
                  <Trophy
                    size={28}
                    className="mx-auto text-neutral-400 mb-2 opacity-60"
                    aria-hidden="true"
                  />
                ),
                message:
                  unlockedAchievements.length === 0
                    ? t("noUnlockedAchievements")
                    : tGallery("emptySearch"),
              }}
              pagination={{
                currentPage: safePage,
                totalPages,
                totalItems: filteredUnlockedAchievements.length,
                onPageChange: setCurrentPage,
              }}
            />
          )}

          {activeTab === "artifacts" && (
            <PickerItemGrid
              items={artifactGridItems}
              alreadyEquippedLabel={alreadyEquippedLabel}
              emptyState={{
                icon: (
                  <Gem
                    size={28}
                    className="mx-auto text-neutral-400 mb-2 opacity-60"
                    aria-hidden="true"
                  />
                ),
                message:
                  unlockedArtifacts.length === 0
                    ? t("noUnlockedArtifacts")
                    : tGallery("emptySearch"),
              }}
              pagination={{
                currentPage: safePage,
                totalPages,
                totalItems: filteredUnlockedArtifacts.length,
                onPageChange: setCurrentPage,
              }}
            />
          )}

          {activeTab === "badges" && (
            <PickerBadgesSection
              user={user}
              isGamified={isGamified}
              levelTitle={levelTitle}
              currentXp={currentXp}
              findEquippedSlotIndex={findEquippedSlotIndex}
              onAssign={handleAssignItem}
            />
          )}

          {activeTab === "metrics" && (
            <PickerMetricsSection
              stats={stats}
              achievements={achievements}
              artifacts={artifacts}
              taskStreaks={taskStreaks}
              activeTaskStreaks={activeTaskStreaks}
              isGamified={isGamified}
              levelTitle={levelTitle}
              currentXp={currentXp}
              findEquippedSlotIndex={findEquippedSlotIndex}
              onAssign={handleAssignItem}
            />
          )}
        </div>

        {/* FOOTER */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-neutral-700 dark:border-primary/20">
          <span className="text-xs text-neutral-400">
            {t("activeSlotLabel", { slot: activeSlot + 1 })}
          </span>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="flex-1 sm:flex-initial justify-center px-4 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:bg-surface-hover cursor-pointer"
            >
              {t("cancelButton")}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="flex-1 sm:flex-initial justify-center px-4 py-2 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-xs cursor-pointer"
            >
              {isPending ? t("savingButton") : t("saveButton")}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
