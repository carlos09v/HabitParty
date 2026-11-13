import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createFocusRecord } from "@/actions/focusActions";
import { changeTaskStatus } from "@/actions/taskActions";
import {
  DEFAULT_LONG_BREAK_MINUTES,
  DEFAULT_POMO_MINUTES,
  DEFAULT_SHORT_BREAK_MINUTES,
} from "@/constants/focus";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActivity,
  FocusPhase,
  FocusRecordType,
  FocusTimerState,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import { getTodayDateString, toLocalISOString } from "@/utils/date";
import { formatDurationMinSec } from "@/utils/focusFormatters";
import {
  optimizedFocusStorage,
  registerFocusTimerWindowListeners,
  sendBrowserNotification,
  updateDocumentTitle,
} from "@/utils/focusTimerBrowser";
import {
  setFocusTimerTranslators,
  tNotifMsg,
  tStoreMsg,
} from "@/utils/focusTimerMessages";
import { awardUserRewards } from "@/utils/gamification";
import { soundEffects } from "@/utils/soundEffects";

export { setFocusTimerTranslators };

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
  startFocusTask: (task: { id: string; title: string }) => void;
  selectActivityTarget: (activity: FocusActivity | null) => void;
  selectItemTarget: (item: InventoryItemResponseDTO | null) => void;
  selectTaskTarget: (task: { id: string; title: string } | null) => void;
  unlinkTaskFromTarget: () => void;
  completeLinkedTask: (taskId: string, taskName?: string) => Promise<boolean>;
  syncTargetMetadata: (metadata: {
    id?: string;
    name?: string;
    icon?: string;
    targetMinutes?: number;
    taskId?: string;
    taskName?: string;
  }) => void;
  resetTarget: () => void;
  transferTarget: (activity: FocusActivity) => void;
  /** Promove uma sessão de foco direto na tarefa para Atividade (Macro) + Tarefa (Micro), preservando o tempo. */
  linkActivityToTask: (activity: FocusActivity) => void;
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

        const resolvedActivityId =
          !isInventory && state.target?.type === "activity"
            ? state.target.id
            : undefined;
        const resolvedTaskId = !isInventory
          ? state.target?.taskId ||
            (state.target?.type === "task" ? state.target.id : undefined)
          : undefined;
        const resolvedTaskName = !isInventory
          ? state.target?.taskName ||
            (state.target?.type === "task" ? state.target.name : undefined)
          : undefined;

        try {
          const res = await createFocusRecord({
            focusActivityId: resolvedActivityId,
            inventoryItemId: isInventory ? state.target?.id : undefined,
            taskId: resolvedTaskId,
            recordType,
            completedPomos: isCompletedPomo ? 1 : 0,
            startTime,
            endTime,
            notes:
              (notes !== undefined ? notes : state.sessionNotes)?.trim() ||
              undefined,
          });

          if (res.success) {
            if (resolvedTaskId && typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("habitparty:task-focus-recorded", {
                  detail: {
                    taskId: resolvedTaskId,
                    durationMinutes: Math.max(1, Math.floor(exactSeconds / 60)),
                    cycles: isCompletedPomo ? 1 : 0,
                  },
                }),
              );
            }

            if (isInventory) {
              soundEffects.playFocusSessionCompleteSound();
              const isFinished =
                state.secondsRemaining <= 1 ||
                exactSeconds >= state.totalDurationSeconds;
              if (isFinished) {
                triggerCelebrationConfetti();
                toast.success(tStoreMsg("couponTimeDepletedToast"));
              } else {
                const timeStr = formatDurationMinSec(exactSeconds);
                toast.success(
                  tStoreMsg("couponTimeDeductedToast", { time: timeStr }),
                );
              }
            } else {
              const timeStr = formatDurationMinSec(exactSeconds);
              const recordData = res.data as
                | { xpEarned?: number; coinsEarned?: number }
                | undefined;
              const xp = recordData?.xpEarned ?? 0;
              const coins = recordData?.coinsEarned ?? 0;

              const rewardResult = awardUserRewards(xp, coins);

              const taskAction = resolvedTaskId
                ? {
                    label: tStoreMsg("completeLinkedTaskAction"),
                    onClick: () => {
                      void get().completeLinkedTask(
                        resolvedTaskId,
                        resolvedTaskName,
                      );
                    },
                  }
                : undefined;

              if (!rewardResult.didLevelUp) {
                soundEffects.playFocusSessionCompleteSound();
                if (xp > 0 || coins > 0) {
                  const isGamified =
                    useUIStore.getState().experienceMode === "GAMIFIED";
                  toast.success(
                    tStoreMsg(
                      isGamified
                        ? "sessionCompletedRewardsToast"
                        : "sessionCompletedRewardsToastProductivity",
                      {
                        time: timeStr,
                        xp,
                        coins: Number(coins).toFixed(2),
                      },
                    ),
                    taskAction
                      ? { action: taskAction, duration: 8000 }
                      : undefined,
                  );
                } else {
                  toast.success(
                    tStoreMsg("sessionCompletedLoggedToast", {
                      time: timeStr,
                    }),
                    taskAction
                      ? { action: taskAction, duration: 8000 }
                      : undefined,
                  );
                }
              } else if (taskAction) {
                toast.info(resolvedTaskName || "", {
                  action: taskAction,
                  duration: 8000,
                });
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

        set((prev) => ({
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
              // Preserva a tarefa apenas quando já existia um vínculo explícito Atividade + Tarefa
              taskId:
                prev.target?.type === "activity"
                  ? prev.target.taskId
                  : undefined,
              taskName:
                prev.target?.type === "activity"
                  ? prev.target.taskName
                  : undefined,
            },
            startedAt: new Date().toISOString(),
            lastTickTimestamp: Date.now(),
          }),
        }));
        updateDocumentTitle(get());
        startGlobalTicker(get().tick);
      },

      startFocusTask: (task: { id: string; title: string }) => {
        stopGlobalTicker();
        const prev = get();
        // Foco direto na tarefa: nunca herda atividade/cupom selecionados anteriormente.
        // O vínculo Macro (Atividade) + Micro (Tarefa) é sempre uma ação explícita do usuário.
        const minutes = DEFAULT_POMO_MINUTES;
        const mode: FocusRecordType =
          prev.target?.type === "inventory" ? "POMO" : prev.mode || "POMO";
        const soundPrefs = useSoundPreferencesStore.getState();

        if (soundPrefs.timerSoundsEnabled) {
          const vol = soundPrefs.timerVolume ?? 0.8;
          soundEffects.playTimerStartSound(soundPrefs.timerSoundType, vol);
        }

        const nextTarget = {
          type: "task" as const,
          id: task.id,
          name: task.title,
          icon: "timer",
          targetMinutes: minutes,
          taskId: task.id,
          taskName: task.title,
        };

        set({
          ...buildIdleTimerPatch(minutes * 60, {
            isActive: true,
            mode,
            completedCycles: 0,
            target: nextTarget,
            startedAt: new Date().toISOString(),
            lastTickTimestamp: Date.now(),
          }),
        });
        updateDocumentTitle(get());
        startGlobalTicker(get().tick);
        toast.success(tStoreMsg("taskFocusStartedToast", { name: task.title }));
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
                // Preserva a tarefa apenas quando já existia um vínculo explícito Atividade + Tarefa
                taskId:
                  prev.target?.type === "activity"
                    ? prev.target.taskId
                    : undefined,
                taskName:
                  prev.target?.type === "activity"
                    ? prev.target.taskName
                    : undefined,
              },
            }),
          };
        });
      },

      selectTaskTarget: (task: { id: string; title: string } | null) => {
        const current = get();
        // Tempo de cupom da mochila em andamento nunca pode ser convertido em foco de tarefa
        if (
          task &&
          current.target?.type === "inventory" &&
          (current.isActive || current.elapsedSeconds > 0)
        ) {
          toast.info(tStoreMsg("finishCouponBeforeTaskToast"));
          return;
        }
        set((prev) => {
          if (!task) {
            if (prev.target?.type === "activity") {
              return {
                ...prev,
                target: {
                  ...prev.target,
                  taskId: undefined,
                  taskName: undefined,
                },
              };
            }
            if (prev.isActive || prev.elapsedSeconds > 0) {
              return prev;
            }
            return {
              ...prev,
              ...buildIdleTimerPatch(DEFAULT_POMO_MINUTES * 60, {
                mode: "POMO",
                target: null,
              }),
            };
          }

          // Se já houver uma Atividade selecionada (Macro -> Micro), anexa a Tarefa sem perder a Atividade!
          if (prev.target?.type === "activity") {
            return {
              ...prev,
              target: {
                ...prev.target,
                taskId: task.id,
                taskName: task.title,
              },
            };
          }

          const minutes = prev.target?.targetMinutes || DEFAULT_POMO_MINUTES;
          if (prev.isActive || prev.elapsedSeconds > 0) {
            return {
              ...prev,
              target: {
                type: "task",
                id: task.id,
                name: task.title,
                icon: "timer",
                targetMinutes: minutes,
                taskId: task.id,
                taskName: task.title,
              },
            };
          }

          return {
            ...prev,
            ...buildIdleTimerPatch(minutes * 60, {
              mode: prev.mode || "POMO",
              completedCycles: 0,
              target: {
                type: "task",
                id: task.id,
                name: task.title,
                icon: "timer",
                targetMinutes: minutes,
                taskId: task.id,
                taskName: task.title,
              },
            }),
          };
        });
        if (task) {
          toast.success(tStoreMsg("taskLinkedToast", { name: task.title }));
        }
        updateDocumentTitle(get());
      },

      unlinkTaskFromTarget: () => {
        set((prev) => {
          if (!prev.target) return prev;
          if (prev.target.type === "activity") {
            return {
              ...prev,
              target: {
                ...prev.target,
                taskId: undefined,
                taskName: undefined,
              },
            };
          }
          if (prev.target.type === "task") {
            if (prev.isActive || prev.elapsedSeconds > 0) {
              return prev;
            }
            return {
              ...prev,
              ...buildIdleTimerPatch(DEFAULT_POMO_MINUTES * 60, {
                mode: "POMO",
                target: null,
              }),
            };
          }
          return prev;
        });
        updateDocumentTitle(get());
      },

      completeLinkedTask: async (taskId: string, taskName?: string) => {
        try {
          const res = await changeTaskStatus(taskId, "COMPLETED");
          if (res.success) {
            useUserStore
              .getState()
              .markStreakSecuredToday(getTodayDateString());
            triggerCelebrationConfetti();
            toast.success(
              tStoreMsg("linkedTaskCompletedToast", {
                name: taskName || "Tarefa",
              }),
            );
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("habitparty:task-completed-from-focus", {
                  detail: { taskId, updatedTask: res.data },
                }),
              );
              window.dispatchEvent(new CustomEvent("habitparty:tasks-changed"));
            }
            set((prev) => {
              if (!prev.target) return prev;
              const currentTaskId =
                prev.target.taskId ||
                (prev.target.type === "task" ? prev.target.id : undefined);
              if (currentTaskId !== taskId) return prev;
              if (prev.target.type === "activity") {
                return {
                  ...prev,
                  target: {
                    ...prev.target,
                    taskId: undefined,
                    taskName: undefined,
                  },
                };
              }
              return {
                ...prev,
                target: null,
              };
            });
            get().onSessionSavedCallback?.();
            return true;
          }
          toast.error(res.error || tStoreMsg("linkedTaskCompleteFailedToast"));
          return false;
        } catch {
          toast.error(tStoreMsg("linkedTaskCompleteFailedToast"));
          return false;
        }
      },

      selectItemTarget: (item: InventoryItemResponseDTO | null) => {
        set((prev) => {
          if (prev.isActive || prev.elapsedSeconds > 0) {
            return prev;
          }

          if (!item) {
            return {
              ...prev,
              ...buildIdleTimerPatch(DEFAULT_POMO_MINUTES * 60, {
                mode: "POMO",
                target: null,
              }),
            };
          }

          const totalSecs =
            item.remainingSeconds !== undefined &&
            item.remainingSeconds !== null
              ? item.remainingSeconds
              : DEFAULT_POMO_MINUTES * 60;

          return {
            ...prev,
            ...buildIdleTimerPatch(totalSecs, {
              mode: "POMO",
              completedCycles: 0,
              target: {
                type: "inventory",
                id: item.inventoryItemId || "",
                name: item.rewardName || tStoreMsg("defaultItemName"),
                icon: item.rewardIcon,
                remainingSeconds: totalSecs,
                targetMinutes: Math.max(1, Math.ceil(totalSecs / 60)),
                packageLevel: item.rewardPackageLevel,
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
            // Ao transferir o tempo de uma sessão de tarefa (ou Atividade + Tarefa),
            // a tarefa continua vinculada para não perder o esforço já contabilizado nela.
            taskId:
              prev.target?.type !== "inventory"
                ? prev.target?.taskId
                : undefined,
            taskName:
              prev.target?.type !== "inventory"
                ? prev.target?.taskName
                : undefined,
          },
        }));
        updateDocumentTitle(get());
        startGlobalTicker(get().tick);
        toast.success(
          tStoreMsg("targetTransferredToast", { name: activity.name }),
        );
      },

      linkActivityToTask: (activity: FocusActivity) => {
        const state = get();
        if (state.target?.type !== "task") return;

        const minutes = activity.targetTimeMinutes || DEFAULT_POMO_MINUTES;
        const taskTarget = state.target;
        const nextTarget = {
          type: "activity" as const,
          id: activity.id,
          name: activity.name,
          icon: activity.icon,
          targetMinutes: minutes,
          taskId: taskTarget.taskId || taskTarget.id,
          taskName: taskTarget.taskName || taskTarget.name,
        };

        const hasSessionInProgress = state.isActive || state.elapsedSeconds > 0;
        if (hasSessionInProgress) {
          // Sessão em andamento: apenas promove o alvo, mantendo o tempo intacto
          set({ target: nextTarget });
        } else {
          set(
            buildIdleTimerPatch(minutes * 60, {
              mode: activity.recordType || state.mode || "POMO",
              target: nextTarget,
            }),
          );
        }
        updateDocumentTitle(get());
        toast.success(
          tStoreMsg("activityLinkedToTaskToast", {
            activity: activity.name,
            task: nextTarget.taskName,
          }),
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
        const hasTaskNameChange =
          metadata.taskName !== undefined &&
          metadata.taskName !== currentTarget.taskName;

        if (
          !hasNameChange &&
          !hasIconChange &&
          !hasMinutesChange &&
          !hasTaskNameChange
        ) {
          return;
        }

        set({
          target: {
            ...currentTarget,
            name: metadata.name ?? currentTarget.name,
            icon: metadata.icon ?? currentTarget.icon,
            targetMinutes:
              metadata.targetMinutes ?? currentTarget.targetMinutes,
            taskId: metadata.taskId ?? currentTarget.taskId,
            taskName: metadata.taskName ?? currentTarget.taskName,
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
