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
import type { ReactNode } from "react";
import {
  ItemRowHeader,
  type ItemRowHeaderProps,
} from "@/components/ui/ItemRow";
import type { ViewMode } from "@/types/ui";
import { cn } from "@/utils";

export interface CatalogGridListShellProps {
  dndContextId: string;
  itemIds: string[];
  viewMode: ViewMode;
  isCompact: boolean;
  headerMode: ItemRowHeaderProps["mode"];
  listAriaLabel?: string;
  gridClassName?: string;
  sensors: SensorDescriptor<SensorOptions>[];
  onDragEnd: (event: DragEndEvent) => void;
  children: ReactNode;
}

/**
 * Shell compartilhado de catálogo com Drag-and-Drop (@dnd-kit) e alternância Grid (Cards) / Lista (Linhas)
 * utilizado pela Vitrine de Recompensas e pela Mochila (Inventário).
 */
export function CatalogGridListShell({
  dndContextId,
  itemIds,
  viewMode,
  isCompact,
  headerMode,
  listAriaLabel,
  gridClassName,
  sensors,
  onDragEnd,
  children,
}: CatalogGridListShellProps) {
  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      modifiers={[restrictToParentElement, restrictToWindowEdges]}
    >
      <SortableContext
        items={itemIds}
        strategy={
          viewMode === "card"
            ? rectSortingStrategy
            : verticalListSortingStrategy
        }
      >
        {viewMode === "card" ? (
          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-2 w-full pb-8",
              gridClassName ??
                (isCompact
                  ? "lg:grid-cols-3 xl:grid-cols-4 gap-3.5"
                  : "lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-4"),
            )}
          >
            {children}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 w-full pb-8">
            <ItemRowHeader isCompact={isCompact} mode={headerMode} />
            <ul
              className="flex flex-col gap-2 w-full"
              aria-label={listAriaLabel}
            >
              {children}
            </ul>
          </div>
        )}
      </SortableContext>
    </DndContext>
  );
}
