"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addChecklistItemAction,
  deleteChecklistItemAction,
  toggleChecklistItemAction,
} from "@/actions/checklistActions";
import type { ChecklistItem } from "@/types/task";

export interface UseChecklistOptions {
  initialItems?: ChecklistItem[];
  taskId?: string | null;
  onChecklistChanged?: (items: ChecklistItem[]) => void;
}

/**
 * Hook reutilizável para gerenciar o estado e mutações de Checklist / Subtarefas.
 * Suporta modo criação (apenas estado local) e modo edição (mutações persistidas via Server Actions com rollback).
 */
export function useChecklist({
  initialItems = [],
  taskId,
  onChecklistChanged,
}: UseChecklistOptions = {}) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialItems);
  const checklistRef = useRef<ChecklistItem[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  // Mantém a ref sincronizada
  const updateList = useCallback(
    (next: ChecklistItem[]) => {
      checklistRef.current = next;
      setChecklist(next);
      onChecklistChanged?.(next);
    },
    [onChecklistChanged],
  );

  const resetChecklist = useCallback((items: ChecklistItem[]) => {
    checklistRef.current = items;
    setChecklist(items);
  }, []);

  const addItem = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const tempId = `temp-${Date.now()}`;
      const optimisticItem: ChecklistItem = {
        id: tempId,
        name: trimmed,
        isCompleted: false,
      };

      const next = [...checklistRef.current, optimisticItem];
      updateList(next);

      if (taskId && !taskId.startsWith("temp-")) {
        startTransition(async () => {
          const res = await addChecklistItemAction(taskId, { name: trimmed });
          if (!res.success) {
            toast.error(res.error || "Erro ao adicionar item ao checklist.");
            const rolledBack = checklistRef.current.filter(
              (i) => i.id !== tempId,
            );
            updateList(rolledBack);
          } else if (res.data) {
            const confirmed = checklistRef.current.map((item) =>
              item.id === tempId ? (res.data as ChecklistItem) : item,
            );
            updateList(confirmed);
          }
        });
      }
    },
    [taskId, updateList],
  );

  const toggleItem = useCallback(
    async (itemId?: string) => {
      if (!itemId) return;

      const previous = [...checklistRef.current];
      const next = checklistRef.current.map((item) =>
        item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item,
      );
      updateList(next);

      if (taskId && !itemId.startsWith("temp-")) {
        startTransition(async () => {
          const res = await toggleChecklistItemAction(itemId);
          if (!res.success) {
            toast.error(res.error || "Erro ao atualizar item do checklist.");
            updateList(previous);
          }
        });
      }
    },
    [taskId, updateList],
  );

  const deleteItem = useCallback(
    async (itemId?: string) => {
      if (!itemId) return;

      const previous = [...checklistRef.current];
      const next = checklistRef.current.filter((item) => item.id !== itemId);
      updateList(next);

      if (taskId && !itemId.startsWith("temp-")) {
        startTransition(async () => {
          const res = await deleteChecklistItemAction(itemId);
          if (!res.success) {
            toast.error(res.error || "Erro ao remover item do checklist.");
            updateList(previous);
          }
        });
      }
    },
    [taskId, updateList],
  );

  return {
    checklist,
    setChecklist: updateList,
    resetChecklist,
    addItem,
    toggleItem,
    deleteItem,
    isPending,
  };
}
