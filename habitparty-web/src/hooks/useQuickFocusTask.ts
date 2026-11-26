"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import type { Task } from "@/types/task";
import { resolveLinkedTask } from "@/utils/focusFormatters";

type FocusTimerStoreState = ReturnType<typeof useFocusTimerStore.getState>;

export interface QuickFocusTargetAdapter<T> {
  isSameTarget: (store: FocusTimerStoreState, item: T) => boolean;
  startTarget: (store: FocusTimerStoreState, item: T) => void;
  transferTarget: (store: FocusTimerStoreState, item: T) => void;
}

/**
 * Shared state machine for Quick Focus Play/Pause actions across tasks and focus activities,
 * prompting via `pendingTarget` before interrupting an active unsaved `WORK` session.
 */
export function useQuickFocusTarget<T>(adapter: QuickFocusTargetAdapter<T>) {
  const adapterRef = useRef(adapter);
  useIsomorphicLayoutEffect(() => {
    adapterRef.current = adapter;
  }, [adapter]);

  const [pendingTarget, setPendingTarget] = useState<T | null>(null);
  const currentFocusTarget = useFocusTimerStore((s) =>
    pendingTarget ? s.target : null,
  );
  const hasUnsavedWorkSession = useFocusTimerStore((s) =>
    pendingTarget
      ? Boolean(s.target) && s.phase === "WORK" && s.elapsedSeconds > 0
      : false,
  );

  // Evita modal zumbi caso a sessão em andamento seja salva/resetada em outra aba ou pelo PiP
  useEffect(() => {
    if (pendingTarget && !hasUnsavedWorkSession) {
      setPendingTarget(null);
    }
  }, [pendingTarget, hasUnsavedWorkSession]);

  const clearPendingTarget = useCallback(() => {
    setPendingTarget(null);
  }, []);

  const handleStartTarget = useCallback((item: T) => {
    const store = useFocusTimerStore.getState();
    if (adapterRef.current.isSameTarget(store, item)) {
      store.toggleTimer();
      return;
    }

    const hasUnsaved =
      Boolean(store.target) &&
      store.phase === "WORK" &&
      store.elapsedSeconds > 0;

    if (hasUnsaved) {
      setPendingTarget(item);
      return;
    }

    adapterRef.current.startTarget(store, item);
  }, []);

  const handleSaveAndStartTarget = useCallback(async () => {
    if (!pendingTarget) return false;
    const saved = await useFocusTimerStore.getState().completeSession();
    if (saved) {
      adapterRef.current.startTarget(
        useFocusTimerStore.getState(),
        pendingTarget,
      );
      setPendingTarget(null);
    }
    return saved;
  }, [pendingTarget]);

  const handleDiscardAndStartTarget = useCallback(() => {
    if (!pendingTarget) return;
    adapterRef.current.startTarget(
      useFocusTimerStore.getState(),
      pendingTarget,
    );
    setPendingTarget(null);
  }, [pendingTarget]);

  const handleTransferTarget = useCallback(() => {
    if (!pendingTarget) return;
    adapterRef.current.transferTarget(
      useFocusTimerStore.getState(),
      pendingTarget,
    );
    setPendingTarget(null);
  }, [pendingTarget]);

  return useMemo(
    () => ({
      pendingTarget,
      currentFocusTarget,
      clearPendingTarget,
      handleStartTarget,
      handleTransferTarget,
      handleSaveAndStartTarget,
      handleDiscardAndStartTarget,
    }),
    [
      pendingTarget,
      currentFocusTarget,
      clearPendingTarget,
      handleStartTarget,
      handleTransferTarget,
      handleSaveAndStartTarget,
      handleDiscardAndStartTarget,
    ],
  );
}

const TASK_FOCUS_ADAPTER: QuickFocusTargetAdapter<Task> = {
  isSameTarget: (store, task) =>
    resolveLinkedTask(store.target).taskId === task.id,
  startTarget: (store, task) =>
    store.startFocusTask({ id: task.id, title: task.title }),
  transferTarget: (store, task) => {
    store.selectTaskTarget({ id: task.id, title: task.title });
    const nextStore = useFocusTimerStore.getState();
    if (nextStore.isPaused || !nextStore.isActive) {
      nextStore.resumeTimer();
    }
  },
};

/**
 * Coordinates Quick Focus Play/Pause actions for a task row or modal,
 * prompting via `pendingFocusTask` before interrupting an active unsaved
 * `WORK` session for a different focus target.
 */
export function useQuickFocusTask() {
  const {
    pendingTarget: pendingFocusTask,
    currentFocusTarget,
    clearPendingTarget: clearPendingFocusTask,
    handleStartTarget: handleStartFocusTask,
    handleTransferTarget: handleTransferFocusTask,
    handleSaveAndStartTarget: handleSaveAndStartFocusTask,
    handleDiscardAndStartTarget: handleDiscardAndStartFocusTask,
  } = useQuickFocusTarget(TASK_FOCUS_ADAPTER);

  return useMemo(
    () => ({
      pendingFocusTask,
      currentFocusTarget,
      clearPendingFocusTask,
      handleStartFocusTask,
      handleTransferFocusTask,
      handleSaveAndStartFocusTask,
      handleDiscardAndStartFocusTask,
    }),
    [
      pendingFocusTask,
      currentFocusTarget,
      clearPendingFocusTask,
      handleStartFocusTask,
      handleTransferFocusTask,
      handleSaveAndStartFocusTask,
      handleDiscardAndStartFocusTask,
    ],
  );
}
