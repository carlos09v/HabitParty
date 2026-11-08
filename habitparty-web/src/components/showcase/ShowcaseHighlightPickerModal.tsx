"use client";

import { Check, Lock, Search, Sparkles, Trash2, Trophy, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateMyHighlightsAction } from "@/actions/showcaseActions";
import { AchievementIcon } from "@/components/showcase/AchievementIcon";
import { BaseModal } from "@/components/ui/BaseModal";
import { Pagination } from "@/components/ui/Pagination";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  ACCOUNT_BADGE_DEFINITIONS,
  HIGHLIGHT_MODAL_ITEMS_PER_PAGE,
  MAX_SHOWCASE_HIGHLIGHTS,
  RARITY_THEMES,
  STAT_METRIC_DEFINITIONS,
} from "@/constants/achievements";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type {
  AchievementItemResponseDTO,
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
  resolveHighlightSlotCard,
  resolveStatMetricCopy,
  resolveUserLevelState,
} from "@/utils";
import { soundEffects } from "@/utils/soundEffects";

interface ShowcaseHighlightPickerModalProps {
  isOpen: boolean;
  initialSlotIndex: number;
  user: UserResponseDTO;
  stats: ShowcaseStatsResponseDTO;
  highlights: ProfileHighlightResponseDTO[];
  achievements: AchievementItemResponseDTO[];
  onClose: () => void;
  onSaved: (updated: ProfileHighlightResponseDTO[]) => void;
}

type PickerTab = "achievements" | "badges" | "metrics";

function buildInitialDraftSlots(
  highlights: ProfileHighlightResponseDTO[],
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
  return nextSlots;
}

export function ShowcaseHighlightPickerModal({
  isOpen,
  initialSlotIndex,
  user,
  stats,
  highlights,
  achievements,
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
  const tMetrics = useTranslations("showcase.statMetrics");
  const { isGamified } = useExperienceMode();

  const [activeSlot, setActiveSlot] = useState(initialSlotIndex);
  const [activeTab, setActiveTab] = useState<PickerTab>("achievements");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [draftSlots, setDraftSlots] = useState<
    (HighlightSlotInputDTO | null)[]
  >(() => buildInitialDraftSlots(highlights));
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

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredUnlockedAchievements.length / HIGHLIGHT_MODAL_ITEMS_PER_PAGE,
    ),
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

  const getSlotTitle = (slotItem: HighlightSlotInputDTO | null): string => {
    const resolved = resolveHighlightSlotCard(slotItem, {
      achievements,
      stats,
      isGamified,
      levelTitle,
      currentXp,
      tCatalog,
      tBadges,
      tMetrics,
    });
    return resolved?.title ?? tHighlights("emptySlotTitle");
  };

  const findEquippedSlotIndex = (
    type: HighlightType,
    referenceId?: string | null,
    highlightKey?: string | null,
  ): number => {
    return draftSlots.findIndex((s) => {
      if (!s || s.highlightType !== type) return false;
      if (type === "ACHIEVEMENT") {
        return s.referenceId === referenceId;
      }
      return s.highlightKey === highlightKey;
    });
  };

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
        if (type === "ACHIEVEMENT") {
          return s.referenceId === referenceId;
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
        value: "badges" as const,
        label: t("tabs.badges"),
      },
      {
        value: "metrics" as const,
        label: t("tabs.metrics"),
      },
    ],
    [t, unlockedAchievements.length],
  );

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {([0, 1, 2, 3] as const).map((slotIdx) => {
            const slotItem = draftSlots[slotIdx] ?? null;
            const isSelectedSlot = activeSlot === slotIdx;
            return (
              <div
                key={`picker-slot-${slotIdx}`}
                className={cn(
                  "relative rounded-xl border p-2.5 flex flex-col justify-between gap-1 text-left transition-colors",
                  isSelectedSlot
                    ? "border-gold bg-gold/15 shadow-glow-gold-xs"
                    : "border-neutral-700 bg-card hover:border-primary/45 dark:border-primary/25 dark:bg-surface/60",
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => setActiveSlot(slotIdx)}
                    className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-gold cursor-pointer text-left flex-1"
                  >
                    {tHighlights("slotLabel", { index: slotIdx + 1 })}
                  </button>
                  {slotItem && (
                    <button
                      type="button"
                      onClick={() => handleClearSlot(slotIdx)}
                      className="text-neutral-400 hover:text-red-400 p-0.5 rounded cursor-pointer"
                      title={t("clearSlot")}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSlot(slotIdx)}
                  className={cn(
                    "text-xs font-bold truncate text-left cursor-pointer",
                    slotItem ? "text-neutral-100" : "text-neutral-400 italic",
                  )}
                >
                  {getSlotTitle(slotItem)}
                </button>
              </div>
            );
          })}
        </div>

        {/* ABAS DE CATEGORIA + BUSCA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-700 dark:border-primary/15">
          <SegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={(val) => setActiveTab(val)}
            size="sm"
          />

          {activeTab === "achievements" && unlockedAchievements.length > 0 && (
            <div className="relative w-full sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={tGallery("searchPlaceholder")}
                className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-neutral-600 bg-card text-xs text-neutral-50 placeholder:text-neutral-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-primary/25 dark:bg-surface/80 dark:text-neutral-100 dark:focus:border-gold dark:focus:ring-2 dark:focus:ring-gold/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-100 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* LISTA DE OPÇÕES */}
        <div className="min-h-[260px]">
          {activeTab === "achievements" &&
            (unlockedAchievements.length === 0 ? (
              <div className="rounded-xl border border-neutral-700 bg-surface/50 dark:border-primary/20 dark:bg-surface/40 p-8 text-center">
                <Trophy
                  size={28}
                  className="mx-auto text-neutral-400 mb-2 opacity-60"
                />
                <p className="text-body-s text-neutral-300 max-w-md mx-auto">
                  {t("noUnlockedAchievements")}
                </p>
              </div>
            ) : filteredUnlockedAchievements.length === 0 ? (
              <div className="rounded-xl border border-neutral-700 bg-surface/50 dark:border-primary/20 dark:bg-surface/40 p-8 text-center">
                <Trophy
                  size={28}
                  className="mx-auto text-neutral-400 mb-2 opacity-60"
                />
                <p className="text-body-s text-neutral-300 max-w-md mx-auto">
                  {tGallery("emptySearch")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paginatedUnlockedAchievements.map((ach) => {
                    const theme = RARITY_THEMES[ach.rarity];
                    const equippedSlot = findEquippedSlotIndex(
                      "ACHIEVEMENT",
                      ach.id,
                      ach.code,
                    );
                    const isEquipped = equippedSlot !== -1;
                    const { title, description } = resolveAchievementCopy(
                      ach,
                      isGamified,
                      tCatalog,
                    );

                    return (
                      <button
                        key={ach.code}
                        type="button"
                        onClick={() =>
                          handleAssignItem("ACHIEVEMENT", ach.id, ach.code)
                        }
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
                          <AchievementIcon iconKey={ach.iconName} size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-neutral-100 truncate">
                              {title}
                            </span>
                            <span
                              className={cn(
                                "px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase border shrink-0",
                                theme.badgeBg,
                                theme.badgeText,
                                theme.badgeBorder,
                              )}
                            >
                              {tRarities(ach.rarity)}
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                            {isEquipped
                              ? t("alreadyEquipped", {
                                  slot: equippedSlot + 1,
                                })
                              : description}
                          </p>
                        </div>
                        {isEquipped && (
                          <Check
                            size={16}
                            className="text-amber-600 dark:text-gold shrink-0"
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
                    totalItems={filteredUnlockedAchievements.length}
                    itemsPerPage={HIGHLIGHT_MODAL_ITEMS_PER_PAGE}
                    isCompact
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            ))}

          {activeTab === "badges" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ACCOUNT_BADGE_DEFINITIONS.map((badge) => {
                const unlocked = isAccountBadgeUnlocked(badge.id, user);
                const theme = RARITY_THEMES[badge.rarity];
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

          {activeTab === "metrics" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {STAT_METRIC_DEFINITIONS.map((metric) => {
                const theme = RARITY_THEMES[metric.rarity];
                const equippedSlot = findEquippedSlotIndex(
                  "STAT_METRIC",
                  null,
                  metric.id,
                );
                const isEquipped = equippedSlot !== -1;
                const { title, valueFormatted } = resolveStatMetricCopy(
                  metric.id,
                  stats,
                  isGamified,
                  tMetrics,
                );

                return (
                  <button
                    key={metric.id}
                    type="button"
                    onClick={() =>
                      handleAssignItem("STAT_METRIC", null, metric.id)
                    }
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors cursor-pointer",
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
                      <AchievementIcon iconKey={metric.iconKey} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-neutral-100 block truncate">
                        {title}
                      </span>
                      <p className="text-xs font-extrabold text-amber-700 dark:text-gold mt-0.5">
                        {valueFormatted}
                      </p>
                    </div>
                    {isEquipped && (
                      <Check
                        size={16}
                        className="text-amber-600 dark:text-gold shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-700 dark:border-primary/20">
          <span className="text-xs text-neutral-400">
            {t("activeSlotLabel", { slot: activeSlot + 1 })}
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-300 hover:bg-surface-hover cursor-pointer"
            >
              {t("cancelButton")}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleSave}
              className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gold text-on-gold hover:bg-gold-hover shadow-glow-gold-xs cursor-pointer"
            >
              {isPending ? t("savingButton") : t("saveButton")}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
