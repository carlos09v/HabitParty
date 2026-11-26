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

export const FOCUS_TIMER_STORAGE_KEY = "habitparty-focus-timer";

export type StoreTranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

let registeredStoreTranslator: StoreTranslateFn | null = null;
let registeredNotificationsTranslator: StoreTranslateFn | null = null;

export function setFocusTimerTranslators(translators: {
  store?: StoreTranslateFn | null;
  notifications?: StoreTranslateFn | null;
}) {
  registeredStoreTranslator = translators.store ?? null;
  registeredNotificationsTranslator = translators.notifications ?? null;
}

export function tStoreMsg(
  key: string,
  values?: Record<string, string | number>,
): string {
  if (registeredStoreTranslator) {
    try {
      return registeredStoreTranslator(key, values);
    } catch {
      // Fallback seguro abaixo
    }
  }
  return key;
}

export function tNotifMsg(
  key: string,
  values?: Record<string, string | number>,
): string {
  if (registeredNotificationsTranslator) {
    try {
      return registeredNotificationsTranslator(key, values);
    } catch {
      // Fallback seguro abaixo
    }
  }
  return key;
}

/**
 * Dispara notificação nativa do navegador ao término de um ciclo ou pausa.
 * Suprime o alerta do SO quando a aba já está visível e em foco para evitar ruído redundante.
 */
export function sendBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (
    typeof document !== "undefined" &&
    document.visibilityState === "visible" &&
    document.hasFocus()
  ) {
    return;
  }
  const isEnabled =
    useSoundPreferencesStore.getState().browserNotificationsEnabled;
  if (isEnabled && Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body,
        icon: "/assets/favicon_io/android-chrome-192x192.png",
        tag: "habitparty-focus-timer",
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
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
 * Atualiza dinamicamente o document.title da aba com o cronômetro ativo,
 * acompanhando trocas de rota SPA quando o Next.js atualiza o título base.
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
      if (document.title.startsWith("(")) {
        document.title = baseDocumentTitle;
      }
      baseDocumentTitle = null;
    }
    return;
  }

  const i18n = getActiveBrowserTranslations();

  if (!document.title.startsWith("(") && document.title) {
    baseDocumentTitle = document.title;
  } else if (!baseDocumentTitle) {
    baseDocumentTitle = i18n.defaultDocumentTitle;
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
  target?: { id?: string; name?: string; taskId?: string } | null;
  totalDurationSeconds?: number;
  customWorkDurationMinutes?: number | null;
  completedCycles?: number;
  hasTriggeredOvertimeAlert?: boolean;
  sessionNotes?: string;
}

let lastWriteTime = 0;
let lastStructuralKey = "";
let lastPersistedNotes = "";
let notesFlushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingStorageEntry: {
  name: string;
  value: StorageValue<FocusStructuralSnapshot>;
} | null = null;

const NOTES_PERSIST_DEBOUNCE_MS = 600;

function clearScheduledNotesFlush() {
  if (notesFlushTimer !== null) {
    clearTimeout(notesFlushTimer);
    notesFlushTimer = null;
  }
}

function buildStructuralKey(state?: FocusStructuralSnapshot): string {
  if (!state) return "";
  return `${state.isActive}|${state.isPaused}|${state.mode}|${state.phase}|${state.target?.id ?? ""}|${state.target?.name ?? ""}|${state.target?.taskId ?? ""}|${state.totalDurationSeconds}|${state.customWorkDurationMinutes ?? ""}|${state.completedCycles}|${state.hasTriggeredOvertimeAlert ? 1 : 0}`;
}

export function flushPendingFocusStorage() {
  clearScheduledNotesFlush();
  if (pendingStorageEntry && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        pendingStorageEntry.name,
        JSON.stringify(pendingStorageEntry.value),
      );
      lastStructuralKey = buildStructuralKey(pendingStorageEntry.value.state);
      lastPersistedNotes = pendingStorageEntry.value.state?.sessionNotes ?? "";
      pendingStorageEntry = null;
      lastWriteTime = Date.now();
    } catch {
      // Ignore quota errors
    }
  }
}

/**
 * Storage tipado do Zustand (`PersistStorage`) que evita `JSON.stringify` + `JSON.parse` a cada 1s
 * ou a cada tecla digitada em `sessionNotes`: só serializa imediatamente em transições estruturais,
 * com debounce leve para anotações, a cada 15s em ticks, ou ao ocultar/fechar a aba.
 */
export function createOptimizedFocusPersistStorage<
  T extends FocusStructuralSnapshot,
>(): PersistStorage<T> {
  return {
    getItem: (name: string): StorageValue<T> | null => {
      if (typeof window === "undefined") return null;
      try {
        const raw = window.localStorage.getItem(name);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StorageValue<T>;
        lastStructuralKey = buildStructuralKey(parsed?.state);
        lastPersistedNotes = parsed?.state?.sessionNotes ?? "";
        return parsed;
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: StorageValue<T>): void => {
      if (typeof window === "undefined") return;
      pendingStorageEntry = { name, value };

      try {
        const structuralKey = buildStructuralKey(value.state);
        const nextNotes = value.state?.sessionNotes ?? "";
        const now = Date.now();
        const isStructuralChange = structuralKey !== lastStructuralKey;
        const isNotesChange = nextNotes !== lastPersistedNotes;

        if (isStructuralChange || now - lastWriteTime >= 15000) {
          clearScheduledNotesFlush();
          lastStructuralKey = structuralKey;
          lastPersistedNotes = nextNotes;
          lastWriteTime = now;
          pendingStorageEntry = null;
          window.localStorage.setItem(name, JSON.stringify(value));
        } else if (isNotesChange) {
          clearScheduledNotesFlush();
          notesFlushTimer = setTimeout(() => {
            notesFlushTimer = null;
            flushPendingFocusStorage();
          }, NOTES_PERSIST_DEBOUNCE_MS);
        }
      } catch {
        try {
          clearScheduledNotesFlush();
          window.localStorage.setItem(name, JSON.stringify(value));
        } catch {
          // Ignore quota errors
        }
      }
    },
    removeItem: (name: string): void => {
      if (typeof window === "undefined") return;
      clearScheduledNotesFlush();
      pendingStorageEntry = null;
      lastStructuralKey = "";
      lastPersistedNotes = "";
      window.localStorage.removeItem(name);
    },
  };
}

let listenersRegistered = false;

/**
 * Registra listeners globais da janela/documento para proteger a sessão de foco ativa
 * contra ocultamento/fechamento acidental da aba e manter múltiplas abas sincronizadas.
 */
export function registerFocusTimerWindowListeners(
  getStoreState: () => {
    isActive: boolean;
    isPaused: boolean;
    tick: () => void;
    pauseTimer: () => void;
  },
  onExternalStorageSync?: () => void,
) {
  if (typeof window === "undefined" || listenersRegistered) return;
  listenersRegistered = true;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushPendingFocusStorage();
    } else if (document.visibilityState === "visible") {
      const state = getStoreState();
      if (state.isActive && !state.isPaused) {
        state.tick();
      }
    }
  });

  // Sincronização multi-aba: evita duas abas tickando simultaneamente ou salvando o mesmo registro 2×
  window.addEventListener("storage", (event) => {
    if (event.key !== FOCUS_TIMER_STORAGE_KEY) return;
    clearScheduledNotesFlush();
    pendingStorageEntry = null;
    onExternalStorageSync?.();
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
