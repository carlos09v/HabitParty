"use client";

import { useSyncExternalStore } from "react";

let currentMinuteTick = 0;
const listeners = new Set<() => void>();
let timerId: ReturnType<typeof setTimeout> | null = null;
let hasVisibilityListener = false;

function notifyListeners() {
  currentMinuteTick += 1;
  for (const listener of listeners) {
    listener();
  }
}

function scheduleNextMinuteTick() {
  if (timerId !== null || typeof window === "undefined") return;
  // Dispara logo após a virada de minuto para atualizar estados "Em andamento" / "Atrasado"
  const msUntilNextMinute = 60_000 - (Date.now() % 60_000) + 50;
  timerId = setTimeout(() => {
    timerId = null;
    if (listeners.size === 0) return;
    notifyListeners();
    scheduleNextMinuteTick();
  }, msUntilNextMinute);
}

function handleVisibilityChange() {
  if (document.visibilityState === "visible" && listeners.size > 0) {
    notifyListeners();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    scheduleNextMinuteTick();
    if (!hasVisibilityListener) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      hasVisibilityListener = true;
    }
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
      if (hasVisibilityListener && typeof document !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
        hasVisibilityListener = false;
      }
    }
  };
}

function getSnapshot() {
  return currentMinuteTick;
}

function getServerSnapshot() {
  return 0;
}

const noopSubscribe = () => () => {};

/**
 * Sincroniza componentes de tarefa com um único ticker global por minuto
 * (e no retorno de foco da aba) sem criar múltiplos intervals por card.
 */
export function useMinuteTicker(enabled = true): number {
  return useSyncExternalStore(
    enabled ? subscribe : noopSubscribe,
    getSnapshot,
    getServerSnapshot,
  );
}
