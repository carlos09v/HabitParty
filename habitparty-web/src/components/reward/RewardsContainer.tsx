"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import {
  rectSortingStrategy,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Pencil, Plus, SearchX, Store, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteReward,
  redeemReward,
  reorderRewards,
} from "@/actions/rewardActions";
import { CatalogEmptyState } from "@/components/ui/CatalogEmptyState";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { FilterBar } from "@/components/ui/FilterBar";
import { ItemRow, ItemRowHeader } from "@/components/ui/ItemRow";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import {
  REWARD_CATEGORY_OPTIONS,
  REWARD_PACKAGE_OPTIONS,
  REWARD_SORT_OPTIONS,
  REWARD_TYPE_OPTIONS,
  toCategoryMessageKey,
  toPackageMessageKey,
  toRewardTypeMessageKey,
} from "@/constants/reward";
import { WELCOME_CARD_DETAILS } from "@/constants/welcomeCards";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useItemCatalogFilters } from "@/hooks/useItemCatalogFilters";
import { useReorderableList } from "@/hooks/useReorderableList";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { Reward } from "@/types/reward";
import { cn } from "@/utils";
import { calculateRewardWelcomeStats } from "@/utils/catalogMetrics";
import { soundEffects } from "@/utils/soundEffects";
import { AddRewardCard, RewardCard } from "./RewardCard";

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

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    reward: Reward | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    reward: null,
  });

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardToDelete, setRewardToDelete] = useState<Reward | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  const currentCoins = useUserStore((s) => s.user?.currentCoins);
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);
  const [isRedeeming, setIsRedeeming] = useState(false);

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

  const handleBuy = useCallback(
    async (reward: Reward) => {
      if (isRedeeming) return;

      if (typeof currentCoins === "number" && currentCoins < reward.price) {
        toast.error(
          isGamified
            ? t("toasts.insufficientCoins")
            : t("toasts.insufficientCredits"),
        );
        return;
      }

      setIsRedeeming(true);
      try {
        const res = await redeemReward(reward.id);
        if (!res.success) {
          toast.error(res.error || t("toasts.redeemError"));
          return;
        }

        if (typeof currentCoins === "number") {
          const nextCoins = Math.max(
            0,
            Math.round((currentCoins - reward.price) * 100) / 100,
          );
          updateUserPartial({
            currentCoins: nextCoins,
          });
        }

        soundEffects.playBuySound();
        toast.success(
          isGamified
            ? t("toasts.buySuccessGamified", { title: reward.title })
            : t("toasts.buySuccessProductivity", { title: reward.title }),
        );
      } catch (_error) {
        toast.error(t("toasts.serverError"));
      } finally {
        setIsRedeeming(false);
      }
    },
    [isGamified, isRedeeming, currentCoins, updateUserPartial, t],
  );

  const handleAddProduct = useCallback(() => {
    setEditingReward(null);
    setIsFormModalOpen(true);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, reward: Reward) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        reward,
      });
    },
    [],
  );

  const handleRewardSuccess = useCallback(
    (savedReward: Reward) => {
      setRewards((prev) => {
        const exists = prev.some((r) => r.id === savedReward.id);
        if (exists) {
          return prev.map((r) => (r.id === savedReward.id ? savedReward : r));
        }
        return [savedReward, ...prev];
      });
    },
    [setRewards],
  );

  const handleConfirmDelete = () => {
    if (!rewardToDelete) return;
    const target = rewardToDelete;
    const previousRewards = [...rewards];

    setRewards((prev) => prev.filter((r) => r.id !== target.id));
    setRewardToDelete(null);

    startDeleteTransition(async () => {
      const res = await deleteReward(target.id);
      if (res.success) {
        toast.success(t("toasts.deleteSuccess", { title: target.title }));
      } else {
        setRewards(previousRewards);
        toast.error(res.error || t("toasts.deleteError"));
      }
    });
  };

  const visibleRewardsForMode = useMemo(
    () =>
      isGamified
        ? rewards
        : rewards.filter(
            (r) => r.type !== "MysteryBox" && r.type !== "MISTERY_BOX",
          ),
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
        compact={isCompact}
        title={WELCOME_CARD_DETAILS.rewards.title}
        subtitle={WELCOME_CARD_DETAILS.rewards.subtitle}
        bullets={WELCOME_CARD_DETAILS.rewards.bullets}
        imageSrc={WELCOME_CARD_DETAILS.rewards.imageSrc}
        stats={welcomeStats}
        imageWidth={
          isCompact
            ? WELCOME_CARD_DETAILS.rewards.compactWidth
            : WELCOME_CARD_DETAILS.rewards.normalWidth
        }
        imageHeight={
          isCompact
            ? WELCOME_CARD_DETAILS.rewards.compactHeight
            : WELCOME_CARD_DETAILS.rewards.normalHeight
        }
        storageKey="rewards"
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

        {filteredRewards.length === 0 ? (
          <div className="flex flex-col gap-2.5 w-full pb-8">
            {viewMode === "list" && (
              <ItemRowHeader isCompact={isCompact} mode="reward" />
            )}
            <CatalogEmptyState
              isCompact={isCompact}
              icon={visibleRewardsForMode.length === 0 ? Store : SearchX}
              title={
                visibleRewardsForMode.length === 0
                  ? t("empty.showcaseEmptyTitle")
                  : t("empty.noResultsTitle")
              }
              description={
                visibleRewardsForMode.length === 0
                  ? isGamified
                    ? t("empty.showcaseEmptyDescription")
                    : t("empty.showcaseEmptyDescriptionProductivity")
                  : t("empty.noResultsDescription")
              }
              action={
                visibleRewardsForMode.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-on-gold font-bold text-xs hover:bg-gold-hover shadow-glow-gold-xs transition-all cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>{t("empty.createFirstReward")}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-primary/40 bg-surface/80 text-xs font-semibold text-gold hover:border-gold hover:bg-gold/10 transition-all cursor-pointer"
                  >
                    <span>{t("empty.clearFilters")}</span>
                  </button>
                )
              }
            />
          </div>
        ) : (
          <DndContext
            id="rewards-dnd-context"
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToParentElement, restrictToWindowEdges]}
          >
            <SortableContext
              items={filteredRewards.map((r) => r.id)}
              strategy={
                viewMode === "card"
                  ? rectSortingStrategy
                  : verticalListSortingStrategy
              }
            >
              {viewMode === "card" ? (
                <div
                  className={cn(
                    "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 transition-all duration-200 w-full pb-8",
                    isCompact
                      ? "lg:grid-cols-3 xl:grid-cols-4 gap-3.5"
                      : "lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4",
                  )}
                >
                  {filteredRewards.map((reward) => {
                    const canAfford =
                      typeof currentCoins === "number"
                        ? currentCoins >= reward.price
                        : true;

                    return (
                      <RewardCard
                        key={reward.id}
                        reward={reward}
                        onBuy={handleBuy}
                        onContextMenu={handleContextMenu}
                        isCompact={isCompact}
                        canAfford={canAfford}
                      />
                    );
                  })}
                  <AddRewardCard
                    onClick={handleAddProduct}
                    viewMode="card"
                    isCompact={isCompact}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 w-full pb-8">
                  <ItemRowHeader isCompact={isCompact} mode="reward" />

                  <ul className="flex flex-col gap-2 w-full">
                    {filteredRewards.map((reward) => {
                      const canAfford =
                        typeof currentCoins === "number"
                          ? currentCoins >= reward.price
                          : true;

                      return (
                        <ItemRow
                          key={reward.id}
                          id={reward.id}
                          title={reward.title}
                          description={reward.description}
                          type={reward.type}
                          packageLevel={reward.packageLevel}
                          category={reward.category}
                          iconName={reward.iconName}
                          baseDurationMinutes={reward.baseDurationMinutes}
                          price={reward.price}
                          disabled={!canAfford}
                          disabledTitle={
                            !canAfford
                              ? isGamified
                                ? t("insufficientCoinsShort")
                                : t("insufficientCreditsShort")
                              : undefined
                          }
                          actionLabel={
                            isGamified ? t("buy") : t("buyProductivity")
                          }
                          onAction={() => handleBuy(reward)}
                          onContextMenu={(e) => handleContextMenu(e, reward)}
                          isCompact={isCompact}
                          dragData={{ type: "Reward", reward }}
                        />
                      );
                    })}
                    <AddRewardCard
                      onClick={handleAddProduct}
                      viewMode="list"
                      isCompact={isCompact}
                    />
                  </ul>
                </div>
              )}
            </SortableContext>
          </DndContext>
        )}
      </section>

      {/* Context Menu flutuante */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        items={[
          {
            label: t("contextMenu.edit"),
            icon: <Pencil size={14} />,
            onClick: () => {
              if (contextMenu.reward) {
                setEditingReward(contextMenu.reward);
                setIsFormModalOpen(true);
              }
            },
          },
          {
            label: t("contextMenu.delete"),
            icon: <Trash2 size={14} />,
            variant: "destructive",
            onClick: () => {
              if (contextMenu.reward) {
                setRewardToDelete(contextMenu.reward);
              }
            },
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
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingReward(null);
          }}
        />
      )}
    </>
  );
}
