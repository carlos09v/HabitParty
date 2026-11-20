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
import { DEBT_MAX_REDEEM_QUANTITY } from "@/constants/reward";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { Reward, RewardDisplayEntry } from "@/types/reward";
import type { ViewMode } from "@/types/ui";
import { RewardCard, RewardItemRow } from "./RewardCard";

interface RewardsCatalogViewProps {
  entries: RewardDisplayEntry[];
  totalVisibleRewardsCount: number;
  viewMode: ViewMode;
  currentCoins?: number;
  deletingRewardIds?: Set<string>;
  redeemingRewardIds?: Set<string>;
  debtQuantities?: Record<string, number>;
  onDebtQuantityChange?: (rewardId: string, nextQuantity: number) => void;
  onSelectVariant?: (groupId: string, variantId: string) => void;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragEnd: (event: DragEndEvent) => void;
  onBuy: (reward: Reward, quantity?: number) => void;
  onEdit: (reward: Reward) => void;
  onContextMenu: (e: MouseEvent, reward: Reward) => void;
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
  debtQuantities,
  onDebtQuantityChange,
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

  const itemIds = useMemo(
    () => entries.map((entry) => entry.primaryReward.id),
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
      itemIds={itemIds}
      viewMode={viewMode}
      headerMode="reward"
      sensors={sensors}
      onDragEnd={onDragEnd}
    >
      {entries.map((entry) => {
        const reward = entry.primaryReward;
        const unitQty = debtQuantities?.[reward.id] ?? 1;
        const canAfford =
          typeof currentCoins === "number"
            ? currentCoins >= reward.price * unitQty
            : true;

        const isDeleteChecking = Boolean(deletingRewardIds?.has(reward.id));
        const isRedeeming = Boolean(redeemingRewardIds?.has(reward.id));
        const hasVariants = entry.variants.length > 1;

        return viewMode === "card" ? (
          <RewardCard
            key={entry.groupId}
            groupId={entry.groupId}
            reward={reward}
            displayTitle={entry.displayTitle}
            hasGroupDescription={entry.hasGroupDescription}
            variants={hasVariants ? entry.variants : undefined}
            activeVariantId={reward.id}
            onSelectVariant={hasVariants ? onSelectVariant : undefined}
            unitQuantity={unitQty}
            onUnitQuantityChange={onDebtQuantityChange}
            maxUnitQuantity={DEBT_MAX_REDEEM_QUANTITY}
            onBuy={onBuy}
            onEdit={onEdit}
            onContextMenu={onContextMenu}
            canAfford={canAfford}
            currentCoins={currentCoins}
            isDeleteChecking={isDeleteChecking}
            isRedeeming={isRedeeming}
          />
        ) : (
          <RewardItemRow
            key={entry.groupId}
            groupId={entry.groupId}
            reward={reward}
            displayTitle={entry.displayTitle}
            variants={hasVariants ? entry.variants : undefined}
            activeVariantId={reward.id}
            onSelectVariant={hasVariants ? onSelectVariant : undefined}
            unitQuantity={unitQty}
            onUnitQuantityChange={onDebtQuantityChange}
            maxUnitQuantity={DEBT_MAX_REDEEM_QUANTITY}
            onBuy={onBuy}
            onEdit={onEdit}
            onContextMenu={onContextMenu}
            canAfford={canAfford}
            currentCoins={currentCoins}
            isDeleteChecking={isDeleteChecking}
            isRedeeming={isRedeeming}
          />
        );
      })}
    </CatalogGridListShell>
  );
}
