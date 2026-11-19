import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_LONG_BREAK_MINUTES,
  DEFAULT_POMO_MINUTES,
  DEFAULT_SHORT_BREAK_MINUTES,
} from "@/constants/focus";
import { executeCompleteLinkedTask } from "@/store/focus/focusLinkedTaskAction";
import {
  executeCompleteSession,
  isFocusSessionCompleting,
} from "@/store/focus/focusSessionCompletion";
import {
  buildIdleTimerPatch,
  type FocusTimerStoreState,
} from "@/store/focus/focusTimerState";
import { executeFocusTick } from "@/store/focus/focusTimerTickAction";
import {
  startGlobalTicker,
  stopGlobalTicker,
} from "@/store/focus/focusTimerTicker";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import { useUIStore } from "@/store/uiStore";
import type { FocusActivity, FocusPhase, FocusRecordType } from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import {
  createOptimizedFocusPersistStorage,
  registerFocusTimerWindowListeners,
  updateDocumentTitle,
} from "@/utils/focusTimerBrowser";
import {
  setFocusTimerTranslators,
  tStoreMsg,
} from "@/utils/focusTimerMessages";
import { soundEffects } from "@/utils/soundEffects";

export type { FocusTimerStoreState };
export { setFocusTimerTranslators };

function playStartSounds(withAmbient = false) {
  const soundPrefs = useSoundPreferencesStore.getState();
  if (soundPrefs.timerSoundsEnabled) {
    const vol = soundPrefs.timerVolume ?? 0.8;
    soundEffects.playTimerStartSound(soundPrefs.timerSoundType, vol);
  }
  if (
    withAmbient &&
    soundPrefs.isAmbientPlaying &&
    soundPrefs.ambientSoundType !== "none"
  ) {
    soundEffects.startAmbientSound(
      soundPrefs.ambientSoundType,
      soundPrefs.ambientVolume,
    );
  }
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
      hasTriggeredOvertimeAlert: false,
      isSavingSession: false,
      isCompletingLinkedTask: false,
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

      tick: () => executeFocusTick(set, get),

      toggleTimer: () => {
        const state = get();
        if (isFocusSessionCompleting(state)) {
          return;
        }

        if (!state.isActive) {
          if (!state.target) {
            const isGamified =
              useUIStore.getState().experienceMode === "GAMIFIED";
            toast.info(
              tStoreMsg(
                isGamified
                  ? "selectTargetToStartToast"
                  : "selectTargetToStartToastProductivity",
              ),
            );
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
          playStartSounds(true);
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
          playStartSounds(true);
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
        set({ isActive: true, isPaused: false, lastTickTimestamp: Date.now() });
        updateDocumentTitle(get());
        startGlobalTicker(get().tick);
      },

      resetTimer: () => {
        if (isFocusSessionCompleting(get())) {
          return;
        }
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

      stopFromWidget: () => {
        if (isFocusSessionCompleting(get())) {
          return;
        }
        stopGlobalTicker();
        set((prev) => {
          if (prev.target?.type === "task") {
            return buildIdleTimerPatch(DEFAULT_POMO_MINUTES * 60, {
              mode: "POMO",
              target: null,
            });
          }
          if (prev.target?.type === "activity") {
            const duration =
              (prev.target.targetMinutes || DEFAULT_POMO_MINUTES) * 60;
            return buildIdleTimerPatch(duration, {
              target: {
                ...prev.target,
                taskId: undefined,
                taskName: undefined,
              },
            });
          }
          const duration =
            prev.totalDurationSeconds || DEFAULT_POMO_MINUTES * 60;
          return buildIdleTimerPatch(duration, { target: prev.target });
        });
        updateDocumentTitle(get());
      },

      skipBreak: () => {
        if (isFocusSessionCompleting(get())) {
          return;
        }
        stopGlobalTicker();
        const state = get();
        const workDuration =
          (state.target?.targetMinutes || DEFAULT_POMO_MINUTES) * 60;
        set(buildIdleTimerPatch(workDuration));
        updateDocumentTitle(get());
        toast.info(tStoreMsg("breakSkippedToast"));
      },

      startBreak: async () => {
        const state = get();
        if (isFocusSessionCompleting(state)) {
          return false;
        }
        if (state.phase === "SHORT_BREAK" || state.phase === "LONG_BREAK") {
          return true;
        }
        const success = await get().completeSession(undefined, {
          suppressCompleteSound: true,
        });
        if (!success) {
          return false;
        }

        const cycles = get().completedCycles;
        const isLongBreak = cycles > 0 && cycles % 4 === 0;
        const breakMinutes = isLongBreak
          ? DEFAULT_LONG_BREAK_MINUTES
          : DEFAULT_SHORT_BREAK_MINUTES;
        const breakSeconds = breakMinutes * 60;
        const nextPhase: FocusPhase = isLongBreak
          ? "LONG_BREAK"
          : "SHORT_BREAK";
        const breakLabel = isLongBreak
          ? tStoreMsg("longBreakLabel")
          : tStoreMsg("shortBreakLabel");

        if (useSoundPreferencesStore.getState().timerSoundsEnabled) {
          soundEffects.playBreakStartSound();
        }
        triggerCelebrationConfetti();
        toast.info(
          tStoreMsg("breakStartedToast", {
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
          hasTriggeredOvertimeAlert: false,
        });
        updateDocumentTitle(get());
        startGlobalTicker(get().tick);
        return true;
      },

      completeSession: (notes, options) =>
        executeCompleteSession(set, get, notes, options),

      changeMode: (newMode: FocusRecordType) => {
        if (isFocusSessionCompleting(get())) {
          return;
        }
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
        if (isFocusSessionCompleting(get())) {
          return;
        }
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
        playStartSounds();

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
        playStartSounds();

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

        playStartSounds();

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

      completeLinkedTask: (taskId: string, taskName?: string) =>
        executeCompleteLinkedTask(set, get, taskId, taskName),

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
        const state = get();
        const currentTarget = state.target;
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
        const hasRecordTypeChange =
          metadata.recordType !== undefined &&
          metadata.recordType !== state.mode &&
          currentTarget.type === "activity";
        const hasTaskNameChange =
          metadata.taskName !== undefined &&
          metadata.taskName !== currentTarget.taskName;

        if (
          !hasNameChange &&
          !hasIconChange &&
          !hasMinutesChange &&
          !hasRecordTypeChange &&
          !hasTaskNameChange
        ) {
          return;
        }

        const nextTargetMinutes =
          metadata.targetMinutes ?? currentTarget.targetMinutes;
        const isIdleAtStart = !state.isActive && state.elapsedSeconds === 0;
        const nextDurationSeconds =
          (nextTargetMinutes || DEFAULT_POMO_MINUTES) * 60;

        set({
          target: {
            ...currentTarget,
            name: metadata.name ?? currentTarget.name,
            icon: metadata.icon ?? currentTarget.icon,
            targetMinutes: nextTargetMinutes,
            taskId: metadata.taskId ?? currentTarget.taskId,
            taskName: metadata.taskName ?? currentTarget.taskName,
          },
          ...(isIdleAtStart && (hasMinutesChange || hasRecordTypeChange)
            ? {
                mode: metadata.recordType ?? state.mode,
                totalDurationSeconds: nextDurationSeconds,
                secondsRemaining: nextDurationSeconds,
              }
            : {}),
        });
        updateDocumentTitle(get());
      },
    }),
    {
      name: "habitparty-focus-timer",
      storage: createOptimizedFocusPersistStorage(),
      partialize: (state) => ({
        isActive: state.isActive,
        isPaused: state.isPaused,
        mode: state.mode,
        phase: state.phase,
        secondsRemaining: state.secondsRemaining,
        totalDurationSeconds: state.totalDurationSeconds,
        elapsedSeconds: state.elapsedSeconds,
        completedCycles: state.completedCycles,
        hasTriggeredOvertimeAlert: state.hasTriggeredOvertimeAlert,
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
