"use client";

import type { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  useCallback,
  useMemo,
} from "react";
import type { MysteryPopoverBridge } from "@/hooks/useMysteryBoxItemPopover";

type SortableHookResult = ReturnType<typeof useSortable>;

export interface CatalogSortableBindings {
  attributes?: SortableHookResult["attributes"];
  listeners?: SortableHookResult["listeners"];
  setNodeRef: SortableHookResult["setNodeRef"];
  transform: SortableHookResult["transform"];
  transition: SortableHookResult["transition"];
  isDragging: boolean;
}

const NOOP_SET_NODE_REF = () => {};

/** Estado inerte de arrasto para cards/linhas fixados (ex.: Dívidas ou itens sem DnD), evitando instanciar `useSortable`. */
export const IDLE_SORTABLE_BINDINGS: CatalogSortableBindings = {
  attributes: undefined,
  listeners: undefined,
  setNodeRef: NOOP_SET_NODE_REF,
  transform: null,
  transition: undefined,
  isDragging: false,
};

interface UseCatalogItemInteractionOptions {
  sortable: CatalogSortableBindings;
  mysteryPopover?: MysteryPopoverBridge;
  isDragDisabled: boolean;
  onDoubleClick?: (e: MouseEvent) => void;
  onContextMenu?: (e: MouseEvent) => void;
}

/**
 * Unifica mesclagem de refs, estilos de transformação @dnd-kit, interação de duplo clique/menu
 * e gatilhos de abertura/fechamento de popover entre `GamifiedItemCard` e `ItemRow`.
 */
export function useCatalogItemInteraction<T extends HTMLElement>({
  sortable,
  mysteryPopover,
  isDragDisabled,
  onDoubleClick,
  onContextMenu,
}: UseCatalogItemInteractionOptions) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable;

  const tierContainerRef = mysteryPopover?.tierContainerRef;
  const setRootRef = useCallback(
    (node: T | null) => {
      setNodeRef(node);
      if (tierContainerRef) {
        tierContainerRef.current = node;
      }
    },
    [setNodeRef, tierContainerRef],
  );

  const dragStyle = useMemo<CSSProperties>(
    () => ({
      transform: CSS.Translate.toString(transform),
      transition: isDragging ? undefined : transition,
    }),
    [transform, transition, isDragging],
  );

  const rootInteractionProps = useMemo<HTMLAttributes<T>>(() => {
    const activeAttributes = !isDragDisabled ? attributes : undefined;
    const activeListeners = !isDragDisabled ? listeners : undefined;

    return {
      ...activeAttributes,
      ...activeListeners,
      onKeyDown: (e) => {
        if (isDragDisabled || e.target !== e.currentTarget) return;
        activeListeners?.onKeyDown?.(e);
      },
      onDoubleClick: (e) => {
        if (isDragging || !onDoubleClick) return;
        e.stopPropagation();
        onDoubleClick(e);
      },
      onContextMenu,
      onPointerEnter: mysteryPopover
        ? (e) => {
            if (e.pointerType === "mouse") {
              mysteryPopover.open();
            }
          }
        : undefined,
      onPointerLeave: mysteryPopover
        ? (e) => {
            if (e.pointerType === "mouse") {
              mysteryPopover.close();
            }
          }
        : undefined,
      onFocus: mysteryPopover
        ? (e) => {
            if (
              e.target === e.currentTarget &&
              e.currentTarget.matches(":focus-visible")
            ) {
              mysteryPopover.open();
            }
          }
        : undefined,
      onBlur: mysteryPopover
        ? (e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              mysteryPopover.close();
            }
          }
        : undefined,
    };
  }, [
    attributes,
    listeners,
    isDragDisabled,
    isDragging,
    onDoubleClick,
    onContextMenu,
    mysteryPopover,
  ]);

  return {
    setRootRef,
    dragStyle,
    isDragging,
    rootInteractionProps,
  };
}
