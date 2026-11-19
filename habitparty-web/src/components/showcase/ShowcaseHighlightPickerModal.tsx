"use client";

import { Check, Gem, Lock, Search, Sparkles, Trophy, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  type ReactNode,
  useCallback,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import { updateMyHighlightsAction } from "@/actions/showcaseActions";
import { AchievementIcon } from "@/components/showcase/AchievementIcon";
import { HighlightSlotSelectorBar } from "@/components/showcase/HighlightSlotSelectorBar";
import { BaseModal } from "@/components/ui/BaseModal";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  ACCOUNT_BADGE_DEFINITIONS,
  getRarityTheme,
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
} from "@/types/showcase";
import type { UserResponseDTO } from "@/types/user";
import {
  cn,
  isAccountBadgeUnlocked,
  resolveAccountBadgeCopy,
  resolveAchievementCopy,
  resolveArtifactCopy,
  resolveHighlightSlotCard,
  resolveUserLevelState,
} from "@/utils";
import { soundEffects } from "@/utils/soundEffects";

export type PickerTab = "achievements" | "artifacts" | "badges";

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
  onClose: () => void;
  onSaved: (updated: ProfileHighlightResponseDTO[]) => void;
}

function buildInitialDraftSlots(
  highlights: ProfileHighlightResponseDTO[],
  initialSlotIndex: number,
  initialPendingItem?: PickerPendingItem | null,
): (HighlightSlotInputDTO | null)[] {
  const nextSlots: (HighlightSlotInputDTO | null)[] = [null, null, null, null];
  for (const h of highlights) {
    if (h.displayOrder >= 0 && h.displayOrder < MAX_SHOWCASE_HIGHLIGHTS) {
      nextSlots[h.displayOrder] = {
        displayOrder: h.displayOrder,
        highlightType: h.highlightType,
        referenceId: h.referenceId,
        highlightKey: h.highlightKey,
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

interface PickerCatalogCardEntry {
  key: string;
  itemType: "ACHIEVEMENT" | "ARTIFACT";
  referenceId: string | null;
  highlightKey: string;
  iconKey: string;
  iconFallback: "trophy" | "sparkles";
  title: string;
  titleWraps?: boolean;
  subtitle: string;
  rarity: AchievementItemResponseDTO["rarity"];
  rarityLabel: string;
  equippedSlot: number;
}

function HighlightCatalogGrid({
  totalUnlockedCount,
  filteredCount,
  entries,
  emptyUnlockedMessage,
  emptySearchMessage,
  emptyIcon,
  safePage,
  totalPages,
  alreadyEquippedLabel,
  onSelectEntry,
  onPageChange,
}: {
  totalUnlockedCount: number;
  filteredCount: number;
  entries: PickerCatalogCardEntry[];
  emptyUnlockedMessage: string;
  emptySearchMessage: string;
  emptyIcon: ReactNode;
  safePage: number;
  totalPages: number;
  alreadyEquippedLabel: (slot: number) => string;
  onSelectEntry: (entry: PickerCatalogCardEntry) => void;
  onPageChange: (page: number) => void;
}) {
  if (totalUnlockedCount === 0 || filteredCount === 0) {
    return (
      <div className="rounded-xl border border-neutral-700 bg-surface/50 dark:border-primary/20 dark:bg-surface/40 p-8 text-center">
        {emptyIcon}
        <p className="text-body-s text-neutral-300 max-w-md mx-auto">
          {totalUnlockedCount === 0 ? emptyUnlockedMessage : emptySearchMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {entries.map((entry) => {
          const theme = getRarityTheme(entry.rarity);
          const isEquipped = entry.equippedSlot !== -1;

          return (
            <button
              key={entry.key}
              type="button"
              aria-pressed={isEquipped}
              onClick={() => onSelectEntry(entry)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border text-left transition-colors cursor-pointer",
                isEquipped
                  ? "border-gold bg-gold/15"
                  : "border-neutral-700 bg-card hover:border-primary/45 dark:border-primary/20 dark:bg-surface/50",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0",
                  theme.iconBg,
                  theme.iconText,
                )}
              >
                <AchievementIcon
                  iconKey={entry.iconKey}
                  size={20}
                  fallback={entry.iconFallback}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    "flex items-center gap-1.5",
                    entry.titleWraps && "flex-wrap",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-bold text-neutral-100",
                      entry.titleWraps ? "break-words" : "truncate",
                    )}
                  >
                    {entry.title}
                  </span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase border shrink-0",
                      theme.badgeBg,
                      theme.badgeText,
                      theme.badgeBorder,
                    )}
                  >
                    {entry.rarityLabel}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                  {isEquipped
                    ? alreadyEquippedLabel(entry.equippedSlot + 1)
                    : entry.subtitle}
                </p>
              </div>
              {isEquipped && (
                <Check
                  size={16}
                  className="text-amber-600 dark:text-gold shrink-0"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filteredCount}
          itemsPerPage={HIGHLIGHT_MODAL_ITEMS_PER_PAGE}
          isCompact
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
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
  const [draftSlots, setDraftSlots] = useState<
    (HighlightSlotInputDTO | null)[]
  >(() =>
    buildInitialDraftSlots(highlights, initialSlotIndex, initialPendingItem),
  );
  const [isPending, startTransition] = useTransition();

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
        if (s.referenceId)
          map.set(`${s.highlightType}:ID:${s.referenceId}`, idx);
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
    setDraftSlots((prev) => {
      const updated = [...prev];
      const existingIdx = updated.findIndex((s) => {
        if (!s || s.highlightType !== type) return false;
        if (type === "ACHIEVEMENT" || type === "ARTIFACT") {
          return (
            (Boolean(referenceId) && s.referenceId === referenceId) ||
            (Boolean(highlightKey) && s.highlightKey === highlightKey)
          );
        }
        return s.highlightKey === highlightKey;
      });

      if (existingIdx !== -1 && existingIdx !== activeSlot) {
        updated[existingIdx] = null;
      }

      updated[activeSlot] = {
        displayOrder: activeSlot,
        highlightType: type,
        referenceId,
        highlightKey,
      };

      const nextEmpty = updated.findIndex(
        (s, idx) => s === null && idx !== activeSlot,
      );
      if (nextEmpty !== -1) {
        setActiveSlot(nextEmpty);
      }

      return updated;
    });
  };

  const handleClearSlot = (slotIdx: number) => {
    setDraftSlots((prev) => {
      const updated = [...prev];
      updated[slotIdx] = null;
      return updated;
    });
  };

  const handleSave = () => {
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
    ],
    [t, unlockedAchievements.length, unlockedArtifacts.length],
  );

  const showSearch =
    (activeTab === "achievements" && unlockedAchievements.length > 0) ||
    (activeTab === "artifacts" && unlockedArtifacts.length > 0);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
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

        {/* ABAS DE CATEGORIA + BUSCA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-700 dark:border-primary/15">
          <SegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={(val) => {
              setActiveTab(val);
              setCurrentPage(1);
            }}
            size="sm"
            className="w-full sm:w-auto"
          />

          {showSearch && (
            <div className="w-full sm:w-64">
              <Input
                type="search"
                compact
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
            </div>
          )}
        </div>

        {/* LISTA DE OPÇÕES */}
        <div className="min-h-[260px]">
          {activeTab === "achievements" && (
            <HighlightCatalogGrid
              totalUnlockedCount={unlockedAchievements.length}
              filteredCount={filteredUnlockedAchievements.length}
              entries={paginatedUnlockedAchievements.map((ach) => {
                const { title, description } = resolveAchievementCopy(
                  ach,
                  isGamified,
                  tCatalog,
                );
                return {
                  key: ach.code,
                  itemType: "ACHIEVEMENT",
                  referenceId: ach.id,
                  highlightKey: ach.code,
                  iconKey: ach.iconName,
                  iconFallback: "trophy",
                  title,
                  subtitle: description,
                  rarity: ach.rarity,
                  rarityLabel: tRarities(ach.rarity),
                  equippedSlot: findEquippedSlotIndex(
                    "ACHIEVEMENT",
                    ach.id,
                    ach.code,
                  ),
                };
              })}
              emptyUnlockedMessage={t("noUnlockedAchievements")}
              emptySearchMessage={tGallery("emptySearch")}
              emptyIcon={
                <Trophy
                  size={28}
                  className="mx-auto text-neutral-400 mb-2 opacity-60"
                  aria-hidden="true"
                />
              }
              safePage={safePage}
              totalPages={totalPages}
              alreadyEquippedLabel={(slot) => t("alreadyEquipped", { slot })}
              onSelectEntry={(entry) =>
                handleAssignItem(
                  entry.itemType,
                  entry.referenceId,
                  entry.highlightKey,
                )
              }
              onPageChange={setCurrentPage}
            />
          )}

          {activeTab === "artifacts" && (
            <HighlightCatalogGrid
              totalUnlockedCount={unlockedArtifacts.length}
              filteredCount={filteredUnlockedArtifacts.length}
              entries={paginatedUnlockedArtifacts.map((artifact) => {
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
                  itemType: "ARTIFACT",
                  referenceId: artifact.id,
                  highlightKey: artifact.code,
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
                };
              })}
              emptyUnlockedMessage={t("noUnlockedArtifacts")}
              emptySearchMessage={tGallery("emptySearch")}
              emptyIcon={
                <Gem
                  size={28}
                  className="mx-auto text-neutral-400 mb-2 opacity-60"
                  aria-hidden="true"
                />
              }
              safePage={safePage}
              totalPages={totalPages}
              alreadyEquippedLabel={(slot) => t("alreadyEquipped", { slot })}
              onSelectEntry={(entry) =>
                handleAssignItem(
                  entry.itemType,
                  entry.referenceId,
                  entry.highlightKey,
                )
              }
              onPageChange={setCurrentPage}
            />
          )}

          {activeTab === "badges" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACCOUNT_BADGE_DEFINITIONS.map((badge) => {
                const unlocked = isAccountBadgeUnlocked(badge.id, user);
                const theme = getRarityTheme(badge.rarity);
                const equippedSlot = findEquippedSlotIndex(
                  "ACCOUNT_BADGE",
                  null,
                  badge.id,
                );
                const isEquipped = equippedSlot !== -1;
                const { title, description } = resolveAccountBadgeCopy(
                  badge.id,
                  isGamified,
                  levelTitle,
                  currentXp,
                  tBadges,
                );

                return (
                  <button
                    key={badge.id}
                    type="button"
                    disabled={!unlocked}
                    aria-pressed={isEquipped}
                    onClick={() =>
                      unlocked &&
                      handleAssignItem("ACCOUNT_BADGE", null, badge.id)
                    }
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors",
                      !unlocked
                        ? "border-neutral-700 bg-surface/50 dark:border-primary/15 dark:bg-surface/20 opacity-55 cursor-not-allowed"
                        : isEquipped
                          ? "border-gold bg-gold/15 cursor-pointer"
                          : "border-neutral-700 bg-card hover:border-primary/45 dark:border-primary/20 dark:bg-surface/50 cursor-pointer",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0",
                        theme.iconBg,
                        theme.iconText,
                      )}
                    >
                      <AchievementIcon iconKey={badge.iconKey} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-neutral-100 block truncate">
                        {title}
                      </span>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">
                        {!unlocked
                          ? tBadges(`${badge.id}.lockedHint` as const)
                          : isEquipped
                            ? t("alreadyEquipped", { slot: equippedSlot + 1 })
                            : description}
                      </p>
                    </div>
                    {!unlocked ? (
                      <Lock size={14} className="text-neutral-400 shrink-0" />
                    ) : isEquipped ? (
                      <Check
                        size={16}
                        className="text-amber-600 dark:text-gold shrink-0"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
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
