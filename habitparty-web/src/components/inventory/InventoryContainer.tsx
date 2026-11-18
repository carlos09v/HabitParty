"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useRef } from "react";
import { reorderInventory } from "@/actions/inventoryActions";
import { InventoryCatalogView } from "@/components/inventory/InventoryCatalogView";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { FilterBar } from "@/components/ui/FilterBar";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { REWARD_CATEGORY_OPTIONS } from "@/constants/reward";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useInventoryCatalogActions } from "@/hooks/useInventoryCatalogActions";
import { useItemCatalogFilters } from "@/hooks/useItemCatalogFilters";
import { useReorderableList } from "@/hooks/useReorderableList";
import type { AppLocale } from "@/i18n/config";
import type { InventoryItem } from "@/types/inventory";
import type { SelectOption } from "@/types/ui";
import { calculateInventoryWelcomeStats } from "@/utils/catalogMetrics";
import {
  isMysteryBoxReward,
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

export function InventoryContainer({
  initialItems,
  isCompact = false,
}: {
  initialItems: InventoryItem[];
  isCompact?: boolean;
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("inventory.container");
  const tRewardOptions = useTranslations("rewards.options");
  const { isGamified } = useExperienceMode();

  const itemsRef = useRef<InventoryItem[]>(initialItems);

  const handleReorderInventory = useCallback(
    async (updates: { id: string; newIndex: number }[]) => {
      const stackById = new Map(
        itemsRef.current.map((item) => [item.id, item]),
      );
      let flatIndex = 0;
      const expandedUpdates: { itemId: string; newIndex: number }[] = [];

      for (const update of updates) {
        const stack = stackById.get(update.id);
        const physicalIds = stack?.itemIds?.length
          ? stack.itemIds
          : [update.id];
        for (const itemId of physicalIds) {
          expandedUpdates.push({ itemId, newIndex: flatIndex++ });
        }
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
    });

  itemsRef.current = items;

  const hasMysteryItems = useMemo(
    () =>
      items.some((item) =>
        isMysteryBoxReward(
          item.reward?.type || item.itemType,
          item.reward?.icon || item.iconName,
        ),
      ),
    [items],
  );

  const statusOptions = useMemo<SelectOption[]>(
    () => [
      { label: t("filters.statusAll"), value: "" },
      { label: t("filters.statusAvailable"), value: "AVAILABLE" },
      { label: t("filters.statusInFocus"), value: "IN_FOCUS" },
    ],
    [t],
  );

  const typeOptions = useMemo<SelectOption[]>(() => {
    const base: SelectOption[] = [
      { label: t("filters.typeAll"), value: "" },
      { label: t("filters.typeSingleUse"), value: "SingleUse" },
      { label: t("filters.typeTimeBased"), value: "TimeBased" },
    ];
    if (isGamified || hasMysteryItems) {
      base.push({ label: t("filters.typeMysteryBox"), value: "MysteryBox" });
    }
    return base;
  }, [hasMysteryItems, isGamified, t]);

  const categoryOptions = useMemo<SelectOption[]>(
    () =>
      REWARD_CATEGORY_OPTIONS.filter((opt) => opt.value !== "Dívida").map(
        (opt) => ({
          value: opt.value,
          label: opt.value
            ? tRewardOptions(`categories.${toCategoryMessageKey(opt.value)}`)
            : tRewardOptions("categories.all"),
        }),
      ),
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
    const searchLower = filters.search.trim().toLowerCase();

    let result = items.filter((item) => {
      const matchSearch =
        !searchLower ||
        item.reward.title.toLowerCase().includes(searchLower) ||
        (item.reward.description || "").toLowerCase().includes(searchLower);

      const matchType =
        !filters.type ||
        toRewardTypeMessageKey(item.reward.type) ===
          toRewardTypeMessageKey(filters.type);
      const matchCat =
        !filters.category ||
        toCategoryMessageKey(item.reward.category) ===
          toCategoryMessageKey(filters.category);

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
  }, [items, filters, locale]);

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
      <WelcomeCard
        storageKey="inventory"
        stats={welcomeStats}
        compact={isCompact}
      />

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
          isCompact={isCompact}
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
          itemToDiscard ? (
            <span>
              {t.rich("discardModal.description", {
                title: itemToDiscard.reward.title,
                strong: (chunks) => (
                  <strong className="text-neutral-100">{chunks}</strong>
                ),
              })}
            </span>
          ) : null
        }
        confirmText={t("discardModal.confirmText")}
        cancelText={t("discardModal.cancelText")}
        variant="danger"
        isLoading={isDiscarding}
      />

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
