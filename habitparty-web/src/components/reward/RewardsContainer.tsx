"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import { reorderRewards } from "@/actions/rewardActions";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { FilterBar } from "@/components/ui/FilterBar";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import {
  REWARD_CATEGORY_OPTIONS,
  REWARD_PACKAGE_OPTIONS,
  REWARD_SORT_OPTIONS,
  REWARD_TYPE_OPTIONS,
} from "@/constants/reward";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useItemCatalogFilters } from "@/hooks/useItemCatalogFilters";
import { useReorderableList } from "@/hooks/useReorderableList";
import { useRewardCatalogActions } from "@/hooks/useRewardCatalogActions";
import type { AppLocale } from "@/i18n/config";
import type { Reward, RewardDisplayEntry } from "@/types/reward";
import { calculateRewardWelcomeStats } from "@/utils/catalogMetrics";
import { groupRewardsForShowcase } from "@/utils/rewardGrouping";
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

export function RewardsContainer({
  initialRewards,
}: {
  initialRewards: Reward[];
}) {
  const t = useTranslations("rewards.container");
  const tOptions = useTranslations("rewards.options");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;

  const [onlyAffordable, setOnlyAffordable] = useState(false);
  const [selectedVariantByGroup, setSelectedVariantByGroup] = useState<
    Record<string, string>
  >({});
  const [debtQuantities, setDebtQuantities] = useState<Record<string, number>>(
    {},
  );
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
        (entry) => entry.primaryReward.id === activeId,
      );
      const newIdx = currentEntries.findIndex(
        (entry) => entry.primaryReward.id === overId,
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
    checkingDeleteRewardIds,
    rewardToDelete,
    setRewardToDelete,
    deleteRewardHistory,
    setDeleteRewardHistory,
    handleConfirmDeleteReward,
    isDeleting,
    isFormModalOpen,
    editingReward,
    prefillDraft,
    handleAddProduct,
    handleCloseFormModal,
    handleRewardSuccess,
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

  const handleDebtQuantityChange = useCallback(
    (rewardId: string, nextQuantity: number) => {
      setDebtQuantities((prev) => ({
        ...prev,
        [rewardId]: nextQuantity,
      }));
    },
    [],
  );

  const handleBuyWithReset = useCallback(
    async (reward: Reward, quantity = 1) => {
      const ok = await handleBuy(reward, quantity);
      if (ok && toCategoryMessageKey(reward.category) === "DEBT") {
        setDebtQuantities((prev) => {
          if ((prev[reward.id] ?? 1) === 1) return prev;
          const next = { ...prev };
          delete next[reward.id];
          return next;
        });
      }
    },
    [handleBuy],
  );

  const categoryOptions = useMemo(
    () =>
      REWARD_CATEGORY_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.value
          ? tOptions(`categories.${toCategoryMessageKey(opt.value)}`)
          : tOptions("categories.all"),
      })),
    [tOptions],
  );

  const typeOptions = useMemo(
    () =>
      REWARD_TYPE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.value
          ? opt.value === "MysteryBox"
            ? isGamified
              ? tOptions("types.MysteryBox")
              : tOptions("types.MysteryBoxProductivity")
            : tOptions(`types.${toRewardTypeMessageKey(opt.value)}`)
          : tOptions("types.all"),
      })),
    [isGamified, tOptions],
  );

  const packageOptions = useMemo(
    () =>
      REWARD_PACKAGE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.value
          ? tOptions(`packages.${toPackageMessageKey(opt.value)}`)
          : tOptions("packages.all"),
      })),
    [tOptions],
  );

  const sortOptions = useMemo(
    () =>
      REWARD_SORT_OPTIONS.map((opt) => ({
        value: opt.value,
        label: tOptions(
          `sort.${(opt.value || "default") as "default" | "price-asc" | "price-desc" | "name"}`,
        ),
      })),
    [tOptions],
  );

  const resolvedCoins = currentCoins ?? 0;

  const filteredRewards = useMemo(() => {
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
      if (onlyAffordable && r.price > resolvedCoins) {
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
  }, [rewards, filters, onlyAffordable, resolvedCoins, locale]);

  const displayedEntries = useMemo(
    () => groupRewardsForShowcase(filteredRewards, selectedVariantByGroup),
    [filteredRewards, selectedVariantByGroup],
  );
  displayedEntriesRef.current = displayedEntries;

  const welcomeStats = useMemo(() => {
    const { stats } = calculateRewardWelcomeStats(
      rewards,
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
    rewards,
    resolvedCoins,
    locale,
    isGamified,
    onlyAffordable,
    isFiltering,
    handleClearAllFilters,
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
            <PrimaryActionButton
              label={isGamified ? t("addProduct") : t("addProductProductivity")}
              onClick={handleAddProduct}
            />
          }
        />

        <RewardsCatalogView
          entries={displayedEntries}
          totalVisibleRewardsCount={rewards.length}
          viewMode={viewMode}
          currentCoins={resolvedCoins}
          deletingRewardIds={checkingDeleteRewardIds}
          redeemingRewardIds={redeemingRewardIds}
          debtQuantities={debtQuantities}
          onDebtQuantityChange={handleDebtQuantityChange}
          onSelectVariant={handleSelectVariant}
          sensors={sensors}
          onDragEnd={handleDragEnd}
          onBuy={handleBuyWithReset}
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
        items={[
          ...(contextMenu.reward &&
          toRewardTypeMessageKey(contextMenu.reward.type) === "TimeBased"
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
        ]}
      />

      {/* Modal de Formulário (Criação / Edição de Recompensa com Lazy Loading) */}
      {isFormModalOpen && (
        <RewardFormModal
          isOpen={isFormModalOpen}
          rewardToEdit={editingReward}
          prefillDraft={prefillDraft}
          existingRewards={rewards}
          onSuccess={handleRewardSuccess}
          onClose={handleCloseFormModal}
        />
      )}

      {/* Modal de Confirmação para Excluir Recompensa */}
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
    </>
  );
}
