"use client";

import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/actions/types";

interface UseReorderableListOptions<T extends { id: string }> {
  initialItems: T[];
  onReorderServerAction: (
    updates: { id: string; newIndex: number }[],
  ) => Promise<ActionState>;
  isFiltering?: boolean;
}

/**
 * Custom hook para listas reordenáveis via @dnd-kit com otimismo e rollback.
 * Compartilhado entre Loja (Rewards) e Mochila (Inventory).
 */
export function useReorderableList<T extends { id: string }>({
  initialItems,
  onReorderServerAction,
  isFiltering = false,
}: UseReorderableListOptions<T>) {
  const [items, setItems] = useState<T[]>(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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

      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const previousItems = [...items];
      const newItems = arrayMove(items, oldIndex, newIndex);
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
    [items, isFiltering, onReorderServerAction],
  );

  return {
    items,
    setItems,
    sensors,
    handleDragEnd,
  };
}
