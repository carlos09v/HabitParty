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
import { Backpack, Package, SearchX, Store } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { MouseEvent } from "react";
import {
  InventoryCard,
  InventoryItemRow,
} from "@/components/inventory/InventoryCard";
import { CatalogEmptyState } from "@/components/ui/CatalogEmptyState";
import { ItemRowHeader } from "@/components/ui/ItemRow";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { InventoryItem } from "@/types/inventory";
import type { ViewMode } from "@/types/ui";
import { cn } from "@/utils";

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
    <DndContext
      id="inventory-dnd-context"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      modifiers={[restrictToParentElement, restrictToWindowEdges]}
    >
      <SortableContext
        items={filteredItems.map((i) => i.id)}
        strategy={
          viewMode === "card"
            ? rectSortingStrategy
            : verticalListSortingStrategy
        }
      >
        {viewMode === "card" ? (
          <div
            className={cn(
              "w-full pb-8",
              isCompact
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4",
            )}
          >
            {filteredItems.map((item) => (
              <InventoryCard
                key={item.id}
                item={item}
                onUse={onUse}
                onSendToFocus={onSendToFocus}
                onOpenMysteryBox={onOpenMysteryBox}
                onContextMenu={onContextMenu}
                isCompact={isCompact}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 w-full pb-8">
            <ItemRowHeader isCompact={isCompact} mode="inventory" />
            <ul
              className="flex flex-col gap-2 w-full"
              aria-label={t("listAriaLabel")}
            >
              {filteredItems.map((item) => (
                <InventoryItemRow
                  key={item.id}
                  item={item}
                  onUse={onUse}
                  onSendToFocus={onSendToFocus}
                  onOpenMysteryBox={onOpenMysteryBox}
                  onContextMenu={onContextMenu}
                  isCompact={isCompact}
                />
              ))}
            </ul>
          </div>
        )}
      </SortableContext>
    </DndContext>
  );
}
