"use client";

import { useCallback, useRef } from "react";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import type { Task } from "@/types/task";
import { computeOptimisticHabitDelta } from "@/utils/taskMapper";

interface UseDashboardTaskActionsProps {
  tasks?: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  defaultColumnId?: string;
}

/**
 * Hook de ações de tarefas do Dashboard.
 * Delega mutações (conclusão, hábitos, exclusão com rollback e duplicação) ao useTaskMutations.
 */
export function useDashboardTaskActions({
  tasks,
  setTasks,
  defaultColumnId,
}: UseDashboardTaskActionsProps) {
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  const findTask = useCallback(
    (taskId: string) => tasksRef.current?.find((t) => t.id === taskId),
    [],
  );

  const onOptimisticToggle = useCallback(
    (taskId: string, completed: boolean) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed } : t)),
      );
    },
    [setTasks],
  );

  const onOptimisticHabit = useCallback(
    (taskId: string, delta: number) => {
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
    [setTasks],
  );

  const onRollbackToggle = useCallback(
    (taskId: string, previousCompleted: boolean) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: previousCompleted } : t,
        ),
      );
    },
    [setTasks],
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
