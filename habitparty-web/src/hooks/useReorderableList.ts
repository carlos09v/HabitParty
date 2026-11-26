"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/actions/types";
import { useDndSensors } from "@/hooks/useDndSensors";
import { useLatestRef } from "@/hooks/useLatestRef";

interface UseReorderableListOptions<
  T extends { id: string; orderIndex?: number },
> {
  initialItems: T[];
  onReorderServerAction: (
    updates: { id: string; newIndex: number }[],
    context: { previousItems: T[]; nextItems: T[] },
  ) => Promise<ActionState>;
  isFiltering?: boolean;
  /**
   * Quando true, envia no payload apenas itens cujo `orderIndex` realmente divergiu
   * do novo índice na lista, atualizando `orderIndex` otimisticamente.
   */
  onlyChangedOrderIndex?: boolean;
  /**
   * Limite máximo de itens destravados que podem ser arrastados ou receber drop.
   * Ex: no plano Free do Foco, apenas os 4 primeiros (índices 0..3) podem ser reordenados;
   * itens nos índices >= 4 permanecem travados no final.
   */
  maxUnlockedCount?: number;
  /**
   * Resolutor customizado opcional de reordenação (ex.: catálogos com variantes agrupadas),
   * permitindo reutilizar sensor, validações, estado otimista e rollback do hook.
   */
  resolveDragReorder?: (
    activeId: string,
    overId: string,
    currentItems: T[],
  ) => T[] | null;
}

/**
 * Custom hook para listas reordenáveis via @dnd-kit com otimismo, rollback
 * e suporte opcional a itens travados por limite de plano.
 * Compartilhado entre Loja (Rewards), Mochila (Inventory) e Atividades de Foco (Focus).
 */
export function useReorderableList<
  T extends { id: string; orderIndex?: number },
>({
  initialItems,
  onReorderServerAction,
  isFiltering = false,
  onlyChangedOrderIndex = false,
  maxUnlockedCount,
  resolveDragReorder,
}: UseReorderableListOptions<T>) {
  const t = useTranslations("ui.reorder");
  const [items, setItems] = useState<T[]>(initialItems);
  const itemsRef = useLatestRef(items);
  const resolveDragReorderRef = useLatestRef(resolveDragReorder);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const sensors = useDndSensors();

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      if (isFiltering) {
        toast.info(t("clearFiltersToReorder"));
        return;
      }

      const currentItems = itemsRef.current;
      let newItems: T[];

      if (resolveDragReorderRef.current) {
        const resolved = resolveDragReorderRef.current(
          String(active.id),
          String(over.id),
          currentItems,
        );
        if (!resolved) return;
        newItems = resolved;
      } else {
        const oldIndex = currentItems.findIndex((i) => i.id === active.id);
        const newIndex = currentItems.findIndex((i) => i.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        if (
          maxUnlockedCount !== undefined &&
          (oldIndex >= maxUnlockedCount || newIndex >= maxUnlockedCount)
        ) {
          return;
        }

        newItems = arrayMove(currentItems, oldIndex, newIndex);
      }

      const previousItems = [...currentItems];
      const updates: { id: string; newIndex: number }[] = [];
      let nextItems = newItems;

      if (onlyChangedOrderIndex) {
        nextItems = newItems.map((item, index) => {
          if (item.orderIndex !== index) {
            updates.push({ id: item.id, newIndex: index });
            return { ...item, orderIndex: index };
          }
          return item;
        });
        if (updates.length === 0) return;
      } else {
        for (let index = 0; index < newItems.length; index++) {
          updates.push({ id: newItems[index].id, newIndex: index });
        }
      }

      setItems(nextItems);

      try {
        const result = await onReorderServerAction(updates, {
          previousItems,
          nextItems,
        });
        if (!result.success) {
          setItems(previousItems);
          toast.error(result.error || t("reorderError"));
        }
      } catch (_error) {
        setItems(previousItems);
        toast.error(t("communicationError"));
      }
    },
    [
      isFiltering,
      itemsRef,
      maxUnlockedCount,
      onlyChangedOrderIndex,
      onReorderServerAction,
      resolveDragReorderRef,
      t,
    ],
  );

  return {
    items,
    setItems,
    sensors,
    handleDragEnd,
  };
}
