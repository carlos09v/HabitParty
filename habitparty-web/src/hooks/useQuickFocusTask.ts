"use client";

import { useCallback, useState } from "react";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import type { Task } from "@/types/task";

/**
 * Coordinates Quick Focus Play/Pause actions for a task row or modal,
 * prompting via `pendingFocusTask` before interrupting an active unsaved
 * `WORK` session for a different focus target.
 */
export function useQuickFocusTask() {
  const [pendingFocusTask, setPendingFocusTask] = useState<Task | null>(null);
  const currentFocusTarget = useFocusTimerStore((s) => s.target);

  const clearPendingFocusTask = useCallback(() => {
    setPendingFocusTask(null);
  }, []);

  const handleStartFocusTask = useCallback((task: Task) => {
    const store = useFocusTimerStore.getState();
    if (store.target?.taskId === task.id) {
      store.toggleTimer();
      return;
    }

    const hasUnsavedWorkSession =
      Boolean(store.target) &&
      store.target?.taskId !== task.id &&
      store.phase === "WORK" &&
      store.elapsedSeconds > 0;

    if (hasUnsavedWorkSession) {
      setPendingFocusTask(task);
      return;
    }

    store.startFocusTask({ id: task.id, title: task.title });
  }, []);

  const handleSaveAndStartFocusTask = useCallback(async () => {
    if (!pendingFocusTask) return false;
    const saved = await useFocusTimerStore.getState().completeSession();
    if (saved) {
      useFocusTimerStore.getState().startFocusTask({
        id: pendingFocusTask.id,
        title: pendingFocusTask.title,
      });
      setPendingFocusTask(null);
    }
    return saved;
  }, [pendingFocusTask]);

  const handleDiscardAndStartFocusTask = useCallback(() => {
    if (!pendingFocusTask) return;
    useFocusTimerStore.getState().startFocusTask({
      id: pendingFocusTask.id,
      title: pendingFocusTask.title,
    });
    setPendingFocusTask(null);
  }, [pendingFocusTask]);

  const handleTransferFocusTask = useCallback(() => {
    if (!pendingFocusTask) return;
    useFocusTimerStore.getState().selectTaskTarget({
      id: pendingFocusTask.id,
      title: pendingFocusTask.title,
    });
    setPendingFocusTask(null);
  }, [pendingFocusTask]);

  return {
    pendingFocusTask,
    currentFocusTarget,
    clearPendingFocusTask,
    handleStartFocusTask,
    handleTransferFocusTask,
    handleSaveAndStartFocusTask,
    handleDiscardAndStartFocusTask,
  };
}
