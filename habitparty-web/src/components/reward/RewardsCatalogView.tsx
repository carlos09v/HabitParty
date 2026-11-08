"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type SensorDescriptor,
  type SensorOptions,
} from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import {
  rectSortingStrategy,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, SearchX, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import type { MouseEvent } from "react";
import { CatalogEmptyState } from "@/components/ui/CatalogEmptyState";
import { ItemRowHeader } from "@/components/ui/ItemRow";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { Reward } from "@/types/reward";
import type { ViewMode } from "@/types/ui";
import { cn } from "@/utils";
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
    <DndContext
      id="rewards-dnd-context"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
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
              "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 w-full pb-8",
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
                viewMode="list"
                isCompact={isCompact}
              />
            </ul>
          </div>
        )}
      </SortableContext>
    </DndContext>
  );
}
