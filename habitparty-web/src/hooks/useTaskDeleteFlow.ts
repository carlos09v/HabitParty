"use client";

import { useCallback, useRef, useState } from "react";
import { checkTaskHasHistory } from "@/actions/taskActions";
import type { Task } from "@/types/task";

export interface PendingTaskDelete {
  task: Task;
  columnId?: string;
}

interface UseTaskDeleteFlowOptions {
  onConfirmDelete: (
    task: Task,
    columnId?: string,
    deleteHistory?: boolean,
  ) => void | Promise<void>;
}

function shouldConfirmTaskDeleteLocally(task: Task): boolean {
  return Boolean(
    (task.checklist?.length ?? 0) > 0 ||
      task.isHardcoreModeEnabled ||
      task.completed ||
      task.hasClaimedReward ||
      task.lastCompletedAt ||
      (task.positiveCount ?? 0) > 0 ||
      (task.negativeCount ?? 0) > 0 ||
      (task.totalFocusMinutes ?? 0) > 0 ||
      (task.focusCyclesCount ?? 0) > 0 ||
      task.isPenaltyApplied ||
      (task.streak ?? 0) > 0,
  );
}

/**
 * Orquestra a verificação prévia antes de excluir uma tarefa:
 * - Exige confirmação imediata (sem RTT) quando campos locais da tarefa já indicam subtarefas, Modo Hardcore ou histórico vinculado.
 * - Caso contrário, consulta GET /tasks/{taskId}/has-history com estado de carregamento.
 * - Executa a exclusão diretamente se não houver histórico nem riscos locais.
 */
export function useTaskDeleteFlow({
  onConfirmDelete,
}: UseTaskDeleteFlowOptions) {
  const [taskToDelete, setTaskToDelete] = useState<PendingTaskDelete | null>(
    null,
  );
  const [deleteHistory, setDeleteHistory] = useState(false);
  const [checkingDeleteTaskIds, setCheckingDeleteTaskIds] = useState<
    Set<string>
  >(() => new Set());
  const checkingIdsRef = useRef<Set<string>>(new Set());

  const setTaskCheckingState = useCallback(
    (taskId: string, isChecking: boolean) => {
      if (isChecking) {
        checkingIdsRef.current.add(taskId);
      } else {
        checkingIdsRef.current.delete(taskId);
      }
      setCheckingDeleteTaskIds(new Set(checkingIdsRef.current));
    },
    [],
  );

  const requestDeleteTask = useCallback(
    async (task: Task, columnId?: string) => {
      if (checkingIdsRef.current.has(task.id)) return;

      if (task.id.startsWith("temp-")) {
        await onConfirmDelete(task, columnId, false);
        return;
      }

      if (shouldConfirmTaskDeleteLocally(task)) {
        setDeleteHistory(false);
        setTaskToDelete({ task, columnId });
        return;
      }

      setTaskCheckingState(task.id, true);
      try {
        const res = await checkTaskHasHistory(task.id);
        const hasHistory = !res.success || Boolean(res.data);

        if (hasHistory) {
          setDeleteHistory(false);
          setTaskToDelete({ task, columnId });
          return;
        }

        await onConfirmDelete(task, columnId, false);
      } finally {
        setTaskCheckingState(task.id, false);
      }
    },
    [onConfirmDelete, setTaskCheckingState],
  );

  const confirmDeleteTask = useCallback(async () => {
    if (!taskToDelete) return;
    const target = taskToDelete;
    const shouldDeleteHistory = deleteHistory;
    setTaskToDelete(null);
    await onConfirmDelete(target.task, target.columnId, shouldDeleteHistory);
  }, [deleteHistory, onConfirmDelete, taskToDelete]);

  const cancelDeleteTask = useCallback(() => {
    setTaskToDelete(null);
  }, []);

  return {
    taskToDelete,
    deleteHistory,
    setDeleteHistory,
    checkingDeleteTaskIds,
    requestDeleteTask,
    confirmDeleteTask,
    cancelDeleteTask,
  };
}
