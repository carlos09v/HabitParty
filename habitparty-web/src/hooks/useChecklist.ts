"use client";

import { useTranslations } from "next-intl";
import { useCallback, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  addChecklistItem,
  deleteChecklistItem,
  toggleChecklistItem,
  toggleChecklistItemReward,
  updateChecklistItem,
} from "@/actions/checklistActions";
import {
  countRewardedChecklistItems,
  MAX_REWARDED_SUBTASKS,
} from "@/constants/task";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { ChecklistItem } from "@/types/task";

export interface UseChecklistOptions {
  initialItems?: ChecklistItem[];
  taskId?: string | null;
  onChecklistChanged?: (items: ChecklistItem[]) => void;
  /**
   * Quando true, todas as mutações ficam apenas no estado local (sem Server Actions),
   * cabendo ao consumidor persistir as alterações (ex: modal de edição ao clicar em Salvar).
   */
  deferPersistence?: boolean;
  /** Se true, permite marcar etapas recompensadas neste checklist (Daily/To-Do Difícil). */
  canRewardItems?: boolean;
  /** Limite máximo de etapas recompensadas permitidas nesta tarefa. */
  maxRewardedItems?: number;
  /** Se true, bloqueia alterações de etapas recompensadas enquanto a tarefa estiver concluída. */
  isRewardLocked?: boolean;
}

/**
 * Hook reutilizável para gerenciar o estado e mutações de Checklist / Subtarefas.
 * Suporta modo criação (apenas estado local) e modo edição (mutações persistidas via Server Actions com rollback).
 */
export function useChecklist({
  initialItems = [],
  taskId: rawTaskId,
  onChecklistChanged,
  deferPersistence = false,
  canRewardItems = false,
  maxRewardedItems = MAX_REWARDED_SUBTASKS,
  isRewardLocked = false,
}: UseChecklistOptions = {}) {
  // Sem taskId efetivo, as mutações permanecem locais (mesmo comportamento do modo criação)
  const taskId = deferPersistence ? null : rawTaskId;
  const t = useTranslations("tasks.hooks");
  const { isGamified } = useExperienceMode();
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
    async (text: string, isRewarded = false) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      let effectiveRewarded = Boolean(isRewarded);
      if (effectiveRewarded) {
        if (!canRewardItems) {
          toast.error(
            t(
              isGamified
                ? "rewardedStepsHardOnly"
                : "rewardedStepsHardOnlyProductivity",
            ),
          );
          effectiveRewarded = false;
        } else if (isRewardLocked) {
          toast.error(
            t(
              isGamified
                ? "rewardLockedWhileCompleted"
                : "rewardLockedWhileCompletedProductivity",
            ),
          );
          effectiveRewarded = false;
        } else {
          const currentRewarded = countRewardedChecklistItems(
            checklistRef.current,
            maxRewardedItems,
          );
          if (currentRewarded >= maxRewardedItems) {
            toast.error(
              t(
                isGamified
                  ? "maxRewardedStepsReached"
                  : "maxRewardedStepsReachedProductivity",
                { max: maxRewardedItems },
              ),
            );
            effectiveRewarded = false;
          }
        }
      }

      const tempId = `temp-${Date.now()}`;
      const optimisticItem: ChecklistItem = {
        id: tempId,
        name: trimmed,
        isCompleted: false,
        isRewarded: effectiveRewarded,
      };

      const next = [...checklistRef.current, optimisticItem];
      updateList(next);

      if (taskId && !taskId.startsWith("temp-")) {
        startTransition(async () => {
          const res = await addChecklistItem(taskId, {
            name: trimmed,
            isRewarded: effectiveRewarded,
          });
          if (!res.success) {
            toast.error(res.error || t("checklistAddError"));
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
    [
      taskId,
      canRewardItems,
      maxRewardedItems,
      isRewardLocked,
      isGamified,
      updateList,
      t,
    ],
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
          const res = await toggleChecklistItem(itemId);
          if (!res.success) {
            toast.error(res.error || t("checklistUpdateError"));
            updateList(previous);
          }
        });
      }
    },
    [taskId, updateList, t],
  );

  const updateItem = useCallback(
    async (itemId?: string, newName?: string) => {
      const trimmed = newName?.trim();
      if (!itemId || !trimmed) return;

      const currentItem = checklistRef.current.find((i) => i.id === itemId);
      if (!currentItem || currentItem.name === trimmed) return;

      const previous = [...checklistRef.current];
      const next = checklistRef.current.map((item) =>
        item.id === itemId ? { ...item, name: trimmed } : item,
      );
      updateList(next);

      if (taskId && !itemId.startsWith("temp-")) {
        startTransition(async () => {
          const res = await updateChecklistItem(itemId, {
            name: trimmed,
            isRewarded: Boolean(currentItem.isRewarded),
          });
          if (!res.success) {
            toast.error(res.error || t("checklistUpdateError"));
            updateList(previous);
          } else if (res.data) {
            const confirmed = checklistRef.current.map((item) =>
              item.id === itemId ? (res.data as ChecklistItem) : item,
            );
            updateList(confirmed);
          }
        });
      }
    },
    [taskId, updateList, t],
  );

  const toggleItemReward = useCallback(
    async (itemId?: string) => {
      if (!itemId) return;

      const currentItem = checklistRef.current.find((i) => i.id === itemId);
      if (!currentItem) return;

      if (isRewardLocked) {
        toast.error(
          t(
            isGamified
              ? "rewardLockedWhileCompleted"
              : "rewardLockedWhileCompletedProductivity",
          ),
        );
        return;
      }

      const nextRewarded = !currentItem.isRewarded;
      if (nextRewarded) {
        if (!canRewardItems) {
          toast.error(
            t(
              isGamified
                ? "rewardedStepsHardOnly"
                : "rewardedStepsHardOnlyProductivity",
            ),
          );
          return;
        }
        const rewardedExcludingSelf = countRewardedChecklistItems(
          checklistRef.current.filter((i) => i.id !== itemId),
          maxRewardedItems,
        );
        if (rewardedExcludingSelf >= maxRewardedItems) {
          toast.error(
            t(
              isGamified
                ? "maxRewardedStepsReached"
                : "maxRewardedStepsReachedProductivity",
              { max: maxRewardedItems },
            ),
          );
          return;
        }
      }

      const previous = [...checklistRef.current];
      const next = checklistRef.current.map((item) =>
        item.id === itemId ? { ...item, isRewarded: nextRewarded } : item,
      );
      updateList(next);

      if (taskId && !itemId.startsWith("temp-")) {
        startTransition(async () => {
          const res = await toggleChecklistItemReward(itemId);
          if (!res.success) {
            toast.error(res.error || t("checklistUpdateError"));
            updateList(previous);
          } else if (res.data) {
            const confirmed = checklistRef.current.map((item) =>
              item.id === itemId ? (res.data as ChecklistItem) : item,
            );
            updateList(confirmed);
          }
        });
      }
    },
    [
      taskId,
      canRewardItems,
      maxRewardedItems,
      isRewardLocked,
      isGamified,
      updateList,
      t,
    ],
  );

  const clearRewardedItems = useCallback(() => {
    if (!checklistRef.current.some((item) => Boolean(item.isRewarded))) return;
    const next = checklistRef.current.map((item) =>
      item.isRewarded ? { ...item, isRewarded: false } : item,
    );
    updateList(next);
  }, [updateList]);

  const deleteItem = useCallback(
    async (itemId?: string) => {
      if (!itemId) return;

      const previous = [...checklistRef.current];
      const next = checklistRef.current.filter((item) => item.id !== itemId);
      updateList(next);

      if (taskId && !itemId.startsWith("temp-")) {
        startTransition(async () => {
          const res = await deleteChecklistItem(itemId);
          if (!res.success) {
            toast.error(res.error || t("checklistDeleteError"));
            updateList(previous);
          }
        });
      }
    },
    [taskId, updateList, t],
  );

  return {
    checklist,
    setChecklist: updateList,
    resetChecklist,
    addItem,
    toggleItem,
    toggleItemReward,
    clearRewardedItems,
    updateItem,
    deleteItem,
    isPending,
  };
}
