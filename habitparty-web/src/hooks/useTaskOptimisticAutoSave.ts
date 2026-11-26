"use client";

import { useTranslations } from "next-intl";
import { type RefObject, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { updateTask } from "@/actions/taskActions";
import { useUserStore } from "@/store/userStore";
import type { ChecklistItem, Task } from "@/types/task";
import { calculateTaskReward } from "@/utils/economy";
import {
  buildUpdateTaskPayload,
  mapTaskResponseToTask,
} from "@/utils/taskMapper";

interface UseTaskOptimisticAutoSaveOptions {
  task: Task | null | undefined;
  checklistRef: RefObject<ChecklistItem[]>;
  onTaskUpdate?: (task: Task) => void;
  applyFieldsToLocalState: (
    sourceTask: Task,
    fieldsToSync?: Partial<Task>,
  ) => void;
  onNewTaskSelected?: (task: Task) => void;
}

const SYNCED_EXTERNAL_STRING_FIELDS = [
  "dueDate",
  "dueTime",
  "startTime",
  "dueEndTime",
] as const;

function areChecklistsEqual(a?: ChecklistItem[], b?: ChecklistItem[]): boolean {
  const listA = a ?? [];
  const listB = b ?? [];
  if (listA.length !== listB.length) return false;
  return listA.every((item, index) => {
    const other = listB[index];
    return (
      Boolean(other) &&
      item.id === other.id &&
      item.name === other.name &&
      Boolean(item.isCompleted) === Boolean(other.isCompleted) &&
      Boolean(item.isRewarded) === Boolean(other.isRewarded)
    );
  });
}

/**
 * Gerencia a fila serializada de auto-save por microtask com reconciliação otimista,
 * rollback automático em caso de erro de rede/validação e sincronização bidirecional
 * quando campos externos da mesma tarefa mudam enquanto o popover está aberto.
 */
export function useTaskOptimisticAutoSave({
  task,
  checklistRef,
  onTaskUpdate,
  applyFieldsToLocalState,
  onNewTaskSelected,
}: UseTaskOptimisticAutoSaveOptions) {
  const t = useTranslations("tasks.hooks");

  const latestTaskRef = useRef<Task | undefined>(task ?? undefined);
  const confirmedTaskRef = useRef<Task | undefined>(task ?? undefined);
  const confirmedByTaskIdRef = useRef<Map<string, Task>>(new Map());
  const latestSeqByTaskIdRef = useRef<Map<string, number>>(new Map());
  const inFlightCountByTaskIdRef = useRef<Map<string, number>>(new Map());
  const pendingBatchRef = useRef<{
    task: Task;
    fields: Partial<Task>;
    previousConfirmed: Task;
    seq: number;
  } | null>(null);
  const flushScheduledRef = useRef(false);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const saveSequenceRef = useRef(0);
  const syncedTaskIdRef = useRef<string | undefined>(task?.id);
  const isMountedRef = useRef(true);
  const onTaskUpdateRef = useRef(onTaskUpdate);
  const applyFieldsToLocalStateRef = useRef(applyFieldsToLocalState);
  const tRef = useRef(t);

  useEffect(() => {
    onTaskUpdateRef.current = onTaskUpdate;
    applyFieldsToLocalStateRef.current = applyFieldsToLocalState;
    tRef.current = t;
  }, [onTaskUpdate, applyFieldsToLocalState, t]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const flushPendingBatch = useCallback(() => {
    flushScheduledRef.current = false;
    const batch = pendingBatchRef.current;
    pendingBatchRef.current = null;
    if (!batch) return;

    const {
      task: snapshotTask,
      fields: patchedFields,
      previousConfirmed: capturedConfirmed,
      seq: batchSeq,
    } = batch;

    const requestTimeZone = useUserStore.getState().user?.timezone;
    const payload = buildUpdateTaskPayload(
      snapshotTask,
      undefined,
      requestTimeZone,
    );

    const prevInFlight =
      inFlightCountByTaskIdRef.current.get(snapshotTask.id) ?? 0;
    inFlightCountByTaskIdRef.current.set(snapshotTask.id, prevInFlight + 1);

    saveChainRef.current = saveChainRef.current
      .then(async () => {
        const previousConfirmed =
          confirmedByTaskIdRef.current.get(snapshotTask.id) ??
          capturedConfirmed;
        const rollbackToConfirmed = (errorMessage?: string) => {
          toast.error(errorMessage || tRef.current("saveChangesError"));
          const isLatestForTask =
            latestSeqByTaskIdRef.current.get(snapshotTask.id) === batchSeq;
          const isStillViewingTask =
            syncedTaskIdRef.current === snapshotTask.id &&
            batchSeq === saveSequenceRef.current;
          if (isLatestForTask) {
            onTaskUpdateRef.current?.(previousConfirmed);
          }
          if (isStillViewingTask) {
            latestTaskRef.current = previousConfirmed;
            if (isMountedRef.current) {
              applyFieldsToLocalStateRef.current(
                previousConfirmed,
                patchedFields,
              );
            }
          }
        };

        try {
          const res = await updateTask(snapshotTask.id, payload);
          const isLatestForTask =
            latestSeqByTaskIdRef.current.get(snapshotTask.id) === batchSeq;
          const isStillViewingTask =
            syncedTaskIdRef.current === snapshotTask.id &&
            batchSeq === saveSequenceRef.current;

          if (!res.success) {
            rollbackToConfirmed(res.error);
          } else if (res.data) {
            const responseTimeZone = useUserStore.getState().user?.timezone;
            const workspaceMeta =
              snapshotTask.workspaceId || snapshotTask.workspaceName
                ? {
                    id: snapshotTask.workspaceId,
                    name: snapshotTask.workspaceName,
                  }
                : undefined;
            const mappedServer = mapTaskResponseToTask(
              res.data,
              snapshotTask.columnId || "",
              responseTimeZone,
              workspaceMeta,
            );
            const finalChecklist =
              syncedTaskIdRef.current === snapshotTask.id
                ? checklistRef.current
                : (res.data.checklist ?? snapshotTask.checklist);
            const finalReward = calculateTaskReward({
              ...mappedServer,
              checklist: finalChecklist,
              timeZone: responseTimeZone,
            });
            const syncedTask: Task = {
              ...mappedServer,
              title: res.data.name || snapshotTask.title,
              checklist: finalChecklist,
              rewardXp: finalReward.xp,
              rewardGold: finalReward.gold,
              totalFocusMinutes:
                res.data.totalFocusMinutes ?? snapshotTask.totalFocusMinutes,
              focusCyclesCount:
                res.data.focusCyclesCount ?? snapshotTask.focusCyclesCount,
            };
            confirmedByTaskIdRef.current.set(snapshotTask.id, syncedTask);
            if (syncedTaskIdRef.current === snapshotTask.id) {
              confirmedTaskRef.current = syncedTask;
            }
            if (isLatestForTask) {
              onTaskUpdateRef.current?.(syncedTask);
            }
            if (isStillViewingTask) {
              latestTaskRef.current = syncedTask;
              if (isMountedRef.current) {
                applyFieldsToLocalStateRef.current(syncedTask, {
                  dueDate: syncedTask.dueDate,
                  dueTime: syncedTask.dueTime,
                  startTime: syncedTask.startTime,
                  dueEndTime: syncedTask.dueEndTime,
                  isAllDay: syncedTask.isAllDay,
                });
              }
            }
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("habitparty:tasks-changed"));
            }
          }
        } catch {
          rollbackToConfirmed();
        } finally {
          const remaining =
            (inFlightCountByTaskIdRef.current.get(snapshotTask.id) ?? 1) - 1;
          if (remaining <= 0) {
            inFlightCountByTaskIdRef.current.delete(snapshotTask.id);
          } else {
            inFlightCountByTaskIdRef.current.set(snapshotTask.id, remaining);
          }
        }
      })
      .catch(() => {
        // Garante que a fila de auto-save jamais fique envenenada por rejeições imprevistas
      });
  }, [checklistRef]);

  useEffect(() => {
    if (!task) {
      flushPendingBatch();
      saveSequenceRef.current += 1;
      syncedTaskIdRef.current = undefined;
      latestTaskRef.current = undefined;
      confirmedTaskRef.current = undefined;
      return;
    }

    if (syncedTaskIdRef.current === task.id) {
      const prevConfirmed = confirmedTaskRef.current;
      const pending =
        pendingBatchRef.current?.task.id === task.id
          ? pendingBatchRef.current.fields
          : {};
      const externalFields: Partial<Task> = {};

      if (
        !("completed" in pending) &&
        Boolean(prevConfirmed?.completed) !== Boolean(task.completed)
      ) {
        externalFields.completed = Boolean(task.completed);
      }

      if (
        task.checklist &&
        !areChecklistsEqual(prevConfirmed?.checklist, task.checklist) &&
        !areChecklistsEqual(checklistRef.current, task.checklist)
      ) {
        externalFields.checklist = task.checklist;
        checklistRef.current = task.checklist;
      }

      for (const fieldKey of SYNCED_EXTERNAL_STRING_FIELDS) {
        if (
          !(fieldKey in pending) &&
          (prevConfirmed?.[fieldKey] || "") !== (task[fieldKey] || "")
        ) {
          externalFields[fieldKey] = task[fieldKey] || "";
        }
      }

      if (
        !("isAllDay" in pending) &&
        Boolean(prevConfirmed?.isAllDay) !== Boolean(task.isAllDay)
      ) {
        externalFields.isAllDay = Boolean(task.isAllDay);
      }

      if (
        !("priority" in pending) &&
        (prevConfirmed?.priority || "NONE") !== (task.priority || "NONE")
      ) {
        externalFields.priority = task.priority || "NONE";
      }

      const hasPendingOrInFlight =
        pendingBatchRef.current?.task.id === task.id ||
        (inFlightCountByTaskIdRef.current.get(task.id) ?? 0) > 0;

      // Não sobrescreve o snapshot confirmado pelo servidor enquanto houver auto-save otimista pendente/em voo
      if (!hasPendingOrInFlight) {
        confirmedTaskRef.current = task;
        confirmedByTaskIdRef.current.set(task.id, task);
      } else if (externalFields.completed !== undefined && prevConfirmed) {
        const patchedConfirmed: Task = {
          ...prevConfirmed,
          completed: Boolean(task.completed),
          hasClaimedReward: task.hasClaimedReward,
          lastCompletedAt: task.lastCompletedAt,
        };
        confirmedTaskRef.current = patchedConfirmed;
        confirmedByTaskIdRef.current.set(task.id, patchedConfirmed);
      }
      latestTaskRef.current = {
        ...task,
        ...pending,
        checklist: checklistRef.current,
      };
      if (Object.keys(externalFields).length > 0 && !hasPendingOrInFlight) {
        applyFieldsToLocalState(task, externalFields);
      } else if (
        hasPendingOrInFlight &&
        (externalFields.completed !== undefined ||
          externalFields.checklist !== undefined)
      ) {
        applyFieldsToLocalState(task, {
          ...(externalFields.completed !== undefined
            ? { completed: externalFields.completed }
            : {}),
          ...(externalFields.checklist !== undefined
            ? { checklist: externalFields.checklist }
            : {}),
        });
      }
      return;
    }

    flushPendingBatch();
    saveSequenceRef.current += 1;
    syncedTaskIdRef.current = task.id;
    latestTaskRef.current = task;
    confirmedTaskRef.current = task;
    confirmedByTaskIdRef.current.set(task.id, task);

    applyFieldsToLocalState(task);
    onNewTaskSelected?.(task);
  }, [
    task,
    checklistRef,
    applyFieldsToLocalState,
    onNewTaskSelected,
    flushPendingBatch,
  ]);

  const syncChecklistIntoTask = useCallback(
    (nextList: ChecklistItem[]) => {
      checklistRef.current = nextList;
      const baseTask = latestTaskRef.current;
      if (!baseTask) return;
      const userTimeZone = useUserStore.getState().user?.timezone;
      const reward = calculateTaskReward({
        ...baseTask,
        checklist: nextList,
        timeZone: userTimeZone,
      });
      const updatedTask = {
        ...baseTask,
        checklist: nextList,
        rewardXp: reward.xp,
        rewardGold: reward.gold,
      };
      latestTaskRef.current = updatedTask;
      const nextConfirmed = confirmedTaskRef.current
        ? {
            ...confirmedTaskRef.current,
            checklist: nextList,
            rewardXp: reward.xp,
            rewardGold: reward.gold,
          }
        : updatedTask;
      confirmedTaskRef.current = nextConfirmed;
      confirmedByTaskIdRef.current.set(updatedTask.id, nextConfirmed);
      if (pendingBatchRef.current?.task.id === updatedTask.id) {
        pendingBatchRef.current = {
          ...pendingBatchRef.current,
          task: {
            ...pendingBatchRef.current.task,
            checklist: nextList,
            rewardXp: reward.xp,
            rewardGold: reward.gold,
          },
        };
      }
      onTaskUpdate?.(updatedTask);
    },
    [checklistRef, onTaskUpdate],
  );

  const saveTaskField = useCallback(
    (fields: Partial<Task>) => {
      const baseTask = latestTaskRef.current ?? task ?? undefined;
      if (!baseTask || baseTask.id.startsWith("temp-")) return;

      const userTimeZone = useUserStore.getState().user?.timezone;
      const currentChecklist = checklistRef.current;

      const mergedDraft: Task = {
        ...baseTask,
        checklist: currentChecklist,
        ...fields,
      };
      const reward = calculateTaskReward({
        ...mergedDraft,
        timeZone: userTimeZone,
      });
      const updated: Task = {
        ...mergedDraft,
        rewardXp: reward.xp,
        rewardGold: reward.gold,
      };

      latestTaskRef.current = updated;
      saveSequenceRef.current += 1;
      const nextSeq = saveSequenceRef.current;
      latestSeqByTaskIdRef.current.set(updated.id, nextSeq);

      const previousConfirmedForTask =
        confirmedByTaskIdRef.current.get(updated.id) ??
        (confirmedTaskRef.current?.id === updated.id
          ? confirmedTaskRef.current
          : baseTask);

      const existingPending =
        pendingBatchRef.current?.task.id === updated.id
          ? pendingBatchRef.current
          : null;

      pendingBatchRef.current = {
        task: updated,
        fields: {
          ...(existingPending?.fields ?? {}),
          ...fields,
        },
        previousConfirmed:
          existingPending?.previousConfirmed ?? previousConfirmedForTask,
        seq: nextSeq,
      };

      onTaskUpdate?.(updated);

      if (flushScheduledRef.current) return;
      flushScheduledRef.current = true;

      queueMicrotask(() => {
        flushPendingBatch();
      });
    },
    [task, checklistRef, onTaskUpdate, flushPendingBatch],
  );

  const getCurrentTask = useCallback(
    () => latestTaskRef.current ?? task ?? undefined,
    [task],
  );

  const setLatestTaskDraft = useCallback((updatedTask: Task) => {
    latestTaskRef.current = updatedTask;
  }, []);

  return {
    getCurrentTask,
    setLatestTaskDraft,
    saveTaskField,
    syncChecklistIntoTask,
  };
}
