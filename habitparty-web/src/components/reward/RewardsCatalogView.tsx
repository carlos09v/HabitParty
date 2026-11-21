"use client";

import type {
  DragEndEvent,
  SensorDescriptor,
  SensorOptions,
} from "@dnd-kit/core";
import { Plus, SearchX, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { type MouseEvent, useMemo } from "react";
import { CatalogEmptyState } from "@/components/ui/CatalogEmptyState";
import { CatalogGridListShell } from "@/components/ui/CatalogGridListShell";
import { ItemRowHeader } from "@/components/ui/ItemRow";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type {
  Reward,
  RewardDisplayEntry,
  RewardGroupContext,
} from "@/types/reward";
import type { ViewMode } from "@/types/ui";
import { isDebtReward } from "@/utils/rewardGrouping";
import { RewardCard, RewardItemRow } from "./RewardCard";

interface RewardsCatalogViewProps {
  entries: RewardDisplayEntry[];
  totalVisibleRewardsCount: number;
  viewMode: ViewMode;
  currentCoins?: number;
  deletingRewardIds?: Set<string>;
  redeemingRewardIds?: Set<string>;
  selectedVariantByGroup?: Record<string, string>;
  onSelectVariant?: (groupId: string, variantId: string) => void;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragEnd: (event: DragEndEvent) => void;
  onBuy: (reward: Reward) => void;
  onEdit: (reward: Reward, groupContext?: RewardGroupContext) => void;
  onContextMenu: (
    e: MouseEvent,
    reward: Reward,
    groupContext?: RewardGroupContext,
  ) => void;
  onAddProduct: () => void;
  onClearFilters: () => void;
}

export function RewardsCatalogView({
  entries,
  totalVisibleRewardsCount,
  viewMode,
  currentCoins,
  deletingRewardIds,
  redeemingRewardIds,
  selectedVariantByGroup,
  onSelectVariant,
  sensors,
  onDragEnd,
  onBuy,
  onEdit,
  onContextMenu,
  onAddProduct,
  onClearFilters,
}: RewardsCatalogViewProps) {
  const t = useTranslations("rewards.container");
  const { isGamified } = useExperienceMode();

  const sortableItemIds = useMemo(
    () =>
      entries
        .filter((entry) => !isDebtReward(entry.primaryReward))
        .map((entry) => entry.groupId),
    [entries],
  );

  if (entries.length === 0) {
    const isStoreEmpty = totalVisibleRewardsCount === 0;
    return (
      <div className="flex flex-col gap-2.5 w-full pb-8">
        {viewMode === "list" && <ItemRowHeader mode="reward" />}
        <CatalogEmptyState
          icon={isStoreEmpty ? Store : SearchX}
          title={
            isStoreEmpty
              ? t("empty.showcaseEmptyTitle")
              : t("empty.noResultsTitle")
          }
          description={
            isStoreEmpty
              ? isGamified
                ? t("empty.showcaseEmptyDescription")
                : t("empty.showcaseEmptyDescriptionProductivity")
              : t("empty.noResultsDescription")
          }
          action={
            isStoreEmpty ? (
              <button
                type="button"
                onClick={onAddProduct}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-on-gold font-bold text-xs hover:bg-gold-hover shadow-glow-gold-xs transition-colors cursor-pointer"
              >
                <Plus size={15} />
                <span>{t("empty.createFirstReward")}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-primary/40 bg-surface/80 text-xs font-semibold text-gold hover:border-gold hover:bg-gold/10 transition-colors cursor-pointer"
              >
                <span>{t("empty.clearFilters")}</span>
              </button>
            )
          }
        />
      </div>
    );
  }

  return (
    <CatalogGridListShell
      dndContextId="rewards-dnd-context"
      itemIds={sortableItemIds}
      viewMode={viewMode}
      headerMode="reward"
      sensors={sensors}
      onDragEnd={onDragEnd}
    >
      {entries.map((entry) => {
        const hasVariants = entry.variants.length > 1;
        const selectedVariantId = selectedVariantByGroup?.[entry.groupId];
        const reward =
          hasVariants && selectedVariantId
            ? (entry.variants.find((v) => v.id === selectedVariantId) ??
              entry.primaryReward)
            : entry.primaryReward;
        const isDeleteChecking = Boolean(deletingRewardIds?.has(reward.id));
        const isRedeeming = Boolean(redeemingRewardIds?.has(reward.id));
        const isDebt = isDebtReward(reward);

        if (viewMode === "card") {
          return (
            <RewardCard
              key={entry.groupId}
              groupId={entry.groupId}
              reward={reward}
              displayTitle={entry.displayTitle}
              hasGroupDescription={entry.hasGroupDescription}
              variants={hasVariants ? entry.variants : undefined}
              activeVariantId={reward.id}
              onSelectVariant={hasVariants ? onSelectVariant : undefined}
              onBuy={onBuy}
              onEdit={onEdit}
              onContextMenu={onContextMenu}
              currentCoins={currentCoins}
              isDeleteChecking={isDeleteChecking}
              isRedeeming={isRedeeming}
              isReorderDisabled={isDebt}
            />
          );
        }

        const canAfford =
          typeof currentCoins === "number"
            ? currentCoins >= reward.price
            : true;

        return (
          <RewardItemRow
            key={entry.groupId}
            groupId={entry.groupId}
            reward={reward}
            displayTitle={entry.displayTitle}
            variants={hasVariants ? entry.variants : undefined}
            activeVariantId={reward.id}
            onSelectVariant={hasVariants ? onSelectVariant : undefined}
            onBuy={onBuy}
            onEdit={onEdit}
            onContextMenu={onContextMenu}
            canAfford={canAfford}
            isDeleteChecking={isDeleteChecking}
            isRedeeming={isRedeeming}
            isReorderDisabled={isDebt}
          />
        );
      })}
    </CatalogGridListShell>
  );
}
