"use client";

import { useCallback, useRef } from "react";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import type { Task } from "@/types/task";
import { computeOptimisticHabitDelta } from "@/utils/taskMapper";

interface UseDashboardTaskActionsProps {
  tasks?: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  defaultColumnId?: string;
  onTaskCompletedTodayChange?: (
    taskId: string,
    completedToday: boolean,
  ) => void;
}

/**
 * Hook de ações de tarefas do Dashboard.
 * Delega mutações (conclusão, hábitos, exclusão com rollback e duplicação) ao useTaskMutations.
 */
export function useDashboardTaskActions({
  tasks,
  setTasks,
  defaultColumnId,
  onTaskCompletedTodayChange,
}: UseDashboardTaskActionsProps) {
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const findTask = useCallback(
    (taskId: string) => tasksRef.current?.find((t) => t.id === taskId),
    [],
  );

  const onOptimisticToggle = useCallback(
    (taskId: string, completed: boolean) => {
      onTaskCompletedTodayChange?.(taskId, completed);
      const nowIso = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                completed,
                hasClaimedReward: completed ? true : t.hasClaimedReward,
                lastCompletedAt: completed ? nowIso : t.lastCompletedAt,
              }
            : t,
        ),
      );
    },
    [onTaskCompletedTodayChange, setTasks],
  );

  const onOptimisticHabit = useCallback(
    (taskId: string, delta: number) => {
      if (delta > 0) {
        onTaskCompletedTodayChange?.(taskId, true);
      }
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            return {
              ...t,
              ...computeOptimisticHabitDelta(t, delta),
            };
          }
          return t;
        }),
      );
    },
    [onTaskCompletedTodayChange, setTasks],
  );

  const onRollbackToggle = useCallback(
    (
      taskId: string,
      previousState: {
        completed: boolean;
        hasClaimedReward?: boolean;
        lastCompletedAt?: string;
      },
    ) => {
      onTaskCompletedTodayChange?.(taskId, previousState.completed);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                completed: previousState.completed,
                hasClaimedReward: previousState.hasClaimedReward,
                lastCompletedAt: previousState.lastCompletedAt,
              }
            : t,
        ),
      );
    },
    [onTaskCompletedTodayChange, setTasks],
  );

  const onOptimisticDelete = useCallback(
    (task: Task) => {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    },
    [setTasks],
  );

  const onRollbackDelete = useCallback(
    (task: Task) => {
      setTasks((prev) => [task, ...prev]);
    },
    [setTasks],
  );

  const onTaskDuplicated = useCallback(
    (duplicatedTask: Task) => {
      setTasks((prev) => [duplicatedTask, ...prev]);
    },
    [setTasks],
  );

  const onReconcileTask = useCallback(
    (reconciledTask: Task) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === reconciledTask.id ? reconciledTask : t)),
      );
    },
    [setTasks],
  );

  const {
    handleToggleComplete,
    handleHabitChange,
    handleDeleteTask,
    handleDuplicateTask,
  } = useTaskMutations({
    findTask,
    onOptimisticToggle,
    onOptimisticHabit,
    onRollbackToggle,
    onOptimisticDelete,
    onRollbackDelete,
    onTaskDuplicated,
    onReconcileTask,
    defaultColumnId,
  });

  const handleTaskSaved = useCallback(
    (savedTask: Task) => {
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === savedTask.id);
        if (exists) {
          return prev.map((t) => (t.id === savedTask.id ? savedTask : t));
        }
        return [savedTask, ...prev];
      });
    },
    [setTasks],
  );

  const handleTaskDetailsUpdate = useCallback(
    (updatedTask: Task) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
      );
    },
    [setTasks],
  );

  return {
    handleToggleComplete,
    handleHabitChange,
    handleDeleteTask,
    handleDuplicateTask,
    handleTaskSaved,
    handleTaskDetailsUpdate,
  };
}
