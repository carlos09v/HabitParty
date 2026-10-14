"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteBoardColumnAction,
  updateBoardColumnOrderAction,
} from "@/actions/boardColumnActions";
import { addChecklistItemAction } from "@/actions/checklistActions";
import {
  changeTaskStatus,
  completeTask,
  createTask,
  deleteTask,
  moveTasks,
} from "@/actions/taskActions";
import {
  ALL_WEEK_DAYS,
  normalizeTaskDifficulty,
  normalizeTaskType,
} from "@/constants/task";
import { useUserStore } from "@/store/userStore";
import type {
  BoardColumn,
  CreateTaskDTO,
  Task,
  TaskPriorityOption,
  TaskTypeOption,
  UpdateTaskOrderDTO,
} from "@/types/task";
import { soundEffects } from "@/utils/soundEffects";

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
  const user = useUserStore((s) => s.user);
  const updateUserPartial = useUserStore((s) => s.updateUserPartial);

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
        if (visibleColumnIds.length < 4) {
          toggleColumnVisibility(savedCol.id);
        }
      }
    },
    [setColumns, visibleColumnIds, toggleColumnVisibility],
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
      const resolvedType = normalizeTaskType(task);
      const isHabit = resolvedType === "habit";
      const isDaily = resolvedType === "daily";
      const isTodo = resolvedType === "todo";

      const payload: CreateTaskDTO = {
        name: task.title,
        description: task.description?.trim() || undefined,
        taskType: (resolvedType.toUpperCase() as TaskTypeOption) || "TODO",
        isHardcoreModeEnabled: Boolean(task.isHardcoreModeEnabled),
        tags: task.tags && task.tags.length > 0 ? task.tags : undefined,
        difficulty: normalizeTaskDifficulty(task.difficulty),
        ...(isHabit && {
          habitType: task.habitType || "POSITIVE",
          resetCounter: task.resetCounter || "DAILY",
          importanceType: task.importanceType || "NORMAL",
        }),
        ...(isDaily && {
          startDate: task.startDate || undefined,
          repeatType:
            task.daysOfWeek && task.daysOfWeek.length < 7
              ? "WEEKLY"
              : task.repeatType || "DAILY",
          repeatEvery: task.repeatEvery || 1,
          daysOfWeek: task.daysOfWeek || [...ALL_WEEK_DAYS],
        }),
        ...(isTodo && {
          priority: (task.priority as TaskPriorityOption) || "MEDIUM",
          dueDate: task.dueDate || undefined,
          reminderType: task.reminderType || "NONE",
        }),
      };

      const res = await createTask(targetColumnId, payload);
      if (!res.success) {
        toast.error(res.error || "Erro ao duplicar tarefa.");
        return;
      }

      const newTaskId = res.data?.id;

      if (newTaskId && task.checklist && task.checklist.length > 0) {
        for (const item of task.checklist) {
          if (item.name) {
            await addChecklistItemAction(newTaskId, { name: item.name });
          }
        }
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

      const updates: UpdateTaskOrderDTO[] = tasksToUpdate.map((t, idx) => ({
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

  const handleToggleComplete = useCallback(
    (taskId: string, completed: boolean) => {
      let targetTask: Task | undefined;
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => {
            if (t.id === taskId) {
              targetTask = t;
              return { ...t, completed };
            }
            return t;
          }),
        })),
      );
      startTransition(async () => {
        const res = completed
          ? await completeTask(taskId)
          : await changeTaskStatus(taskId, "PENDING");

        if (!res.success) {
          toast.error(res.error || "Erro ao atualizar status da tarefa.");
          // Rollback
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              tasks: col.tasks.map((t) =>
                t.id === taskId ? { ...t, completed: !completed } : t,
              ),
            })),
          );
          return;
        }

        if (completed) {
          soundEffects.playTaskCompleteSound();
          toast.success("Tarefa concluída!");
          if (targetTask && user) {
            updateUserPartial({
              currentCoins:
                (user.currentCoins ?? 0) + (targetTask.rewardGold ?? 0),
              totalXp: (user.totalXp ?? 0) + (targetTask.rewardXp ?? 0),
            });
          }
        }
      });
    },
    [setColumns, user, updateUserPartial],
  );

  const handleHabitChange = useCallback(
    (taskId: string, delta: number) => {
      let targetTask: Task | undefined;
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => {
            if (t.id === taskId) {
              targetTask = t;
              const nextPositive =
                delta > 0
                  ? (t.positiveCount ?? 0) + delta
                  : (t.positiveCount ?? 0);
              const nextNegative =
                delta < 0
                  ? (t.negativeCount ?? 0) + Math.abs(delta)
                  : (t.negativeCount ?? 0);
              const nextStreak =
                delta > 0 ? (t.streak ?? 0) + 1 : (t.streak ?? 0);
              return {
                ...t,
                positiveCount: nextPositive,
                negativeCount: nextNegative,
                streak: nextStreak,
              };
            }
            return t;
          }),
        })),
      );

      if (delta > 0) {
        soundEffects.playHabitSound();
        startTransition(async () => {
          const res = await completeTask(taskId);
          if (!res.success) {
            toast.error(res.error || "Erro ao registrar hábito no servidor.");
            return;
          }

          toast.success("Hábito positivo registrado com sucesso!");
          if (targetTask && user) {
            const rewardGold = targetTask.rewardGold ?? 0;
            const rewardXp = targetTask.rewardXp ?? 0;
            updateUserPartial({
              currentCoins: (user.currentCoins ?? 0) + rewardGold,
              totalXp: (user.totalXp ?? 0) + rewardXp,
              xpToNextLevel: Math.max(0, (user.xpToNextLevel ?? 0) - rewardXp),
            });
          }
        });
      }
    },
    [setColumns, user, updateUserPartial],
  );

  return {
    handleColumnSaved,
    handleDeleteColumn,
    isDeletingColumn,
    handleDuplicateTask,
    handleTaskSaved,
    handleDeleteTask,
    handleTaskMove,
    handleColumnReorder,
    handleTaskDetailsUpdate,
    handleToggleComplete,
    handleHabitChange,
  };
}
