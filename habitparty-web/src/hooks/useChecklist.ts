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

interface PendingTempChecklistOp {
  deleted?: boolean;
  toggled?: boolean;
  name?: string;
  rewardToggled?: boolean;
}

let checklistTempSeq = 0;

/**
 * Hook reutilizável para gerenciar o estado e mutações de Checklist / Subtarefas.
 * Suporta modo criação (apenas estado local) e modo edição (mutações persistidas via Server Actions com rollback cirúrgico por item).
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
  const pendingTempOpsRef = useRef<Map<string, PendingTempChecklistOp>>(
    new Map(),
  );
  const resetGenerationRef = useRef(0);
  const inFlightToggleIdsRef = useRef<Set<string>>(new Set());
  const inFlightRewardToggleIdsRef = useRef<Set<string>>(new Set());
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
    resetGenerationRef.current += 1;
    pendingTempOpsRef.current.clear();
    inFlightToggleIdsRef.current.clear();
    inFlightRewardToggleIdsRef.current.clear();
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

      checklistTempSeq += 1;
      const tempId = `temp-${Date.now()}-${checklistTempSeq}`;
      const optimisticItem: ChecklistItem = {
        id: tempId,
        name: trimmed,
        isCompleted: false,
        isRewarded: effectiveRewarded,
      };

      const next = [...checklistRef.current, optimisticItem];
      updateList(next);

      if (taskId && !taskId.startsWith("temp-")) {
        const gen = resetGenerationRef.current;
        startTransition(async () => {
          const res = await addChecklistItem(taskId, {
            name: trimmed,
            isRewarded: effectiveRewarded,
          });
          const pendingOp = pendingTempOpsRef.current.get(tempId);
          pendingTempOpsRef.current.delete(tempId);

          if (resetGenerationRef.current !== gen) {
            return;
          }

          if (!res.success) {
            toast.error(res.error || t("checklistAddError"));
            const rolledBack = checklistRef.current.filter(
              (i) => i.id !== tempId,
            );
            updateList(rolledBack);
            return;
          }

          if (res.data) {
            const createdItem = res.data as ChecklistItem;
            const realId = createdItem.id;

            // Se o usuário removeu o item enquanto o POST ainda estava em voo, deleta no servidor agora
            if (pendingOp?.deleted) {
              if (realId) {
                const delRes = await deleteChecklistItem(realId);
                if (!delRes.success) {
                  toast.error(delRes.error || t("checklistDeleteError"));
                }
              }
              if (resetGenerationRef.current !== gen) return;
              if (
                checklistRef.current.some(
                  (i) => i.id === tempId || (realId && i.id === realId),
                )
              ) {
                updateList(
                  checklistRef.current.filter(
                    (i) => i.id !== tempId && (!realId || i.id !== realId),
                  ),
                );
              }
              return;
            }

            const reconciledItem: ChecklistItem = {
              ...createdItem,
              name: pendingOp?.name ?? createdItem.name,
              isCompleted: pendingOp?.toggled
                ? !createdItem.isCompleted
                : createdItem.isCompleted,
              isRewarded: pendingOp?.rewardToggled
                ? !createdItem.isRewarded
                : createdItem.isRewarded,
            };

            const confirmed = checklistRef.current.map((item) =>
              item.id === tempId ? reconciledItem : item,
            );
            updateList(confirmed);

            // Reproduz no servidor eventuais mutações aplicadas sobre o item temporário em voo
            if (realId && pendingOp) {
              if (pendingOp.name && pendingOp.name !== createdItem.name) {
                const updRes = await updateChecklistItem(realId, {
                  name: pendingOp.name,
                  isRewarded: Boolean(createdItem.isRewarded),
                });
                if (!updRes.success) {
                  toast.error(updRes.error || t("checklistUpdateError"));
                  if (resetGenerationRef.current === gen) {
                    updateList(
                      checklistRef.current.map((i) =>
                        i.id === realId ? { ...i, name: createdItem.name } : i,
                      ),
                    );
                  }
                }
              }
              if (pendingOp.toggled) {
                const togRes = await toggleChecklistItem(realId);
                if (!togRes.success) {
                  toast.error(togRes.error || t("checklistUpdateError"));
                  if (resetGenerationRef.current === gen) {
                    updateList(
                      checklistRef.current.map((i) =>
                        i.id === realId
                          ? { ...i, isCompleted: createdItem.isCompleted }
                          : i,
                      ),
                    );
                  }
                }
              }
              if (pendingOp.rewardToggled) {
                const rewRes = await toggleChecklistItemReward(realId);
                if (!rewRes.success) {
                  toast.error(rewRes.error || t("checklistUpdateError"));
                  if (resetGenerationRef.current === gen) {
                    updateList(
                      checklistRef.current.map((i) =>
                        i.id === realId
                          ? { ...i, isRewarded: createdItem.isRewarded }
                          : i,
                      ),
                    );
                  }
                }
              }
            }
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

      if (
        taskId &&
        !itemId.startsWith("temp-") &&
        inFlightToggleIdsRef.current.has(itemId)
      ) {
        return;
      }

      const currentItem = checklistRef.current.find((i) => i.id === itemId);
      if (!currentItem) return;
      const previousCompleted = Boolean(currentItem.isCompleted);

      const next = checklistRef.current.map((item) =>
        item.id === itemId
          ? { ...item, isCompleted: !previousCompleted }
          : item,
      );
      updateList(next);

      if (taskId && itemId.startsWith("temp-")) {
        const existing = pendingTempOpsRef.current.get(itemId) ?? {};
        pendingTempOpsRef.current.set(itemId, {
          ...existing,
          toggled: !existing.toggled,
        });
        return;
      }

      if (taskId && !itemId.startsWith("temp-")) {
        const gen = resetGenerationRef.current;
        inFlightToggleIdsRef.current.add(itemId);
        startTransition(async () => {
          try {
            const res = await toggleChecklistItem(itemId);
            if (resetGenerationRef.current !== gen) return;
            if (!res.success) {
              toast.error(res.error || t("checklistUpdateError"));
              updateList(
                checklistRef.current.map((item) =>
                  item.id === itemId
                    ? { ...item, isCompleted: previousCompleted }
                    : item,
                ),
              );
            }
          } finally {
            inFlightToggleIdsRef.current.delete(itemId);
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
      const previousName = currentItem.name;

      const next = checklistRef.current.map((item) =>
        item.id === itemId ? { ...item, name: trimmed } : item,
      );
      updateList(next);

      if (taskId && itemId.startsWith("temp-")) {
        const existing = pendingTempOpsRef.current.get(itemId) ?? {};
        pendingTempOpsRef.current.set(itemId, {
          ...existing,
          name: trimmed,
        });
        return;
      }

      if (taskId && !itemId.startsWith("temp-")) {
        const gen = resetGenerationRef.current;
        startTransition(async () => {
          const res = await updateChecklistItem(itemId, {
            name: trimmed,
            isRewarded: Boolean(currentItem.isRewarded),
          });
          if (resetGenerationRef.current !== gen) return;
          if (!res.success) {
            toast.error(res.error || t("checklistUpdateError"));
            updateList(
              checklistRef.current.map((item) =>
                item.id === itemId ? { ...item, name: previousName } : item,
              ),
            );
          } else if (res.data) {
            const serverItem = res.data as ChecklistItem;
            const confirmed = checklistRef.current.map((item) =>
              item.id === itemId
                ? { ...item, name: serverItem.name ?? item.name }
                : item,
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

      if (
        taskId &&
        !itemId.startsWith("temp-") &&
        inFlightRewardToggleIdsRef.current.has(itemId)
      ) {
        return;
      }

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

      const previousRewarded = Boolean(currentItem.isRewarded);
      const nextRewarded = !previousRewarded;
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

      const next = checklistRef.current.map((item) =>
        item.id === itemId ? { ...item, isRewarded: nextRewarded } : item,
      );
      updateList(next);

      if (taskId && itemId.startsWith("temp-")) {
        const existing = pendingTempOpsRef.current.get(itemId) ?? {};
        pendingTempOpsRef.current.set(itemId, {
          ...existing,
          rewardToggled: !existing.rewardToggled,
        });
        return;
      }

      if (taskId && !itemId.startsWith("temp-")) {
        const gen = resetGenerationRef.current;
        inFlightRewardToggleIdsRef.current.add(itemId);
        startTransition(async () => {
          try {
            const res = await toggleChecklistItemReward(itemId);
            if (resetGenerationRef.current !== gen) return;
            if (!res.success) {
              toast.error(res.error || t("checklistUpdateError"));
              updateList(
                checklistRef.current.map((item) =>
                  item.id === itemId
                    ? { ...item, isRewarded: previousRewarded }
                    : item,
                ),
              );
            } else if (res.data) {
              const serverItem = res.data as ChecklistItem;
              const confirmed = checklistRef.current.map((item) =>
                item.id === itemId
                  ? { ...item, isRewarded: serverItem.isRewarded }
                  : item,
              );
              updateList(confirmed);
            }
          } finally {
            inFlightRewardToggleIdsRef.current.delete(itemId);
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

      const deletedIndex = checklistRef.current.findIndex(
        (item) => item.id === itemId,
      );
      if (deletedIndex === -1) return;
      const deletedItem = checklistRef.current[deletedIndex];

      const next = checklistRef.current.filter((item) => item.id !== itemId);
      updateList(next);

      if (taskId && itemId.startsWith("temp-")) {
        const existing = pendingTempOpsRef.current.get(itemId) ?? {};
        pendingTempOpsRef.current.set(itemId, {
          ...existing,
          deleted: true,
        });
        return;
      }

      if (taskId && !itemId.startsWith("temp-")) {
        const gen = resetGenerationRef.current;
        startTransition(async () => {
          const res = await deleteChecklistItem(itemId);
          if (resetGenerationRef.current !== gen) return;
          if (!res.success) {
            toast.error(res.error || t("checklistDeleteError"));
            const current = checklistRef.current;
            if (!current.some((i) => i.id === itemId)) {
              const restored = [...current];
              restored.splice(
                Math.min(deletedIndex, restored.length),
                0,
                deletedItem,
              );
              updateList(restored);
            }
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
