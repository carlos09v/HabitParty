"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteBoardColumnAction,
  updateBoardColumnOrderAction,
} from "@/actions/boardColumnActions";
import { cloneTaskChecklistItems } from "@/actions/checklistActions";
import { createTask, deleteTask, moveTasks } from "@/actions/taskActions";
import { MAX_COLUMNS_PREMIUM, MAX_VISIBLE_COLUMNS } from "@/constants/routine";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { useUserStore } from "@/store/userStore";
import type {
  BoardColumn,
  CreateTaskDTO,
  Task,
  TaskTypeOption,
  UpdateTaskOrderDTO,
} from "@/types/task";
import {
  buildCreateTaskPayloadFromTask,
  buildQuickCreateTaskPayload,
  computeOptimisticHabitDelta,
  mapTaskResponseToTask,
} from "@/utils/taskMapper";

interface UseBoardTaskActionsOptions {
  columns: BoardColumn[];
  setColumns: Dispatch<SetStateAction<BoardColumn[]>>;
  activeWorkspaceId?: string | null;
  visibleColumnIds: string[];
  toggleColumnVisibility: (columnId: string) => void;
  onTaskUpdatedInDetails?: (task: Task) => void;
}

/**
 * Hook dedicado a concentrar todas as ações e mutações assíncronas do quadro Kanban
 * (duplicação, criação, salvamento, remoção e reordenação de tarefas e colunas).
 */
export function useBoardTaskActions({
  columns,
  setColumns,
  activeWorkspaceId,
  visibleColumnIds,
  toggleColumnVisibility,
  onTaskUpdatedInDetails,
}: UseBoardTaskActionsOptions) {
  const [, startTransition] = useTransition();
  const is_Premium = useUserStore((s) => s.is_Premium);

  const handleColumnSaved = useCallback(
    (savedCol: BoardColumn, isEdit?: boolean) => {
      if (isEdit) {
        setColumns((prev) =>
          prev.map((c) =>
            c.id === savedCol.id
              ? { ...c, title: savedCol.title, icon: savedCol.icon }
              : c,
          ),
        );
      } else {
        setColumns((prev) => [...prev, savedCol]);
        const limit = is_Premium ? MAX_COLUMNS_PREMIUM : MAX_VISIBLE_COLUMNS;
        if (visibleColumnIds.length < limit) {
          toggleColumnVisibility(savedCol.id);
        }
      }
    },
    [setColumns, visibleColumnIds, toggleColumnVisibility, is_Premium],
  );

  const [isDeletingColumn, setIsDeletingColumn] = useState(false);

  const handleDeleteColumn = useCallback(
    async (column: BoardColumn) => {
      setIsDeletingColumn(true);
      try {
        setColumns((prev) => prev.filter((c) => c.id !== column.id));
        if (visibleColumnIds.includes(column.id)) {
          toggleColumnVisibility(column.id);
        }

        const res = await deleteBoardColumnAction(column.id);
        if (!res.success) {
          toast.error(res.error || "Erro ao excluir coluna no servidor.");
          return false;
        }

        toast.success(`Coluna "${column.title}" excluída com sucesso!`);
        return true;
      } catch (_error) {
        toast.error("Erro inesperado ao excluir coluna.");
        return false;
      } finally {
        setIsDeletingColumn(false);
      }
    },
    [setColumns, visibleColumnIds, toggleColumnVisibility],
  );

  const handleDuplicateTask = useCallback(
    async (task: Task, targetColumnId: string) => {
      const payload = buildCreateTaskPayloadFromTask(task);

      const res = await createTask(targetColumnId, payload);
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
        columnId: targetColumnId,
        order: 0,
      };

      setColumns((prev) =>
        prev.map((col) =>
          col.id === targetColumnId
            ? { ...col, tasks: [...col.tasks, duplicatedTask] }
            : col,
        ),
      );

      toast.success(`Tarefa "${task.title}" duplicada com sucesso!`);
    },
    [setColumns],
  );

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

  const handleDeleteTask = useCallback(
    async (task: Task, targetColumnId: string) => {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === targetColumnId
            ? { ...col, tasks: col.tasks.filter((t) => t.id !== task.id) }
            : col,
        ),
      );
      toast.success(`Tarefa "${task.title}" excluída com sucesso!`);

      const res = await deleteTask(task.id);
      if (!res.success) {
        toast.error(res.error || "Erro ao excluir tarefa no servidor.");
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
        columns.find((c) => c.id === targetColumnId)?.tasks ||
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
    [columns],
  );

  const handleColumnReorder = useCallback(
    (reorderedColumns: BoardColumn[]) => {
      if (!activeWorkspaceId) return;

      const payload = reorderedColumns.map((c, idx) => ({
        board_column_id: c.id,
        newIndex: idx,
      }));

      startTransition(async () => {
        const res = await updateBoardColumnOrderAction(
          activeWorkspaceId,
          payload,
        );
        if (!res.success) {
          toast.error(
            res.error || "Erro ao salvar ordem das colunas no servidor.",
          );
        }
      });
    },
    [activeWorkspaceId],
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

  const columnsRef = useRef(columns);
  columnsRef.current = columns;

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

  const { handleToggleComplete, handleHabitChange } = useTaskMutations({
    findTask,
    onOptimisticToggle,
    onOptimisticHabit,
    onRollbackToggle,
    onTaskUpdatedInDetails,
  });

  return {
    handleColumnSaved,
    handleDeleteColumn,
    isDeletingColumn,
    handleDuplicateTask,
    handleTaskSaved,
    handleQuickCreateTask,
    handleDeleteTask,
    handleTaskMove,
    handleColumnReorder,
    handleTaskDetailsUpdate,
    handleToggleComplete,
    handleHabitChange,
  };
}
