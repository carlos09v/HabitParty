import type { PersistStorage, StorageValue } from "zustand/middleware";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import type {
  FocusPhase,
  FocusRecordType,
  FocusTimerState,
} from "@/types/focus";
import {
  formatFocusDisplayTime,
  isFocusOvertime,
} from "@/utils/focusFormatters";

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

export interface FocusBrowserTranslations {
  defaultDocumentTitle: string;
  titlePausedPrefix: string;
  titleBreakPrefix: string;
  titleFocusPrefix: string;
  titleOvertimePrefix: string;
}

const FALLBACK_BROWSER_TRANSLATIONS: Record<
  "en" | "pt-BR",
  FocusBrowserTranslations
> = {
  en: {
    defaultDocumentTitle: "Focus & Pomodoro | HabitParty",
    titlePausedPrefix: "⏸️ Paused",
    titleBreakPrefix: "☕ Break",
    titleFocusPrefix: "🔥 Focus",
    titleOvertimePrefix: "⏱️ Overtime",
  },
  "pt-BR": {
    defaultDocumentTitle: "Foco & Pomodoro | HabitParty",
    titlePausedPrefix: "⏸️ Pausado",
    titleBreakPrefix: "☕ Pausa",
    titleFocusPrefix: "🔥 Foco",
    titleOvertimePrefix: "⏱️ Excedente",
  },
};

let customBrowserTranslations: Partial<FocusBrowserTranslations> | null = null;

export function setFocusBrowserTranslations(
  translations: Partial<FocusBrowserTranslations> | null,
) {
  customBrowserTranslations = translations;
}

export function getBrowserDocumentLocale(): "en" | "pt-BR" {
  if (
    typeof document !== "undefined" &&
    document.documentElement.lang?.toLowerCase().startsWith("en")
  ) {
    return "en";
  }
  return "pt-BR";
}

function getActiveBrowserTranslations(): FocusBrowserTranslations {
  const fallback = FALLBACK_BROWSER_TRANSLATIONS[getBrowserDocumentLocale()];
  if (!customBrowserTranslations) return fallback;
  return {
    ...fallback,
    ...customBrowserTranslations,
  };
}

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
  totalDurationSeconds?: number;
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

  const i18n = getActiveBrowserTranslations();

  if (!baseDocumentTitle && !document.title.startsWith("(")) {
    baseDocumentTitle = document.title || i18n.defaultDocumentTitle;
  }

  const isBreak = state.phase === "SHORT_BREAK" || state.phase === "LONG_BREAK";
  const isOvertime = isFocusOvertime(state);
  const timeStr = formatFocusDisplayTime(state);
  const statusPrefix = state.isPaused
    ? i18n.titlePausedPrefix
    : isBreak
      ? i18n.titleBreakPrefix
      : isOvertime
        ? i18n.titleOvertimePrefix
        : i18n.titleFocusPrefix;
  const targetLabel = state.target?.name ? ` • ${state.target.name}` : "";

  document.title = `(${timeStr}) ${statusPrefix}${targetLabel} | HabitParty`;
}

/**
 * Storage inteligente que evita serialização síncrona no localStorage a cada 1 segundo durante o tick,
 * gravando imediatamente em transições de estado (play, pause, reset, troca de modo/alvo)
 * e fazendo checkpoint periódico ou no ocultamento/fechamento da aba.
 */
export interface FocusStructuralSnapshot {
  isActive?: boolean;
  isPaused?: boolean;
  mode?: FocusRecordType;
  phase?: FocusPhase;
  target?: { id?: string } | null;
  totalDurationSeconds?: number;
  completedCycles?: number;
}

let lastWriteTime = 0;
let lastStructuralKey = "";
let pendingStorageEntry: {
  name: string;
  value: StorageValue<FocusStructuralSnapshot>;
} | null = null;

function buildStructuralKey(state?: FocusStructuralSnapshot): string {
  if (!state) return "";
  return `${state.isActive}|${state.isPaused}|${state.mode}|${state.phase}|${state.target?.id ?? ""}|${state.totalDurationSeconds}|${state.completedCycles}`;
}

export function flushPendingFocusStorage() {
  if (pendingStorageEntry && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        pendingStorageEntry.name,
        JSON.stringify(pendingStorageEntry.value),
      );
      pendingStorageEntry = null;
      lastWriteTime = Date.now();
    } catch {
      // Ignore quota errors
    }
  }
}

/**
 * Storage tipado do Zustand (`PersistStorage`) que evita `JSON.stringify` + `JSON.parse` a cada 1s:
 * inspeciona `value.state` em memória, só serializa em transições estruturais, a cada 15s,
 * ou ao ocultar/fechar a aba via `flushPendingFocusStorage()`.
 */
export function createOptimizedFocusPersistStorage<
  T extends FocusStructuralSnapshot,
>(): PersistStorage<T> {
  return {
    getItem: (name: string): StorageValue<T> | null => {
      if (typeof window === "undefined") return null;
      try {
        const raw = window.localStorage.getItem(name);
        return raw ? (JSON.parse(raw) as StorageValue<T>) : null;
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: StorageValue<T>): void => {
      if (typeof window === "undefined") return;
      pendingStorageEntry = { name, value };

      try {
        const structuralKey = buildStructuralKey(value.state);
        const now = Date.now();
        const isStructuralChange = structuralKey !== lastStructuralKey;

        if (isStructuralChange || now - lastWriteTime >= 15000) {
          lastStructuralKey = structuralKey;
          lastWriteTime = now;
          pendingStorageEntry = null;
          window.localStorage.setItem(name, JSON.stringify(value));
        }
      } catch {
        try {
          window.localStorage.setItem(name, JSON.stringify(value));
        } catch {
          // Ignore quota errors
        }
      }
    },
    removeItem: (name: string): void => {
      if (typeof window === "undefined") return;
      pendingStorageEntry = null;
      lastStructuralKey = "";
      window.localStorage.removeItem(name);
    },
  };
}

export const optimizedFocusStorage =
  createOptimizedFocusPersistStorage<FocusStructuralSnapshot>();

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
