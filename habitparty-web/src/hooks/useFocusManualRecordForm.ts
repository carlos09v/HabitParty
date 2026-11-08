"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createFocusRecord } from "@/actions/focusActions";
import { MAX_FOCUS_ACTIVITIES_FREE } from "@/constants/focus";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActivity,
  FocusRecord,
  FocusRecordType,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import {
  computeTimeWindowFromDuration,
  formatTimeHHMM,
  getTodayDateString,
  minutesToTimeHHMM,
  parseTimeToMinutes,
  toLocalISOString,
} from "@/utils/date";
import { getItemRemainingMinutes } from "@/utils/focusFormatters";
import { toLocalDateKey } from "@/utils/focusMetrics";
import {
  calculateFocusRewardEstimate,
  toFocusRewardEstimate,
} from "@/utils/focusRewards";
import { awardUserRewards } from "@/utils/gamification";
import { soundEffects } from "@/utils/soundEffects";

interface UseFocusManualRecordFormParams {
  isOpen: boolean;
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  records?: FocusRecord[];
  initialActivityId?: string;
  initialItemId?: string;
  onSuccess?: () => void;
  onClose: () => void;
}

/**
 * Hook de controle do formulário de inserção manual de foco.
 * Otimizado com estado inicial síncrono, useTransition e integração de recompensas unificada.
 */
export function useFocusManualRecordForm({
  activities,
  backpackItems,
  records = [],
  initialActivityId,
  initialItemId,
  onSuccess,
  onClose,
}: UseFocusManualRecordFormParams) {
  const t = useTranslations("focus.manualRecord");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();
  const isPremium = useUserStore((s) => s.is_Premium);
  const [isPending, startTransition] = useTransition();

  const selectableActivities = useMemo(() => {
    return isPremium
      ? activities
      : activities.slice(0, MAX_FOCUS_ACTIVITIES_FREE);
  }, [activities, isPremium]);

  // Inicialização de estado síncrona sem necessidade de useEffect
  const [targetType, setTargetType] = useState<"ACTIVITY" | "ITEM">(() =>
    initialItemId ? "ITEM" : "ACTIVITY",
  );

  const [selectedActivityId, setSelectedActivityId] = useState<string>(() => {
    if (
      initialActivityId &&
      selectableActivities.some((a) => a.id === initialActivityId)
    ) {
      return initialActivityId;
    }
    return selectableActivities[0]?.id ?? "";
  });

  const [selectedItemId, setSelectedItemId] = useState<string>(() => {
    if (initialItemId) return initialItemId;
    return backpackItems[0]?.inventoryItemId ?? "";
  });

  const [recordType, setRecordType] = useState<FocusRecordType>("POMO");

  const [durationMinutes, setDurationMinutes] = useState<number>(() => {
    if (initialItemId) {
      const item = backpackItems.find(
        (b) => b.inventoryItemId === initialItemId,
      );
      const mins = getItemRemainingMinutes(item?.remainingSeconds);
      if (mins > 0) return mins;
    }
    const validInitId =
      initialActivityId &&
      selectableActivities.some((a) => a.id === initialActivityId)
        ? initialActivityId
        : selectableActivities[0]?.id;
    const act = selectableActivities.find((a) => a.id === validInitId);
    return act?.targetTimeMinutes || 35;
  });

  const [durationInput, setDurationInput] = useState<string>(() =>
    String(durationMinutes),
  );

  const [completedPomos, setCompletedPomos] = useState<number>(() => {
    const validInitId =
      initialActivityId &&
      selectableActivities.some((a) => a.id === initialActivityId)
        ? initialActivityId
        : selectableActivities[0]?.id;
    const act = selectableActivities.find((a) => a.id === validInitId);
    if (act?.targetTimeMinutes && act.targetTimeMinutes > 45) {
      return Math.max(1, Math.round(act.targetTimeMinutes / 30));
    }
    return 1;
  });

  const [sessionDate, setSessionDate] = useState<string>(getTodayDateString);
  const [endTimeStr, setEndTimeStr] = useState<string>(() =>
    formatTimeHHMM(new Date()),
  );
  const [startTimeStr, setStartTimeStr] = useState<string>(() => {
    const initialEnd = formatTimeHHMM(new Date());
    return computeTimeWindowFromDuration(initialEnd, durationMinutes)
      .startTimeStr;
  });
  const [notes, setNotes] = useState("");

  const syncDurationWithWindow = (nextDuration: number) => {
    const clamped = Math.max(0, Math.min(1439, nextDuration));
    setDurationMinutes(clamped);
    setDurationInput(String(clamped));
    if (clamped >= 1) {
      const window = computeTimeWindowFromDuration(endTimeStr, clamped);
      setStartTimeStr(window.startTimeStr);
      setEndTimeStr(window.endTimeStr);
    }
  };

  const handleDurationInputChange = (raw: string) => {
    if (raw === "") {
      setDurationInput("");
      setDurationMinutes(0);
      return;
    }
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      return;
    }
    const clamped = Math.max(0, Math.min(1439, parsed));
    setDurationInput(String(clamped));
    setDurationMinutes(clamped);
    if (clamped >= 1) {
      const window = computeTimeWindowFromDuration(endTimeStr, clamped);
      setStartTimeStr(window.startTimeStr);
      setEndTimeStr(window.endTimeStr);
      syncPomosFromMinutes(clamped);
    }
  };

  const syncPomosFromMinutes = (mins: number) => {
    if (recordType === "POMO") {
      if (mins <= 45) {
        setCompletedPomos(1);
      } else if (mins <= 60) {
        setCompletedPomos(2);
      } else {
        setCompletedPomos(Math.max(1, Math.round(mins / 30)));
      }
    }
  };

  const handleStartTimeChange = (nextStart: string) => {
    setStartTimeStr(nextStart);
    const startMins = parseTimeToMinutes(nextStart);
    const endMins = parseTimeToMinutes(endTimeStr);
    if (startMins === null || endMins === null) return;

    if (endMins > startMins) {
      const diff = endMins - startMins;
      setDurationMinutes(diff);
      setDurationInput(String(diff));
      syncPomosFromMinutes(diff);
    } else {
      const nextEndMins = Math.min(1439, startMins + durationMinutes);
      const safeDiff = Math.max(1, nextEndMins - startMins);
      setEndTimeStr(minutesToTimeHHMM(startMins + safeDiff));
      setDurationMinutes(safeDiff);
      setDurationInput(String(safeDiff));
    }
  };

  const handleEndTimeChange = (nextEnd: string) => {
    setEndTimeStr(nextEnd);
    const startMins = parseTimeToMinutes(startTimeStr);
    const endMins = parseTimeToMinutes(nextEnd);
    if (startMins === null || endMins === null) return;

    if (endMins > startMins) {
      const diff = endMins - startMins;
      setDurationMinutes(diff);
      setDurationInput(String(diff));
      syncPomosFromMinutes(diff);
    } else {
      const nextStartMins = Math.max(0, endMins - durationMinutes);
      const safeDiff = Math.max(1, endMins - nextStartMins);
      setStartTimeStr(minutesToTimeHHMM(endMins - safeDiff));
      setDurationMinutes(safeDiff);
      setDurationInput(String(safeDiff));
    }
  };

  const selectedItem = useMemo(() => {
    return backpackItems.find((b) => b.inventoryItemId === selectedItemId);
  }, [backpackItems, selectedItemId]);

  const selectedItemMinutes = useMemo(() => {
    return getItemRemainingMinutes(selectedItem?.remainingSeconds);
  }, [selectedItem]);

  const selectedActivity = useMemo(() => {
    return selectableActivities.find((a) => a.id === selectedActivityId);
  }, [selectableActivities, selectedActivityId]);

  // Minutos já focados na data selecionada (para avisar sobre soft/hard cap diário no preview)
  const priorFocusMinutesForDate = useMemo(() => {
    if (!sessionDate || records.length === 0) return 0;
    return records.reduce((sum, rec) => {
      if (rec.inventoryItemId) return sum;
      if (toLocalDateKey(rec.endTime) !== sessionDate) return sum;
      return sum + (rec.durationMinutes || 0);
    }, 0);
  }, [records, sessionDate]);

  const estimatedRewards = useMemo(() => {
    return calculateFocusRewardEstimate(
      targetType,
      recordType,
      durationMinutes,
      completedPomos,
      priorFocusMinutesForDate,
      locale,
    );
  }, [
    targetType,
    recordType,
    durationMinutes,
    completedPomos,
    priorFocusMinutesForDate,
    locale,
  ]);

  const rewardEstimate = useMemo(() => {
    return toFocusRewardEstimate(
      estimatedRewards,
      {
        durationMinutes,
        completedPomos,
        recordType,
        locale,
      },
      locale,
    );
  }, [estimatedRewards, durationMinutes, completedPomos, recordType, locale]);

  const handleTargetTypeChange = (type: "ACTIVITY" | "ITEM") => {
    setTargetType(type);
    if (type === "ITEM") {
      const item =
        backpackItems.find((b) => b.inventoryItemId === selectedItemId) ??
        backpackItems[0];
      if (item) {
        setSelectedItemId(item.inventoryItemId || "");
        const mins = getItemRemainingMinutes(item.remainingSeconds);
        if (mins > 0) syncDurationWithWindow(mins);
      }
    }
  };

  const handleSelectActivity = (actId: string) => {
    setSelectedActivityId(actId);
    const act = selectableActivities.find((a) => a.id === actId);
    if (act?.targetTimeMinutes) {
      syncDurationWithWindow(act.targetTimeMinutes);
      syncPomosFromMinutes(act.targetTimeMinutes);
    }
  };

  const handleSelectBackpackItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = backpackItems.find((b) => b.inventoryItemId === itemId);
    const itemMins = getItemRemainingMinutes(item?.remainingSeconds);
    if (itemMins > 0) {
      syncDurationWithWindow(itemMins);
    }
  };

  const handlePresetSelect = (minutes: number) => {
    syncDurationWithWindow(minutes);
    syncPomosFromMinutes(minutes);
  };

  const handleDurationChange = (minutes: number) => {
    syncDurationWithWindow(minutes);
  };

  const handleCompletedPomosStep = (delta: number) => {
    setCompletedPomos((prev) => Math.max(1, Math.min(50, prev + delta)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (targetType === "ACTIVITY" && !selectedActivityId) {
      toast.error(t("toasts.selectActivityRequired"));
      return;
    }

    if (targetType === "ITEM" && !selectedItemId) {
      toast.error(t("toasts.noBackpackItems"));
      return;
    }

    if (durationMinutes <= 0) {
      toast.error(t("toasts.invalidDuration"));
      return;
    }

    if (
      targetType === "ITEM" &&
      selectedItemMinutes > 0 &&
      durationMinutes > selectedItemMinutes
    ) {
      toast.error(
        t("toasts.exceedsItemBalance", { minutes: selectedItemMinutes }),
      );
      return;
    }

    startTransition(async () => {
      try {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        if (targetType === "ITEM") {
          endDate = now;
          startDate = new Date(now.getTime() - durationMinutes * 60 * 1000);
        } else {
          const baseDateStr = sessionDate || getTodayDateString(now);
          const [y, m, d] = baseDateStr.split("-").map(Number);
          const startMins = parseTimeToMinutes(startTimeStr);
          const endMins = parseTimeToMinutes(endTimeStr);

          if (startMins !== null && endMins !== null && endMins > startMins) {
            startDate = new Date(
              y,
              m - 1,
              d,
              Math.floor(startMins / 60),
              startMins % 60,
              0,
            );
            endDate = new Date(
              y,
              m - 1,
              d,
              Math.floor(endMins / 60),
              endMins % 60,
              0,
            );
          } else {
            const fallbackEndMins =
              endMins ?? now.getHours() * 60 + now.getMinutes();
            endDate = new Date(
              y,
              m - 1,
              d,
              Math.floor(fallbackEndMins / 60),
              fallbackEndMins % 60,
              0,
            );
            startDate = new Date(
              endDate.getTime() - durationMinutes * 60 * 1000,
            );
          }
        }

        const startTime = toLocalISOString(startDate);
        const endTime = toLocalISOString(endDate);

        const res = await createFocusRecord({
          focusActivityId:
            targetType === "ACTIVITY" ? selectedActivityId : undefined,
          inventoryItemId: targetType === "ITEM" ? selectedItemId : undefined,
          recordType: targetType === "ITEM" ? "STOPWATCH" : recordType,
          completedPomos:
            targetType !== "ITEM" && recordType === "POMO" ? completedPomos : 0,
          startTime,
          endTime,
          notes: notes.trim() || undefined,
        });

        if (res.success) {
          const xp = Number(res.data?.xpEarned ?? 0);
          const coins = Number(res.data?.coinsEarned ?? 0);

          if (targetType === "ACTIVITY") {
            const rewardResult = awardUserRewards(xp, coins);
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
                      coins: coins.toFixed(2),
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

          onSuccess?.();
          onClose();
        } else {
          toast.error(res.error || t("toasts.saveFailed"));
        }
      } catch {
        toast.error(t("toasts.unexpectedError"));
      }
    });
  };

  return {
    isPremium,
    selectableActivities,
    targetType,
    handleTargetTypeChange,
    selectedActivityId,
    handleSelectActivity,
    selectedItemId,
    handleSelectBackpackItem,
    recordType,
    setRecordType,
    durationMinutes,
    durationInput,
    handleDurationInputChange,
    setDurationMinutes: handleDurationChange,
    startTimeStr,
    endTimeStr,
    handleStartTimeChange,
    handleEndTimeChange,
    completedPomos,
    setCompletedPomos,
    sessionDate,
    setSessionDate,
    notes,
    setNotes,
    isSubmitting: isPending,
    selectedItem,
    selectedItemMinutes,
    selectedActivity,
    rewardEstimate,
    handlePresetSelect,
    handleCompletedPomosStep,
    handleSubmit,
  };
}
