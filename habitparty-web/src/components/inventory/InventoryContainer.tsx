"use client";

import { arrayMove } from "@dnd-kit/sortable";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { reorderInventory } from "@/actions/inventoryActions";
import { InventoryCatalogView } from "@/components/inventory/InventoryCatalogView";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { FilterBar } from "@/components/ui/FilterBar";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { REWARD_CATEGORY_FILTER_VALUES } from "@/constants/reward";
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
import { calculateInventoryWelcomeStats } from "@/utils/catalogMetrics";
import {
  toCategoryMessageKey,
  toRewardTypeMessageKey,
} from "@/utils/rewardMapper";

const MysteryBoxRouletteModal = dynamic(
  () =>
    import("@/components/inventory/MysteryBoxRouletteModal").then((mod) => ({
      default: mod.MysteryBoxRouletteModal,
    })),
  { ssr: false },
);

interface InventoryContainerProps {
  initialItems: InventoryItem[];
  initialExperienceMode?: ExperienceMode;
}

export function InventoryContainer({
  initialItems,
  initialExperienceMode = "PRODUCTIVITY",
}: InventoryContainerProps) {
  return (
    <ExperienceModeFallbackProvider mode={initialExperienceMode}>
      <InventoryContainerContent
        initialItems={initialItems}
        initialExperienceMode={initialExperienceMode}
      />
    </ExperienceModeFallbackProvider>
  );
}

function InventoryContainerContent({
  initialItems,
  initialExperienceMode,
}: Required<InventoryContainerProps>) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("inventory.container");
  const tRewardOptions = useTranslations("rewards.options");
  const { isGamified } = useExperienceMode(initialExperienceMode);

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
    () => [
      { label: t("filters.typeAll"), value: "" },
      { label: t("filters.typeSingleUse"), value: "SingleUse" },
      { label: t("filters.typeTimeBased"), value: "TimeBased" },
      {
        label: isGamified
          ? t("filters.typeMysteryBox")
          : t("filters.typeMysteryBoxProductivity"),
        value: "MysteryBox",
      },
    ],
    [isGamified, t],
  );

  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      REWARD_CATEGORY_FILTER_VALUES.filter(
        (value) => toCategoryMessageKey(value) !== "DEBT",
      ).map((value) => ({
        value,
        label: value
          ? tRewardOptions(`categories.${toCategoryMessageKey(value)}`)
          : tRewardOptions("categories.all"),
      })),
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
    handleOpenMysteryBox,
    handleCloseMysteryBox,
    handleMysteryBoxOpened,
    itemToDiscard,
    setItemToDiscard,
    isDiscarding,
    handleConfirmDiscard,
    handleUseItem,
    handleSendToFocus,
    usingItemIds,
    sendingItemIds,
    contextMenu,
    closeContextMenu,
    handleItemContextMenu,
    contextMenuItems,
  } = useInventoryCatalogActions({ items, setItems });

  const filteredItems = useMemo(() => {
    if (!isFiltering) {
      return items;
    }

    const searchLower = filters.search.trim().toLowerCase();
    const filterTypeKey = filters.type
      ? toRewardTypeMessageKey(filters.type)
      : null;
    const filterCategoryKey = filters.category
      ? toCategoryMessageKey(filters.category)
      : null;

    let result = items.filter((item) => {
      const matchSearch =
        !searchLower ||
        item.reward.title.toLowerCase().includes(searchLower) ||
        (item.reward.description || "").toLowerCase().includes(searchLower);

      const matchType =
        !filterTypeKey ||
        toRewardTypeMessageKey(item.reward.type) === filterTypeKey;
      const matchCat =
        !filterCategoryKey ||
        toCategoryMessageKey(item.reward.category) === filterCategoryKey;

      const matchStatus =
        !filters.status ||
        (filters.status === "IN_FOCUS"
          ? item.status === "IN_FOCUS"
          : item.status !== "IN_FOCUS");

      return matchSearch && matchType && matchCat && matchStatus;
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

  const welcomeStats = useMemo(() => {
    const { stats } = calculateInventoryWelcomeStats(items, locale, isGamified);
    return stats.map((stat, index) => {
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
              id: "sortBy",
              label: t("filters.sortLabel"),
              options: sortOptions,
              value: filters.sortBy || "",
            },
          ]}
          onDropdownChange={(id, value) => handleFilterChange({ [id]: value })}
          onClearDropdowns={handleClearFilters}
        />

        <InventoryCatalogView
          filteredItems={filteredItems}
          totalItemsCount={items.length}
          viewMode={viewMode}
          sensors={sensors}
          onDragEnd={handleDragEnd}
          onUse={handleUseItem}
          onSendToFocus={handleSendToFocus}
          usingItemIds={usingItemIds}
          sendingItemIds={sendingItemIds}
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
          }
          confirmText={t("discardModal.confirmText")}
          cancelText={t("discardModal.cancelText")}
          variant="danger"
          isLoading={isDiscarding}
        />
      )}

      {openingBoxItem && (
        <MysteryBoxRouletteModal
          isOpen={Boolean(openingBoxItem)}
          onClose={handleCloseMysteryBox}
          item={openingBoxItem}
          onSuccess={handleMysteryBoxOpened}
        />
      )}
    </>
  );
}
