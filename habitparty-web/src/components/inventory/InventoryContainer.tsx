"use client";

import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { reorderInventory } from "@/actions/inventoryActions";
import { InventoryCatalogView } from "@/components/inventory/InventoryCatalogView";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { FilterBar } from "@/components/ui/FilterBar";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useInventoryCatalogActions } from "@/hooks/useInventoryCatalogActions";
import { useItemCatalogFilters } from "@/hooks/useItemCatalogFilters";
import { useReorderableList } from "@/hooks/useReorderableList";
import type { AppLocale } from "@/i18n/config";
import type { InventoryItem } from "@/types/inventory";
import type { SelectOption } from "@/types/ui";
import { calculateInventoryWelcomeStats } from "@/utils/catalogMetrics";

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
  const { isGamified } = useExperienceMode();

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
      { label: t("filters.typeMysteryBox"), value: "MysteryBox" },
    ],
    [t],
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
      onReorderServerAction: async (updates) => {
        return reorderInventory(
          updates.map((u) => ({ itemId: u.id, newIndex: u.newIndex })),
        );
      },
      isFiltering,
    });

  const {
    openingBoxItem,
    handleOpenMysteryBox,
    handleCloseMysteryBox,
    itemToDiscard,
    setItemToDiscard,
    isDiscarding,
    handleConfirmDiscard,
    handleUseItem,
    handleSendToFocus,
    contextMenu,
    closeContextMenu,
    handleItemContextMenu,
    contextMenuItems,
  } = useInventoryCatalogActions({ items, setItems });

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const matchSearch =
        !filters.search ||
        item.reward.title
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        item.reward.description
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      const matchType = !filters.type || item.reward.type === filters.type;
      const matchCat =
        !filters.category || item.reward.category === filters.category;

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
        a.reward.title.localeCompare(b.reward.title),
      );
    }

    return result;
  }, [items, filters]);

  const { stats: welcomeStats } = useMemo(() => {
    return calculateInventoryWelcomeStats(items, locale, isGamified);
  }, [items, locale, isGamified]);

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
        />
      )}
    </>
  );
}
