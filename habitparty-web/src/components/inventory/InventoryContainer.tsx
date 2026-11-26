"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { History, Store } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { reorderInventory } from "@/actions/inventoryActions";
import { InventoryCatalogView } from "@/components/inventory/InventoryCatalogView";
import {
  CatalogCapacityPill,
  useResolvedIsPremium,
} from "@/components/ui/CatalogItemShared";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { FilterBar } from "@/components/ui/FilterBar";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import {
  ExperienceModeFallbackProvider,
  useExperienceMode,
} from "@/hooks/useExperienceMode";
import { useInventoryCatalogActions } from "@/hooks/useInventoryCatalogActions";
import { useItemCatalogFilters } from "@/hooks/useItemCatalogFilters";
import { useReorderableList } from "@/hooks/useReorderableList";
import type { AppLocale } from "@/i18n/config";
import type { InventoryItem } from "@/types/inventory";
import type { ExperienceMode, SelectOption } from "@/types/ui";
import {
  buildCatalogCategoryOptions,
  buildCatalogPackageOptions,
  buildCatalogTypeOptions,
  matchesCatalogSearchAndMeta,
} from "@/utils/catalogFiltering";
import { calculateInventoryWelcomeStats } from "@/utils/catalogMetrics";

const FREE_INVENTORY_CAPACITY = 20;
const PREMIUM_INVENTORY_CAPACITY = 100;

const MysteryBoxRouletteModal = dynamic(
  () =>
    import("@/components/inventory/MysteryBoxRouletteModal").then((mod) => ({
      default: mod.MysteryBoxRouletteModal,
    })),
  { ssr: false },
);

interface InventoryContainerProps {
  initialItems: InventoryItem[];
  initialIsPremium?: boolean;
  initialExperienceMode?: ExperienceMode;
}

export function InventoryContainer({
  initialItems,
  initialIsPremium = false,
  initialExperienceMode = "PRODUCTIVITY",
}: InventoryContainerProps) {
  return (
    <ExperienceModeFallbackProvider mode={initialExperienceMode}>
      <InventoryContainerContent
        initialItems={initialItems}
        initialIsPremium={initialIsPremium}
        initialExperienceMode={initialExperienceMode}
      />
    </ExperienceModeFallbackProvider>
  );
}

function InventoryContainerContent({
  initialItems,
  initialIsPremium,
  initialExperienceMode,
}: Required<InventoryContainerProps>) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("inventory.container");
  const tRewardOptions = useTranslations("rewards.options");
  const { isGamified } = useExperienceMode(initialExperienceMode);
  const isPremium = useResolvedIsPremium(initialIsPremium);

  const resolveInventoryStackOrder = useCallback(
    (activeId: string, overId: string, currentItems: InventoryItem[]) => {
      const oldIndex = currentItems.findIndex((i) => i.id === activeId);
      const newIndex = currentItems.findIndex((i) => i.id === overId);
      if (oldIndex === -1 || newIndex === -1) return null;

      const moved = arrayMove(currentItems, oldIndex, newIndex);
      let flatIndex = 0;
      return moved.map((stack) => {
        const count = stack.itemIds?.length || 1;
        const nextOrderIndexes = Array.from(
          { length: count },
          () => flatIndex++,
        );
        return {
          ...stack,
          orderIndex: nextOrderIndexes[0] ?? stack.orderIndex,
          itemOrderIndexes: nextOrderIndexes,
        };
      });
    },
    [],
  );

  const handleReorderInventory = useCallback(
    async (
      _updates: { id: string; newIndex: number }[],
      context: { previousItems: InventoryItem[]; nextItems: InventoryItem[] },
    ) => {
      const prevOrderByPhysicalId = new Map<string, number>();
      for (const stack of context.previousItems) {
        const ids = stack.itemIds?.length ? stack.itemIds : [stack.id];
        ids.forEach((itemId, idx) => {
          prevOrderByPhysicalId.set(
            itemId,
            stack.itemOrderIndexes?.[idx] ?? stack.orderIndex ?? -1,
          );
        });
      }

      let flatIndex = 0;
      const expandedUpdates: { itemId: string; newIndex: number }[] = [];
      for (const stack of context.nextItems) {
        const ids = stack.itemIds?.length ? stack.itemIds : [stack.id];
        for (const itemId of ids) {
          if (prevOrderByPhysicalId.get(itemId) !== flatIndex) {
            expandedUpdates.push({ itemId, newIndex: flatIndex });
          }
          flatIndex += 1;
        }
      }

      if (expandedUpdates.length === 0) {
        return { success: true as const };
      }
      return reorderInventory(expandedUpdates);
    },
    [],
  );

  const {
    viewMode,
    setViewMode,
    filters,
    isFiltering,
    handleFilterChange,
    handleClearFilters,
  } = useItemCatalogFilters("inventory");

  const { items, setItems, sensors, handleDragEnd } =
    useReorderableList<InventoryItem>({
      initialItems,
      onReorderServerAction: handleReorderInventory,
      isFiltering,
      resolveDragReorder: resolveInventoryStackOrder,
    });

  const statusOptions = useMemo<SelectOption[]>(
    () => [
      { label: t("filters.statusAll"), value: "" },
      { label: t("filters.statusAvailable"), value: "AVAILABLE" },
      { label: t("filters.statusInFocus"), value: "IN_FOCUS" },
    ],
    [t],
  );

  const typeOptions = useMemo<SelectOption[]>(
    () =>
      buildCatalogTypeOptions({
        allLabel: t("filters.typeAll"),
        isGamified,
        getTypeLabel: (typeKey) => t(`filters.type${typeKey}`),
      }),
    [isGamified, t],
  );

  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      buildCatalogCategoryOptions({
        allLabel: tRewardOptions("categories.all"),
        getCategoryLabel: (key) => tRewardOptions(`categories.${key}`),
        excludeDebt: true,
      }),
    [tRewardOptions],
  );

  const packageOptions = useMemo<SelectOption[]>(
    () =>
      buildCatalogPackageOptions({
        allLabel: tRewardOptions("packages.all"),
        getPackageLabel: (key) => tRewardOptions(`packages.${key}`),
      }),
    [tRewardOptions],
  );

  const sortOptions = useMemo<SelectOption[]>(
    () => [
      { label: t("filters.sortDefault"), value: "" },
      { label: t("filters.sortQuantityDesc"), value: "quantity-desc" },
      { label: t("filters.sortName"), value: "name" },
    ],
    [t],
  );

  const {
    openingBoxItem,
    lastWonInventoryItem,
    remainingBoxesInOpeningStack,
    handleOpenMysteryBox,
    handleOpenNextMysteryBox,
    handleCloseMysteryBox,
    handleMysteryBoxOpened,
    itemToDiscard,
    setItemToDiscard,
    isDiscarding,
    handleConfirmDiscard,
    activeReturnConfirm,
    setActiveReturnConfirm,
    isReturningActive,
    handleConfirmReturnActive,
    handleUseItem,
    handleSendToFocus,
    usingItemIds,
    sendingItemIds,
    returningItemIds,
    contextMenu,
    closeContextMenu,
    handleItemContextMenu,
    contextMenuItems,
  } = useInventoryCatalogActions({ items, setItems });

  const filteredItems = useMemo(() => {
    if (!isFiltering) {
      return items;
    }

    let result = items.filter((item) => {
      if (!matchesCatalogSearchAndMeta(item.reward, filters)) {
        return false;
      }

      if (
        filters.status &&
        (filters.status === "IN_FOCUS"
          ? item.status !== "IN_FOCUS"
          : item.status === "IN_FOCUS")
      ) {
        return false;
      }

      return true;
    });

    if (filters.sortBy === "quantity-desc") {
      result = [...result].sort((a, b) => b.quantity - a.quantity);
    } else if (filters.sortBy === "name") {
      result = [...result].sort((a, b) =>
        a.reward.title.localeCompare(b.reward.title, locale),
      );
    }

    return result;
  }, [items, isFiltering, filters, locale]);

  const { welcomeStats, totalPhysicalItems } = useMemo(() => {
    const { stats, totalQuantity } = calculateInventoryWelcomeStats(
      items,
      locale,
      isGamified,
    );
    const mappedStats = stats.map((stat, index) => {
      if (index === 0) {
        return {
          ...stat,
          onClick: isFiltering ? handleClearFilters : undefined,
        };
      }
      if (index === 1) {
        return {
          ...stat,
          active: filters.status === "IN_FOCUS",
          onClick: () =>
            handleFilterChange({
              status: filters.status === "IN_FOCUS" ? "" : "IN_FOCUS",
            }),
        };
      }
      if (index === 2) {
        return {
          ...stat,
          active: filters.type === "SingleUse",
          onClick: () =>
            handleFilterChange({
              type: filters.type === "SingleUse" ? "" : "SingleUse",
            }),
        };
      }
      return stat;
    });
    return { welcomeStats: mappedStats, totalPhysicalItems: totalQuantity };
  }, [
    items,
    locale,
    isGamified,
    isFiltering,
    filters.status,
    filters.type,
    handleFilterChange,
    handleClearFilters,
  ]);

  const maxCapacity = isPremium
    ? PREMIUM_INVENTORY_CAPACITY
    : FREE_INVENTORY_CAPACITY;
  const isNearCapacity = totalPhysicalItems >= Math.floor(maxCapacity * 0.9);

  return (
    <>
      <WelcomeCard storageKey="inventory" stats={welcomeStats} />

      <section className="flex-1 min-h-0 flex flex-col gap-4 sm:gap-6 w-full pb-10">
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
              id: "status",
              label: t("filters.statusLabel"),
              options: statusOptions,
              value: filters.status || "",
            },
            {
              id: "category",
              label: t("filters.categoryLabel"),
              options: categoryOptions,
              value: filters.category || "",
            },
            {
              id: "type",
              label: t("filters.typeLabel"),
              options: typeOptions,
              value: filters.type,
            },
            {
              id: "packageLevel",
              label: t("filters.packageLabel"),
              options: packageOptions,
              value: filters.packageLevel || "",
            },
            {
              id: "sortBy",
              label: t("filters.sortLabel"),
              options: sortOptions,
              value: filters.sortBy || "",
            },
          ]}
          onDropdownChange={(id, value) => handleFilterChange({ [id]: value })}
          onClearDropdowns={handleClearFilters}
          rightActions={
            <div className="flex items-center gap-2 flex-wrap">
              <CatalogCapacityPill
                current={totalPhysicalItems}
                max={maxCapacity}
                isPremium={isPremium}
                isWarning={isNearCapacity}
                title={t("capacityTitle", {
                  current: totalPhysicalItems,
                  max: maxCapacity,
                })}
              />

              <Link
                href="/history"
                className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-neutral-700 dark:border-white/15 bg-card dark:bg-surface/60 hover:border-gold/45 hover:text-gold text-neutral-300 text-xs font-semibold transition-colors"
              >
                <History size={14} aria-hidden="true" />
                <span>{t("quickLinks.history")}</span>
              </Link>

              <Link
                href="/rewards"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gold/15 hover:bg-gold/25 border border-gold/40 text-amber-800 dark:text-gold text-xs font-bold transition-colors"
              >
                <Store size={14} aria-hidden="true" />
                <span>
                  {isGamified
                    ? t("quickLinks.storeGamified")
                    : t("quickLinks.storeProductivity")}
                </span>
              </Link>
            </div>
          }
        />

        <InventoryCatalogView
          filteredItems={filteredItems}
          totalItemsCount={items.length}
          viewMode={viewMode}
          isGamified={isGamified}
          isReorderDisabled={isFiltering}
          sensors={sensors}
          onDragEnd={handleDragEnd}
          onUse={handleUseItem}
          onSendToFocus={handleSendToFocus}
          usingItemIds={usingItemIds}
          sendingItemIds={sendingItemIds}
          returningItemIds={returningItemIds}
          onOpenMysteryBox={handleOpenMysteryBox}
          onContextMenu={handleItemContextMenu}
          onClearFilters={handleClearFilters}
        />
      </section>

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={closeContextMenu}
        items={contextMenuItems}
      />

      {itemToDiscard && (
        <ConfirmationModal
          isOpen={Boolean(itemToDiscard)}
          onClose={() => !isDiscarding && setItemToDiscard(null)}
          onConfirm={handleConfirmDiscard}
          title={
            isGamified
              ? t("discardModal.titleGamified")
              : t("discardModal.titleProductivity")
          }
          description={
            <div className="flex flex-col gap-1.5">
              <span>
                {t.rich(
                  isGamified
                    ? "discardModal.description"
                    : "discardModal.descriptionProductivity",
                  {
                    title: itemToDiscard.reward.title,
                    strong: (chunks) => (
                      <strong className="text-neutral-100">{chunks}</strong>
                    ),
                  },
                )}
              </span>
              {itemToDiscard.quantity > 1 && (
                <span className="text-xs text-neutral-400">
                  {t("discardModal.remainingUnitsHint", {
                    remaining: itemToDiscard.quantity - 1,
                  })}
                </span>
              )}
            </div>
          }
          confirmText={t("discardModal.confirmText")}
          cancelText={t("discardModal.cancelText")}
          variant="danger"
          isLoading={isDiscarding}
        />
      )}

      {activeReturnConfirm && (
        <ConfirmationModal
          isOpen={Boolean(activeReturnConfirm)}
          onClose={() => !isReturningActive && setActiveReturnConfirm(null)}
          onConfirm={handleConfirmReturnActive}
          title={
            isGamified
              ? t("returnActiveModal.titleGamified")
              : t("returnActiveModal.titleProductivity")
          }
          description={t.rich(
            isGamified
              ? "returnActiveModal.descriptionGamified"
              : "returnActiveModal.descriptionProductivity",
            {
              title: activeReturnConfirm.item.reward.title,
              strong: (chunks) => (
                <strong className="text-neutral-100">{chunks}</strong>
              ),
            },
          )}
          confirmText={t("returnActiveModal.confirmText")}
          cancelText={t("returnActiveModal.cancelText")}
          variant="warning"
          isLoading={isReturningActive}
        />
      )}

      {openingBoxItem && (
        <MysteryBoxRouletteModal
          isOpen={Boolean(openingBoxItem)}
          onClose={handleCloseMysteryBox}
          item={openingBoxItem}
          wonInventoryItem={lastWonInventoryItem}
          remainingBoxesCount={remainingBoxesInOpeningStack}
          onSuccess={handleMysteryBoxOpened}
          onSendWonToFocus={handleSendToFocus}
          onUseWonItem={handleUseItem}
          onOpenNextBox={handleOpenNextMysteryBox}
        />
      )}
    </>
  );
}
