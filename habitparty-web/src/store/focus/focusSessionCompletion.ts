import { toast } from "sonner";
import { createFocusRecord } from "@/actions/focusActions";
import { DEFAULT_POMO_MINUTES } from "@/constants/focus";
import { dispatchTaskFocusRecorded } from "@/hooks/useFocusTaskSync";
import {
  buildIdleTimerPatch,
  type FocusStoreGetter,
  type FocusStoreSetter,
  type FocusTimerStoreState,
} from "@/store/focus/focusTimerState";
import {
  startGlobalTicker,
  stopGlobalTicker,
} from "@/store/focus/focusTimerTicker";
import { useOptimisticDashboardStore } from "@/store/optimisticDashboardStore";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import type { FocusRecordType } from "@/types/focus";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import { getTodayDateString, toLocalISOString } from "@/utils/date";
import { formatCoins } from "@/utils/economy";
import { formatDurationMinSec } from "@/utils/focusFormatters";
import {
  getBrowserDocumentLocale,
  updateDocumentTitle,
} from "@/utils/focusTimerBrowser";
import { tStoreMsg } from "@/utils/focusTimerMessages";
import { awardUserRewards } from "@/utils/gamification";
import { soundEffects } from "@/utils/soundEffects";

let isCompletingSessionGuard = false;

export function isFocusSessionCompleting(state: FocusTimerStoreState): boolean {
  return isCompletingSessionGuard || state.isSavingSession;
}

interface CompleteSessionOptions {
  suppressCompleteSound?: boolean;
  suppressLinkedTaskAction?: boolean;
  suppressSuccessToast?: boolean;
}

function notifyInventoryCompletion(
  state: FocusTimerStoreState,
  exactSeconds: number,
) {
  soundEffects.playFocusSessionCompleteSound();
  const isFinished =
    state.secondsRemaining <= 1 || exactSeconds >= state.totalDurationSeconds;
  if (isFinished) {
    triggerCelebrationConfetti();
    toast.success(tStoreMsg("couponTimeDepletedToast"));
    useUserStore.getState().triggerAchievementCheck();
  } else {
    const timeStr = formatDurationMinSec(exactSeconds);
    toast.success(tStoreMsg("couponTimeDeductedToast", { time: timeStr }));
  }
}

function notifyStandardCompletion(
  resData: unknown,
  exactSeconds: number,
  resolvedTaskId: string | undefined,
  resolvedTaskName: string | undefined,
  options: CompleteSessionOptions | undefined,
  get: FocusStoreGetter,
) {
  const timeStr = formatDurationMinSec(exactSeconds);
  const recordData = resData as
    | { xpEarned?: number; coinsEarned?: number }
    | undefined;
  const xp = recordData?.xpEarned ?? 0;
  const coins = recordData?.coinsEarned ?? 0;

  const rewardResult = awardUserRewards(xp, coins);
  if (xp > 0 || coins > 0) {
    useOptimisticDashboardStore.getState().addTransaction({
      xpAmount: xp,
      goldAmount: coins,
      transactionType: "FOCUS_COMPLETED",
    });
  } else {
    useUserStore.getState().triggerAchievementCheck();
  }

  const taskAction =
    resolvedTaskId && !options?.suppressLinkedTaskAction
      ? {
          label: tStoreMsg("completeLinkedTaskAction"),
          onClick: () => {
            void get().completeLinkedTask(resolvedTaskId, resolvedTaskName);
          },
        }
      : undefined;

  if (!rewardResult.didLevelUp) {
    if (!options?.suppressCompleteSound) {
      soundEffects.playFocusSessionCompleteSound();
    }
    if (!options?.suppressSuccessToast) {
      if (xp > 0 || coins > 0) {
        const isGamified = useUIStore.getState().experienceMode === "GAMIFIED";
        toast.success(
          tStoreMsg(
            isGamified
              ? "sessionCompletedRewardsToast"
              : "sessionCompletedRewardsToastProductivity",
            {
              time: timeStr,
              xp,
              coins: formatCoins(Number(coins), {
                locale: getBrowserDocumentLocale(),
              }),
            },
          ),
          taskAction ? { action: taskAction, duration: 8000 } : undefined,
        );
      } else {
        toast.success(
          tStoreMsg("sessionCompletedLoggedToast", { time: timeStr }),
          taskAction ? { action: taskAction, duration: 8000 } : undefined,
        );
      }
    }
  } else if (taskAction && !options?.suppressSuccessToast) {
    toast.info(
      tStoreMsg("levelUpLinkedTaskPrompt", {
        name: resolvedTaskName || tStoreMsg("defaultTaskName"),
      }),
      {
        action: taskAction,
        duration: 8000,
      },
    );
  }
}

/**
 * Persiste uma sessão de foco concluída no backend, atualiza cache otimista/gamificação,
 * exibe toasts de feedback e reinicia o estado do timer.
 */
export async function executeCompleteSession(
  set: FocusStoreSetter,
  get: FocusStoreGetter,
  notes?: string,
  options?: CompleteSessionOptions,
): Promise<boolean> {
  if (isFocusSessionCompleting(get())) {
    return false;
  }

  const state = get();
  if (state.phase === "SHORT_BREAK" || state.phase === "LONG_BREAK") {
    get().skipBreak();
    return true;
  }

  if (!state.target) {
    const isGamified = useUIStore.getState().experienceMode === "GAMIFIED";
    toast.warning(
      tStoreMsg(
        isGamified
          ? "linkTargetBeforeSaveToast"
          : "linkTargetBeforeSaveToastProductivity",
      ),
    );
    return false;
  }

  const elapsed = state.elapsedSeconds;
  if (elapsed < 60) {
    toast.warning(tStoreMsg("minDurationWarningToast"));
    return false;
  }

  const wasRunning = state.isActive && !state.isPaused;
  isCompletingSessionGuard = true;
  set({ isSavingSession: true });
  stopGlobalTicker();

  const isInventory = state.target?.type === "inventory";
  const now = new Date();
  const exactSeconds = Math.max(1, elapsed);
  const userTimeZone = useUserStore.getState().user?.timezone;
  const endTime = toLocalISOString(now, userTimeZone);
  const startTime = toLocalISOString(
    new Date(now.getTime() - exactSeconds * 1000),
    userTimeZone,
  );

  const recordType: FocusRecordType = isInventory ? "STOPWATCH" : state.mode;
  const pomoTargetMinutes =
    recordType === "POMO"
      ? Math.max(1, Math.round(state.totalDurationSeconds / 60))
      : undefined;
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
      pomoTargetMinutes,
      startTime,
      endTime,
      notes:
        (notes !== undefined ? notes : state.sessionNotes)?.trim() || undefined,
    });

    if (res.success) {
      if (resolvedTaskId) {
        dispatchTaskFocusRecorded({
          taskId: resolvedTaskId,
          durationMinutes: Math.max(1, Math.floor(exactSeconds / 60)),
          cycles: isCompletedPomo ? 1 : 0,
        });
      }

      if (isInventory) {
        notifyInventoryCompletion(state, exactSeconds);
      } else {
        const recordedDurationMinutes = Math.max(
          0,
          Math.floor(exactSeconds / 60),
        );
        if (recordedDurationMinutes > 0) {
          useUserStore
            .getState()
            .recordFocusMinutesToday(
              recordedDurationMinutes,
              getTodayDateString(now, userTimeZone),
            );
        }
        notifyStandardCompletion(
          res.data,
          exactSeconds,
          resolvedTaskId,
          resolvedTaskName,
          options,
          get,
        );
      }

      stopGlobalTicker();
      set((prev) =>
        buildIdleTimerPatch(
          isInventory
            ? DEFAULT_POMO_MINUTES * 60
            : prev.totalDurationSeconds || DEFAULT_POMO_MINUTES * 60,
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

    if (wasRunning) {
      startGlobalTicker(() => get().tick());
    }
    toast.error(res.error || tStoreMsg("saveSessionFailedToast"));
    return false;
  } catch {
    if (wasRunning) {
      startGlobalTicker(() => get().tick());
    }
    toast.error(tStoreMsg("saveSessionServerErrorToast"));
    return false;
  } finally {
    isCompletingSessionGuard = false;
    set({ isSavingSession: false });
  }
}
