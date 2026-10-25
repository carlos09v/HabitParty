import type { StateStorage } from "zustand/middleware";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import type {
  FocusPhase,
  FocusRecordType,
  FocusTimerState,
} from "@/types/focus";
import { formatFocusTime } from "@/utils/focusFormatters";

/**
 * Dispara notificação nativa do navegador ao término de um ciclo ou pausa.
 */
export function sendBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  const isEnabled =
    useSoundPreferencesStore.getState().browserNotificationsEnabled;
  if (isEnabled && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
      });
    } catch {
      // Falha silenciosa caso o navegador restrinja
    }
  }
}

const DEFAULT_DOCUMENT_TITLE = "Foco & Pomodoro | HabitParty";
let baseDocumentTitle: string | null = null;

/**
 * Atualiza dinamicamente o document.title da aba com o cronômetro ativo.
 */
export function updateDocumentTitle(state: {
  isActive: boolean;
  isPaused: boolean;
  mode: FocusRecordType;
  phase: FocusPhase;
  secondsRemaining: number;
  elapsedSeconds: number;
  target: FocusTimerState["target"];
}) {
  if (typeof document === "undefined") return;

  if (!state.isActive) {
    if (baseDocumentTitle) {
      document.title = baseDocumentTitle;
      baseDocumentTitle = null;
    }
    return;
  }

  if (!baseDocumentTitle && !document.title.startsWith("(")) {
    baseDocumentTitle = document.title || DEFAULT_DOCUMENT_TITLE;
  }

  const isBreak = state.phase === "SHORT_BREAK" || state.phase === "LONG_BREAK";
  const isCountdown =
    state.mode === "POMO" || state.target?.type === "inventory" || isBreak;
  const displaySeconds = isCountdown
    ? state.secondsRemaining
    : state.elapsedSeconds;
  const timeStr = formatFocusTime(displaySeconds);
  const statusPrefix = state.isPaused
    ? "⏸️ Pausado"
    : isBreak
      ? "☕ Pausa"
      : "🔥 Foco";
  const targetLabel = state.target?.name ? ` • ${state.target.name}` : "";

  document.title = `(${timeStr}) ${statusPrefix}${targetLabel} | HabitParty`;
}

/**
 * Storage inteligente que evita serialização síncrona no localStorage a cada 1 segundo durante o tick,
 * gravando imediatamente em transições de estado (play, pause, reset, troca de modo/alvo)
 * e fazendo checkpoint periódico ou no ocultamento/fechamento da aba.
 */
let lastWriteTime = 0;
let lastStructuralKey = "";
let pendingStorageEntry: { name: string; value: string } | null = null;

export function flushPendingFocusStorage() {
  if (pendingStorageEntry && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        pendingStorageEntry.name,
        pendingStorageEntry.value,
      );
      pendingStorageEntry = null;
      lastWriteTime = Date.now();
    } catch {
      // Ignore quota errors
    }
  }
}

export const optimizedFocusStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return;
    pendingStorageEntry = { name, value };

    try {
      const parsed = JSON.parse(value)?.state;
      const structuralKey = parsed
        ? `${parsed.isActive}|${parsed.isPaused}|${parsed.mode}|${parsed.phase}|${parsed.target?.id ?? ""}|${parsed.totalDurationSeconds}|${parsed.completedCycles}`
        : "";

      const now = Date.now();
      const isStructuralChange = structuralKey !== lastStructuralKey;

      if (isStructuralChange || now - lastWriteTime >= 15000) {
        lastStructuralKey = structuralKey;
        lastWriteTime = now;
        pendingStorageEntry = null;
        window.localStorage.setItem(name, value);
      }
    } catch {
      window.localStorage.setItem(name, value);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return;
    pendingStorageEntry = null;
    window.localStorage.removeItem(name);
  },
};

let listenersRegistered = false;

/**
 * Registra listeners globais da janela para proteger a sessão de foco ativa
 * contra ocultamento/fechamento acidental da aba.
 */
export function registerFocusTimerWindowListeners(
  getStoreState: () => {
    isActive: boolean;
    isPaused: boolean;
    tick: () => void;
    pauseTimer: () => void;
  },
) {
  if (typeof window === "undefined" || listenersRegistered) return;
  listenersRegistered = true;

  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushPendingFocusStorage();
    } else if (document.visibilityState === "visible") {
      const state = getStoreState();
      if (state.isActive && !state.isPaused) {
        state.tick();
      }
    }
  });

  // Exibe confirmação nativa do navegador (estilo Gmail) ao tentar fechar/recarregar a aba com foco ativo
  window.addEventListener("beforeunload", (e) => {
    const state = getStoreState();
    if (state.isActive && !state.isPaused) {
      flushPendingFocusStorage();
      e.preventDefault();
      e.returnValue = "";
    }
  });

  // Caso o usuário confirme o fechamento da aba, pausa o cronômetro imediatamente para não acumular horas offline
  window.addEventListener("pagehide", () => {
    const state = getStoreState();
    if (state.isActive && !state.isPaused) {
      state.pauseTimer();
    }
    flushPendingFocusStorage();
  });
}
