import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createFocusRecordAction } from "@/actions/focusActions";
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

export interface FocusTimerStoreState extends FocusTimerState {
  phase: FocusPhase;
  lastTickTimestamp: number | null;
  onSessionSavedCallback: (() => void) | null;

  // Preferências de som
  isSoundEnabled: boolean;
  timerSoundType: "zen" | "arcade";
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

      isSoundEnabled: true,
      timerSoundType: "zen",
      toggleSound: () => {
        const next = !get().isSoundEnabled;
        set({ isSoundEnabled: next });
        useSoundPreferencesStore.getState().setTimerSoundsEnabled(next);
      },
      setTimerSoundType: (type) => {
        set({ timerSoundType: type });
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
        const isBreak =
          state.phase === "SHORT_BREAK" || state.phase === "LONG_BREAK";
        const isCountdown =
          state.mode === "POMO" ||
          state.target?.type === "inventory" ||
          isBreak;

        if (isCountdown) {
          if (state.secondsRemaining <= 1) {
            // Ciclo concluído: computa o último segundo para fechar 100% da duração
            stopGlobalTicker();
            const finalElapsed = state.elapsedSeconds + 1;
            set({
              secondsRemaining: 0,
              elapsedSeconds: finalElapsed,
              lastTickTimestamp: now,
            });

            // 1. Pausa concluída (SHORT_BREAK ou LONG_BREAK)
            if (isBreak) {
              if (state.isSoundEnabled) {
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

                    if (get().isSoundEnabled) {
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
            secondsRemaining: Math.max(0, prev.secondsRemaining - 1),
            elapsedSeconds: prev.elapsedSeconds + 1,
            lastTickTimestamp: now,
          }));
        } else {
          // Cronômetro livre
          set((prev) => ({
            elapsedSeconds: prev.elapsedSeconds + 1,
            lastTickTimestamp: now,
          }));
        }
      },

      toggleTimer: () => {
        const state = get();
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
          if (state.isSoundEnabled) {
            const vol = useSoundPreferencesStore.getState().timerVolume ?? 0.8;
            soundEffects.playTimerStartSound(state.timerSoundType, vol);
          }
          const soundPrefs = useSoundPreferencesStore.getState();
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
          if (state.isSoundEnabled) {
            const vol = useSoundPreferencesStore.getState().timerVolume ?? 0.8;
            soundEffects.playTimerStartSound(state.timerSoundType, vol);
          }
          const soundPrefs = useSoundPreferencesStore.getState();
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
          startGlobalTicker(get().tick);
        } else {
          set({
            isPaused: true,
          });
          stopGlobalTicker();
        }
      },

      pauseTimer: () => {
        set({ isPaused: true });
        stopGlobalTicker();
      },

      resumeTimer: () => {
        set({ isPaused: false, lastTickTimestamp: Date.now() });
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
          const res = await createFocusRecordAction({
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
      },

      startFocusActivity: (activity: FocusActivity) => {
        stopGlobalTicker();
        const minutes = activity.targetTimeMinutes || DEFAULT_POMO_MINUTES;
        const mode = activity.recordType || "POMO";

        if (get().isSoundEnabled) {
          const vol = useSoundPreferencesStore.getState().timerVolume ?? 0.8;
          soundEffects.playTimerStartSound(get().timerSoundType, vol);
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

        if (get().isSoundEnabled) {
          const vol = useSoundPreferencesStore.getState().timerVolume ?? 0.8;
          soundEffects.playTimerStartSound(get().timerSoundType, vol);
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
      },

      transferTarget: (activity: FocusActivity) => {
        const minutes = activity.targetTimeMinutes || DEFAULT_POMO_MINUTES;
        set({
          target: {
            type: "activity",
            id: activity.id,
            name: activity.name,
            icon: activity.icon,
            targetMinutes: minutes,
          },
        });
        toast.success(
          `Vínculo alterado para "${activity.name}". O tempo continua rodando!`,
        );
      },
    }),
    {
      name: "habitparty-focus-timer",
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
        isSoundEnabled: state.isSoundEnabled,
        timerSoundType: state.timerSoundType,
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

        if (state.isActive && !state.isPaused) {
          if (state.lastTickTimestamp) {
            const elapsedDiff = Math.floor(
              (Date.now() - state.lastTickTimestamp) / 1000,
            );
            if (elapsedDiff > 0) {
              const isCountdown =
                state.mode === "POMO" ||
                state.target?.type === "inventory" ||
                state.phase === "SHORT_BREAK" ||
                state.phase === "LONG_BREAK";
              if (isCountdown) {
                if (state.secondsRemaining <= elapsedDiff) {
                  state.completeSession();
                  return;
                }
                state.secondsRemaining = Math.max(
                  0,
                  state.secondsRemaining - elapsedDiff,
                );
              }
              state.elapsedSeconds += elapsedDiff;
              state.lastTickTimestamp = Date.now();
            }
          }
          startGlobalTicker(state.tick);
        }
      },
    },
  ),
);
