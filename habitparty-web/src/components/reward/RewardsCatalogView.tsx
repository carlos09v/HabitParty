import type {
  DragEndEvent,
  SensorDescriptor,
  SensorOptions,
} from "@dnd-kit/core";
import {
  Coffee,
  Gamepad2,
  Package,
  Plus,
  Receipt,
  SearchX,
  Store,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type MouseEvent, useMemo } from "react";
import { CatalogEmptyState } from "@/components/ui/CatalogEmptyState";
import { CatalogGridListShell } from "@/components/ui/CatalogGridListShell";
import type { RewardPrefillDraft } from "@/hooks/useRewardCatalogActions";
import type {
  Reward,
  RewardDisplayEntry,
  RewardGroupContext,
} from "@/types/reward";
import type { ViewMode } from "@/types/ui";
import { cn } from "@/utils";
import {
  extractRewardGroupBaseTitle,
  isDebtReward,
} from "@/utils/rewardGrouping";
import { RewardCard, RewardItemRow } from "./RewardCard";

interface RewardsCatalogViewProps {
  entries: RewardDisplayEntry[];
  fullGroupById?: ReadonlyMap<string, RewardGroupContext>;
  totalVisibleRewardsCount: number;
  viewMode: ViewMode;
  isGamified: boolean;
  isReorderDisabled?: boolean;
  sortBy?: string;
  currentCoins?: number;
  ownedCountByRewardId?: Readonly<Record<string, number>>;
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
  onSelectStarterTemplate?: (draft: RewardPrefillDraft) => void;
  onClearFilters: () => void;
}

export function RewardsCatalogView({
  entries,
  fullGroupById,
  totalVisibleRewardsCount,
  viewMode,
  isGamified,
  isReorderDisabled = false,
  sortBy,
  currentCoins,
  ownedCountByRewardId,
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
  onSelectStarterTemplate,
  onClearFilters,
}: RewardsCatalogViewProps) {
  const t = useTranslations("rewards.container");

  const { debtEntries, debtIds, regularEntries, sortableItemIds } =
    useMemo(() => {
      const debts: RewardDisplayEntry[] = [];
      const debtGroupIds: string[] = [];
      const regular: RewardDisplayEntry[] = [];
      const ids: string[] = [];

      for (const entry of entries) {
        if (isDebtReward(entry.primaryReward)) {
          debts.push(entry);
          debtGroupIds.push(entry.groupId);
        } else {
          regular.push(entry);
          ids.push(entry.groupId);
        }
      }

      return {
        debtEntries: debts,
        debtIds: debtGroupIds,
        regularEntries: regular,
        sortableItemIds: ids,
      };
    }, [entries]);

  const starterTemplates = useMemo<
    Array<{
      id: string;
      icon: typeof Coffee;
      label: string;
      meta: string;
      draft: RewardPrefillDraft;
    }>
  >(
    () => [
      {
        id: "coffee",
        icon: Coffee,
        label: t("empty.templates.coffeeTitle"),
        meta: t("empty.templates.coffeeMeta"),
        draft: {
          title: t("empty.templates.coffeeTitle"),
          category: "Bem-estar",
          type: "SingleUse",
          icon: "coffee",
          price: 4,
          suggestedPackageLevel: "Básico",
        },
      },
      {
        id: "gaming",
        icon: Gamepad2,
        label: t("empty.templates.gamingTitle"),
        meta: t("empty.templates.gamingMeta"),
        draft: {
          title: extractRewardGroupBaseTitle(t("empty.templates.gamingTitle")),
          category: "Entretenimento",
          type: "TimeBased",
          icon: "gamepad",
          baseDurationMinutes: 30,
          suggestedPackageLevel: "Básico",
        },
      },
      {
        id: "box",
        icon: Package,
        label: isGamified
          ? t("empty.templates.boxTitleGamified")
          : t("empty.templates.boxTitleProductivity"),
        meta: t("empty.templates.boxMeta"),
        draft: {
          title: isGamified
            ? t("empty.templates.boxTitleGamified")
            : t("empty.templates.boxTitleProductivity"),
          category: "Sorte",
          type: "MysteryBox",
          icon: "mystery_box",
          price: 5,
          suggestedPackageLevel: "Básico",
        },
      },
    ],
    [isGamified, t],
  );

  if (entries.length === 0) {
    const isStoreEmpty = totalVisibleRewardsCount === 0;
    return (
      <div className="flex flex-col gap-2.5 w-full pb-8">
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
              <div className="flex flex-col items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={onAddProduct}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-on-gold font-bold text-xs hover:bg-gold-hover shadow-glow-gold-xs transition-colors cursor-pointer"
                >
                  <Plus size={15} />
                  <span>{t("empty.createFirstReward")}</span>
                </button>
                {onSelectStarterTemplate && (
                  <div className="flex flex-col items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-medium text-neutral-400">
                      {t("empty.templatesHint")}
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {starterTemplates.map((tpl) => {
                        const TplIcon = tpl.icon;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => onSelectStarterTemplate(tpl.draft)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 dark:border-white/15 bg-card dark:bg-surface/80 hover:border-gold/50 hover:text-gold text-neutral-200 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <TplIcon
                              size={13}
                              className="text-gold shrink-0"
                              aria-hidden="true"
                            />
                            <span>{tpl.label}</span>
                            <span className="text-[10px] text-neutral-400 font-normal">
                              ({tpl.meta})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
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

  const effectiveDragDisabled = isReorderDisabled || regularEntries.length <= 1;

  const renderRewardEntry = (entry: RewardDisplayEntry, isDebt: boolean) => {
    const hasVariants = entry.variants.length > 1;
    const selectedVariantId = selectedVariantByGroup?.[entry.groupId];
    const defaultVariant =
      hasVariants && sortBy === "price-desc"
        ? entry.variants.reduce((best, curr) =>
            curr.price > best.price ? curr : best,
          )
        : entry.primaryReward;
    const reward =
      hasVariants && selectedVariantId
        ? (entry.variants.find((v) => v.id === selectedVariantId) ??
          defaultVariant)
        : defaultVariant;

    const fullGroupContext = fullGroupById?.get(entry.groupId);
    const isDeleteChecking = Boolean(deletingRewardIds?.has(reward.id));
    const isRedeeming = Boolean(redeemingRewardIds?.has(reward.id));
    const ownedQuantity = ownedCountByRewardId?.[reward.id] ?? 0;

    // Clamping currentCoins ao preço do item evita re-renders de cards já compráveis quando saldo sobe
    const clampedCoins =
      typeof currentCoins === "number"
        ? Math.min(currentCoins, reward.price)
        : undefined;
    const canAfford =
      typeof currentCoins === "number" ? currentCoins >= reward.price : true;

    const sharedProps = {
      groupId: entry.groupId,
      reward,
      displayTitle: entry.displayTitle,
      variants: hasVariants ? entry.variants : undefined,
      fullGroupContext,
      activeVariantId: reward.id,
      onSelectVariant: hasVariants ? onSelectVariant : undefined,
      onBuy,
      onEdit,
      onContextMenu,
      currentCoins: clampedCoins,
      canAfford,
      ownedQuantity,
      isGamified,
      isDeleteChecking,
      isRedeeming,
      isReorderDisabled: isDebt || effectiveDragDisabled,
    };

    if (viewMode !== "list") {
      return <RewardCard key={entry.groupId} {...sharedProps} />;
    }

    return <RewardItemRow key={entry.groupId} {...sharedProps} />;
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

          <CatalogGridListShell
            itemIds={debtIds}
            viewMode={viewMode}
            headerMode="reward"
            listAriaLabel={t("sections.debtsListAria")}
            disableDnd={true}
            hideHeader={false}
            bottomPaddingClassName="pb-0"
          >
            {debtEntries.map((entry) => renderRewardEntry(entry, true))}
          </CatalogGridListShell>
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
            disableDnd={effectiveDragDisabled}
            hideHeader={debtEntries.length > 0}
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
