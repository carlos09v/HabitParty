"use client";

import { useTranslations } from "next-intl";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { startTransition, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { createTask, deleteTask } from "@/actions/taskActions";
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
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type {
  BoardColumn,
  CreateTaskDTO,
  Task,
  TaskTypeOption,
  UpdateTaskOrderDTO,
} from "@/types/task";
import type { WorkspaceResponseDTO } from "@/types/workspace";
import { soundEffects } from "@/utils/soundEffects";
import {
  buildQuickCreateTaskPayload,
  mapTaskInColumns,
  mapTaskResponseToTask,
  removeTaskFromColumns,
} from "@/utils/taskMapper";

interface UseBoardTaskActionsOptions {
  columns: BoardColumn[];
  setColumns: Dispatch<SetStateAction<BoardColumn[]>>;
  workspaceId?: string | null;
  workspaces?: WorkspaceResponseDTO[];
  hasPendingTaskMovesRef?: RefObject<boolean>;
  onTaskUpdatedInDetails?: (task: Task) => void;
  onTempTaskReconciled?: (tempId: string, realTask: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
}

const MOVE_COALESCE_DELAY_MS = 250;

let quickCreateTempSeq = 0;

async function persistTaskMoveUpdates(
  updates: UpdateTaskOrderDTO[],
  options?: { keepalive?: boolean },
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch("/api/tasks/move", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
      keepalive: Boolean(options?.keepalive),
    });

    if (response.ok) {
      return { success: true };
    }

    let errorMessage: string | undefined;
    try {
      const body = (await response.json()) as { error?: unknown };
      if (typeof body?.error === "string" && body.error.trim().length > 0) {
        errorMessage = body.error;
      }
    } catch {
      // Resposta de erro sem JSON válido
    }

    return { success: false, error: errorMessage };
  } catch {
    return { success: false };
  }
}

/**
 * Hook dedicado às ações e mutações assíncronas de tarefas do quadro Kanban.
 * Mantém referências estáveis via columnsRef para evitar re-renders em cascata durante Drag-and-Drop.
 */
export function useBoardTaskActions({
  columns,
  setColumns,
  workspaceId,
  workspaces,
  hasPendingTaskMovesRef,
  onTaskUpdatedInDetails,
  onTempTaskReconciled,
  onTaskDeleted,
}: UseBoardTaskActionsOptions) {
  const t = useTranslations("tasks.hooks");
  const columnsRef = useRef(columns);
  const deletedTempTaskIdsRef = useRef<Set<string>>(new Set());
  const moveChainRef = useRef<Promise<void>>(Promise.resolve());
  const moveSeqRef = useRef(0);
  const pendingMoveColumnIdsRef = useRef<Set<string>>(new Set());
  const pendingMoveTasksByColumnRef = useRef<Map<string, Task[]>>(new Map());
  const pendingMoveSnapshotRef = useRef<BoardColumn[] | null>(null);
  const moveFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightMovesCountRef = useRef(0);
  const isUnmountedRef = useRef(false);

  const syncPendingMoveFlag = useCallback(() => {
    if (hasPendingTaskMovesRef) {
      hasPendingTaskMovesRef.current =
        pendingMoveColumnIdsRef.current.size > 0 ||
        inFlightMovesCountRef.current > 0;
    }
  }, [hasPendingTaskMovesRef]);

  const enqueueMoveBatch = useCallback(
    (
      updates: UpdateTaskOrderDTO[],
      rollbackSnapshot: BoardColumn[] | null,
      flushSeq: number,
      options?: { keepalive?: boolean },
    ) => {
      if (updates.length === 0) return;

      const effectiveWorkspaceId =
        workspaceId ?? useWorkspaceStore.getState().activeWorkspaceId;
      useWorkspaceStore.getState().markBoardOrderDirty(effectiveWorkspaceId);

      inFlightMovesCountRef.current += 1;
      syncPendingMoveFlag();

      moveChainRef.current = moveChainRef.current
        .then(async () => {
          const res = await persistTaskMoveUpdates(updates, options);
          if (!res.success && !isUnmountedRef.current) {
            // Só reverte o snapshot anterior se nenhum arrasto mais recente o substituiu
            if (rollbackSnapshot && flushSeq === moveSeqRef.current) {
              startTransition(() => {
                columnsRef.current = rollbackSnapshot;
                setColumns(rollbackSnapshot);
              });
            }
            toast.error(res.error || t("movePositionError"));
          }
        })
        .catch(() => {
          if (!isUnmountedRef.current) {
            toast.error(t("movePositionError"));
          }
        })
        .finally(() => {
          inFlightMovesCountRef.current = Math.max(
            0,
            inFlightMovesCountRef.current - 1,
          );
          syncPendingMoveFlag();
        });
    },
    [setColumns, syncPendingMoveFlag, t, workspaceId],
  );

  const flushPendingMoves = useCallback(
    (options?: { keepalive?: boolean }) => {
      if (moveFlushTimerRef.current !== null) {
        clearTimeout(moveFlushTimerRef.current);
        moveFlushTimerRef.current = null;
      }

      if (pendingMoveColumnIdsRef.current.size === 0) {
        syncPendingMoveFlag();
        return;
      }

      const touchedColumnIds = Array.from(pendingMoveColumnIdsRef.current);
      const bufferedTasksByCol = new Map(pendingMoveTasksByColumnRef.current);
      const rollbackSnapshot = pendingMoveSnapshotRef.current;
      const flushSeq = moveSeqRef.current;

      pendingMoveColumnIdsRef.current.clear();
      pendingMoveTasksByColumnRef.current.clear();
      pendingMoveSnapshotRef.current = null;

      const dedupedUpdates = new Map<string, UpdateTaskOrderDTO>();
      for (const colId of touchedColumnIds) {
        const liveCol = columnsRef.current.find((c) => c.id === colId);
        const colTasks = liveCol?.tasks ?? bufferedTasksByCol.get(colId) ?? [];
        colTasks.forEach((taskItem, idx) => {
          if (!taskItem.id || taskItem.id.startsWith("temp-")) return;
          dedupedUpdates.set(taskItem.id, {
            taskId: taskItem.id,
            boardColumnId: colId,
            newOrderIndex: idx,
          });
        });
      }

      const updates = Array.from(dedupedUpdates.values());
      if (updates.length === 0) {
        syncPendingMoveFlag();
        return;
      }

      enqueueMoveBatch(updates, rollbackSnapshot, flushSeq, options);
    },
    [enqueueMoveBatch, syncPendingMoveFlag],
  );

  useEffect(() => {
    isUnmountedRef.current = false;
    const handlePageHide = () => {
      flushPendingMoves({ keepalive: true });
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      flushPendingMoves({ keepalive: true });
      isUnmountedRef.current = true;
    };
  }, [flushPendingMoves]);

  useIsomorphicLayoutEffect(() => {
    columnsRef.current = columns;
  }, [columns]);

  const handleTaskSaved = useCallback(
    (savedTask: Task, targetColumnId: string) => {
      setColumns((prev) => {
        const existedInOtherColumn = prev.some(
          (col) =>
            col.id !== targetColumnId &&
            col.tasks.some((t) => t.id === savedTask.id),
        );

        return prev.map((col) => {
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
            // Ao mover entre colunas via modal, o backend posiciona em newOrderIndex: 0
            return {
              ...col,
              tasks: existedInOtherColumn
                ? [savedTask, ...col.tasks]
                : [...col.tasks, savedTask],
            };
          }

          if (existsInThisCol) {
            return {
              ...col,
              tasks: col.tasks.filter((t) => t.id !== savedTask.id),
            };
          }

          return col;
        });
      });
    },
    [setColumns],
  );

  const handleQuickCreateTask = useCallback(
    async (
      title: string,
      targetColumnId: string,
      taskType: TaskTypeOption = "TODO",
      extraPayload?: Partial<CreateTaskDTO>,
    ): Promise<boolean> => {
      quickCreateTempSeq += 1;
      const tempId = `temp-${Date.now()}-${quickCreateTempSeq}`;
      const userTimeZone = useUserStore.getState().user?.timezone;
      const wsState = useWorkspaceStore.getState();
      const effectiveWorkspaceId = workspaceId ?? wsState.activeWorkspaceId;
      const wsList =
        workspaces && workspaces.length > 0 ? workspaces : wsState.workspaces;
      const activeWs = wsList.find((w) => w.id === effectiveWorkspaceId);
      const workspaceMeta = activeWs
        ? { id: activeWs.id, name: activeWs.name }
        : effectiveWorkspaceId
          ? { id: effectiveWorkspaceId }
          : undefined;

      const { payload, optimisticTask } = buildQuickCreateTaskPayload(
        title,
        targetColumnId,
        taskType,
        extraPayload,
        tempId,
        userTimeZone,
      );
      const enrichedOptimisticTask: Task = workspaceMeta
        ? {
            ...optimisticTask,
            workspaceId: workspaceMeta.id,
            workspaceName: workspaceMeta.name,
          }
        : optimisticTask;

      setColumns((prev) =>
        prev.map((col) =>
          col.id === targetColumnId
            ? { ...col, tasks: [...col.tasks, enrichedOptimisticTask] }
            : col,
        ),
      );

      const res = await createTask(targetColumnId, payload);
      if (res.success && res.data) {
        // Se o usuário excluiu o card temporário enquanto o POST estava em voo, deleta imediatamente no servidor
        if (deletedTempTaskIdsRef.current.has(tempId)) {
          deletedTempTaskIdsRef.current.delete(tempId);
          if (res.data.id) {
            void deleteTask(res.data.id, false);
          }
          setColumns((prev) => removeTaskFromColumns(prev, tempId));
          return true;
        }

        const currentColumnWithTemp = columnsRef.current.find((col) =>
          col.tasks.some((t) => t.id === tempId),
        );
        const resolvedColumnId = currentColumnWithTemp?.id ?? targetColumnId;
        const realTask = mapTaskResponseToTask(
          res.data,
          resolvedColumnId,
          userTimeZone,
          workspaceMeta,
        );

        const movedColumnUpdates: UpdateTaskOrderDTO[] | null =
          currentColumnWithTemp && currentColumnWithTemp.id !== targetColumnId
            ? currentColumnWithTemp.tasks
                .map((t) => (t.id === tempId ? realTask : t))
                .filter((item) => item.id && !item.id.startsWith("temp-"))
                .map((item, idx) => ({
                  taskId: item.id,
                  boardColumnId: currentColumnWithTemp.id,
                  newOrderIndex: idx,
                }))
            : null;

        setColumns((prev) =>
          prev.map((col) => {
            const hasTemp = col.tasks.some((t) => t.id === tempId);
            if (!hasTemp) return col;
            return {
              ...col,
              tasks: col.tasks.map((t, idx) =>
                t.id === tempId
                  ? { ...realTask, columnId: col.id, order: idx }
                  : t,
              ),
            };
          }),
        );

        onTempTaskReconciled?.(tempId, realTask);

        // Se o card foi arrastado para outra coluna durante o POST, persiste a movimentação agora com o UUID real
        if (movedColumnUpdates && movedColumnUpdates.length > 0) {
          enqueueMoveBatch(movedColumnUpdates, null, ++moveSeqRef.current);
        }

        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("habitparty:tasks-changed"));
        }
        soundEffects.playCreateSound();
        return true;
      }

      deletedTempTaskIdsRef.current.delete(tempId);
      setColumns((prev) => removeTaskFromColumns(prev, tempId));
      const errMsg = !res.success ? res.error : t("quickCreateError");
      toast.error(errMsg || t("quickCreateError"));
      return false;
    },
    [
      enqueueMoveBatch,
      onTempTaskReconciled,
      setColumns,
      t,
      workspaceId,
      workspaces,
    ],
  );

  const handleTaskMove = useCallback(
    (
      taskId: string,
      targetColumnId: string,
      _newIndex: number,
      allTargetTasks?: Task[],
      previousColumns?: BoardColumn[],
    ) => {
      if (pendingMoveSnapshotRef.current === null && previousColumns) {
        pendingMoveSnapshotRef.current = previousColumns;
      }

      if (allTargetTasks) {
        for (const [colId, buffered] of pendingMoveTasksByColumnRef.current) {
          if (colId !== targetColumnId) {
            pendingMoveTasksByColumnRef.current.set(
              colId,
              buffered.filter((item) => item.id !== taskId),
            );
          }
        }
        pendingMoveTasksByColumnRef.current.set(targetColumnId, allTargetTasks);
      }

      pendingMoveColumnIdsRef.current.add(targetColumnId);
      moveSeqRef.current += 1;
      syncPendingMoveFlag();

      const effectiveWorkspaceId =
        workspaceId ?? useWorkspaceStore.getState().activeWorkspaceId;
      useWorkspaceStore.getState().markBoardOrderDirty(effectiveWorkspaceId);

      if (moveFlushTimerRef.current !== null) {
        clearTimeout(moveFlushTimerRef.current);
      }
      moveFlushTimerRef.current = setTimeout(() => {
        flushPendingMoves();
      }, MOVE_COALESCE_DELAY_MS);
    },
    [flushPendingMoves, syncPendingMoveFlag, workspaceId],
  );

  const handleTaskDetailsUpdate = useCallback(
    (updatedTask: Task) => {
      onTaskUpdatedInDetails?.(updatedTask);
      setColumns((prev) =>
        mapTaskInColumns(prev, updatedTask.id, () => updatedTask),
      );
    },
    [setColumns, onTaskUpdatedInDetails],
  );

  const findTask = useCallback((taskId: string) => {
    for (const col of columnsRef.current) {
      const found = col.tasks.find((t) => t.id === taskId);
      if (found) return found;
    }
    return undefined;
  }, []);

  const onOptimisticToggle = useCallback(
    (taskId: string, completed: boolean) => {
      const nowIso = new Date().toISOString();
      setColumns((prev) =>
        mapTaskInColumns(prev, taskId, (t) =>
          applyOptimisticTaskToggle(t, completed, nowIso),
        ),
      );
    },
    [setColumns],
  );

  const onOptimisticHabit = useCallback(
    (taskId: string, delta: number) => {
      const timeZone = useUserStore.getState().user?.timezone;
      setColumns((prev) =>
        mapTaskInColumns(prev, taskId, (t) =>
          applyOptimisticHabitChange(t, delta, timeZone),
        ),
      );
    },
    [setColumns],
  );

  const onRollbackToggle = useCallback(
    (taskId: string, previousState: TaskToggleRollbackState) => {
      setColumns((prev) =>
        mapTaskInColumns(prev, taskId, (t) =>
          applyOptimisticTaskRollback(t, previousState),
        ),
      );
    },
    [setColumns],
  );

  const onRollbackHabit = useCallback(
    (taskId: string, previousState: HabitRollbackState) => {
      setColumns((prev) =>
        mapTaskInColumns(prev, taskId, (t) =>
          applyOptimisticHabitRollback(t, previousState),
        ),
      );
    },
    [setColumns],
  );

  const onOptimisticDelete = useCallback(
    (task: Task, targetColumnId?: string) => {
      if (task.id.startsWith("temp-")) {
        deletedTempTaskIdsRef.current.add(task.id);
      }
      onTaskDeleted?.(task.id);
      setColumns((prev) => {
        if (!targetColumnId) {
          return removeTaskFromColumns(prev, task.id);
        }
        return prev.map((col) =>
          col.id === targetColumnId
            ? { ...col, tasks: col.tasks.filter((t) => t.id !== task.id) }
            : col,
        );
      });
    },
    [setColumns, onTaskDeleted],
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
    (duplicatedTask: Task, targetColumnId: string, sourceTaskId?: string) => {
      setColumns((prev) =>
        prev.map((col) => {
          if (col.id !== targetColumnId) return col;
          if (!sourceTaskId) {
            return { ...col, tasks: [...col.tasks, duplicatedTask] };
          }
          const sourceIndex = col.tasks.findIndex((t) => t.id === sourceTaskId);
          if (sourceIndex === -1) {
            return { ...col, tasks: [...col.tasks, duplicatedTask] };
          }
          const nextTasks = [...col.tasks];
          nextTasks.splice(sourceIndex + 1, 0, duplicatedTask);
          return {
            ...col,
            tasks: nextTasks.map((t, idx) => ({ ...t, order: idx })),
          };
        }),
      );
    },
    [setColumns],
  );

  const onReconcileTask = useCallback(
    (reconciledTask: Task) => {
      setColumns((prev) =>
        mapTaskInColumns(prev, reconciledTask.id, () => reconciledTask),
      );
    },
    [setColumns],
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
    onTaskUpdatedInDetails,
    onReconcileTask,
  });

  return {
    handleDuplicateTask,
    duplicatingTaskIds,
    handleTaskSaved,
    handleQuickCreateTask,
    handleDeleteTask,
    scheduleUndoDeleteTask,
    handleTaskMove,
    handleTaskDetailsUpdate,
    handleToggleComplete,
    handleHabitChange,
  };
}
