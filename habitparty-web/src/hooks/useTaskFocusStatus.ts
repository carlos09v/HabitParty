"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { resolveLinkedTask } from "@/utils/focusFormatters";

export type TaskFocusStatus = "none" | "running" | "paused";

interface FocusTaskSnapshot {
  taskId: string | null;
  status: TaskFocusStatus;
}

const listenersByTaskId = new Map<string, Set<() => void>>();
let unsubscribeStore: (() => void) | null = null;
let currentSnapshot: FocusTaskSnapshot = { taskId: null, status: "none" };

function resolveActiveWorkTaskId(
  state: ReturnType<typeof useFocusTimerStore.getState>,
): string | null {
  if (!state.isActive || state.phase !== "WORK") return null;
  return resolveLinkedTask(state.target).taskId ?? null;
}

function computeSnapshot(): FocusTaskSnapshot {
  const state = useFocusTimerStore.getState();
  const taskId = resolveActiveWorkTaskId(state);
  if (!taskId) {
    return { taskId: null, status: "none" };
  }
  return {
    taskId,
    status: state.isPaused ? "paused" : "running",
  };
}

function notifyTask(taskId: string | null) {
  if (!taskId) return;
  const listeners = listenersByTaskId.get(taskId);
  if (!listeners) return;
  for (const listener of listeners) {
    listener();
  }
}

function ensureStoreSubscription() {
  if (unsubscribeStore) return;
  currentSnapshot = computeSnapshot();
  unsubscribeStore = useFocusTimerStore.subscribe((state) => {
    const nextTaskId = resolveActiveWorkTaskId(state);
    const nextStatus: TaskFocusStatus = nextTaskId
      ? state.isPaused
        ? "paused"
        : "running"
      : "none";

    // Curto-circuito O(1): ticks de 1s (elapsedSeconds) não alteram taskId/status → zero re-renders.
    if (
      nextTaskId === currentSnapshot.taskId &&
      nextStatus === currentSnapshot.status
    ) {
      return;
    }

    const prevTaskId = currentSnapshot.taskId;
    currentSnapshot = { taskId: nextTaskId, status: nextStatus };

    if (prevTaskId && prevTaskId !== nextTaskId) {
      notifyTask(prevTaskId);
    }
    notifyTask(nextTaskId);
  });
}

function releaseStoreSubscriptionIfEmpty() {
  if (listenersByTaskId.size === 0 && unsubscribeStore) {
    unsubscribeStore();
    unsubscribeStore = null;
  }
}

function subscribeToTaskFocusStatus(
  taskId: string,
  listener: () => void,
): () => void {
  ensureStoreSubscription();
  let set = listenersByTaskId.get(taskId);
  if (!set) {
    set = new Set();
    listenersByTaskId.set(taskId, set);
  }
  set.add(listener);

  return () => {
    const existing = listenersByTaskId.get(taskId);
    if (existing) {
      existing.delete(listener);
      if (existing.size === 0) {
        listenersByTaskId.delete(taskId);
      }
    }
    releaseStoreSubscriptionIfEmpty();
  };
}

function getServerSnapshot(): TaskFocusStatus {
  return "none";
}

/**
 * Assinatura O(1) do status de foco de uma tarefa específica.
 * Mantém apenas 1 listener global em `useFocusTimerStore`, evitando 2N seletores
 * reavaliados a cada tick de 1 segundo do cronômetro.
 */
export function useTaskFocusStatus(taskId: string): TaskFocusStatus {
  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      subscribeToTaskFocusStatus(taskId, onStoreChange),
    [taskId],
  );

  const getSnapshot = useCallback((): TaskFocusStatus => {
    const snap = unsubscribeStore ? currentSnapshot : computeSnapshot();
    return snap.taskId === taskId ? snap.status : "none";
  }, [taskId]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
