"use client";

import { Pencil, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
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
import type { Reward } from "@/types/reward";
import { calculateRewardWelcomeStats } from "@/utils/catalogMetrics";
import {
  isMysteryBoxReward,
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
  isCompact = false,
  initialRewards,
}: {
  isCompact?: boolean;
  initialRewards: Reward[];
}) {
  const t = useTranslations("rewards.container");
  const tOptions = useTranslations("rewards.options");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;

  const {
    viewMode,
    setViewMode,
    filters,
    isFiltering,
    handleFilterChange,
    handleClearFilters,
  } = useItemCatalogFilters("rewards");

  const {
    items: rewards,
    setItems: setRewards,
    sensors,
    handleDragEnd,
  } = useReorderableList<Reward>({
    initialItems: initialRewards,
    onReorderServerAction: reorderRewards,
    isFiltering,
  });

  const {
    currentCoins,
    contextMenu,
    closeContextMenu,
    handleContextMenu,
    handleEditFromContextMenu,
    handleDeleteFromContextMenu,
    isFormModalOpen,
    editingReward,
    handleAddProduct,
    handleCloseFormModal,
    handleRewardSuccess,
    rewardToDelete,
    setRewardToDelete,
    isDeleting,
    handleConfirmDelete,
    handleBuy,
  } = useRewardCatalogActions({ rewards, setRewards });

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
      REWARD_TYPE_OPTIONS.filter(
        (opt) => isGamified || opt.value !== "MysteryBox",
      ).map((opt) => ({
        value: opt.value,
        label: opt.value
          ? tOptions(`types.${toRewardTypeMessageKey(opt.value)}`)
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

  const visibleRewardsForMode = useMemo(
    () =>
      isGamified
        ? rewards
        : rewards.filter((r) => !isMysteryBoxReward(r.type, r.iconName)),
    [isGamified, rewards],
  );

  const filteredRewards = useMemo(() => {
    let result = visibleRewardsForMode.filter((r) => {
      if (
        filters.search &&
        !r.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !r.description.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.type && r.type !== filters.type) return false;
      if (filters.category && r.category !== filters.category) return false;
      if (filters.packageLevel) {
        const normalizedPkg = r.packageLevel || "Nenhum";
        if (normalizedPkg !== filters.packageLevel) return false;
      }
      return true;
    });

    if (filters.sortBy === "price-asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === "price-desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (filters.sortBy === "name") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [visibleRewardsForMode, filters]);

  const resolvedCoins = currentCoins ?? 0;

  const { stats: welcomeStats } = useMemo(() => {
    return calculateRewardWelcomeStats(
      visibleRewardsForMode,
      resolvedCoins,
      locale,
      isGamified,
    );
  }, [visibleRewardsForMode, resolvedCoins, locale, isGamified]);

  return (
    <>
      <WelcomeCard
        storageKey="rewards"
        stats={welcomeStats}
        compact={isCompact}
      />

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
          onClearDropdowns={handleClearFilters}
          rightActions={
            <PrimaryActionButton
              label={isGamified ? t("addProduct") : t("addProductProductivity")}
              onClick={handleAddProduct}
              isCompact={isCompact}
            />
          }
        />

        <RewardsCatalogView
          filteredRewards={filteredRewards}
          totalVisibleRewardsCount={visibleRewardsForMode.length}
          viewMode={viewMode}
          isCompact={isCompact}
          currentCoins={currentCoins}
          sensors={sensors}
          onDragEnd={handleDragEnd}
          onBuy={handleBuy}
          onContextMenu={handleContextMenu}
          onAddProduct={handleAddProduct}
          onClearFilters={handleClearFilters}
        />
      </section>

      {/* Context Menu flutuante */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        items={[
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

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmationModal
        isOpen={Boolean(rewardToDelete)}
        onClose={() => !isDeleting && setRewardToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t("deleteModal.title")}
        description={
          rewardToDelete ? (
            <span>
              {t.rich("deleteModal.description", {
                title: rewardToDelete.title,
                bold: (chunks) => (
                  <strong className="text-neutral-100">{chunks}</strong>
                ),
              })}
            </span>
          ) : null
        }
        confirmText={t("deleteModal.confirmText")}
        cancelText={t("deleteModal.cancelText")}
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Modal de Formulário (Criação / Edição de Recompensa com Lazy Loading) */}
      {isFormModalOpen && (
        <RewardFormModal
          isOpen={isFormModalOpen}
          rewardToEdit={editingReward}
          onSuccess={handleRewardSuccess}
          onClose={handleCloseFormModal}
        />
      )}
    </>
  );
}
