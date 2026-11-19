import { toast } from "sonner";
import { changeTaskStatus } from "@/actions/taskActions";
import { DEFAULT_POMO_MINUTES } from "@/constants/focus";
import {
  buildIdleTimerPatch,
  type FocusStoreGetter,
  type FocusStoreSetter,
} from "@/store/focus/focusTimerState";
import { stopGlobalTicker } from "@/store/focus/focusTimerTicker";
import { useOptimisticDashboardStore } from "@/store/optimisticDashboardStore";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import { getTodayDateString } from "@/utils/date";
import { formatCoins, getTaskRewardBreakdown } from "@/utils/economy";
import {
  getBrowserDocumentLocale,
  updateDocumentTitle,
} from "@/utils/focusTimerBrowser";
import { tStoreMsg } from "@/utils/focusTimerMessages";
import { awardUserRewards } from "@/utils/gamification";
import { soundEffects } from "@/utils/soundEffects";

let isCompletingLinkedTaskGuard = false;

/**
 * Conclui uma tarefa vinculada ao foco atual (salvando a sessão ativa se já tiver >= 60s),
 * aplica recompensas/estrela, dispara eventos de sincronização e limpa ou desvincula o alvo.
 */
export async function executeCompleteLinkedTask(
  set: FocusStoreSetter,
  get: FocusStoreGetter,
  taskId: string,
  taskName?: string,
): Promise<boolean> {
  if (isCompletingLinkedTaskGuard || get().isCompletingLinkedTask) {
    return false;
  }
  isCompletingLinkedTaskGuard = true;
  set({ isCompletingLinkedTask: true });

  try {
    const stateBeforeComplete = get();
    const currentTargetTaskId =
      stateBeforeComplete.target?.type === "task"
        ? stateBeforeComplete.target.taskId || stateBeforeComplete.target.id
        : stateBeforeComplete.target?.type === "activity"
          ? stateBeforeComplete.target.taskId
          : undefined;
    const isLinkedToTarget = currentTargetTaskId === taskId;
    if (
      isLinkedToTarget &&
      stateBeforeComplete.phase === "WORK" &&
      stateBeforeComplete.elapsedSeconds >= 60
    ) {
      const sessionSaved = await get().completeSession(undefined, {
        suppressCompleteSound: true,
        suppressLinkedTaskAction: true,
      });
      if (!sessionSaved) {
        return false;
      }
    }

    const res = await changeTaskStatus(taskId, "COMPLETED");
    if (res.success) {
      const taskData = res.data;
      const locale = getBrowserDocumentLocale();
      const userTimeZone = useUserStore.getState().user?.timezone;
      const resolvedName = taskName || taskData?.name || "Tarefa";
      const rewardGranted = taskData?.rewardGranted !== false;

      if (!rewardGranted) {
        useUserStore
          .getState()
          .markStreakSecuredToday(getTodayDateString(new Date(), userTimeZone));
        soundEffects.playTaskCompleteSound();
        triggerCelebrationConfetti();
        toast.success(
          tStoreMsg("linkedTaskCompletedNoRewardToast", {
            name: resolvedName,
          }),
        );
      } else {
        const rewardStreak =
          taskData?.taskType === "DAILY" &&
          typeof taskData.currentStreak === "number"
            ? Math.max(0, taskData.currentStreak - 1)
            : taskData?.currentStreak;
        const isGamified = useUIStore.getState().experienceMode === "GAMIFIED";
        const breakdown = getTaskRewardBreakdown({
          taskType: taskData?.taskType,
          difficulty: taskData?.difficulty,
          importanceType: taskData?.importanceType,
          repeatType: taskData?.repeatType,
          resetCounter: taskData?.resetCounter,
          currentStreak: rewardStreak,
          isHardcoreModeEnabled: taskData?.isHardcoreModeEnabled,
          dueDate: taskData?.dueDate,
          isPenaltyApplied: taskData?.isPenaltyApplied,
          locale,
          timeZone: userTimeZone,
          isGamified,
        });
        const xp = breakdown.finalReward.xp;
        const gold = breakdown.finalReward.gold;
        const rewardResult = awardUserRewards(xp, gold, {
          locale,
          isTaskCompletion: true,
        });
        useOptimisticDashboardStore.getState().addTransaction({
          xpAmount: xp,
          goldAmount: gold,
          transactionType: "TASK_COMPLETED",
        });

        if (!rewardResult.didLevelUp) {
          soundEffects.playTaskCompleteSound();
          triggerCelebrationConfetti();
          if (xp > 0 || gold > 0) {
            toast.success(
              tStoreMsg(
                isGamified
                  ? "linkedTaskCompletedRewardsToast"
                  : "linkedTaskCompletedRewardsToastProductivity",
                {
                  name: resolvedName,
                  xp,
                  coins: formatCoins(gold, { locale }),
                },
              ),
            );
          } else {
            toast.success(
              tStoreMsg("linkedTaskCompletedToast", {
                name: resolvedName,
              }),
            );
          }
        }
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("habitparty:task-completed-from-focus", {
            detail: { taskId, updatedTask: res.data },
          }),
        );
        window.dispatchEvent(
          new CustomEvent("habitparty:tasks-changed", {
            detail: { completedToday: true },
          }),
        );
      }
      let shouldFinalizeDirectTaskSession = false;
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
        shouldFinalizeDirectTaskSession = true;
        return {
          ...prev,
          ...buildIdleTimerPatch(DEFAULT_POMO_MINUTES * 60, {
            mode: "POMO",
            target: null,
          }),
        };
      });
      if (shouldFinalizeDirectTaskSession) {
        stopGlobalTicker();
        updateDocumentTitle(get());
        get().onSessionSavedCallback?.();
      }
      return true;
    }
    toast.error(res.error || tStoreMsg("linkedTaskCompleteFailedToast"));
    return false;
  } catch {
    toast.error(tStoreMsg("linkedTaskCompleteFailedToast"));
    return false;
  } finally {
    isCompletingLinkedTaskGuard = false;
    set({ isCompletingLinkedTask: false });
  }
}
