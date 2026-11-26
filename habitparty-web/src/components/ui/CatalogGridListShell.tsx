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
} from "@/components/ui/ItemRowHeader";
import type { ViewMode } from "@/types/ui";
import { cn } from "@/utils";
import { CATALOG_CARD_GRID_CLASS } from "@/utils/catalogLayout";

const DND_MODIFIERS = [restrictToParentElement, restrictToWindowEdges];
const EMPTY_SENSORS: SensorDescriptor<SensorOptions>[] = [];

export interface CatalogGridListShellProps {
  dndContextId?: string;
  itemIds: string[];
  viewMode: ViewMode;
  headerMode: ItemRowHeaderProps["mode"];
  listAriaLabel?: string;
  disableDnd?: boolean;
  hideHeader?: boolean;
  bottomPaddingClassName?: string;
  sensors?: SensorDescriptor<SensorOptions>[];
  onDragEnd?: (event: DragEndEvent) => void;
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
  disableDnd = false,
  hideHeader = false,
  bottomPaddingClassName = "pb-8",
  sensors,
  onDragEnd,
  children,
}: CatalogGridListShellProps) {
  const isCardMode = viewMode !== "list";
  // Mantém a árvore de DndContext/SortableContext estável quando o catálogo suporta DnD,
  // evitando desmontar e remontar todos os cards/linhas ao filtrar ou alternar entre 1 e 2 itens.
  const hasDndCapability = Boolean(sensors && onDragEnd);
  const isDndDisabled = disableDnd || itemIds.length <= 1;

  const content = isCardMode ? (
    <div className="@container w-full">
      <div className={cn(CATALOG_CARD_GRID_CLASS, bottomPaddingClassName)}>
        {children}
      </div>
    </div>
  ) : (
    <div
      className={cn(
        "@container flex flex-col gap-2.5 w-full",
        bottomPaddingClassName,
      )}
    >
      {!hideHeader && itemIds.length > 0 && <ItemRowHeader mode={headerMode} />}
      <ul className="flex flex-col gap-2 w-full" aria-label={listAriaLabel}>
        {children}
      </ul>
    </div>
  );

  if (!hasDndCapability) {
    return content;
  }

  return (
    <DndContext
      id={dndContextId}
      sensors={isDndDisabled ? EMPTY_SENSORS : sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      modifiers={DND_MODIFIERS}
    >
      <SortableContext
        items={itemIds}
        disabled={isDndDisabled}
        strategy={
          isCardMode ? rectSortingStrategy : verticalListSortingStrategy
        }
      >
        {content}
      </SortableContext>
    </DndContext>
  );
}
