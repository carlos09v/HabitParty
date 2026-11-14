"use client";

import type {
  DragEndEvent,
  SensorDescriptor,
  SensorOptions,
} from "@dnd-kit/core";
import { Backpack, Package, SearchX, Store } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { MouseEvent } from "react";
import {
  InventoryCard,
  InventoryItemRow,
} from "@/components/inventory/InventoryCard";
import { CatalogEmptyState } from "@/components/ui/CatalogEmptyState";
import { CatalogGridListShell } from "@/components/ui/CatalogGridListShell";
import { ItemRowHeader } from "@/components/ui/ItemRow";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { InventoryItem } from "@/types/inventory";
import type { ViewMode } from "@/types/ui";

interface InventoryCatalogViewProps {
  filteredItems: InventoryItem[];
  totalItemsCount: number;
  viewMode: ViewMode;
  isCompact: boolean;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragEnd: (event: DragEndEvent) => void;
  onUse: (item: InventoryItem) => void;
  onSendToFocus: (item: InventoryItem) => void;
  onOpenMysteryBox: (item: InventoryItem) => void;
  onContextMenu: (e: MouseEvent, item: InventoryItem) => void;
  onClearFilters: () => void;
}

export function InventoryCatalogView({
  filteredItems,
  totalItemsCount,
  viewMode,
  isCompact,
  sensors,
  onDragEnd,
  onUse,
  onSendToFocus,
  onOpenMysteryBox,
  onContextMenu,
  onClearFilters,
}: InventoryCatalogViewProps) {
  const t = useTranslations("inventory.container");
  const { isGamified } = useExperienceMode();

  if (filteredItems.length === 0) {
    const isInventoryEmpty = totalItemsCount === 0;
    return (
      <div className="flex flex-col gap-2.5 w-full pb-8">
        {viewMode === "list" && (
          <ItemRowHeader isCompact={isCompact} mode="inventory" />
        )}
        <CatalogEmptyState
          isCompact={isCompact}
          icon={isInventoryEmpty ? (isGamified ? Backpack : Package) : SearchX}
          title={
            isInventoryEmpty
              ? isGamified
                ? t("emptyState.emptyTitleGamified")
                : t("emptyState.emptyTitleProductivity")
              : t("emptyState.noResultsTitle")
          }
          description={
            isInventoryEmpty
              ? isGamified
                ? t("emptyState.emptyDescriptionGamified")
                : t("emptyState.emptyDescriptionProductivity")
              : t("emptyState.noResultsDescription")
          }
          action={
            isInventoryEmpty ? (
              <Link
                href="/rewards"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold text-on-gold font-bold text-xs hover:bg-gold-hover shadow-glow-gold-xs transition-colors cursor-pointer"
              >
                <Store size={15} />
                <span>{t("emptyState.exploreStore")}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={onClearFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-primary/40 bg-surface/80 text-xs font-semibold text-gold hover:border-gold hover:bg-gold/10 transition-colors cursor-pointer"
              >
                <span>{t("emptyState.clearFilters")}</span>
              </button>
            )
          }
        />
      </div>
    );
  }

  return (
    <CatalogGridListShell
      dndContextId="inventory-dnd-context"
      itemIds={filteredItems.map((i) => i.id)}
      viewMode={viewMode}
      isCompact={isCompact}
      headerMode="inventory"
      listAriaLabel={t("listAriaLabel")}
      gridClassName={
        isCompact
          ? "lg:grid-cols-3 xl:grid-cols-4 gap-3.5"
          : "lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
      }
      sensors={sensors}
      onDragEnd={onDragEnd}
    >
      {filteredItems.map((item) =>
        viewMode === "card" ? (
          <InventoryCard
            key={item.id}
            item={item}
            onUse={onUse}
            onSendToFocus={onSendToFocus}
            onOpenMysteryBox={onOpenMysteryBox}
            onContextMenu={onContextMenu}
            isCompact={isCompact}
          />
        ) : (
          <InventoryItemRow
            key={item.id}
            item={item}
            onUse={onUse}
            onSendToFocus={onSendToFocus}
            onOpenMysteryBox={onOpenMysteryBox}
            onContextMenu={onContextMenu}
            isCompact={isCompact}
          />
        ),
      )}
    </CatalogGridListShell>
  );
}
