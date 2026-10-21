"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useRef, useTransition } from "react";
import { toast } from "sonner";
import { createTask, moveTasks } from "@/actions/taskActions";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import type {
  BoardColumn,
  CreateTaskDTO,
  Task,
  TaskTypeOption,
  UpdateTaskOrderDTO,
} from "@/types/task";
import { soundEffects } from "@/utils/soundEffects";
import {
  buildQuickCreateTaskPayload,
  computeOptimisticHabitDelta,
  mapTaskResponseToTask,
} from "@/utils/taskMapper";

interface UseBoardTaskActionsOptions {
  columns: BoardColumn[];
  setColumns: Dispatch<SetStateAction<BoardColumn[]>>;
  onTaskUpdatedInDetails?: (task: Task) => void;
}

/**
 * Hook dedicado às ações e mutações assíncronas de tarefas do quadro Kanban.
 * Mantém referências estáveis via columnsRef para evitar re-renders em cascata durante Drag-and-Drop.
 */
export function useBoardTaskActions({
  columns,
  setColumns,
  onTaskUpdatedInDetails,
}: UseBoardTaskActionsOptions) {
  const [, startTransition] = useTransition();
  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const handleTaskSaved = useCallback(
    (savedTask: Task, targetColumnId: string) => {
      setColumns((prev) =>
        prev.map((col) => {
          const existsInThisCol = col.tasks.some((t) => t.id === savedTask.id);

          if (col.id === targetColumnId) {
            if (existsInThisCol) {
              return {
                ...col,
                tasks: col.tasks.map((t) =>
                  t.id === savedTask.id ? savedTask : t,
                ),
              };
            }
            return { ...col, tasks: [...col.tasks, savedTask] };
          }

          if (existsInThisCol) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== savedTask.id),
            };
          }

          return col;
        }),
      );
    },
    [setColumns],
  );

  const handleQuickCreateTask = useCallback(
    async (
      title: string,
      targetColumnId: string,
      taskType: TaskTypeOption = "TODO",
      extraPayload?: Partial<CreateTaskDTO>,
    ) => {
      const tempId = `temp-${Date.now()}`;
      const { payload, optimisticTask } = buildQuickCreateTaskPayload(
        title,
        targetColumnId,
        taskType,
        extraPayload,
        tempId,
      );

      setColumns((prev) =>
        prev.map((col) =>
          col.id === targetColumnId
            ? { ...col, tasks: [...col.tasks, optimisticTask] }
            : col,
        ),
      );

      const res = await createTask(targetColumnId, payload);
      if (res.success && res.data) {
        const realTask = mapTaskResponseToTask(res.data, targetColumnId);
        setColumns((prev) =>
          prev.map((col) =>
            col.id === targetColumnId
              ? {
                  ...col,
                  tasks: col.tasks.map((t) =>
                    t.id === tempId
                      ? { ...realTask, columnId: targetColumnId }
                      : t,
                  ),
                }
              : col,
          ),
        );
        const typeLabel =
          taskType === "HABIT"
            ? "Hábito"
            : taskType === "DAILY"
              ? "Diária"
              : "Tarefa";
        soundEffects.playCreateSound();
        toast.success(`${typeLabel} "${title}" adicionada!`);
      } else {
        setColumns((prev) =>
          prev.map((col) =>
            col.id === targetColumnId
              ? {
                  ...col,
                  tasks: col.tasks.filter((t) => t.id !== tempId),
                }
              : col,
          ),
        );
        const errMsg = !res.success
          ? res.error
          : "Erro ao criar tarefa rápida.";
        toast.error(errMsg || "Erro ao criar tarefa rápida.");
      }
    },
    [setColumns],
  );

  const handleTaskMove = useCallback(
    (
      _taskId: string,
      targetColumnId: string,
      _newIndex: number,
      allTargetTasks?: Task[],
    ) => {
      const tasksToUpdate =
        allTargetTasks ||
        columnsRef.current.find((c) => c.id === targetColumnId)?.tasks ||
        [];

      const updates: UpdateTaskOrderDTO[] = tasksToUpdate
        .filter((t) => t.id && !t.id.startsWith("temp-"))
        .map((t, idx) => ({
          taskId: t.id,
          boardColumnId: targetColumnId,
          newOrderIndex: idx,
        }));

      if (updates.length > 0) {
        startTransition(async () => {
          const res = await moveTasks(updates);
          if (!res.success) {
            toast.error(
              res.error || "Erro ao salvar nova posição da tarefa no servidor.",
            );
          }
        });
      }
    },
    [],
  );

  const handleTaskDetailsUpdate = useCallback(
    (updatedTask: Task) => {
      onTaskUpdatedInDetails?.(updatedTask);
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) =>
            t.id === updatedTask.id ? updatedTask : t,
          ),
        })),
      );
    },
    [setColumns, onTaskUpdatedInDetails],
  );

  const findTask = useCallback(
    (taskId: string) =>
      columnsRef.current
        .flatMap((col) => col.tasks)
        .find((t) => t.id === taskId),
    [],
  );

  const onOptimisticToggle = useCallback(
    (taskId: string, completed: boolean) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) =>
            t.id === taskId ? { ...t, completed } : t,
          ),
        })),
      );
    },
    [setColumns],
  );

  const onOptimisticHabit = useCallback(
    (taskId: string, delta: number) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                ...computeOptimisticHabitDelta(t, delta),
              };
            }
            return t;
          }),
        })),
      );
    },
    [setColumns],
  );

  const onRollbackToggle = useCallback(
    (taskId: string, previousCompleted: boolean) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) =>
            t.id === taskId ? { ...t, completed: previousCompleted } : t,
          ),
        })),
      );
    },
    [setColumns],
  );

  const onOptimisticDelete = useCallback(
    (task: Task, targetColumnId?: string) => {
      setColumns((prev) =>
        prev.map((col) =>
          !targetColumnId || col.id === targetColumnId
            ? { ...col, tasks: col.tasks.filter((t) => t.id !== task.id) }
            : col,
        ),
      );
    },
    [setColumns],
  );

  const onRollbackDelete = useCallback(
    (task: Task, targetColumnId?: string) => {
      const colId = targetColumnId || task.columnId;
      if (!colId) return;
      setColumns((prev) =>
        prev.map((col) =>
          col.id === colId ? { ...col, tasks: [...col.tasks, task] } : col,
        ),
      );
    },
    [setColumns],
  );

  const onTaskDuplicated = useCallback(
    (duplicatedTask: Task, targetColumnId: string) => {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === targetColumnId
            ? { ...col, tasks: [...col.tasks, duplicatedTask] }
            : col,
        ),
      );
    },
    [setColumns],
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
    onTaskUpdatedInDetails,
  });

  return {
    handleDuplicateTask,
    handleTaskSaved,
    handleQuickCreateTask,
    handleDeleteTask,
    handleTaskMove,
    handleTaskDetailsUpdate,
    handleToggleComplete,
    handleHabitChange,
  };
}
