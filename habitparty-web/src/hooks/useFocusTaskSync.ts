"use client";

import { useEffect, useRef } from "react";
import { normalizeTaskType } from "@/constants/task";
import { useUserStore } from "@/store/userStore";
import type { Task, TaskResponseDTO } from "@/types/task";
import { calculateTaskReward } from "@/utils/economy";
import { computeOptimisticHabitDelta } from "@/utils/taskMapper";

export interface FocusRecordedEventDetail {
  taskId?: string;
  durationMinutes?: number;
  cycles?: number;
}

export function dispatchTaskFocusRecorded(detail: FocusRecordedEventDetail) {
  if (typeof window === "undefined" || !detail.taskId) return;
  window.dispatchEvent(
    new CustomEvent<FocusRecordedEventDetail>(
      "habitparty:task-focus-recorded",
      { detail },
    ),
  );
}

export interface FocusTaskCompletedEventDetail {
  taskId?: string;
  updatedTask?: TaskResponseDTO;
}

export function applyFocusRecordedToTask(
  task: Task,
  durationMinutes: number,
  cycles: number,
): Task {
  return {
    ...task,
    totalFocusMinutes: Math.max(
      0,
      (task.totalFocusMinutes ?? 0) + durationMinutes,
    ),
    focusCyclesCount: Math.max(0, (task.focusCyclesCount ?? 0) + cycles),
  };
}

export function applyFocusCompletionToTask(
  task: Task,
  timeZone?: string | null,
  updatedTask?: TaskResponseDTO,
): Task {
  if (normalizeTaskType(task) === "habit") {
    return {
      ...task,
      ...computeOptimisticHabitDelta(task, 1, timeZone),
      completed: true,
      hasClaimedReward: true,
    };
  }

  const nextChecklist =
    updatedTask?.checklist ??
    (task.checklist && task.checklist.length > 0
      ? task.checklist.map((item) => ({ ...item, isCompleted: true }))
      : task.checklist);
  const nextPenaltyApplied =
    updatedTask?.isPenaltyApplied ?? task.isPenaltyApplied;
  const nextStreak =
    updatedTask?.currentStreak !== undefined
      ? updatedTask.currentStreak
      : task.streak;
  const reward = calculateTaskReward({
    ...task,
    streak: nextStreak,
    currentStreak: nextStreak,
    isPenaltyApplied: nextPenaltyApplied,
    checklist: nextChecklist,
    timeZone,
  });

  return {
    ...task,
    completed: true,
    hasClaimedReward: true,
    lastCompletedAt: updatedTask?.lastCompletedAt ?? new Date().toISOString(),
    streak: nextStreak,
    currentStreak:
      updatedTask?.currentStreak !== undefined
        ? updatedTask.currentStreak
        : task.currentStreak,
    highestStreak:
      updatedTask?.highestStreak !== undefined
        ? updatedTask.highestStreak
        : task.highestStreak,
    isPenaltyApplied: nextPenaltyApplied,
    checklist: nextChecklist,
    rewardXp: reward.xp,
    rewardGold: reward.gold,
  };
}

interface UseFocusTaskSyncOptions {
  onFocusRecorded?: (
    taskId: string,
    durationMinutes: number,
    cycles: number,
  ) => void;
  onTaskCompleted?: (taskId: string, transformTask: (t: Task) => Task) => void;
}

/**
 * Hook unificado para sincronizar eventos do Palco/Widget de Foco (`habitparty:task-focus-recorded`
 * e `habitparty:task-completed-from-focus`) com listas de tarefas, colunas do Kanban e popovers.
 */
export function useFocusTaskSync({
  onFocusRecorded,
  onTaskCompleted,
}: UseFocusTaskSyncOptions) {
  const onFocusRecordedRef = useRef(onFocusRecorded);
  const onTaskCompletedRef = useRef(onTaskCompleted);
  onFocusRecordedRef.current = onFocusRecorded;
  onTaskCompletedRef.current = onTaskCompleted;

  useEffect(() => {
    const handleFocusRecorded = (event: Event) => {
      const detail = (event as CustomEvent<FocusRecordedEventDetail>).detail;
      if (!detail?.taskId) return;
      onFocusRecordedRef.current?.(
        detail.taskId,
        detail.durationMinutes ?? 0,
        detail.cycles ?? 0,
      );
    };

    const handleTaskCompleted = (event: Event) => {
      const detail = (event as CustomEvent<FocusTaskCompletedEventDetail>)
        .detail;
      if (!detail?.taskId) return;
      const tz = useUserStore.getState().user?.timezone;
      onTaskCompletedRef.current?.(detail.taskId, (task) =>
        applyFocusCompletionToTask(task, tz, detail.updatedTask),
      );
    };

    window.addEventListener(
      "habitparty:task-focus-recorded",
      handleFocusRecorded,
    );
    window.addEventListener(
      "habitparty:task-completed-from-focus",
      handleTaskCompleted,
    );
    return () => {
      window.removeEventListener(
        "habitparty:task-focus-recorded",
        handleFocusRecorded,
      );
      window.removeEventListener(
        "habitparty:task-completed-from-focus",
        handleTaskCompleted,
      );
    };
  }, []);
}
