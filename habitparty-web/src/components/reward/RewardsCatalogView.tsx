"use client";

import type {
  DragEndEvent,
  SensorDescriptor,
  SensorOptions,
} from "@dnd-kit/core";
import { Plus, SearchX, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MouseEvent } from "react";
import { CatalogEmptyState } from "@/components/ui/CatalogEmptyState";
import { CatalogGridListShell } from "@/components/ui/CatalogGridListShell";
import { ItemRowHeader } from "@/components/ui/ItemRow";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { Reward } from "@/types/reward";
import type { ViewMode } from "@/types/ui";
import { AddRewardCard, RewardCard, RewardItemRow } from "./RewardCard";

interface RewardsCatalogViewProps {
  filteredRewards: Reward[];
  totalVisibleRewardsCount: number;
  viewMode: ViewMode;
  isCompact: boolean;
  currentCoins?: number;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragEnd: (event: DragEndEvent) => void;
  onBuy: (reward: Reward) => void;
  onEdit: (reward: Reward) => void;
  onContextMenu: (e: MouseEvent, reward: Reward) => void;
  onAddProduct: () => void;
  onClearFilters: () => void;
}

export function RewardsCatalogView({
  filteredRewards,
  totalVisibleRewardsCount,
  viewMode,
  isCompact,
  currentCoins,
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

  if (filteredRewards.length === 0) {
    const isStoreEmpty = totalVisibleRewardsCount === 0;
    return (
      <div className="flex flex-col gap-2.5 w-full pb-8">
        {viewMode === "list" && (
          <ItemRowHeader isCompact={isCompact} mode="reward" />
        )}
        <CatalogEmptyState
          isCompact={isCompact}
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
      itemIds={filteredRewards.map((r) => r.id)}
      viewMode={viewMode}
      isCompact={isCompact}
      headerMode="reward"
      sensors={sensors}
      onDragEnd={onDragEnd}
    >
      {filteredRewards.map((reward) => {
        const canAfford =
          typeof currentCoins === "number"
            ? currentCoins >= reward.price
            : true;

        return viewMode === "card" ? (
          <RewardCard
            key={reward.id}
            reward={reward}
            onBuy={onBuy}
            onEdit={onEdit}
            onContextMenu={onContextMenu}
            isCompact={isCompact}
            canAfford={canAfford}
          />
        ) : (
          <RewardItemRow
            key={reward.id}
            reward={reward}
            onBuy={onBuy}
            onEdit={onEdit}
            onContextMenu={onContextMenu}
            isCompact={isCompact}
            canAfford={canAfford}
          />
        );
      })}
      <AddRewardCard
        onClick={onAddProduct}
        viewMode={viewMode === "card" ? "card" : "list"}
        isCompact={isCompact}
      />
    </CatalogGridListShell>
  );
}
