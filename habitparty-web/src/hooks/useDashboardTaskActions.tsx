"use client";

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { cloneTaskChecklistItems } from "@/actions/checklistActions";
import { createTask, deleteTask } from "@/actions/taskActions";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import type { Task } from "@/types/task";
import {
  buildCreateTaskPayloadFromTask,
  computeOptimisticHabitDelta,
} from "@/utils/taskMapper";

interface UseDashboardTaskActionsProps {
  tasks?: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  defaultColumnId?: string;
}

/**
 * Hook de ações de tarefas do Dashboard.
 * Gerencia conclusão, hábitos, exclusão, duplicação e atualização de detalhes.
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

  const { handleToggleComplete, handleHabitChange } = useTaskMutations({
    findTask,
    onOptimisticToggle,
    onOptimisticHabit,
    onRollbackToggle,
  });

  const handleDeleteTask = useCallback(
    async (task: Task) => {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast.success(`Tarefa "${task.title}" excluída com sucesso!`);

      const res = await deleteTask(task.id);
      if (!res.success) {
        toast.error(res.error || "Erro ao excluir tarefa no servidor.");
      }
    },
    [setTasks],
  );

  const handleDuplicateTask = useCallback(
    async (task: Task, targetColId?: string) => {
      const colId = targetColId || task.columnId || defaultColumnId;
      if (!colId) {
        toast.error("Coluna de destino não encontrada para duplicação.");
        return;
      }

      const payload = buildCreateTaskPayloadFromTask(task);

      const res = await createTask(colId, payload);
      if (!res.success) {
        toast.error(res.error || "Erro ao duplicar tarefa.");
        return;
      }

      const newTaskId = res.data?.id;

      if (newTaskId && task.checklist && task.checklist.length > 0) {
        await cloneTaskChecklistItems(newTaskId, task.checklist);
      }

      const duplicatedTask: Task = {
        ...task,
        id: newTaskId || `dup-${Date.now()}`,
        completed: false,
        streak: 0,
        positiveCount: 0,
        negativeCount: 0,
        columnId: colId,
        order: 0,
      };

      setTasks((prev) => [duplicatedTask, ...prev]);
      toast.success(`Tarefa "${task.title}" duplicada com sucesso!`);
    },
    [setTasks, defaultColumnId],
  );

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
