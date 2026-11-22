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

const DND_MODIFIERS = [restrictToParentElement, restrictToWindowEdges];

export interface CatalogGridListShellProps {
  dndContextId: string;
  itemIds: string[];
  viewMode: ViewMode;
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
      modifiers={DND_MODIFIERS}
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
          <div className="@container w-full">
            <div
              className={cn(
                "catalog-card-grid grid grid-cols-1 w-full pb-8",
                gridClassName ??
                  "@min-[520px]:grid-cols-2 @min-[800px]:grid-cols-3 @min-[1080px]:grid-cols-4 @min-[1280px]:grid-cols-5 gap-3.5",
              )}
            >
              {children}
            </div>
          </div>
        ) : (
          <div className="@container flex flex-col gap-2.5 w-full pb-8">
            <ItemRowHeader mode={headerMode} />
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
