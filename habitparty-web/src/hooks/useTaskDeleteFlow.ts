"use client";

import { useCallback, useState } from "react";
import { checkTaskHasHistory } from "@/actions/taskActions";
import { useInFlightSet } from "@/hooks/useInFlightSet";
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
  /** Chamado para tarefas simples sem histórico/checklist/hardcore (ex: Undo Toast de 5s). */
  onSimpleDelete?: (task: Task, columnId?: string) => void | Promise<void>;
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
  onSimpleDelete,
}: UseTaskDeleteFlowOptions) {
  const [taskToDelete, setTaskToDelete] = useState<PendingTaskDelete | null>(
    null,
  );
  const [deleteHistory, setDeleteHistory] = useState(false);
  const {
    activeIds: checkingDeleteTaskIds,
    has: isTaskChecking,
    setPending: setTaskCheckingState,
  } = useInFlightSet();

  const requestDeleteTask = useCallback(
    async (task: Task, columnId?: string) => {
      if (isTaskChecking(task.id)) return;

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

        if (onSimpleDelete) {
          await onSimpleDelete(task, columnId);
        } else {
          await onConfirmDelete(task, columnId, false);
        }
      } finally {
        setTaskCheckingState(task.id, false);
      }
    },
    [isTaskChecking, onConfirmDelete, onSimpleDelete, setTaskCheckingState],
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
