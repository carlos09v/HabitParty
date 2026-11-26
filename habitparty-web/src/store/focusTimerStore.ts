import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_POMO_MINUTES } from "@/constants/focusRules";
import {
  pauseAmbientIfSynced,
  playFocusStartSounds,
} from "@/store/focus/focusAmbientSync";
import { executeCompleteLinkedTask } from "@/store/focus/focusLinkedTaskAction";
import {
  executeCompleteSession,
  isFocusSessionCompleting,
} from "@/store/focus/focusSessionCompletion";
import {
  buildIdleTimerPatch,
  type FocusTimerStoreState,
  resolveWorkDurationSeconds,
} from "@/store/focus/focusTimerState";
import { executeFocusTick } from "@/store/focus/focusTimerTickAction";
import {
  startGlobalTicker,
  stopGlobalTicker,
} from "@/store/focus/focusTimerTicker";
import { useFocusPreferencesStore } from "@/store/focusPreferencesStore";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import { useUIStore } from "@/store/uiStore";
import type {
  FocusActiveTarget,
  FocusActivity,
  FocusPhase,
  FocusRecordType,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import {
  resolveFocusBreakPlan,
  resolveLinkedTask,
} from "@/utils/focusFormatters";
import {
  createOptimizedFocusPersistStorage,
  FOCUS_TIMER_STORAGE_KEY,
  registerFocusTimerWindowListeners,
  setFocusTimerTranslators,
  tStoreMsg,
  updateDocumentTitle,
} from "@/utils/focusTimerBrowser";
import { soundEffects } from "@/utils/soundEffects";

export type { FocusTimerStoreState };
export { setFocusTimerTranslators };

const VALID_MODES = new Set<FocusRecordType>(["POMO", "STOPWATCH"]);
const VALID_PHASES = new Set<FocusPhase>(["WORK", "SHORT_BREAK", "LONG_BREAK"]);
const VALID_TARGET_TYPES = new Set<FocusActiveTarget["type"]>([
  "activity",
  "inventory",
  "task",
]);

function sanitizeNonNegativeInt(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return fallback;
  }
  return Math.floor(value);
}

function sanitizePersistedTarget(value: unknown): FocusActiveTarget | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (
    typeof raw.type !== "string" ||
    !VALID_TARGET_TYPES.has(raw.type as FocusActiveTarget["type"]) ||
    typeof raw.id !== "string" ||
    typeof raw.name !== "string"
  ) {
    return null;
  }
  return {
    type: raw.type as FocusActiveTarget["type"],
    id: raw.id,
    name: raw.name,
    icon: typeof raw.icon === "string" ? raw.icon : undefined,
    targetMinutes:
      typeof raw.targetMinutes === "number" &&
      Number.isFinite(raw.targetMinutes) &&
      raw.targetMinutes > 0
        ? Math.floor(raw.targetMinutes)
        : undefined,
    remainingSeconds:
      typeof raw.remainingSeconds === "number" &&
      Number.isFinite(raw.remainingSeconds) &&
      raw.remainingSeconds >= 0
        ? Math.floor(raw.remainingSeconds)
        : undefined,
    packageLevel:
      typeof raw.packageLevel === "string" ? raw.packageLevel : undefined,
    taskId: typeof raw.taskId === "string" ? raw.taskId : undefined,
    taskName: typeof raw.taskName === "string" ? raw.taskName : undefined,
  };
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
      customWorkDurationMinutes: null,
      isSavingSession: false,
      isCompletingLinkedTask: false,
      target: null,
      lastTickTimestamp: null,
      sessionNotes: "",
      setSessionNotes: (notes: string) => set({ sessionNotes: notes }),

      tick: () => executeFocusTick(set, get),

      toggleTimer: () => {
        const state = get();
        if (isFocusSessionCompleting(state)) {
          return;
        }
        if (state.isActive && !state.isPaused) {
          get().pauseTimer();
          return;
        }
        if (!state.isActive && !state.target) {
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
        get().resumeTimer();
      },

      pauseTimer: () => {
        const state = get();
        if (
          !state.isActive ||
          state.isPaused ||
          isFocusSessionCompleting(state)
        ) {
          return;
        }
        set({ isPaused: true, lastTickTimestamp: null });
        stopGlobalTicker();
        pauseAmbientIfSynced();
        updateDocumentTitle(get());
      },

      resumeTimer: () => {
        const state = get();
        if (isFocusSessionCompleting(state) || !state.target) {
          return;
        }
        if (state.target.type === "inventory" && state.secondsRemaining <= 1) {
          toast.info(tStoreMsg("itemAlreadyCompletedToast"));
          return;
        }
        const isBreakPhase =
          state.phase === "SHORT_BREAK" || state.phase === "LONG_BREAK";
        if (!isBreakPhase) {
          playFocusStartSounds(true);
        }
        set({
          isActive: true,
          isPaused: false,
          lastTickTimestamp: Date.now(),
        });
        updateDocumentTitle(get());
        startGlobalTicker(get().tick);
      },

      resetTimer: () => {
        if (isFocusSessionCompleting(get())) {
          return;
        }
        stopGlobalTicker();
        pauseAmbientIfSynced();
        set((prev) => {
          const isBreak =
            prev.phase === "SHORT_BREAK" || prev.phase === "LONG_BREAK";
          const duration = isBreak
            ? resolveWorkDurationSeconds(prev)
            : prev.totalDurationSeconds || resolveWorkDurationSeconds(prev);
          return buildIdleTimerPatch(duration, { target: prev.target });
        });
        updateDocumentTitle(get());
      },

      stopFromWidget: () => {
        if (isFocusSessionCompleting(get())) {
          return;
        }
        stopGlobalTicker();
        pauseAmbientIfSynced();
        set((prev) => {
          if (prev.target?.type === "task") {
            return buildIdleTimerPatch(DEFAULT_POMO_MINUTES * 60, {
              mode: "POMO",
              target: null,
              customWorkDurationMinutes: null,
            });
          }
          if (prev.target?.type === "activity") {
            const duration = resolveWorkDurationSeconds(prev);
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
        pauseAmbientIfSynced();
        const state = get();
        const workDuration = resolveWorkDurationSeconds(state);
        set(buildIdleTimerPatch(workDuration));
        updateDocumentTitle(get());
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
        const focusPrefs = useFocusPreferencesStore.getState();
        const { minutes: breakMinutes, phase: nextPhase } =
          resolveFocusBreakPlan(cycles, focusPrefs);
        const breakSeconds = breakMinutes * 60;

        if (useSoundPreferencesStore.getState().timerSoundsEnabled) {
          soundEffects.playBreakStartSound();
        }

        set({
          phase: nextPhase,
          isActive: true,
          isPaused: false,
          secondsRemaining: breakSeconds,
          totalDurationSeconds: breakSeconds,
          elapsedSeconds: 0,
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
        const current = get();
        if (
          isFocusSessionCompleting(current) ||
          current.target?.type === "inventory"
        ) {
          return;
        }
        stopGlobalTicker();
        pauseAmbientIfSynced();
        set((prev) => {
          if (prev.target?.type === "inventory") {
            return prev;
          }
          const workDurationSeconds = resolveWorkDurationSeconds(prev);
          return {
            ...prev,
            ...buildIdleTimerPatch(workDurationSeconds, { mode: newMode }),
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
            ...buildIdleTimerPatch(minutes * 60, {
              sessionNotes: prev.sessionNotes,
              customWorkDurationMinutes: minutes,
            }),
          };
        });
        updateDocumentTitle(get());
      },

      startFocusActivity: (activity: FocusActivity) => {
        if (isFocusSessionCompleting(get())) {
          return;
        }
        stopGlobalTicker();
        const minutes = activity.targetTimeMinutes || DEFAULT_POMO_MINUTES;
        const mode = activity.recordType || "POMO";
        playFocusStartSounds(true);

        set((prev) => ({
          ...buildIdleTimerPatch(minutes * 60, {
            isActive: true,
            mode,
            completedCycles: 0,
            customWorkDurationMinutes: null,
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
            lastTickTimestamp: Date.now(),
          }),
        }));
        updateDocumentTitle(get());
        startGlobalTicker(get().tick);
      },

      startFocusTask: (task: { id: string; title: string }) => {
        if (isFocusSessionCompleting(get())) {
          return;
        }
        stopGlobalTicker();
        const prev = get();
        // Foco direto na tarefa: nunca herda atividade/cupom selecionados anteriormente.
        // O vínculo Macro (Atividade) + Micro (Tarefa) é sempre uma ação explícita do usuário.
        const minutes = DEFAULT_POMO_MINUTES;
        const mode: FocusRecordType =
          prev.target?.type === "inventory" ? "POMO" : prev.mode || "POMO";
        playFocusStartSounds(true);

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
            customWorkDurationMinutes: null,
            target: nextTarget,
            lastTickTimestamp: Date.now(),
          }),
        });
        updateDocumentTitle(get());
        startGlobalTicker(get().tick);
      },

      startFocusItem: (item: InventoryItemResponseDTO) => {
        if (isFocusSessionCompleting(get())) {
          return;
        }
        const totalSecs =
          item.remainingSeconds !== undefined && item.remainingSeconds !== null
            ? item.remainingSeconds
            : DEFAULT_POMO_MINUTES * 60;

        if (totalSecs <= 1) {
          toast.info(tStoreMsg("couponAlreadyDepletedToast"));
          return;
        }

        stopGlobalTicker();
        playFocusStartSounds(true);

        set({
          ...buildIdleTimerPatch(totalSecs, {
            isActive: true,
            mode: "POMO",
            completedCycles: 0,
            customWorkDurationMinutes: null,
            target: {
              type: "inventory",
              id: item.inventoryItemId || "",
              name: item.rewardName || tStoreMsg("defaultItemName"),
              icon: item.rewardIcon,
              remainingSeconds: totalSecs,
              targetMinutes: Math.ceil(totalSecs / 60),
              packageLevel: item.rewardPackageLevel,
            },
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
                customWorkDurationMinutes: null,
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
              customWorkDurationMinutes: null,
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

      handleExternalTaskRemovedOrCompleted: (taskId: string) => {
        if (!taskId) return;
        let shouldResetDirectTaskSession = false;
        set((prev) => {
          if (!prev.target) return prev;
          const { taskId: currentTaskId } = resolveLinkedTask(prev.target);
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

          if (prev.target.type === "task") {
            shouldResetDirectTaskSession = true;
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
        if (shouldResetDirectTaskSession) {
          stopGlobalTicker();
          pauseAmbientIfSynced();
        }
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
                customWorkDurationMinutes: null,
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
              customWorkDurationMinutes: null,
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
        if (isFocusSessionCompleting(get())) {
          return;
        }
        stopGlobalTicker();
        pauseAmbientIfSynced();
        set(
          buildIdleTimerPatch(DEFAULT_POMO_MINUTES * 60, {
            mode: "POMO",
            target: null,
            completedCycles: 0,
            customWorkDurationMinutes: null,
          }),
        );
        updateDocumentTitle(get());
      },

      transferTarget: (activity: FocusActivity) => {
        const currentState = get();
        if (isFocusSessionCompleting(currentState)) {
          return;
        }
        // Nunca converte tempo de pausa ou de cupom da mochila em tempo produtivo de atividade
        if (
          currentState.phase !== "WORK" ||
          currentState.target?.type === "inventory"
        ) {
          get().startFocusActivity(activity);
          return;
        }
        const shouldPlayStartSounds =
          !currentState.isActive || currentState.isPaused;
        const minutes = activity.targetTimeMinutes || DEFAULT_POMO_MINUTES;
        const newMode = activity.recordType || "POMO";
        const newTotalSeconds = minutes * 60;

        if (shouldPlayStartSounds) {
          playFocusStartSounds(true);
        }

        set((prev) => {
          const nextSecondsRemaining =
            newMode === "POMO"
              ? Math.max(0, newTotalSeconds - prev.elapsedSeconds)
              : newTotalSeconds;
          return {
            isActive: true,
            isPaused: false,
            mode: newMode,
            phase: "WORK",
            totalDurationSeconds: newTotalSeconds,
            secondsRemaining: nextSecondsRemaining,
            customWorkDurationMinutes: null,
            hasTriggeredOvertimeAlert:
              newMode === "POMO" && nextSecondsRemaining === 0,
            lastTickTimestamp: Date.now(),
            target: {
              type: "activity",
              id: activity.id,
              name: activity.name,
              icon: activity.icon,
              targetMinutes: minutes,
              // Ao transferir o tempo de uma sessão de tarefa (ou Atividade + Tarefa),
              // a tarefa continua vinculada para não perder o esforço já contabilizado nela.
              taskId: prev.target?.taskId,
              taskName: prev.target?.taskName,
            },
          };
        });
        updateDocumentTitle(get());
        startGlobalTicker(get().tick);
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
        const hasRemainingSecondsChange =
          currentTarget.type === "inventory" &&
          metadata.remainingSeconds !== undefined &&
          metadata.remainingSeconds !== currentTarget.remainingSeconds;
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
          !hasRemainingSecondsChange &&
          !hasMinutesChange &&
          !hasRecordTypeChange &&
          !hasTaskNameChange
        ) {
          return;
        }

        const nextRemainingSeconds = hasRemainingSecondsChange
          ? metadata.remainingSeconds
          : currentTarget.remainingSeconds;
        const nextTargetMinutes = hasRemainingSecondsChange
          ? Math.max(1, Math.ceil((metadata.remainingSeconds ?? 0) / 60))
          : (metadata.targetMinutes ?? currentTarget.targetMinutes);
        const isIdleAtStart = !state.isActive && state.elapsedSeconds === 0;
        const nextDurationSeconds =
          currentTarget.type === "inventory" &&
          nextRemainingSeconds !== undefined
            ? nextRemainingSeconds
            : (nextTargetMinutes || DEFAULT_POMO_MINUTES) * 60;

        set({
          target: {
            ...currentTarget,
            name: metadata.name ?? currentTarget.name,
            icon: metadata.icon ?? currentTarget.icon,
            targetMinutes: nextTargetMinutes,
            remainingSeconds: nextRemainingSeconds,
            taskId: metadata.taskId ?? currentTarget.taskId,
            taskName: metadata.taskName ?? currentTarget.taskName,
          },
          ...(isIdleAtStart &&
          (hasMinutesChange || hasRecordTypeChange || hasRemainingSecondsChange)
            ? {
                mode:
                  currentTarget.type === "inventory"
                    ? state.mode
                    : (metadata.recordType ?? state.mode),
                totalDurationSeconds: nextDurationSeconds,
                secondsRemaining: nextDurationSeconds,
                ...(hasMinutesChange
                  ? { customWorkDurationMinutes: null }
                  : {}),
              }
            : {}),
        });
        updateDocumentTitle(get());
      },
    }),
    {
      name: FOCUS_TIMER_STORAGE_KEY,
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
        customWorkDurationMinutes: state.customWorkDurationMinutes,
        // Nunca persiste alvo de mochila se não houver foco ativamente em execução
        target:
          state.target?.type === "inventory" && !state.isActive
            ? null
            : state.target,
        lastTickTimestamp: state.lastTickTimestamp,
        sessionNotes: state.sessionNotes,
      }),
      merge: (persistedState, currentState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return currentState;
        }
        const raw = persistedState as Record<string, unknown>;
        const defaultSecs = DEFAULT_POMO_MINUTES * 60;
        const sanitizedTarget = sanitizePersistedTarget(raw.target);
        const mode: FocusRecordType =
          typeof raw.mode === "string" &&
          VALID_MODES.has(raw.mode as FocusRecordType)
            ? (raw.mode as FocusRecordType)
            : currentState.mode;
        const phase: FocusPhase =
          typeof raw.phase === "string" &&
          VALID_PHASES.has(raw.phase as FocusPhase)
            ? (raw.phase as FocusPhase)
            : "WORK";
        const isActive = Boolean(raw.isActive) && sanitizedTarget !== null;
        const totalDurationSeconds = Math.max(
          1,
          sanitizeNonNegativeInt(raw.totalDurationSeconds, defaultSecs),
        );
        const secondsRemaining = sanitizeNonNegativeInt(
          raw.secondsRemaining,
          totalDurationSeconds,
        );
        const elapsedSeconds = sanitizeNonNegativeInt(raw.elapsedSeconds, 0);
        const completedCycles = sanitizeNonNegativeInt(raw.completedCycles, 0);
        const customWorkDurationMinutes =
          typeof raw.customWorkDurationMinutes === "number" &&
          Number.isFinite(raw.customWorkDurationMinutes) &&
          raw.customWorkDurationMinutes > 0
            ? Math.floor(raw.customWorkDurationMinutes)
            : null;

        const merged: FocusTimerStoreState = {
          ...currentState,
          isActive,
          isPaused: Boolean(raw.isPaused),
          mode,
          phase,
          secondsRemaining,
          totalDurationSeconds,
          elapsedSeconds,
          completedCycles,
          hasTriggeredOvertimeAlert: Boolean(raw.hasTriggeredOvertimeAlert),
          customWorkDurationMinutes,
          target: sanitizedTarget,
          lastTickTimestamp:
            typeof raw.lastTickTimestamp === "number" &&
            Number.isFinite(raw.lastTickTimestamp)
              ? raw.lastTickTimestamp
              : null,
          sessionNotes:
            typeof raw.sessionNotes === "string" ? raw.sessionNotes : "",
        };

        // Se o alvo for item de mochila mas não estiver ativo ou com tempo concluído, limpa o alvo
        if (
          merged.target?.type === "inventory" &&
          (!merged.isActive || merged.secondsRemaining <= 1)
        ) {
          return {
            ...merged,
            ...buildIdleTimerPatch(defaultSecs, {
              target: null,
              completedCycles: 0,
              customWorkDurationMinutes: null,
            }),
          };
        }

        // Se a sessão estava ativa quando a aba/navegador foi fechado (ou outra aba salvou),
        // restaura em estado PAUSADO preservando o tempo acumulado sem somar horas offline nem duplicar ticks.
        if (merged.isActive) {
          return {
            ...merged,
            isPaused: true,
            lastTickTimestamp: null,
          };
        }

        return merged;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          updateDocumentTitle(state);
        }
      },
    },
  ),
);

registerFocusTimerWindowListeners(
  () => useFocusTimerStore.getState(),
  () => {
    stopGlobalTicker();
    pauseAmbientIfSynced();
    void useFocusTimerStore.persist.rehydrate();
  },
);
