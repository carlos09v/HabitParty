"use client";

import { useCallback, useRef } from "react";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import {
  applyOptimisticHabitChange,
  applyOptimisticHabitRollback,
  applyOptimisticTaskRollback,
  applyOptimisticTaskToggle,
  type HabitRollbackState,
  type TaskToggleRollbackState,
  useTaskMutations,
} from "@/hooks/useTaskMutations";
import { useOptimisticDashboardStore } from "@/store/optimisticDashboardStore";
import { useUserStore } from "@/store/userStore";
import type { DashboardColumnOption } from "@/types/dashboard";
import type { Task } from "@/types/task";
import { enrichTaskWithColumnWorkspace } from "@/utils/taskMapper";

interface UseDashboardTaskActionsProps {
  tasks?: Task[];
  columns?: DashboardColumnOption[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  defaultColumnId?: string;
  onTaskUpdatedInDetails?: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
}

/**
 * Hook de ações de tarefas do Dashboard.
 * Delega mutações (conclusão, hábitos, exclusão com rollback e duplicação) ao useTaskMutations.
 */
export function useDashboardTaskActions({
  tasks,
  columns,
  setTasks,
  defaultColumnId,
  onTaskUpdatedInDetails,
  onTaskDeleted,
}: UseDashboardTaskActionsProps) {
  const tasksRef = useRef(tasks);
  const columnsRef = useRef(columns);

  useIsomorphicLayoutEffect(() => {
    tasksRef.current = tasks;
    columnsRef.current = columns;
  }, [tasks, columns]);

  const enrichTaskWorkspace = useCallback(
    (task: Task): Task =>
      enrichTaskWithColumnWorkspace(task, columnsRef.current),
    [],
  );

  const findTask = useCallback(
    (taskId: string) => tasksRef.current?.find((t) => t.id === taskId),
    [],
  );

  const onOptimisticToggle = useCallback(
    (taskId: string, completed: boolean) => {
      const nowIso = new Date().toISOString();
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? applyOptimisticTaskToggle(t, completed, nowIso) : t,
        ),
      );
    },
    [setTasks],
  );

  const onOptimisticHabit = useCallback(
    (taskId: string, delta: number) => {
      const timeZone = useUserStore.getState().user?.timezone;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? applyOptimisticHabitChange(t, delta, timeZone) : t,
        ),
      );
    },
    [setTasks],
  );

  const onRollbackToggle = useCallback(
    (taskId: string, previousState: TaskToggleRollbackState) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? applyOptimisticTaskRollback(t, previousState) : t,
        ),
      );
    },
    [setTasks],
  );

  const onRollbackHabit = useCallback(
    (taskId: string, previousState: HabitRollbackState) => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? applyOptimisticHabitRollback(t, previousState) : t,
        ),
      );
    },
    [setTasks],
  );

  const onOptimisticDelete = useCallback(
    (task: Task) => {
      onTaskDeleted?.(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
    },
    [onTaskDeleted, setTasks],
  );

  const onRollbackDelete = useCallback(
    (task: Task) => {
      setTasks((prev) => [task, ...prev]);
    },
    [setTasks],
  );

  const onTaskDuplicated = useCallback(
    (duplicatedTask: Task, _targetColumnId: string, sourceTaskId?: string) => {
      const enriched = enrichTaskWorkspace(duplicatedTask);
      setTasks((prev) => {
        if (!sourceTaskId) return [enriched, ...prev];
        const sourceIndex = prev.findIndex((t) => t.id === sourceTaskId);
        if (sourceIndex === -1) return [enriched, ...prev];
        const nextTasks = [...prev];
        nextTasks.splice(sourceIndex + 1, 0, enriched);
        return nextTasks;
      });
    },
    [enrichTaskWorkspace, setTasks],
  );

  const onReconcileTask = useCallback(
    (reconciledTask: Task) => {
      const enriched = enrichTaskWorkspace(reconciledTask);
      setTasks((prev) =>
        prev.map((t) => (t.id === enriched.id ? enriched : t)),
      );
    },
    [enrichTaskWorkspace, setTasks],
  );

  const handleTaskUpdatedInDetailsEnriched = useCallback(
    (updatedTask: Task) => {
      onTaskUpdatedInDetails?.(enrichTaskWorkspace(updatedTask));
    },
    [enrichTaskWorkspace, onTaskUpdatedInDetails],
  );

  const {
    handleToggleComplete,
    handleHabitChange,
    handleDeleteTask,
    scheduleUndoDeleteTask,
    handleDuplicateTask,
    duplicatingTaskIds,
  } = useTaskMutations({
    findTask,
    onOptimisticToggle,
    onOptimisticHabit,
    onRollbackToggle,
    onRollbackHabit,
    onOptimisticDelete,
    onRollbackDelete,
    onTaskDuplicated,
    onReconcileTask,
    onTaskUpdatedInDetails: handleTaskUpdatedInDetailsEnriched,
    defaultColumnId,
  });

  const handleTaskSaved = useCallback(
    (savedTask: Task) => {
      const enriched = enrichTaskWorkspace(savedTask);
      useOptimisticDashboardStore.getState().upsertTask(enriched);
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === enriched.id);
        if (exists) {
          return prev.map((t) => (t.id === enriched.id ? enriched : t));
        }
        return [enriched, ...prev];
      });
    },
    [enrichTaskWorkspace, setTasks],
  );

  const handleTaskDetailsUpdate = useCallback(
    (updatedTask: Task) => {
      const enriched = enrichTaskWorkspace(updatedTask);
      useOptimisticDashboardStore.getState().upsertTask(enriched);
      setTasks((prev) =>
        prev.map((t) => (t.id === enriched.id ? enriched : t)),
      );
    },
    [enrichTaskWorkspace, setTasks],
  );

  return {
    handleToggleComplete,
    handleHabitChange,
    handleDeleteTask,
    scheduleUndoDeleteTask,
    handleDuplicateTask,
    duplicatingTaskIds,
    handleTaskSaved,
    handleTaskDetailsUpdate,
  };
}
