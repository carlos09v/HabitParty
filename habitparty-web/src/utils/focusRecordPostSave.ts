import { toast } from "sonner";
import { dispatchTaskFocusRecorded } from "@/hooks/useFocusTaskSync";
import type { AppLocale } from "@/i18n/config";
import { useOptimisticDashboardStore } from "@/store/optimisticDashboardStore";
import { useUserStore } from "@/store/userStore";
import type { FocusRecord, FocusRecordResponseDTO } from "@/types/focus";
import { formatCoins } from "@/utils/economy";
import type { ParsedRecordDateParts } from "@/utils/focusRecordTimeWindow";
import { awardUserRewards, deductUserPenalty } from "@/utils/gamification";
import { soundEffects } from "@/utils/soundEffects";

export function formatSignedInt(val: number): string {
  return val > 0 ? `+${val}` : `${val}`;
}

export function formatSignedCoins(val: number, locale: AppLocale): string {
  const sign = val > 0 ? "+" : val < 0 ? "-" : "";
  return `${sign}${formatCoins(Math.abs(val), { locale })}`;
}

type ManualRecordTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function applyUpdatedFocusRecordSideEffects(params: {
  editingRecord: FocusRecord;
  resData: FocusRecordResponseDTO;
  targetType: "ACTIVITY" | "ITEM";
  selectedTaskId: string;
  durationMinutes: number;
  resolvedCompletedPomos: number;
  editingEndParts: ParsedRecordDateParts | null;
  todayDateKey: string;
  isSessionToday: boolean;
  isGamified: boolean;
  locale: AppLocale;
  t: ManualRecordTranslator;
}) {
  const {
    editingRecord,
    resData,
    targetType,
    selectedTaskId,
    durationMinutes,
    resolvedCompletedPomos,
    editingEndParts,
    todayDateKey,
    isSessionToday,
    isGamified,
    locale,
    t,
  } = params;

  const oldTaskId = editingRecord.taskId;
  const newTaskId =
    targetType === "ACTIVITY" && selectedTaskId ? selectedTaskId : undefined;
  const oldTaskMins = Math.max(1, editingRecord.durationMinutes);
  const oldTaskPomos = editingRecord.completedPomos ?? 0;
  const newTaskMins = Math.max(
    1,
    Number(resData.durationMinutes ?? durationMinutes),
  );
  const newTaskPomos = resolvedCompletedPomos;

  if (oldTaskId && oldTaskId === newTaskId) {
    const minsDelta = newTaskMins - oldTaskMins;
    const pomosDelta = newTaskPomos - oldTaskPomos;
    if (minsDelta !== 0 || pomosDelta !== 0) {
      dispatchTaskFocusRecorded({
        taskId: newTaskId,
        durationMinutes: minsDelta,
        cycles: pomosDelta,
      });
    }
  } else {
    if (oldTaskId) {
      dispatchTaskFocusRecorded({
        taskId: oldTaskId,
        durationMinutes: -oldTaskMins,
        cycles: -oldTaskPomos,
      });
    }
    if (newTaskId) {
      dispatchTaskFocusRecorded({
        taskId: newTaskId,
        durationMinutes: newTaskMins,
        cycles: newTaskPomos,
      });
    }
  }

  if (targetType === "ACTIVITY") {
    const wasOnToday = editingEndParts?.dateKey === todayDateKey;
    const oldFocusMins = Math.max(0, editingRecord.durationMinutes);
    const newFocusMins = Math.max(
      0,
      Number(resData.durationMinutes ?? durationMinutes),
    );
    const todayFocusDelta =
      (isSessionToday ? newFocusMins : 0) - (wasOnToday ? oldFocusMins : 0);
    if (todayFocusDelta !== 0) {
      useUserStore
        .getState()
        .adjustFocusMinutesToday(todayFocusDelta, todayDateKey);
    }

    const oldXp = editingRecord.xpEarned ?? 0;
    const oldCoins = Number(editingRecord.coinsEarned ?? 0);
    const newXp = Number(resData.xpEarned ?? 0);
    const newCoins = Number(resData.coinsEarned ?? 0);
    const xpDelta = newXp - oldXp;
    const coinsDelta = Math.round((newCoins - oldCoins) * 100) / 100;

    let didLevelUp = false;
    if (xpDelta > 0 || coinsDelta > 0) {
      const rewardResult = awardUserRewards(
        Math.max(0, xpDelta),
        Math.max(0, coinsDelta),
        { locale },
      );
      didLevelUp = rewardResult.didLevelUp;
      useOptimisticDashboardStore.getState().addTransaction({
        xpAmount: Math.max(0, xpDelta),
        goldAmount: Math.max(0, coinsDelta),
        transactionType: "FOCUS_COMPLETED",
      });
    }
    if (xpDelta < 0 || coinsDelta < 0) {
      deductUserPenalty(Math.max(0, -xpDelta), Math.max(0, -coinsDelta));
      useOptimisticDashboardStore.getState().addTransaction({
        xpAmount: -Math.abs(Math.min(0, xpDelta)),
        goldAmount: -Math.abs(Math.min(0, coinsDelta)),
        transactionType: "MANUAL_ADJUSTMENT",
        isReversal: true,
      });
    }

    if (!didLevelUp) {
      soundEffects.playCreateSound();
      const hasPositiveDelta = xpDelta > 0 || coinsDelta > 0;
      const hasNegativeDelta = xpDelta < 0 || coinsDelta < 0;
      if (hasNegativeDelta) {
        toast.success(
          t(
            isGamified
              ? "toasts.recordUpdatedWithAdjustment"
              : "toasts.recordUpdatedWithAdjustmentProductivity",
            {
              xp: formatSignedInt(xpDelta),
              coins: formatSignedCoins(coinsDelta, locale),
            },
          ),
        );
      } else if (hasPositiveDelta) {
        toast.success(
          t(
            isGamified
              ? "toasts.recordUpdatedWithGain"
              : "toasts.recordUpdatedWithGainProductivity",
            {
              xp: `${xpDelta}`,
              coins: formatCoins(coinsDelta, { locale }),
            },
          ),
        );
      } else {
        toast.success(t("toasts.recordUpdated"));
      }
    }
  } else {
    soundEffects.playCreateSound();
    toast.success(t("toasts.itemRecordUpdated"));
  }

  useUserStore.getState().triggerAchievementCheck();
}

export function applyCreatedFocusRecordSideEffects(params: {
  resData?: FocusRecordResponseDTO;
  targetType: "ACTIVITY" | "ITEM";
  selectedTaskId: string;
  durationMinutes: number;
  resolvedCompletedPomos: number;
  todayDateKey: string;
  isSessionToday: boolean;
  isGamified: boolean;
  locale: AppLocale;
  t: ManualRecordTranslator;
}) {
  const {
    resData,
    targetType,
    selectedTaskId,
    durationMinutes,
    resolvedCompletedPomos,
    todayDateKey,
    isSessionToday,
    isGamified,
    locale,
    t,
  } = params;

  const xp = Number(resData?.xpEarned ?? 0);
  const coins = Number(resData?.coinsEarned ?? 0);

  if (targetType === "ACTIVITY" && selectedTaskId) {
    dispatchTaskFocusRecorded({
      taskId: selectedTaskId,
      durationMinutes: Math.max(
        1,
        Number(resData?.durationMinutes ?? durationMinutes),
      ),
      cycles: resolvedCompletedPomos,
    });
  }

  if (targetType === "ACTIVITY") {
    const rewardResult = awardUserRewards(xp, coins, { locale });
    if (isSessionToday) {
      const savedDuration = Math.max(
        1,
        Number(resData?.durationMinutes ?? durationMinutes),
      );
      useUserStore
        .getState()
        .recordFocusMinutesToday(savedDuration, todayDateKey);
    }
    if (xp > 0 || coins > 0) {
      useOptimisticDashboardStore.getState().addTransaction({
        xpAmount: xp,
        goldAmount: coins,
        transactionType: "FOCUS_COMPLETED",
      });
    }
    if (!rewardResult.didLevelUp) {
      soundEffects.playCreateSound();
      if (xp > 0 || coins > 0) {
        toast.success(
          t(
            isGamified
              ? "toasts.recordSavedWithRewards"
              : "toasts.recordSavedWithRewardsProductivity",
            {
              xp,
              coins: formatCoins(coins, { locale }),
            },
          ),
        );
      } else {
        toast.success(t("toasts.recordSaved"));
      }
    }
  } else {
    soundEffects.playCreateSound();
    toast.success(t("toasts.itemTimeLogged"));
  }

  if (targetType === "ITEM" || (xp <= 0 && coins <= 0)) {
    useUserStore.getState().triggerAchievementCheck();
  }
}
