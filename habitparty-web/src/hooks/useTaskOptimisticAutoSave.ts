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
  const pendingFieldsRef = useRef<Partial<Task>>({});
  const flushScheduledRef = useRef(false);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());
  const saveSequenceRef = useRef(0);
  const syncedTaskIdRef = useRef<string | undefined>(task?.id);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!task) {
      syncedTaskIdRef.current = undefined;
      latestTaskRef.current = undefined;
      confirmedTaskRef.current = undefined;
      pendingFieldsRef.current = {};
      flushScheduledRef.current = false;
      return;
    }

    if (syncedTaskIdRef.current === task.id) {
      const prevConfirmed = confirmedTaskRef.current;
      const pending = pendingFieldsRef.current;
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

      confirmedTaskRef.current = task;
      latestTaskRef.current = {
        ...task,
        ...pending,
        checklist: checklistRef.current,
      };
      if (Object.keys(externalFields).length > 0) {
        applyFieldsToLocalState(task, externalFields);
      }
      return;
    }

    syncedTaskIdRef.current = task.id;
    latestTaskRef.current = task;
    confirmedTaskRef.current = task;
    pendingFieldsRef.current = {};
    flushScheduledRef.current = false;

    applyFieldsToLocalState(task);
    onNewTaskSelected?.(task);
  }, [task, checklistRef, applyFieldsToLocalState, onNewTaskSelected]);

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
      confirmedTaskRef.current = confirmedTaskRef.current
        ? {
            ...confirmedTaskRef.current,
            checklist: nextList,
            rewardXp: reward.xp,
            rewardGold: reward.gold,
          }
        : updatedTask;
      onTaskUpdate?.(updatedTask);
    },
    [checklistRef, onTaskUpdate],
  );

  const saveTaskField = useCallback(
    (fields: Partial<Task>) => {
      const baseTask = latestTaskRef.current ?? task ?? undefined;
      if (!baseTask) return;

      const userTimeZone = useUserStore.getState().user?.timezone;
      const currentChecklist =
        checklistRef.current.length > 0
          ? checklistRef.current
          : baseTask.checklist || [];

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
      pendingFieldsRef.current = {
        ...pendingFieldsRef.current,
        ...fields,
      };
      saveSequenceRef.current += 1;
      onTaskUpdate?.(updated);

      if (flushScheduledRef.current) return;
      flushScheduledRef.current = true;

      queueMicrotask(() => {
        flushScheduledRef.current = false;
        const snapshotTask = latestTaskRef.current;
        const patchedFields = pendingFieldsRef.current;
        pendingFieldsRef.current = {};
        if (!snapshotTask) return;

        const batchSeq = saveSequenceRef.current;
        const requestTimeZone = useUserStore.getState().user?.timezone;
        const payload = buildUpdateTaskPayload(
          snapshotTask,
          undefined,
          requestTimeZone,
        );

        saveChainRef.current = saveChainRef.current.then(async () => {
          const previousConfirmed = confirmedTaskRef.current ?? snapshotTask;
          const res = await updateTask(snapshotTask.id, payload);
          if (!res.success) {
            toast.error(res.error || t("saveChangesError"));
            if (batchSeq === saveSequenceRef.current) {
              latestTaskRef.current = previousConfirmed;
              onTaskUpdate?.(previousConfirmed);
              if (isMountedRef.current) {
                applyFieldsToLocalState(previousConfirmed, patchedFields);
              }
            }
          } else if (res.data) {
            const responseTimeZone = useUserStore.getState().user?.timezone;
            const mappedServer = mapTaskResponseToTask(
              res.data,
              snapshotTask.columnId || "",
              responseTimeZone,
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
            confirmedTaskRef.current = syncedTask;
            if (batchSeq === saveSequenceRef.current) {
              latestTaskRef.current = syncedTask;
              onTaskUpdate?.(syncedTask);
              if (isMountedRef.current) {
                applyFieldsToLocalState(syncedTask, {
                  dueDate: syncedTask.dueDate,
                  dueTime: syncedTask.dueTime,
                  startTime: syncedTask.startTime,
                  dueEndTime: syncedTask.dueEndTime,
                  isAllDay: syncedTask.isAllDay,
                });
              }
            }
          }
        });
      });
    },
    [task, checklistRef, onTaskUpdate, applyFieldsToLocalState, t],
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
