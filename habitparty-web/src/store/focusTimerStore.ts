import { toast } from "sonner";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import { createFocusRecord } from "@/actions/focusActions";
import {
  DEFAULT_LONG_BREAK_MINUTES,
  DEFAULT_POMO_MINUTES,
  DEFAULT_SHORT_BREAK_MINUTES,
} from "@/constants/focus";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import type {
  FocusActivity,
  FocusPhase,
  FocusRecordType,
  FocusTimerState,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import { toLocalISOString } from "@/utils/date";
import { formatFocusTime } from "@/utils/focusFormatters";
import { awardUserRewards } from "@/utils/gamification";
import { soundEffects } from "@/utils/soundEffects";

function sendBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  const isEnabled =
    useSoundPreferencesStore.getState().browserNotificationsEnabled;
  if (isEnabled && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
      });
    } catch (_e) {
      // Falha silenciosa caso o navegador restrinja
    }
  }
}

const DEFAULT_DOCUMENT_TITLE = "Foco & Pomodoro | HabitParty";
let baseDocumentTitle: string | null = null;

function updateDocumentTitle(state: {
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

let globalTimerInterval: NodeJS.Timeout | null = null;

function startGlobalTicker(tickFn: () => void) {
  if (typeof window === "undefined") return;
  if (globalTimerInterval) {
    clearInterval(globalTimerInterval);
  }
  globalTimerInterval = setInterval(() => {
    tickFn();
  }, 1000);
}

function stopGlobalTicker() {
  if (globalTimerInterval) {
    clearInterval(globalTimerInterval);
    globalTimerInterval = null;
  }
}

/**
 * Storage inteligente que evita serialização síncrona no localStorage a cada 1 segundo durante o tick,
 * gravando imediatamente em transições de estado (play, pause, reset, troca de modo/alvo)
 * e fazendo checkpoint periódico ou no ocultamento/fechamento da aba.
 */
let lastWriteTime = 0;
let lastStructuralKey = "";
let pendingStorageEntry: { name: string; value: string } | null = null;

function flushPendingStorage() {
  if (pendingStorageEntry && typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        pendingStorageEntry.name,
        pendingStorageEntry.value,
      );
      pendingStorageEntry = null;
      lastWriteTime = Date.now();
    } catch (_e) {
      // Ignore quota errors
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushPendingStorage();
    } else if (document.visibilityState === "visible") {
      const state = useFocusTimerStore.getState();
      if (state.isActive && !state.isPaused) {
        state.tick();
      }
    }
  });

  // Exibe confirmação nativa do navegador (estilo Gmail) ao tentar fechar/recarregar a aba com foco ativo
  window.addEventListener("beforeunload", (e) => {
    const state = useFocusTimerStore.getState();
    if (state.isActive && !state.isPaused) {
      flushPendingStorage();
      e.preventDefault();
      e.returnValue = "";
    }
  });

  // Caso o usuário confirme o fechamento da aba, pausa o cronômetro imediatamente para não acumular horas offline
  window.addEventListener("pagehide", () => {
    const state = useFocusTimerStore.getState();
    if (state.isActive && !state.isPaused) {
      state.pauseTimer();
    }
    flushPendingStorage();
  });
}

const optimizedFocusStorage: StateStorage = {
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
    } catch (_e) {
      window.localStorage.setItem(name, value);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return;
    pendingStorageEntry = null;
    window.localStorage.removeItem(name);
  },
};

export interface FocusTimerStoreState extends FocusTimerState {
  phase: FocusPhase;
  lastTickTimestamp: number | null;
  onSessionSavedCallback: (() => void) | null;

  // Preferências de som delegadas ao soundPreferencesStore (fonte única da verdade)
  toggleSound: () => void;
  setTimerSoundType: (type: "zen" | "arcade") => void;

  // Anotações da sessão
  sessionNotes: string;
  setSessionNotes: (notes: string) => void;

  // Ações de controle
  setOnSessionSavedCallback: (cb: (() => void) | null) => void;
  toggleTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipBreak: () => void;
  completeSession: (notes?: string) => Promise<boolean>;
  changeMode: (newMode: FocusRecordType) => void;
  changeDuration: (minutes: number) => void;
  startFocusActivity: (activity: FocusActivity) => void;
  startFocusItem: (item: InventoryItemResponseDTO) => void;
  selectActivityTarget: (activity: FocusActivity | null) => void;
  resetTarget: () => void;
  transferTarget: (activity: FocusActivity) => void;
  tick: () => void;
}

export const useFocusTimerStore = create<FocusTimerStoreState>()(
  persist(
    (set, get) => ({
      isActive: false,
      isPaused: false,
      mode: "POMO",
      phase: "WORK",
      secondsRemaining: DEFAULT_POMO_MINUTES * 60,
      totalDurationSeconds: DEFAULT_POMO_MINUTES * 60,
      elapsedSeconds: 0,
      completedCycles: 0,
      target: null,
      startedAt: null,
      lastTickTimestamp: null,
      onSessionSavedCallback: null,
      sessionNotes: "",
      setSessionNotes: (notes: string) => set({ sessionNotes: notes }),

      toggleSound: () => {
        useSoundPreferencesStore.getState().toggleTimerSounds();
      },
      setTimerSoundType: (type) => {
        useSoundPreferencesStore.getState().setTimerSoundType(type);
      },

      setOnSessionSavedCallback: (cb) => {
        set({ onSessionSavedCallback: cb });
      },

      tick: () => {
        const state = get();
        if (!state.isActive || state.isPaused) {
          stopGlobalTicker();
          return;
        }

        const now = Date.now();
        const elapsedMs = state.lastTickTimestamp
          ? now - state.lastTickTimestamp
          : 1000;

        // Evita avanço duplicado caso visibilitychange e setInterval disparem no mesmo segundo
        if (elapsedMs < 850) {
          return;
        }

        const delta = state.lastTickTimestamp
          ? Math.max(1, Math.round(elapsedMs / 1000))
          : 1;

        const isBreak =
          state.phase === "SHORT_BREAK" || state.phase === "LONG_BREAK";
        const isCountdown =
          state.mode === "POMO" ||
          state.target?.type === "inventory" ||
          isBreak;

        if (isCountdown) {
          if (state.secondsRemaining <= delta) {
            // Ciclo concluído: soma exatamente os segundos restantes para fechar 100% da duração
            stopGlobalTicker();
            const finalElapsed = state.elapsedSeconds + state.secondsRemaining;
            set({
              secondsRemaining: 0,
              elapsedSeconds: finalElapsed,
              lastTickTimestamp: null,
            });

            const soundPrefs = useSoundPreferencesStore.getState();

            // 1. Pausa concluída (SHORT_BREAK ou LONG_BREAK)
            if (isBreak) {
              if (soundPrefs.timerSoundsEnabled) {
                soundEffects.playBreakEndSound();
              }
              const workDuration =
                (state.target?.targetMinutes || DEFAULT_POMO_MINUTES) * 60;
              set({
                phase: "WORK",
                isActive: false,
                isPaused: false,
                secondsRemaining: workDuration,
                totalDurationSeconds: workDuration,
                elapsedSeconds: 0,
                startedAt: null,
                lastTickTimestamp: null,
              });
              updateDocumentTitle(get());
              toast.info(
                "Pausa concluída! Pronto para o próximo ciclo de foco?",
              );
              sendBrowserNotification(
                "HabitParty - Pausa Concluída!",
                "Pronto para o próximo ciclo de foco?",
              );
              return;
            }

            // 2. Foco de trabalho em Pomodoro
            if (state.mode === "POMO" && state.target?.type !== "inventory") {
              get()
                .completeSession()
                .then((success) => {
                  if (success) {
                    const cycles = get().completedCycles;
                    const isLongBreak = cycles > 0 && cycles % 4 === 0;
                    const breakMinutes = isLongBreak
                      ? DEFAULT_LONG_BREAK_MINUTES
                      : DEFAULT_SHORT_BREAK_MINUTES;
                    const breakSeconds = breakMinutes * 60;

                    if (
                      useSoundPreferencesStore.getState().timerSoundsEnabled
                    ) {
                      soundEffects.playBreakStartSound();
                    }
                    triggerCelebrationConfetti();

                    const nextPhase: FocusPhase = isLongBreak
                      ? "LONG_BREAK"
                      : "SHORT_BREAK";
                    const breakLabel = isLongBreak
                      ? "longa (15 min)"
                      : "curta (5 min)";
                    toast.success(
                      `🍅 Ciclo ${cycles} concluído! Iniciando pausa ${breakLabel}. Relaxe um pouco!`,
                    );
                    sendBrowserNotification(
                      "HabitParty - Ciclo Concluído!",
                      `🍅 Ciclo ${cycles} concluído! Iniciando pausa ${breakLabel}. Relaxe um pouco!`,
                    );

                    set({
                      phase: nextPhase,
                      isActive: true,
                      isPaused: false,
                      secondsRemaining: breakSeconds,
                      totalDurationSeconds: breakSeconds,
                      elapsedSeconds: 0,
                      startedAt: new Date().toISOString(),
                      lastTickTimestamp: Date.now(),
                    });
                    updateDocumentTitle(get());
                    startGlobalTicker(get().tick);
                  }
                });
              return;
            }

            // 3. Caso cupom de inventário ou outro countdown
            get().completeSession();
            return;
          }

          set((prev) => ({
            secondsRemaining: Math.max(0, prev.secondsRemaining - delta),
            elapsedSeconds: prev.elapsedSeconds + delta,
            lastTickTimestamp: now,
          }));
          updateDocumentTitle(get());
        } else {
          // Cronômetro livre (enquanto a aba estiver aberta)
          set((prev) => ({
            elapsedSeconds: prev.elapsedSeconds + delta,
            lastTickTimestamp: now,
          }));
          updateDocumentTitle(get());
        }
      },

      toggleTimer: () => {
        const state = get();
        const soundPrefs = useSoundPreferencesStore.getState();

        if (!state.isActive) {
          if (!state.target) {
            toast.info(
              "Selecione uma atividade ou item da mochila para iniciar o foco.",
            );
            return;
          }
          if (
            state.target.type === "inventory" &&
            state.secondsRemaining <= 1
          ) {
            toast.info(
              "🎉 Este item já concluiu seu tempo. Clique no botão de Concluir (Check) para resgatá-lo.",
            );
            return;
          }
          const nowStr = state.startedAt || new Date().toISOString();
          if (soundPrefs.timerSoundsEnabled) {
            const vol = soundPrefs.timerVolume ?? 0.8;
            soundEffects.playTimerStartSound(soundPrefs.timerSoundType, vol);
          }
          if (
            soundPrefs.isAmbientPlaying &&
            soundPrefs.ambientSoundType !== "none"
          ) {
            soundEffects.startAmbientSound(
              soundPrefs.ambientSoundType,
              soundPrefs.ambientVolume,
            );
          }
          set({
            isActive: true,
            isPaused: false,
            startedAt: nowStr,
            lastTickTimestamp: Date.now(),
          });
          updateDocumentTitle(get());
          startGlobalTicker(get().tick);
          return;
        }

        if (state.isPaused) {
          if (
            state.target?.type === "inventory" &&
            state.secondsRemaining <= 1
          ) {
            toast.info(
              "🎉 Este item já concluiu seu tempo. Clique no botão de Concluir (Check) para resgatá-lo.",
            );
            return;
          }
          if (soundPrefs.timerSoundsEnabled) {
            const vol = soundPrefs.timerVolume ?? 0.8;
            soundEffects.playTimerStartSound(soundPrefs.timerSoundType, vol);
          }
          if (
            soundPrefs.isAmbientPlaying &&
            soundPrefs.ambientSoundType !== "none"
          ) {
            soundEffects.startAmbientSound(
              soundPrefs.ambientSoundType,
              soundPrefs.ambientVolume,
            );
          }
          set({
            isPaused: false,
            lastTickTimestamp: Date.now(),
          });
          updateDocumentTitle(get());
          startGlobalTicker(get().tick);
        } else {
          set({
            isPaused: true,
            lastTickTimestamp: null,
          });
          stopGlobalTicker();
          updateDocumentTitle(get());
        }
      },

      pauseTimer: () => {
        set({ isPaused: true, lastTickTimestamp: null });
        stopGlobalTicker();
        updateDocumentTitle(get());
      },

      resumeTimer: () => {
        set({ isPaused: false, lastTickTimestamp: Date.now() });
        updateDocumentTitle(get());
        startGlobalTicker(get().tick);
      },

      resetTimer: () => {
        stopGlobalTicker();
        set((prev) => {
          const isBreak =
            prev.phase === "SHORT_BREAK" || prev.phase === "LONG_BREAK";
          const duration = isBreak
            ? (prev.target?.targetMinutes || DEFAULT_POMO_MINUTES) * 60
            : prev.totalDurationSeconds || DEFAULT_POMO_MINUTES * 60;
          return {
            isActive: false,
            isPaused: false,
            phase: "WORK",
            target: prev.target,
            secondsRemaining: duration,
            totalDurationSeconds: duration,
            elapsedSeconds: 0,
            startedAt: null,
            lastTickTimestamp: null,
          };
        });
        updateDocumentTitle(get());
      },

      skipBreak: () => {
        stopGlobalTicker();
        const state = get();
        const workDuration =
          (state.target?.targetMinutes || DEFAULT_POMO_MINUTES) * 60;
        set({
          phase: "WORK",
          isActive: false,
          isPaused: false,
          secondsRemaining: workDuration,
          totalDurationSeconds: workDuration,
          elapsedSeconds: 0,
          startedAt: null,
          lastTickTimestamp: null,
        });
        updateDocumentTitle(get());
        toast.info("Pausa pulada. Pronto para focar!");
      },

      completeSession: async (notes?: string) => {
        const state = get();
        if (state.phase === "SHORT_BREAK" || state.phase === "LONG_BREAK") {
          get().skipBreak();
          return true;
        }

        if (!state.target) {
          toast.warning(
            "Vincule o foco a uma atividade ou item da mochila antes de salvar.",
          );
          return false;
        }
        const elapsed = state.elapsedSeconds;
        if (elapsed < 60) {
          toast.warning("Sessões com menos de 1 minuto não são registradas.");
          return false;
        }

        const isInventory = state.target?.type === "inventory";
        const now = new Date();
        const exactSeconds = Math.max(1, elapsed);
        const endTime = toLocalISOString(now);
        const startTime = toLocalISOString(
          new Date(now.getTime() - exactSeconds * 1000),
        );

        const recordType: FocusRecordType = isInventory
          ? "STOPWATCH"
          : state.mode;
        const isCompletedPomo =
          !isInventory &&
          state.mode === "POMO" &&
          exactSeconds >= state.totalDurationSeconds;

        try {
          const res = await createFocusRecord({
            focusActivityId: !isInventory ? state.target?.id : undefined,
            inventoryItemId: isInventory ? state.target?.id : undefined,
            recordType,
            completedPomos: isCompletedPomo ? 1 : 0,
            startTime,
            endTime,
            notes:
              (notes !== undefined ? notes : state.sessionNotes)?.trim() ||
              undefined,
          });

          if (res.success) {
            if (isInventory) {
              soundEffects.playFocusSessionCompleteSound();
              const isFinished =
                state.secondsRemaining <= 1 ||
                exactSeconds >= state.totalDurationSeconds;
              if (isFinished) {
                triggerCelebrationConfetti();
                toast.success(
                  "🎉 Tempo do cupom esgotado! Clique no botão de Concluir (Check) para resgatá-lo.",
                );
              } else {
                const m = Math.floor(exactSeconds / 60);
                const s = exactSeconds % 60;
                const timeStr =
                  m > 0 ? (s > 0 ? `${m}m ${s}s` : `${m}m`) : `${s}s`;
                toast.success(`Tempo do cupom deduzido! (-${timeStr})`);
              }
            } else {
              const m = Math.floor(exactSeconds / 60);
              const s = exactSeconds % 60;
              const timeStr =
                m === 0 ? `${s}s` : s === 0 ? `${m}m` : `${m}m ${s}s`;
              const recordData = res.data as
                | { xpEarned?: number; coinsEarned?: number }
                | undefined;
              const xp = recordData?.xpEarned ?? 0;
              const coins = recordData?.coinsEarned ?? 0;

              const rewardResult = awardUserRewards(xp, coins);

              if (!rewardResult.didLevelUp) {
                soundEffects.playFocusSessionCompleteSound();
                if (xp > 0 || coins > 0) {
                  toast.success(
                    `Sessão de foco concluída! (+${timeStr} • +${xp} XP • +${Number(coins).toFixed(2)} 🪙)`,
                  );
                } else {
                  toast.success(
                    `Sessão de foco concluída! (+${timeStr} registrados)`,
                  );
                }
              }
            }

            stopGlobalTicker();
            set((prev) => ({
              isActive: false,
              isPaused: false,
              sessionNotes: "",
              phase: "WORK",
              target: isInventory ? null : prev.target,
              secondsRemaining:
                prev.totalDurationSeconds || DEFAULT_POMO_MINUTES * 60,
              totalDurationSeconds:
                prev.totalDurationSeconds || DEFAULT_POMO_MINUTES * 60,
              elapsedSeconds: 0,
              startedAt: null,
              lastTickTimestamp: null,
              completedCycles: isCompletedPomo
                ? prev.completedCycles + 1
                : prev.completedCycles,
            }));
            updateDocumentTitle(get());

            // Notifica componentes inscritos (ex: router.refresh())
            state.onSessionSavedCallback?.();

            return true;
          }

          toast.error(res.error || "Falha ao salvar sessão de foco.");
          return false;
        } catch {
          toast.error("Erro ao salvar sessão de foco no servidor.");
          return false;
        }
      },

      changeMode: (newMode: FocusRecordType) => {
        stopGlobalTicker();
        set((prev) => {
          if (prev.target?.type === "inventory") {
            return prev;
          }
          const defaultDuration =
            prev.target?.targetMinutes ||
            (prev.target?.remainingSeconds
              ? Math.ceil(prev.target.remainingSeconds / 60)
              : DEFAULT_POMO_MINUTES);
          return {
            ...prev,
            mode: newMode,
            phase: "WORK",
            isActive: false,
            isPaused: false,
            secondsRemaining: defaultDuration * 60,
            totalDurationSeconds: defaultDuration * 60,
            elapsedSeconds: 0,
            startedAt: null,
            lastTickTimestamp: null,
          };
        });
        updateDocumentTitle(get());
      },

      changeDuration: (minutes: number) => {
        set((prev) => {
          if (prev.target?.type === "inventory") {
            return prev;
          }
          return {
            ...prev,
            phase: "WORK",
            totalDurationSeconds: minutes * 60,
            secondsRemaining: minutes * 60,
            elapsedSeconds: 0,
            isActive: false,
            isPaused: false,
            startedAt: null,
            lastTickTimestamp: null,
          };
        });
        updateDocumentTitle(get());
      },

      startFocusActivity: (activity: FocusActivity) => {
        stopGlobalTicker();
        const minutes = activity.targetTimeMinutes || DEFAULT_POMO_MINUTES;
        const mode = activity.recordType || "POMO";
        const soundPrefs = useSoundPreferencesStore.getState();

        if (soundPrefs.timerSoundsEnabled) {
          const vol = soundPrefs.timerVolume ?? 0.8;
          soundEffects.playTimerStartSound(soundPrefs.timerSoundType, vol);
        }

        set({
          isActive: true,
          isPaused: false,
          mode,
          phase: "WORK",
          secondsRemaining: minutes * 60,
          totalDurationSeconds: minutes * 60,
          elapsedSeconds: 0,
          completedCycles: 0,
          target: {
            type: "activity",
            id: activity.id,
            name: activity.name,
            icon: activity.icon,
            targetMinutes: minutes,
          },
          startedAt: new Date().toISOString(),
          lastTickTimestamp: Date.now(),
        });
        updateDocumentTitle(get());
        startGlobalTicker(get().tick);
      },

      startFocusItem: (item: InventoryItemResponseDTO) => {
        stopGlobalTicker();
        const totalSecs =
          item.remainingSeconds !== undefined && item.remainingSeconds !== null
            ? item.remainingSeconds
            : DEFAULT_POMO_MINUTES * 60;

        if (totalSecs <= 1) {
          toast.info(
            "O tempo deste cupom já está esgotado! Clique no botão de Concluir (Check) para resgatá-lo.",
          );
          return;
        }

        const soundPrefs = useSoundPreferencesStore.getState();
        if (soundPrefs.timerSoundsEnabled) {
          const vol = soundPrefs.timerVolume ?? 0.8;
          soundEffects.playTimerStartSound(soundPrefs.timerSoundType, vol);
        }

        set({
          isActive: true,
          isPaused: false,
          mode: "POMO",
          phase: "WORK",
          secondsRemaining: totalSecs,
          totalDurationSeconds: totalSecs,
          elapsedSeconds: 0,
          completedCycles: 0,
          target: {
            type: "inventory",
            id: item.inventoryItemId || "",
            name: item.rewardName || "Item de Foco",
            icon: item.rewardIcon,
            remainingSeconds: totalSecs,
            targetMinutes: Math.ceil(totalSecs / 60),
            packageLevel: item.rewardPackageLevel,
          },
          startedAt: new Date().toISOString(),
          lastTickTimestamp: Date.now(),
        });
        updateDocumentTitle(get());
        startGlobalTicker(get().tick);
      },

      selectActivityTarget: (activity: FocusActivity | null) => {
        set((prev) => {
          if (prev.isActive || prev.elapsedSeconds > 0) {
            return prev;
          }

          if (!activity) {
            return {
              ...prev,
              isActive: false,
              isPaused: false,
              target: null,
              mode: "POMO",
              phase: "WORK",
              secondsRemaining: DEFAULT_POMO_MINUTES * 60,
              totalDurationSeconds: DEFAULT_POMO_MINUTES * 60,
              elapsedSeconds: 0,
              startedAt: null,
              lastTickTimestamp: null,
            };
          }

          const minutes = activity.targetTimeMinutes || DEFAULT_POMO_MINUTES;
          const mode = activity.recordType || "POMO";

          return {
            ...prev,
            isActive: false,
            isPaused: false,
            mode,
            phase: "WORK",
            secondsRemaining: minutes * 60,
            totalDurationSeconds: minutes * 60,
            elapsedSeconds: 0,
            completedCycles: 0,
            target: {
              type: "activity",
              id: activity.id,
              name: activity.name,
              icon: activity.icon,
              targetMinutes: minutes,
            },
            startedAt: null,
            lastTickTimestamp: null,
          };
        });
      },

      resetTarget: () => {
        stopGlobalTicker();
        set({
          isActive: false,
          isPaused: false,
          target: null,
          mode: "POMO",
          phase: "WORK",
          secondsRemaining: DEFAULT_POMO_MINUTES * 60,
          totalDurationSeconds: DEFAULT_POMO_MINUTES * 60,
          elapsedSeconds: 0,
          startedAt: null,
          lastTickTimestamp: null,
        });
        updateDocumentTitle(get());
      },

      transferTarget: (activity: FocusActivity) => {
        const minutes = activity.targetTimeMinutes || DEFAULT_POMO_MINUTES;
        const newMode = activity.recordType || "POMO";
        const newTotalSeconds = minutes * 60;

        set((prev) => ({
          isActive: true,
          isPaused: false,
          mode: newMode,
          phase: "WORK",
          totalDurationSeconds: newTotalSeconds,
          secondsRemaining:
            newMode === "POMO"
              ? Math.max(1, newTotalSeconds - prev.elapsedSeconds)
              : newTotalSeconds,
          lastTickTimestamp: Date.now(),
          target: {
            type: "activity",
            id: activity.id,
            name: activity.name,
            icon: activity.icon,
            targetMinutes: minutes,
          },
        }));
        updateDocumentTitle(get());
        startGlobalTicker(get().tick);
        toast.success(
          `Vínculo alterado para "${activity.name}". O tempo continua rodando!`,
        );
      },
    }),
    {
      name: "habitparty-focus-timer",
      storage: createJSONStorage(() => optimizedFocusStorage),
      partialize: (state) => ({
        isActive: state.isActive,
        isPaused: state.isPaused,
        mode: state.mode,
        phase: state.phase,
        secondsRemaining: state.secondsRemaining,
        totalDurationSeconds: state.totalDurationSeconds,
        elapsedSeconds: state.elapsedSeconds,
        completedCycles: state.completedCycles,
        // Nunca persiste alvo de mochila se não houver foco ativamente em execução
        target:
          state.target?.type === "inventory" && !state.isActive
            ? null
            : state.target,
        startedAt: state.startedAt,
        lastTickTimestamp: state.lastTickTimestamp,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // Se o alvo for item de mochila mas não estiver ativo ou com tempo concluído, limpa o alvo
        if (
          state.target?.type === "inventory" &&
          (!state.isActive || state.secondsRemaining <= 1)
        ) {
          state.target = null;
          state.isActive = false;
          state.isPaused = false;
          state.secondsRemaining = DEFAULT_POMO_MINUTES * 60;
          state.totalDurationSeconds = DEFAULT_POMO_MINUTES * 60;
          state.elapsedSeconds = 0;
          state.lastTickTimestamp = null;
          return;
        }

        // Se a sessão estava ativa quando a aba/navegador foi fechado, restaura em estado PAUSADO
        // preservando exatamente o tempo acumulado até o fechamento (sem somar horas offline).
        if (state.isActive) {
          state.isPaused = true;
          state.lastTickTimestamp = null;
          updateDocumentTitle(state);
        }
      },
    },
  ),
);
