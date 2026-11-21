"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { Crown, Pencil, Plus, Trash2, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import { reorderRewards } from "@/actions/rewardActions";
import { LazyUpgradePremiumModal } from "@/components/subscription/LazyUpgradePremiumModal";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { FilterBar } from "@/components/ui/FilterBar";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import {
  FREE_MAX_REWARD_CARDS,
  MAX_ACTIVE_DEBT_CARDS,
  MAX_REWARD_PACKAGES_PER_CARD,
  PREMIUM_MAX_REWARD_CARDS,
  REWARD_CATEGORY_FILTER_VALUES,
  REWARD_PACKAGE_FILTER_VALUES,
  REWARD_SORT_VALUES,
  REWARD_TYPE_FILTER_VALUES,
} from "@/constants/reward";
import {
  ExperienceModeFallbackProvider,
  useExperienceMode,
} from "@/hooks/useExperienceMode";
import { useItemCatalogFilters } from "@/hooks/useItemCatalogFilters";
import { useReorderableList } from "@/hooks/useReorderableList";
import { useRewardCatalogActions } from "@/hooks/useRewardCatalogActions";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { Reward, RewardDisplayEntry } from "@/types/reward";
import type { ExperienceMode } from "@/types/ui";
import { cn } from "@/utils";
import { calculateRewardWelcomeStats } from "@/utils/catalogMetrics";
import {
  formatRewardVariantBadge,
  groupRewardsForShowcase,
} from "@/utils/rewardGrouping";
import {
  toCategoryMessageKey,
  toPackageMessageKey,
  toRewardTypeMessageKey,
} from "@/utils/rewardMapper";
import { RewardsCatalogView } from "./RewardsCatalogView";

const RewardFormModal = dynamic(
  () =>
    import("./RewardFormModal").then((mod) => ({
      default: mod.RewardFormModal,
    })),
  { ssr: false },
);

interface RewardsContainerProps {
  initialRewards: Reward[];
  initialCoins?: number;
  initialIsPremium?: boolean;
  initialExperienceMode?: ExperienceMode;
}

export function RewardsContainer({
  initialRewards,
  initialCoins = 0,
  initialIsPremium = false,
  initialExperienceMode = "PRODUCTIVITY",
}: RewardsContainerProps) {
  return (
    <ExperienceModeFallbackProvider mode={initialExperienceMode}>
      <RewardsContainerContent
        initialRewards={initialRewards}
        initialCoins={initialCoins}
        initialIsPremium={initialIsPremium}
        initialExperienceMode={initialExperienceMode}
      />
    </ExperienceModeFallbackProvider>
  );
}

function RewardsContainerContent({
  initialRewards,
  initialCoins,
  initialIsPremium,
  initialExperienceMode,
}: Required<RewardsContainerProps>) {
  const t = useTranslations("rewards.container");
  const tOptions = useTranslations("rewards.options");
  const { isGamified } = useExperienceMode(initialExperienceMode);
  const locale = useLocale() as AppLocale;
  const storeHasUser = useUserStore((s) => s.user !== null);
  const storeIsPremium = useUserStore((s) => Boolean(s.user?.isPremium));
  const isPremium = storeHasUser ? storeIsPremium : initialIsPremium;

  const [onlyAffordable, setOnlyAffordable] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedVariantByGroup, setSelectedVariantByGroup] = useState<
    Record<string, string>
  >({});
  const displayedEntriesRef = useRef<RewardDisplayEntry[]>([]);

  const {
    viewMode,
    setViewMode,
    filters,
    isFiltering,
    handleFilterChange,
    handleClearFilters,
  } = useItemCatalogFilters("rewards");

  const handleClearAllFilters = useCallback(() => {
    handleClearFilters();
    setOnlyAffordable(false);
  }, [handleClearFilters]);

  const resolveGroupedRewardOrder = useCallback(
    (activeId: string, overId: string) => {
      const currentEntries = displayedEntriesRef.current;
      const oldIdx = currentEntries.findIndex(
        (entry) => entry.groupId === activeId,
      );
      const newIdx = currentEntries.findIndex(
        (entry) => entry.groupId === overId,
      );
      if (oldIdx === -1 || newIdx === -1) return null;
      return arrayMove(currentEntries, oldIdx, newIdx).flatMap(
        (entry) => entry.variants,
      );
    },
    [],
  );

  const {
    items: rewards,
    setItems: setRewards,
    sensors,
    handleDragEnd,
  } = useReorderableList<Reward>({
    initialItems: initialRewards,
    onReorderServerAction: reorderRewards,
    isFiltering: isFiltering || onlyAffordable,
    onlyChangedOrderIndex: true,
    resolveDragReorder: resolveGroupedRewardOrder,
  });

  const {
    currentCoins,
    contextMenu,
    closeContextMenu,
    handleContextMenu,
    handleEditReward,
    handleEditFromContextMenu,
    handleAddPackageFromContextMenu,
    handleDeleteFromContextMenu,
    handleDeleteGroupFromContextMenu,
    checkingDeleteRewardIds,
    rewardToDelete,
    setRewardToDelete,
    deleteRewardHistory,
    setDeleteRewardHistory,
    handleConfirmDeleteReward,
    groupToDelete,
    setGroupToDelete,
    deleteGroupHistory,
    setDeleteGroupHistory,
    handleConfirmDeleteGroup,
    isFormModalOpen,
    editingReward,
    editingGroup,
    prefillDraft,
    handleAddProduct,
    handleAddDebt,
    handleCloseFormModal,
    handleRewardSuccess,
    handleRewardGroupSuccess,
    isDeleting,
    redeemingRewardIds,
    handleBuy,
  } = useRewardCatalogActions({ rewards, setRewards });

  const handleSelectVariant = useCallback(
    (groupId: string, variantId: string) => {
      setSelectedVariantByGroup((prev) => ({
        ...prev,
        [groupId]: variantId,
      }));
    },
    [],
  );

  const categoryOptions = useMemo(
    () =>
      REWARD_CATEGORY_FILTER_VALUES.map((value) => ({
        value,
        label: value
          ? tOptions(`categories.${toCategoryMessageKey(value)}`)
          : tOptions("categories.all"),
      })),
    [tOptions],
  );

  const typeOptions = useMemo(
    () =>
      REWARD_TYPE_FILTER_VALUES.map((value) => ({
        value,
        label: value
          ? value === "MysteryBox"
            ? isGamified
              ? tOptions("types.MysteryBox")
              : tOptions("types.MysteryBoxProductivity")
            : tOptions(`types.${toRewardTypeMessageKey(value)}`)
          : tOptions("types.all"),
      })),
    [isGamified, tOptions],
  );

  const packageOptions = useMemo(
    () =>
      REWARD_PACKAGE_FILTER_VALUES.map((value) => ({
        value,
        label: value
          ? tOptions(`packages.${toPackageMessageKey(value)}`)
          : tOptions("packages.all"),
      })),
    [tOptions],
  );

  const sortOptions = useMemo(
    () =>
      REWARD_SORT_VALUES.map((value) => ({
        value,
        label: tOptions(`sort.${value || "default"}`),
      })),
    [tOptions],
  );

  const resolvedCoins = currentCoins ?? initialCoins;

  const allGroupedEntries = useMemo(
    () => groupRewardsForShowcase(rewards),
    [rewards],
  );
  // Dívidas descartáveis possuem cota implícita independente e não consomem o limite regular de cards
  const activeDebtsCount = useMemo(
    () =>
      rewards.filter(
        (reward) => toCategoryMessageKey(reward.category) === "DEBT",
      ).length,
    [rewards],
  );
  const totalShowcaseCards = useMemo(
    () =>
      allGroupedEntries.filter(
        (entry) =>
          toCategoryMessageKey(entry.primaryReward.category) !== "DEBT",
      ).length,
    [allGroupedEntries],
  );
  const maxRewardCards = isPremium
    ? PREMIUM_MAX_REWARD_CARDS
    : FREE_MAX_REWARD_CARDS;
  const isCardLimitReached = totalShowcaseCards >= maxRewardCards;
  const planName = isPremium ? t("planPremium") : t("planFree");

  const coinFilterLimit = onlyAffordable ? resolvedCoins : null;

  const filteredRewards = useMemo(() => {
    if (!isFiltering && coinFilterLimit === null) {
      return rewards;
    }

    const searchLower = filters.search.trim().toLowerCase();
    const filterTypeKey = filters.type
      ? toRewardTypeMessageKey(filters.type)
      : null;
    const filterCategoryKey = filters.category
      ? toCategoryMessageKey(filters.category)
      : null;
    const filterPackageKey = filters.packageLevel
      ? toPackageMessageKey(filters.packageLevel)
      : null;

    let result = rewards.filter((r) => {
      if (
        searchLower &&
        !r.title.toLowerCase().includes(searchLower) &&
        !(r.description || "").toLowerCase().includes(searchLower)
      ) {
        return false;
      }
      if (filterTypeKey && toRewardTypeMessageKey(r.type) !== filterTypeKey) {
        return false;
      }
      if (
        filterCategoryKey &&
        toCategoryMessageKey(r.category) !== filterCategoryKey
      ) {
        return false;
      }
      if (
        filterPackageKey &&
        toPackageMessageKey(r.packageLevel) !== filterPackageKey
      ) {
        return false;
      }
      if (coinFilterLimit !== null && r.price > coinFilterLimit) {
        return false;
      }
      return true;
    });

    if (filters.sortBy === "price-asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === "price-desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === "name") {
      result = [...result].sort((a, b) =>
        a.title.localeCompare(b.title, locale),
      );
    }

    return result;
  }, [rewards, isFiltering, filters, coinFilterLimit, locale]);

  const displayedEntries = useMemo(
    () =>
      isFiltering || onlyAffordable
        ? groupRewardsForShowcase(filteredRewards)
        : allGroupedEntries,
    [isFiltering, onlyAffordable, filteredRewards, allGroupedEntries],
  );
  displayedEntriesRef.current = displayedEntries;

  const welcomeStats = useMemo(() => {
    const { stats } = calculateRewardWelcomeStats(
      allGroupedEntries,
      resolvedCoins,
      locale,
      isGamified,
    );
    return stats.map((stat, index) => {
      if (index === 1) {
        return {
          ...stat,
          active: onlyAffordable,
          onClick: () => setOnlyAffordable((prev) => !prev),
        };
      }
      if (index === 2) {
        return {
          ...stat,
          onClick:
            isFiltering || onlyAffordable ? handleClearAllFilters : undefined,
        };
      }
      return stat;
    });
  }, [
    allGroupedEntries,
    resolvedCoins,
    locale,
    isGamified,
    onlyAffordable,
    isFiltering,
    handleClearAllFilters,
  ]);

  const contextGroup = contextMenu.groupContext;
  const isContextGrouped = Boolean(
    contextGroup && contextGroup.variants.length > 1,
  );
  const canAddPackageToContext = Boolean(
    contextMenu.reward &&
      toRewardTypeMessageKey(contextMenu.reward.type) === "TimeBased" &&
      (!contextGroup ||
        contextGroup.variants.length < MAX_REWARD_PACKAGES_PER_CARD),
  );

  return (
    <>
      <WelcomeCard storageKey="rewards" stats={welcomeStats} />

      <section className="flex-1 min-h-0 flex flex-col gap-6 w-full pb-10">
        <FilterBar
          search={{
            value: filters.search,
            onChange: (v) => handleFilterChange({ search: v }),
          }}
          viewMode={{
            value: viewMode,
            onChange: setViewMode,
          }}
          dropdownFilters={[
            {
              id: "category",
              label: t("filters.category"),
              options: categoryOptions,
              value: filters.category,
            },
            {
              id: "type",
              label: t("filters.type"),
              options: typeOptions,
              value: filters.type,
            },
            {
              id: "packageLevel",
              label: t("filters.packageLevel"),
              options: packageOptions,
              value: filters.packageLevel || "",
            },
            {
              id: "sortBy",
              label: t("filters.sortBy"),
              options: sortOptions,
              value: filters.sortBy || "",
            },
          ]}
          onDropdownChange={(id, value) => handleFilterChange({ [id]: value })}
          onClearDropdowns={handleClearAllFilters}
          middleActions={
            onlyAffordable ? (
              <button
                type="button"
                onClick={() => setOnlyAffordable(false)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/45 bg-emerald-500/15 px-2.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
              >
                <span>{t("filters.affordableActive")}</span>
                <X size={13} aria-hidden="true" />
              </button>
            ) : undefined
          }
          rightActions={
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium tabular-nums",
                  isCardLimitReached
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "border-neutral-700 bg-surface dark:border-white/15 dark:bg-surface/60 text-neutral-300",
                )}
                title={
                  isCardLimitReached
                    ? t("limitReachedTitle", {
                        current: totalShowcaseCards,
                        max: maxRewardCards,
                        plan: planName,
                      })
                    : t("limitUsedTitle", {
                        current: totalShowcaseCards,
                        max: maxRewardCards,
                      })
                }
              >
                {isPremium && (
                  <Crown size={12} className="text-gold fill-gold/20" />
                )}
                <span>
                  {totalShowcaseCards}/{maxRewardCards}
                </span>
              </div>

              {isCardLimitReached ? (
                <div className="flex items-center gap-2">
                  {activeDebtsCount < MAX_ACTIVE_DEBT_CARDS && (
                    <button
                      type="button"
                      onClick={handleAddDebt}
                      title={t("addDebtTitle")}
                      className="flex items-center gap-1 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-2.5 text-body-s font-semibold text-rose-700 hover:bg-rose-500/20 dark:border-rose-400/35 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25 transition-colors shrink-0 cursor-pointer select-none"
                    >
                      <Plus size={14} />
                      <span>{t("addDebtButton")}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={
                      isPremium ? undefined : () => setIsUpgradeModalOpen(true)
                    }
                    disabled={isPremium}
                    title={
                      isPremium
                        ? t("maxLimitReachedTitle", { max: maxRewardCards })
                        : t("upgradeLimitTitle")
                    }
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3.5 py-2.5 text-body-s font-bold transition-colors shrink-0 select-none",
                      isPremium
                        ? "border-neutral-700 bg-surface dark:bg-neutral-800/40 text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
                        : "border-amber-500/40 bg-amber-500/15 text-amber-800 hover:bg-amber-500/25 hover:border-amber-600 dark:border-gold/40 dark:bg-gold/15 dark:text-gold dark:hover:bg-gold/25 dark:hover:border-gold shadow-glow-gold-xs cursor-pointer",
                    )}
                  >
                    <Crown
                      size={15}
                      className={isPremium ? undefined : "fill-gold/20"}
                    />
                    <span>
                      {isPremium
                        ? t("limitReachedShort")
                        : t("upgradeLimitButton")}
                    </span>
                  </button>
                </div>
              ) : (
                <PrimaryActionButton
                  label={
                    isGamified ? t("addProduct") : t("addProductProductivity")
                  }
                  onClick={handleAddProduct}
                />
              )}
            </div>
          }
        />

        <RewardsCatalogView
          entries={displayedEntries}
          totalVisibleRewardsCount={rewards.length}
          viewMode={viewMode}
          currentCoins={resolvedCoins}
          deletingRewardIds={checkingDeleteRewardIds}
          redeemingRewardIds={redeemingRewardIds}
          selectedVariantByGroup={selectedVariantByGroup}
          onSelectVariant={handleSelectVariant}
          sensors={sensors}
          onDragEnd={handleDragEnd}
          onBuy={handleBuy}
          onEdit={handleEditReward}
          onContextMenu={handleContextMenu}
          onAddProduct={handleAddProduct}
          onClearFilters={handleClearAllFilters}
        />
      </section>

      {/* Context Menu flutuante */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        items={
          isContextGrouped && contextMenu.reward && contextGroup
            ? [
                {
                  label: t("contextMenu.editGroup"),
                  icon: <Pencil size={14} />,
                  onClick: handleEditFromContextMenu,
                },
                ...(canAddPackageToContext
                  ? [
                      {
                        label: t("contextMenu.addPackage"),
                        icon: <Plus size={14} />,
                        onClick: handleAddPackageFromContextMenu,
                      },
                    ]
                  : []),
                {
                  label: t("contextMenu.deleteSinglePackage", {
                    variant: formatRewardVariantBadge(contextMenu.reward),
                  }),
                  icon: <Trash2 size={14} />,
                  variant: "warning",
                  onClick: handleDeleteFromContextMenu,
                },
                {
                  label: t("contextMenu.deleteWholeGroup", {
                    count: contextGroup.variants.length,
                  }),
                  icon: <Trash2 size={14} />,
                  variant: "destructive",
                  onClick: handleDeleteGroupFromContextMenu,
                },
              ]
            : [
                ...(canAddPackageToContext
                  ? [
                      {
                        label: t("contextMenu.addPackage"),
                        icon: <Plus size={14} />,
                        onClick: handleAddPackageFromContextMenu,
                      },
                    ]
                  : []),
                {
                  label: t("contextMenu.edit"),
                  icon: <Pencil size={14} />,
                  onClick: handleEditFromContextMenu,
                },
                {
                  label: t("contextMenu.delete"),
                  icon: <Trash2 size={14} />,
                  variant: "destructive",
                  onClick: handleDeleteFromContextMenu,
                },
              ]
        }
      />

      {/* Modal de Formulário (Criação / Edição / Edição em Grupo com Lazy Loading) */}
      {isFormModalOpen && (
        <RewardFormModal
          isOpen={isFormModalOpen}
          rewardToEdit={editingReward}
          groupToEdit={editingGroup}
          prefillDraft={prefillDraft}
          existingRewards={rewards}
          onSuccess={handleRewardSuccess}
          onGroupSuccess={handleRewardGroupSuccess}
          onClose={handleCloseFormModal}
        />
      )}

      {/* Modal de Confirmação para Excluir Recompensa / Pacote Individual */}
      {rewardToDelete && (
        <ConfirmationModal
          isOpen={Boolean(rewardToDelete)}
          title={t("deleteModal.title")}
          description={t.rich("deleteModal.description", {
            title: rewardToDelete.title,
            bold: (chunks) => (
              <strong className="text-neutral-100">{chunks}</strong>
            ),
          })}
          confirmText={t("deleteModal.confirmText")}
          cancelText={t("deleteModal.cancelText")}
          variant="danger"
          isLoading={isDeleting}
          checkboxLabel={t("deleteModal.deleteHistoryLabel")}
          checkboxHint={t("deleteModal.deleteHistoryHint")}
          checkboxChecked={deleteRewardHistory}
          onCheckboxChange={setDeleteRewardHistory}
          onClose={() => !isDeleting && setRewardToDelete(null)}
          onConfirm={handleConfirmDeleteReward}
        />
      )}

      {/* Modal de Confirmação para Excluir Card Agrupado Inteiro */}
      {groupToDelete && (
        <ConfirmationModal
          isOpen={Boolean(groupToDelete)}
          title={t("deleteGroupModal.title")}
          description={t.rich("deleteGroupModal.description", {
            title: groupToDelete.displayTitle,
            count: groupToDelete.variants.length,
            bold: (chunks) => (
              <strong className="text-neutral-100">{chunks}</strong>
            ),
          })}
          confirmText={t("deleteGroupModal.confirmText")}
          cancelText={t("deleteGroupModal.cancelText")}
          variant="danger"
          isLoading={isDeleting}
          checkboxLabel={
            groupToDelete.hasHistory
              ? t("deleteModal.deleteHistoryLabel")
              : undefined
          }
          checkboxHint={
            groupToDelete.hasHistory
              ? t("deleteModal.deleteHistoryHint")
              : undefined
          }
          checkboxChecked={deleteGroupHistory}
          onCheckboxChange={setDeleteGroupHistory}
          onClose={() => !isDeleting && setGroupToDelete(null)}
          onConfirm={handleConfirmDeleteGroup}
        />
      )}

      {isUpgradeModalOpen && (
        <LazyUpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}
    </>
  );
}
