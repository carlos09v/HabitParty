"use client";

import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/actions/types";

interface UseReorderableListOptions<T extends { id: string }> {
  initialItems: T[];
  onReorderServerAction: (
    updates: { id: string; newIndex: number }[],
  ) => Promise<ActionState>;
  isFiltering?: boolean;
  /**
   * Limite máximo de itens destravados que podem ser arrastados ou receber drop.
   * Ex: no plano Free do Foco, apenas os 4 primeiros (índices 0..3) podem ser reordenados;
   * itens nos índices >= 4 permanecem travados no final.
   */
  maxUnlockedCount?: number;
}

/**
 * Custom hook para listas reordenáveis via @dnd-kit com otimismo, rollback
 * e suporte opcional a itens travados por limite de plano.
 * Compartilhado entre Loja (Rewards), Mochila (Inventory) e Atividades de Foco (Focus).
 */
export function useReorderableList<T extends { id: string }>({
  initialItems,
  onReorderServerAction,
  isFiltering = false,
  maxUnlockedCount,
}: UseReorderableListOptions<T>) {
  const [items, setItems] = useState<T[]>(initialItems);
  const itemsRef = useRef<T[]>(initialItems);
  itemsRef.current = items;

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      if (isFiltering) {
        toast.info("Limpe os filtros para reordenar os itens.");
        return;
      }

      const currentItems = itemsRef.current;
      const oldIndex = currentItems.findIndex((i) => i.id === active.id);
      const newIndex = currentItems.findIndex((i) => i.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      if (
        maxUnlockedCount !== undefined &&
        (oldIndex >= maxUnlockedCount || newIndex >= maxUnlockedCount)
      ) {
        return;
      }

      const previousItems = [...currentItems];
      const newItems = arrayMove(currentItems, oldIndex, newIndex);
      setItems(newItems);

      const updates = newItems.map((item, index) => ({
        id: item.id,
        newIndex: index,
      }));

      try {
        const result = await onReorderServerAction(updates);
        if (!result.success) {
          setItems(previousItems);
          toast.error(result.error || "Erro ao reordenar itens.");
        }
      } catch (_error) {
        setItems(previousItems);
        toast.error("Erro de comunicação com o servidor.");
      }
    },
    [isFiltering, maxUnlockedCount, onReorderServerAction],
  );

  return {
    items,
    setItems,
    sensors,
    handleDragEnd,
  };
}
