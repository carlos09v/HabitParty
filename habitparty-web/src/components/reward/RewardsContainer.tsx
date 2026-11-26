"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { Crown, Pencil, Plus, Receipt, Trash2, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { reorderRewards } from "@/actions/rewardActions";
import {
  CatalogCapacityPill,
  useResolvedIsPremium,
} from "@/components/ui/CatalogItemShared";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ContextMenu, type ContextMenuItem } from "@/components/ui/ContextMenu";
import { FilterBar } from "@/components/ui/FilterBar";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { Switch } from "@/components/ui/Switch";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import {
  FREE_MAX_REWARD_CARDS,
  MAX_ACTIVE_DEBT_CARDS,
  MAX_REWARD_PACKAGES_PER_CARD,
  PREMIUM_MAX_REWARD_CARDS,
  REWARD_SORT_VALUES,
} from "@/constants/reward";
import {
  ExperienceModeFallbackProvider,
  useExperienceMode,
} from "@/hooks/useExperienceMode";
import { useItemCatalogFilters } from "@/hooks/useItemCatalogFilters";
import { useReorderableList } from "@/hooks/useReorderableList";
import { useRewardCatalogActions } from "@/hooks/useRewardCatalogActions";
import type { AppLocale } from "@/i18n/config";
import { useUIStore } from "@/store/uiStore";
import type {
  Reward,
  RewardDisplayEntry,
  RewardGroupContext,
} from "@/types/reward";
import type { ExperienceMode } from "@/types/ui";
import { cn } from "@/utils";
import {
  buildCatalogCategoryOptions,
  buildCatalogPackageOptions,
  buildCatalogTypeOptions,
  matchesCatalogSearchAndMeta,
} from "@/utils/catalogFiltering";
import { calculateRewardWelcomeStats } from "@/utils/catalogMetrics";
import {
  formatRewardVariantBadge,
  groupRewardsForShowcase,
  isDebtReward,
} from "@/utils/rewardGrouping";
import { toRewardTypeMessageKey } from "@/utils/rewardMapper";
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
  initialOwnedCounts?: Record<string, number>;
  initialCoins?: number;
  initialIsPremium?: boolean;
  initialExperienceMode?: ExperienceMode;
}

export function RewardsContainer({
  initialRewards,
  initialOwnedCounts = {},
  initialCoins = 0,
  initialIsPremium = false,
  initialExperienceMode = "PRODUCTIVITY",
}: RewardsContainerProps) {
  return (
    <ExperienceModeFallbackProvider mode={initialExperienceMode}>
      <RewardsContainerContent
        initialRewards={initialRewards}
        initialOwnedCounts={initialOwnedCounts}
        initialCoins={initialCoins}
        initialIsPremium={initialIsPremium}
        initialExperienceMode={initialExperienceMode}
      />
    </ExperienceModeFallbackProvider>
  );
}

function RewardsContainerContent({
  initialRewards,
  initialOwnedCounts,
  initialCoins,
  initialIsPremium,
  initialExperienceMode,
}: Required<RewardsContainerProps>) {
  const t = useTranslations("rewards.container");
  const tOptions = useTranslations("rewards.options");
  const { isGamified } = useExperienceMode(initialExperienceMode);
  const locale = useLocale() as AppLocale;
  const isPremium = useResolvedIsPremium(initialIsPremium);
  const openUpgradeModal = useUIStore((s) => s.openUpgradeModal);

  const [onlyAffordable, setOnlyAffordable] = useState(false);
  const [ownedCountByRewardId, setOwnedCountByRewardId] =
    useState<Record<string, number>>(initialOwnedCounts);
  const [selectedVariantByGroup, setSelectedVariantByGroup] = useState<
    Record<string, string>
  >({});
  const displayedEntriesRef = useRef<RewardDisplayEntry[]>([]);

  useEffect(() => {
    setOwnedCountByRewardId(initialOwnedCounts);
  }, [initialOwnedCounts]);

  const handleRewardBought = useCallback((reward: Reward) => {
    setOwnedCountByRewardId((prev) => ({
      ...prev,
      [reward.id]: (prev[reward.id] ?? 0) + 1,
    }));
  }, []);

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
      const debtEntries = currentEntries.filter((entry) =>
        isDebtReward(entry.primaryReward),
      );
      const regularEntries = currentEntries.filter(
        (entry) => !isDebtReward(entry.primaryReward),
      );
      const oldIdx = regularEntries.findIndex(
        (entry) => entry.groupId === activeId,
      );
      const newIdx = regularEntries.findIndex(
        (entry) => entry.groupId === overId,
      );
      if (oldIdx === -1 || newIdx === -1) return null;
      return [
        ...debtEntries,
        ...arrayMove(regularEntries, oldIdx, newIdx),
      ].flatMap((entry) => entry.variants);
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
    handleOpenTemplateDraft,
    handleAddDebt,
    handleCloseFormModal,
    handleRewardSuccess,
    handleRewardGroupSuccess,
    isDeleting,
    redeemingRewardIds,
    handleBuy,
  } = useRewardCatalogActions({
    rewards,
    setRewards,
    fallbackCoins: initialCoins,
    onRewardBought: handleRewardBought,
  });

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
      buildCatalogCategoryOptions({
        allLabel: tOptions("categories.all"),
        getCategoryLabel: (key) => tOptions(`categories.${key}`),
      }),
    [tOptions],
  );

  const typeOptions = useMemo(
    () =>
      buildCatalogTypeOptions({
        allLabel: tOptions("types.all"),
        isGamified,
        getTypeLabel: (typeKey) => tOptions(`types.${typeKey}`),
      }),
    [isGamified, tOptions],
  );

  const packageOptions = useMemo(
    () =>
      buildCatalogPackageOptions({
        allLabel: tOptions("packages.all"),
        getPackageLabel: (key) => tOptions(`packages.${key}`),
      }),
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

  const fullGroupById = useMemo(() => {
    const map = new Map<string, RewardGroupContext>();
    for (const entry of allGroupedEntries) {
      if (entry.variants.length > 1) {
        map.set(entry.groupId, {
          groupId: entry.groupId,
          displayTitle: entry.displayTitle,
          variants: entry.variants,
        });
      }
    }
    return map;
  }, [allGroupedEntries]);

  // Dívidas descartáveis possuem cota implícita independente e não consomem o limite regular de cards
  const { activeDebtsCount, totalShowcaseCards } = useMemo(() => {
    let debts = 0;
    let regular = 0;
    for (const entry of allGroupedEntries) {
      if (isDebtReward(entry.primaryReward)) {
        debts += 1;
      } else {
        regular += 1;
      }
    }
    return { activeDebtsCount: debts, totalShowcaseCards: regular };
  }, [allGroupedEntries]);
  const maxRewardCards = isPremium
    ? PREMIUM_MAX_REWARD_CARDS
    : FREE_MAX_REWARD_CARDS;
  const isCardLimitReached = totalShowcaseCards >= maxRewardCards;
  const planName = isPremium ? t("planPremium") : t("planFree");

  const coinFilterLimit = onlyAffordable ? resolvedCoins : null;

  // Filtra entradas já agrupadas preservando a identidade do grupo e ordena grupos completos após filtragem
  const displayedEntries = useMemo(() => {
    if (!isFiltering && coinFilterLimit === null) {
      return allGroupedEntries;
    }

    const filteredEntries: RewardDisplayEntry[] = [];
    for (const entry of allGroupedEntries) {
      const matchingVariants = entry.variants.filter((variant) => {
        if (!matchesCatalogSearchAndMeta(variant, filters)) {
          return false;
        }
        if (coinFilterLimit !== null && variant.price > coinFilterLimit) {
          return false;
        }
        return true;
      });

      if (matchingVariants.length === 0) continue;

      filteredEntries.push({
        groupId: entry.groupId,
        displayTitle: entry.displayTitle,
        primaryReward: matchingVariants[0],
        variants: matchingVariants,
      });
    }

    if (!filters.sortBy) {
      return filteredEntries;
    }

    const debts = filteredEntries.filter((e) => isDebtReward(e.primaryReward));
    const regulars = filteredEntries.filter(
      (e) => !isDebtReward(e.primaryReward),
    );

    const compareEntries = (a: RewardDisplayEntry, b: RewardDisplayEntry) => {
      if (filters.sortBy === "price-asc") {
        const minA = Math.min(...a.variants.map((v) => v.price));
        const minB = Math.min(...b.variants.map((v) => v.price));
        return minA - minB;
      }
      if (filters.sortBy === "price-desc") {
        const maxA = Math.max(...a.variants.map((v) => v.price));
        const maxB = Math.max(...b.variants.map((v) => v.price));
        return maxB - maxA;
      }
      if (filters.sortBy === "name") {
        return a.displayTitle.localeCompare(b.displayTitle, locale);
      }
      return 0;
    };

    return [...debts.sort(compareEntries), ...regulars.sort(compareEntries)];
  }, [allGroupedEntries, isFiltering, filters, coinFilterLimit, locale]);

  useEffect(() => {
    displayedEntriesRef.current = displayedEntries;
  }, [displayedEntries]);

  const welcomeStats = useMemo(() => {
    const { stats, redeemableCount } = calculateRewardWelcomeStats(
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
          onClick:
            redeemableCount > 0 || onlyAffordable
              ? () => setOnlyAffordable((prev) => !prev)
              : undefined,
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
  const contextTypeKey = contextMenu.reward
    ? toRewardTypeMessageKey(contextMenu.reward.type)
    : null;
  const canAddPackageToContext = Boolean(
    contextMenu.reward &&
      !isDebtReward(contextMenu.reward) &&
      (contextTypeKey === "TimeBased" || contextTypeKey === "SingleUse") &&
      (!contextGroup ||
        contextGroup.variants.length < MAX_REWARD_PACKAGES_PER_CARD),
  );

  const contextMenuItems = useMemo<ContextMenuItem[]>(() => {
    if (isContextGrouped && contextMenu.reward && contextGroup) {
      return [
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
            variant: formatRewardVariantBadge(contextMenu.reward, (pkgKey) =>
              tOptions(`packages.${pkgKey}`),
            ),
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
      ];
    }

    return [
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
    ];
  }, [
    isContextGrouped,
    contextMenu.reward,
    contextGroup,
    canAddPackageToContext,
    t,
    tOptions,
    handleEditFromContextMenu,
    handleAddPackageFromContextMenu,
    handleDeleteFromContextMenu,
    handleDeleteGroupFromContextMenu,
  ]);

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
          extraActiveFiltersCount={onlyAffordable ? 1 : 0}
          mobileExtraFilters={
            <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-700/80 dark:border-white/10 bg-surface/60 px-3 py-2.5">
              <label
                htmlFor="mobile-filter-affordable"
                className="text-xs font-semibold text-neutral-100 cursor-pointer"
              >
                {t("filters.affordableActive")}
              </label>
              <Switch
                id="mobile-filter-affordable"
                checked={onlyAffordable}
                onCheckedChange={setOnlyAffordable}
                aria-label={t("filters.affordableActive")}
              />
            </div>
          }
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
            <div className="flex items-center gap-2 flex-wrap">
              <CatalogCapacityPill
                current={totalShowcaseCards}
                max={maxRewardCards}
                isPremium={isPremium}
                isWarning={isCardLimitReached}
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
              />

              {activeDebtsCount < MAX_ACTIVE_DEBT_CARDS && (
                <button
                  type="button"
                  onClick={handleAddDebt}
                  title={t("addDebtTitle")}
                  className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-2.5 text-body-s font-semibold text-rose-700 hover:bg-rose-500/20 dark:border-rose-400/35 dark:bg-rose-500/15 dark:text-rose-200 dark:hover:bg-rose-500/25 transition-colors shrink-0 cursor-pointer select-none"
                >
                  <Receipt size={14} aria-hidden="true" />
                  <span>{t("addDebtButton")}</span>
                </button>
              )}

              {isCardLimitReached ? (
                <button
                  type="button"
                  onClick={isPremium ? undefined : openUpgradeModal}
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
          fullGroupById={fullGroupById}
          totalVisibleRewardsCount={rewards.length}
          viewMode={viewMode}
          isGamified={isGamified}
          isReorderDisabled={isFiltering || onlyAffordable}
          sortBy={filters.sortBy}
          currentCoins={resolvedCoins}
          ownedCountByRewardId={ownedCountByRewardId}
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
          onSelectStarterTemplate={handleOpenTemplateDraft}
          onClearFilters={handleClearAllFilters}
        />
      </section>

      {/* Context Menu flutuante */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        items={contextMenuItems}
      />

      {/* Modal de Formulário (Criação / Edição / Edição em Grupo com Lazy Loading) */}
      {isFormModalOpen && (
        <RewardFormModal
          isOpen={isFormModalOpen}
          rewardToEdit={editingReward}
          groupToEdit={editingGroup}
          prefillDraft={prefillDraft}
          existingRewards={rewards}
          restrictToDebtOnly={
            isCardLimitReached &&
            !editingReward &&
            !editingGroup &&
            prefillDraft?.category === "Dívida"
          }
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
            title: rewardToDelete.reward.title,
            bold: (chunks) => (
              <strong className="text-neutral-100">{chunks}</strong>
            ),
          })}
          confirmText={t("deleteModal.confirmText")}
          cancelText={t("deleteModal.cancelText")}
          variant="danger"
          isLoading={isDeleting}
          checkboxLabel={
            rewardToDelete.hasHistory
              ? t("deleteModal.deleteHistoryLabel")
              : undefined
          }
          checkboxHint={
            rewardToDelete.hasHistory
              ? t("deleteModal.deleteHistoryHint")
              : undefined
          }
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
    </>
  );
}
