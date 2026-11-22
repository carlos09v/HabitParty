"use client";

import type {
  DragEndEvent,
  SensorDescriptor,
  SensorOptions,
} from "@dnd-kit/core";
import { Plus, Receipt, SearchX, Store } from "lucide-react";
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
import { cn } from "@/utils";
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

  const { debtEntries, regularEntries, sortableItemIds } = useMemo(() => {
    const debts: RewardDisplayEntry[] = [];
    const regular: RewardDisplayEntry[] = [];
    const ids: string[] = [];

    for (const entry of entries) {
      if (isDebtReward(entry.primaryReward)) {
        debts.push(entry);
      } else {
        regular.push(entry);
        ids.push(entry.groupId);
      }
    }

    return {
      debtEntries: debts,
      regularEntries: regular,
      sortableItemIds: ids,
    };
  }, [entries]);

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

  const renderRewardEntry = (entry: RewardDisplayEntry, isDebt: boolean) => {
    const hasVariants = entry.variants.length > 1;
    const selectedVariantId = selectedVariantByGroup?.[entry.groupId];
    const reward =
      hasVariants && selectedVariantId
        ? (entry.variants.find((v) => v.id === selectedVariantId) ??
          entry.primaryReward)
        : entry.primaryReward;
    const isDeleteChecking = Boolean(deletingRewardIds?.has(reward.id));
    const isRedeeming = Boolean(redeemingRewardIds?.has(reward.id));

    if (viewMode === "card") {
      return (
        <RewardCard
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
          currentCoins={currentCoins}
          isDeleteChecking={isDeleteChecking}
          isRedeeming={isRedeeming}
          isReorderDisabled={isDebt}
        />
      );
    }

    const canAfford =
      typeof currentCoins === "number" ? currentCoins >= reward.price : true;

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
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {debtEntries.length > 0 && (
        <section
          aria-labelledby="rewards-debts-heading"
          className={cn(
            "flex flex-col gap-2.5 w-full",
            regularEntries.length === 0 && "pb-8",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-rose-500/12 border border-rose-500/25 text-rose-700 dark:text-rose-400 shrink-0"
                aria-hidden="true"
              >
                <Receipt size={13} />
              </span>
              <h2
                id="rewards-debts-heading"
                className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300"
              >
                {t("sections.debtsTitle")}
              </h2>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums bg-rose-500/12 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                {debtEntries.length}
              </span>
            </div>
            <p className="text-[11px] font-medium text-neutral-400">
              {t("sections.debtsHint")}
            </p>
          </div>

          {viewMode === "card" ? (
            <div className="@container w-full">
              <div className="catalog-card-grid grid grid-cols-1 w-full @min-[520px]:grid-cols-2 @min-[800px]:grid-cols-3 @min-[1080px]:grid-cols-4 @min-[1280px]:grid-cols-5 gap-3.5">
                {debtEntries.map((entry) => renderRewardEntry(entry, true))}
              </div>
            </div>
          ) : (
            <div className="@container flex flex-col gap-2.5 w-full">
              {regularEntries.length === 0 && <ItemRowHeader mode="reward" />}
              <ul
                className="flex flex-col gap-2 w-full"
                aria-label={t("sections.debtsListAria")}
              >
                {debtEntries.map((entry) => renderRewardEntry(entry, true))}
              </ul>
            </div>
          )}
        </section>
      )}

      {regularEntries.length > 0 && (
        <section
          aria-labelledby={
            debtEntries.length > 0 ? "rewards-showcase-heading" : undefined
          }
          className="flex flex-col gap-2.5 w-full"
        >
          {debtEntries.length > 0 && (
            <div className="flex items-center gap-2 px-0.5">
              <h2
                id="rewards-showcase-heading"
                className="text-xs font-bold uppercase tracking-wider text-neutral-400"
              >
                {t("sections.showcaseTitle")}
              </h2>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold tabular-nums bg-surface/80 dark:bg-white/8 text-neutral-300 border border-neutral-700/80 dark:border-white/10">
                {regularEntries.length}
              </span>
            </div>
          )}

          <CatalogGridListShell
            dndContextId="rewards-dnd-context"
            itemIds={sortableItemIds}
            viewMode={viewMode}
            headerMode="reward"
            listAriaLabel={t("sections.showcaseListAria")}
            sensors={sensors}
            onDragEnd={onDragEnd}
          >
            {regularEntries.map((entry) => renderRewardEntry(entry, false))}
          </CatalogGridListShell>
        </section>
      )}
    </div>
  );
}
