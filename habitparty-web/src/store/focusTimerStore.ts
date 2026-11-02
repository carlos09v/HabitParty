import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
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
import {
  getBrowserDocumentLocale,
  optimizedFocusStorage,
  registerFocusTimerWindowListeners,
  sendBrowserNotification,
  updateDocumentTitle,
} from "@/utils/focusTimerBrowser";
import { awardUserRewards } from "@/utils/gamification";
import { soundEffects } from "@/utils/soundEffects";

type StoreTranslateFn = (
  key: string,
  values?: Record<string, string | number>,
) => string;

let customStoreT: StoreTranslateFn | null = null;
let customNotificationsT: StoreTranslateFn | null = null;

export function setFocusTimerTranslators(translators: {
  store?: StoreTranslateFn | null;
  notifications?: StoreTranslateFn | null;
}) {
  customStoreT = translators.store ?? null;
  customNotificationsT = translators.notifications ?? null;
}

const FALLBACK_STORE_MESSAGES: Record<
  "en" | "pt-BR",
  Record<string, string>
> = {
  en: {
    breakCompletedToast: "Break completed! Ready for the next focus cycle?",
    longBreakLabel: "long (15 min)",
    shortBreakLabel: "short (5 min)",
    cycleCompletedToast:
      "🍅 Cycle {cycles} completed! Starting {breakLabel} break. Relax a little!",
    selectTargetToStartToast:
      "Select an activity or backpack item to start focusing.",
    itemAlreadyCompletedToast:
      "🎉 This item has already completed its time. Click the Complete (Check) button to redeem it.",
    breakSkippedToast: "Break skipped. Ready to focus!",
    linkTargetBeforeSaveToast:
      "Link your focus to an activity or backpack item before saving.",
    minDurationWarningToast: "Sessions under 1 minute are not recorded.",
    couponTimeDepletedToast:
      "🎉 Coupon time depleted! Click the Complete (Check) button to redeem it.",
    couponTimeDeductedToast: "Coupon time deducted! (-{time})",
    sessionCompletedRewardsToast:
      "Focus session completed! (+{time} • +{xp} XP • +{coins} 🪙)",
    sessionCompletedLoggedToast: "Focus session completed! (+{time} logged)",
    saveSessionFailedToast: "Failed to save focus session.",
    saveSessionServerErrorToast: "Error saving focus session on the server.",
    couponAlreadyDepletedToast:
      "This coupon's time is already depleted! Click the Complete (Check) button to redeem it.",
    defaultItemName: "Focus Item",
    targetTransferredToast:
      'Target switched to "{name}". The timer keeps running!',
  },
  "pt-BR": {
    breakCompletedToast:
      "Pausa concluída! Pronto para o próximo ciclo de foco?",
    longBreakLabel: "longa (15 min)",
    shortBreakLabel: "curta (5 min)",
    cycleCompletedToast:
      "🍅 Ciclo {cycles} concluído! Iniciando pausa {breakLabel}. Relaxe um pouco!",
    selectTargetToStartToast:
      "Selecione uma atividade ou item da mochila para iniciar o foco.",
    itemAlreadyCompletedToast:
      "🎉 Este item já concluiu seu tempo. Clique no botão de Concluir (Check) para resgatá-lo.",
    breakSkippedToast: "Pausa pulada. Pronto para focar!",
    linkTargetBeforeSaveToast:
      "Vincule o foco a uma atividade ou item da mochila antes de salvar.",
    minDurationWarningToast:
      "Sessões com menos de 1 minuto não são registradas.",
    couponTimeDepletedToast:
      "🎉 Tempo do cupom esgotado! Clique no botão de Concluir (Check) para resgatá-lo.",
    couponTimeDeductedToast: "Tempo do cupom deduzido! (-{time})",
    sessionCompletedRewardsToast:
      "Sessão de foco concluída! (+{time} • +{xp} XP • +{coins} 🪙)",
    sessionCompletedLoggedToast:
      "Sessão de foco concluída! (+{time} registrados)",
    saveSessionFailedToast: "Falha ao salvar sessão de foco.",
    saveSessionServerErrorToast: "Erro ao salvar sessão de foco no servidor.",
    couponAlreadyDepletedToast:
      "O tempo deste cupom já está esgotado! Clique no botão de Concluir (Check) para resgatá-lo.",
    defaultItemName: "Item de Foco",
    targetTransferredToast:
      'Vínculo alterado para "{name}". O tempo continua rodando!',
  },
};

const FALLBACK_NOTIFICATION_MESSAGES: Record<
  "en" | "pt-BR",
  Record<string, string>
> = {
  en: {
    breakEndedTitle: "HabitParty - Break Completed!",
    breakEndedBody: "Ready for the next focus cycle?",
    cycleCompletedTitle: "HabitParty - Cycle Completed!",
    cycleCompletedBody:
      "🍅 Cycle {cycles} completed! Starting {breakLabel} break. Relax a little!",
  },
  "pt-BR": {
    breakEndedTitle: "HabitParty - Pausa Concluída!",
    breakEndedBody: "Pronto para o próximo ciclo de foco?",
    cycleCompletedTitle: "HabitParty - Ciclo Concluído!",
    cycleCompletedBody:
      "🍅 Ciclo {cycles} concluído! Iniciando pausa {breakLabel}. Relaxe um pouco!",
  },
};

function interpolateFallback(
  template: string,
  values?: Record<string, string | number>,
): string {
  if (!values) return template;
  return Object.entries(values).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

function tStoreMsg(
  key: string,
  values?: Record<string, string | number>,
): string {
  if (customStoreT) {
    try {
      return customStoreT(key, values);
    } catch {
      // Fallback below
    }
  }
  const dict = FALLBACK_STORE_MESSAGES[getBrowserDocumentLocale()];
  return interpolateFallback(dict[key] ?? key, values);
}

function tNotifMsg(
  key: string,
  values?: Record<string, string | number>,
): string {
  if (customNotificationsT) {
    try {
      return customNotificationsT(key, values);
    } catch {
      // Fallback below
    }
  }
  const dict = FALLBACK_NOTIFICATION_MESSAGES[getBrowserDocumentLocale()];
  return interpolateFallback(dict[key] ?? key, values);
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
 * Helper unificado para gerar o estado base de timer parado/resetado,
 * evitando repetição dos mesmos 8 campos em múltiplos métodos da store.
 */
function buildIdleTimerPatch(
  durationSeconds = DEFAULT_POMO_MINUTES * 60,
  overrides?: Partial<FocusTimerStoreState>,
): Partial<FocusTimerStoreState> {
  return {
    isActive: false,
    isPaused: false,
    phase: "WORK",
    secondsRemaining: durationSeconds,
    totalDurationSeconds: durationSeconds,
    elapsedSeconds: 0,
    startedAt: null,
    lastTickTimestamp: null,
    ...overrides,
  };
}

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
  syncTargetMetadata: (metadata: {
    id?: string;
    name?: string;
    icon?: string;
    targetMinutes?: number;
  }) => void;
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
              set(buildIdleTimerPatch(workDuration));
              updateDocumentTitle(get());
              toast.info(tStoreMsg("breakCompletedToast"));
              sendBrowserNotification(
                tNotifMsg("breakEndedTitle"),
                tNotifMsg("breakEndedBody"),
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
                      ? tStoreMsg("longBreakLabel")
                      : tStoreMsg("shortBreakLabel");
                    toast.success(
                      tStoreMsg("cycleCompletedToast", {
                        cycles,
                        breakLabel,
                      }),
                    );
                    sendBrowserNotification(
                      tNotifMsg("cycleCompletedTitle"),
                      tNotifMsg("cycleCompletedBody", {
                        cycles,
                        breakLabel,
                      }),
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
            toast.info(tStoreMsg("selectTargetToStartToast"));
            return;
          }
          if (
            state.target.type === "inventory" &&
            state.secondsRemaining <= 1
          ) {
            toast.info(tStoreMsg("itemAlreadyCompletedToast"));
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
            toast.info(tStoreMsg("itemAlreadyCompletedToast"));
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
          return buildIdleTimerPatch(duration, { target: prev.target });
        });
        updateDocumentTitle(get());
      },

      skipBreak: () => {
        stopGlobalTicker();
        const state = get();
        const workDuration =
          (state.target?.targetMinutes || DEFAULT_POMO_MINUTES) * 60;
        set(buildIdleTimerPatch(workDuration));
        updateDocumentTitle(get());
        toast.info(tStoreMsg("breakSkippedToast"));
      },

      completeSession: async (notes?: string) => {
        const state = get();
        if (state.phase === "SHORT_BREAK" || state.phase === "LONG_BREAK") {
          get().skipBreak();
          return true;
        }

        if (!state.target) {
          toast.warning(tStoreMsg("linkTargetBeforeSaveToast"));
          return false;
        }
        const elapsed = state.elapsedSeconds;
        if (elapsed < 60) {
          toast.warning(tStoreMsg("minDurationWarningToast"));
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
                toast.success(tStoreMsg("couponTimeDepletedToast"));
              } else {
                const m = Math.floor(exactSeconds / 60);
                const s = exactSeconds % 60;
                const timeStr =
                  m > 0 ? (s > 0 ? `${m}m ${s}s` : `${m}m`) : `${s}s`;
                toast.success(
                  tStoreMsg("couponTimeDeductedToast", { time: timeStr }),
                );
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
                    tStoreMsg("sessionCompletedRewardsToast", {
                      time: timeStr,
                      xp,
                      coins: Number(coins).toFixed(2),
                    }),
                  );
                } else {
                  toast.success(
                    tStoreMsg("sessionCompletedLoggedToast", {
                      time: timeStr,
                    }),
                  );
                }
              }
            }

            stopGlobalTicker();
            set((prev) =>
              buildIdleTimerPatch(
                prev.totalDurationSeconds || DEFAULT_POMO_MINUTES * 60,
                {
                  sessionNotes: "",
                  target: isInventory ? null : prev.target,
                  completedCycles: isCompletedPomo
                    ? prev.completedCycles + 1
                    : prev.completedCycles,
                },
              ),
            );
            updateDocumentTitle(get());

            // Notifica componentes inscritos (ex: router.refresh())
            state.onSessionSavedCallback?.();

            return true;
          }

          toast.error(res.error || tStoreMsg("saveSessionFailedToast"));
          return false;
        } catch {
          toast.error(tStoreMsg("saveSessionServerErrorToast"));
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
            ...buildIdleTimerPatch(defaultDuration * 60, { mode: newMode }),
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
            ...buildIdleTimerPatch(minutes * 60),
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
          ...buildIdleTimerPatch(minutes * 60, {
            isActive: true,
            mode,
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
          }),
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
          toast.info(tStoreMsg("couponAlreadyDepletedToast"));
          return;
        }

        const soundPrefs = useSoundPreferencesStore.getState();
        if (soundPrefs.timerSoundsEnabled) {
          const vol = soundPrefs.timerVolume ?? 0.8;
          soundEffects.playTimerStartSound(soundPrefs.timerSoundType, vol);
        }

        set({
          ...buildIdleTimerPatch(totalSecs, {
            isActive: true,
            mode: "POMO",
            completedCycles: 0,
            target: {
              type: "inventory",
              id: item.inventoryItemId || "",
              name: item.rewardName || tStoreMsg("defaultItemName"),
              icon: item.rewardIcon,
              remainingSeconds: totalSecs,
              targetMinutes: Math.ceil(totalSecs / 60),
              packageLevel: item.rewardPackageLevel,
            },
            startedAt: new Date().toISOString(),
            lastTickTimestamp: Date.now(),
          }),
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
              ...buildIdleTimerPatch(DEFAULT_POMO_MINUTES * 60, {
                mode: "POMO",
                target: null,
              }),
            };
          }

          const minutes = activity.targetTimeMinutes || DEFAULT_POMO_MINUTES;
          const mode = activity.recordType || "POMO";

          return {
            ...prev,
            ...buildIdleTimerPatch(minutes * 60, {
              mode,
              completedCycles: 0,
              target: {
                type: "activity",
                id: activity.id,
                name: activity.name,
                icon: activity.icon,
                targetMinutes: minutes,
              },
            }),
          };
        });
      },

      resetTarget: () => {
        stopGlobalTicker();
        set(
          buildIdleTimerPatch(DEFAULT_POMO_MINUTES * 60, {
            mode: "POMO",
            target: null,
          }),
        );
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
          tStoreMsg("targetTransferredToast", { name: activity.name }),
        );
      },

      syncTargetMetadata: (metadata) => {
        const currentTarget = get().target;
        if (
          !currentTarget ||
          !metadata.id ||
          currentTarget.id !== metadata.id
        ) {
          return;
        }

        const hasNameChange =
          metadata.name !== undefined && metadata.name !== currentTarget.name;
        const hasIconChange =
          metadata.icon !== undefined && metadata.icon !== currentTarget.icon;
        const hasMinutesChange =
          metadata.targetMinutes !== undefined &&
          metadata.targetMinutes !== currentTarget.targetMinutes;

        if (!hasNameChange && !hasIconChange && !hasMinutesChange) {
          return;
        }

        set({
          target: {
            ...currentTarget,
            name: metadata.name ?? currentTarget.name,
            icon: metadata.icon ?? currentTarget.icon,
            targetMinutes:
              metadata.targetMinutes ?? currentTarget.targetMinutes,
          },
        });
        updateDocumentTitle(get());
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

registerFocusTimerWindowListeners(() => useFocusTimerStore.getState());
