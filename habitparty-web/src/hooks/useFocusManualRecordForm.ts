"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { createFocusRecord, updateFocusRecord } from "@/actions/focusActions";
import {
  MAX_FOCUS_ACTIVITIES_FREE,
  MAX_MANUAL_FOCUS_MINUTES,
} from "@/constants/focus";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { dispatchTaskFocusRecorded } from "@/hooks/useFocusTaskSync";
import type { AppLocale } from "@/i18n/config";
import { useOptimisticDashboardStore } from "@/store/optimisticDashboardStore";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActivity,
  FocusableTaskItem,
  FocusRecord,
  FocusRecordType,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import {
  computeTimeWindowFromDuration,
  formatDateParts,
  formatTimeHHMM,
  getDateKeyInTimeZone,
  getDatePartsInTimeZone,
  getTodayDateString,
  hasTimeZoneSuffix,
  minutesToTimeHHMM,
  parseLocalDate,
  parseServerDate,
  parseTimeToMinutes,
  toLocalISOString,
} from "@/utils/date";
import { formatCoins } from "@/utils/economy";
import { calculateRewardableMinutesForDate } from "@/utils/focusDailyYield";
import {
  getItemRemainingMinutes,
  isBackpackItemTimeDepleted,
} from "@/utils/focusFormatters";
import { mapFocusRecordDtoToRecord } from "@/utils/focusMapper";
import {
  calculateFocusRewardEstimate,
  toFocusRewardEstimate,
} from "@/utils/focusRewards";
import { awardUserRewards, deductUserPenalty } from "@/utils/gamification";
import { soundEffects } from "@/utils/soundEffects";

interface UseFocusManualRecordFormParams {
  isOpen: boolean;
  activities: FocusActivity[];
  backpackItems: InventoryItemResponseDTO[];
  allInventoryItems?: InventoryItemResponseDTO[];
  focusableTasks?: FocusableTaskItem[];
  records?: FocusRecord[];
  editingRecord?: FocusRecord | null;
  initialActivityId?: string;
  initialItemId?: string;
  initialTaskId?: string;
  onSuccess?: () => void;
  onRecordUpdated?: (updatedRecord: FocusRecord) => void;
  onClose: () => void;
}

interface ParsedRecordDateParts {
  dateKey: string;
  timeHHMM: string;
  wallIso: string;
  timestampMs: number | null;
  hasExplicitTz: boolean;
}

function formatWallUtc(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${formatDateParts(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())}T${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}:${pad(dt.getUTCSeconds())}`;
}

function parseWallIsoToUtcMs(wallIso: string): number | null {
  const [datePart, timePart = "00:00:00"] = wallIso.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh = 0, mm = 0, ss = 0] = timePart.split(":").map(Number);
  if (
    !y ||
    !m ||
    !d ||
    Number.isNaN(hh) ||
    Number.isNaN(mm) ||
    Number.isNaN(ss)
  ) {
    return null;
  }
  return Date.UTC(y, m - 1, d, hh, mm, ss);
}

function parseRecordDateParts(
  dateStr: string,
  timeZone?: string | null,
): ParsedRecordDateParts {
  const trimmed = dateStr.trim();
  if (!hasTimeZoneSuffix(trimmed)) {
    const normalized = trimmed.replace(" ", "T");
    const [datePart = "", timePart = "00:00:00"] = normalized.split("T");
    const [hh = "00", mm = "00", ss = "00"] = timePart.split(":");
    const pad2 = (s: string) => s.padStart(2, "0").slice(0, 2);
    const localDate = parseLocalDate(normalized);
    return {
      dateKey: datePart,
      timeHHMM: `${pad2(hh)}:${pad2(mm)}`,
      wallIso: `${datePart}T${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`,
      timestampMs: localDate ? localDate.getTime() : null,
      hasExplicitTz: false,
    };
  }
  const parsed = parseServerDate(trimmed);
  if (!parsed) {
    const now = new Date();
    return {
      dateKey: getTodayDateString(now, timeZone),
      timeHHMM: formatTimeHHMM(now, timeZone),
      wallIso: toLocalISOString(now, timeZone),
      timestampMs: now.getTime(),
      hasExplicitTz: true,
    };
  }
  return {
    dateKey: getDateKeyInTimeZone(parsed, timeZone),
    timeHHMM: formatTimeHHMM(parsed, timeZone),
    wallIso: toLocalISOString(parsed, timeZone),
    timestampMs: parsed.getTime(),
    hasExplicitTz: true,
  };
}

function estimatePomosFromMinutes(mins: number): number {
  if (mins <= 45) return 1;
  if (mins <= 60) return 2;
  return Math.max(1, Math.round(mins / 30));
}

function formatSignedInt(val: number): string {
  return val > 0 ? `+${val}` : `${val}`;
}

function formatSignedCoins(val: number, locale: AppLocale): string {
  const sign = val > 0 ? "+" : val < 0 ? "-" : "";
  return `${sign}${formatCoins(Math.abs(val), { locale })}`;
}

function resolveRecordDurationSeconds(record: FocusRecord): number {
  const startParsed = hasTimeZoneSuffix(record.startTime)
    ? parseServerDate(record.startTime)
    : parseLocalDate(record.startTime);
  const endParsed = hasTimeZoneSuffix(record.endTime)
    ? parseServerDate(record.endTime)
    : parseLocalDate(record.endTime);
  if (startParsed && endParsed) {
    const diffSecs = Math.round(
      (endParsed.getTime() - startParsed.getTime()) / 1000,
    );
    if (diffSecs > 0) {
      return diffSecs;
    }
  }
  return Math.max(0, (record.durationMinutes || 0) * 60);
}

/**
 * Hook de controle do formulário de inserção e edição manual de foco.
 * Otimizado com estado inicial síncrono, useTransition e integração de recompensas unificada.
 */
export function useFocusManualRecordForm({
  activities,
  backpackItems,
  allInventoryItems = [],
  records = [],
  editingRecord = null,
  initialActivityId,
  initialItemId,
  initialTaskId,
  onSuccess,
  onRecordUpdated,
  onClose,
}: UseFocusManualRecordFormParams) {
  const t = useTranslations("focus.manualRecord");
  const locale = useLocale() as AppLocale;
  const { isGamified } = useExperienceMode();
  const isPremium = useUserStore((s) => s.is_Premium);
  const userTimeZone = useUserStore((s) => s.user?.timezone);
  const [isPending, startTransition] = useTransition();

  const isEditMode = Boolean(editingRecord);
  const isOrphanedFreeSession = Boolean(
    editingRecord &&
      !editingRecord.inventoryItemId &&
      !editingRecord.focusActivityId &&
      !editingRecord.taskId,
  );

  const [initialUserTz] = useState(() => userTimeZone);
  const [mountDate] = useState(() => new Date());

  const editingStartParts = useMemo(
    () =>
      editingRecord
        ? parseRecordDateParts(editingRecord.startTime, initialUserTz)
        : null,
    [editingRecord, initialUserTz],
  );
  const editingEndParts = useMemo(
    () =>
      editingRecord
        ? parseRecordDateParts(editingRecord.endTime, initialUserTz)
        : null,
    [editingRecord, initialUserTz],
  );
  const editingOldDurationSeconds = useMemo(
    () => (editingRecord ? resolveRecordDurationSeconds(editingRecord) : 0),
    [editingRecord],
  );
  const editingInitialDurationMinutes = useMemo(() => {
    if (!editingRecord) return 0;
    return Math.max(
      1,
      editingRecord.durationMinutes ||
        Math.round(editingOldDurationSeconds / 60) ||
        1,
    );
  }, [editingRecord, editingOldDurationSeconds]);

  const selectableActivities = useMemo(() => {
    const base = isPremium
      ? activities
      : activities.slice(0, MAX_FOCUS_ACTIVITIES_FREE);
    if (
      editingRecord?.focusActivityId &&
      !base.some((a) => a.id === editingRecord.focusActivityId)
    ) {
      const existingAct = activities.find(
        (a) => a.id === editingRecord.focusActivityId,
      );
      if (existingAct) {
        return [...base, existingAct];
      }
    }
    return base;
  }, [activities, isPremium, editingRecord?.focusActivityId]);

  const availableBackpackItems = useMemo(() => {
    const editingItemId = editingRecord?.inventoryItemId;
    const base = backpackItems.filter(
      (item) =>
        !isBackpackItemTimeDepleted(item.remainingSeconds) ||
        (editingItemId && item.inventoryItemId === editingItemId),
    );
    if (
      editingItemId &&
      !base.some((b) => b.inventoryItemId === editingItemId)
    ) {
      const fromAll = allInventoryItems.find(
        (item) => item.inventoryItemId === editingItemId,
      );
      if (fromAll) {
        return [...base, fromAll];
      }
      return [
        ...base,
        {
          inventoryItemId: editingItemId,
          rewardName: editingRecord?.itemName || t("defaultFocusItemName"),
          rewardIcon: editingRecord?.itemIcon,
          remainingSeconds: 0,
        } as InventoryItemResponseDTO,
      ];
    }
    return base;
  }, [
    backpackItems,
    allInventoryItems,
    editingRecord?.inventoryItemId,
    editingRecord?.itemName,
    editingRecord?.itemIcon,
    t,
  ]);

  const defaultInitActivity = !editingRecord
    ? (selectableActivities.find((a) => a.id === initialActivityId) ??
      selectableActivities[0])
    : undefined;

  const [targetType, setTargetType] = useState<"ACTIVITY" | "ITEM">(() => {
    if (editingRecord) {
      return editingRecord.inventoryItemId ? "ITEM" : "ACTIVITY";
    }
    return initialItemId ? "ITEM" : "ACTIVITY";
  });

  const [selectedActivityId, setSelectedActivityId] = useState<string>(() =>
    editingRecord
      ? (editingRecord.focusActivityId ?? "")
      : (defaultInitActivity?.id ?? ""),
  );

  const [selectedItemId, setSelectedItemId] = useState<string>(() => {
    if (editingRecord) {
      return editingRecord.inventoryItemId ?? "";
    }
    if (
      initialItemId &&
      availableBackpackItems.some((b) => b.inventoryItemId === initialItemId)
    ) {
      return initialItemId;
    }
    return availableBackpackItems[0]?.inventoryItemId ?? "";
  });

  const [selectedTaskId, setSelectedTaskId] = useState<string>(() =>
    editingRecord ? (editingRecord.taskId ?? "") : (initialTaskId ?? ""),
  );

  const [recordType, setRecordType] = useState<FocusRecordType>(() =>
    editingRecord
      ? editingRecord.recordType || "POMO"
      : defaultInitActivity?.recordType || "POMO",
  );

  const [durationMinutes, setDurationMinutes] = useState<number>(() => {
    if (editingRecord) {
      return editingInitialDurationMinutes;
    }
    if (initialItemId) {
      const item = availableBackpackItems.find(
        (b) => b.inventoryItemId === initialItemId,
      );
      const mins = getItemRemainingMinutes(item?.remainingSeconds);
      if (mins > 0) return mins;
    }
    return defaultInitActivity?.targetTimeMinutes || 35;
  });

  const [durationInput, setDurationInput] = useState<string>(() =>
    String(durationMinutes),
  );

  const [completedPomos, setCompletedPomos] = useState<number>(() => {
    if (editingRecord) {
      if (editingRecord.recordType === "POMO") {
        return editingRecord.completedPomos ?? 0;
      }
      return estimatePomosFromMinutes(editingInitialDurationMinutes);
    }
    if (
      defaultInitActivity?.targetTimeMinutes &&
      defaultInitActivity.targetTimeMinutes > 45
    ) {
      return estimatePomosFromMinutes(defaultInitActivity.targetTimeMinutes);
    }
    return 1;
  });

  const [sessionDate, setSessionDate] = useState<string>(
    () =>
      editingEndParts?.dateKey ?? getTodayDateString(mountDate, initialUserTz),
  );
  const [endTimeStr, setEndTimeStr] = useState<string>(
    () => editingEndParts?.timeHHMM ?? formatTimeHHMM(mountDate, initialUserTz),
  );
  const [startTimeStr, setStartTimeStr] = useState<string>(() => {
    if (editingStartParts) {
      return editingStartParts.timeHHMM;
    }
    const initialEnd = formatTimeHHMM(mountDate, initialUserTz);
    return computeTimeWindowFromDuration(initialEnd, durationMinutes)
      .startTimeStr;
  });
  const [notes, setNotes] = useState(() => editingRecord?.notes ?? "");

  const resolveItemEffectiveMinutes = useCallback(
    (
      itemId: string,
      itemsList: InventoryItemResponseDTO[] = availableBackpackItems,
    ): number => {
      const item = itemsList.find((b) => b.inventoryItemId === itemId);
      if (!item) return 0;
      if (
        isEditMode &&
        editingRecord?.inventoryItemId &&
        itemId === editingRecord.inventoryItemId
      ) {
        if (
          item.remainingSeconds !== undefined &&
          item.remainingSeconds !== null
        ) {
          const effectiveSeconds =
            Math.max(0, item.remainingSeconds) + editingOldDurationSeconds;
          return Math.max(1, Math.floor(effectiveSeconds / 60));
        }
        return 0;
      }
      return getItemRemainingMinutes(item.remainingSeconds);
    },
    [
      availableBackpackItems,
      isEditMode,
      editingRecord?.inventoryItemId,
      editingOldDurationSeconds,
    ],
  );

  const selectedItem = useMemo(() => {
    return availableBackpackItems.find(
      (b) => b.inventoryItemId === selectedItemId,
    );
  }, [availableBackpackItems, selectedItemId]);

  const selectedItemMinutes = useMemo(
    () => resolveItemEffectiveMinutes(selectedItemId),
    [resolveItemEffectiveMinutes, selectedItemId],
  );

  const selectedActivity = useMemo(() => {
    return selectableActivities.find((a) => a.id === selectedActivityId);
  }, [selectableActivities, selectedActivityId]);

  const syncPomosFromMinutes = (
    mins: number,
    overrideRecordType?: FocusRecordType,
  ) => {
    const activeRecordType = overrideRecordType ?? recordType;
    if (activeRecordType === "POMO") {
      setCompletedPomos(estimatePomosFromMinutes(mins));
    }
  };

  const applyDurationAndPomos = (
    mins: number,
    overrideRecordType?: FocusRecordType,
  ) => {
    setDurationMinutes(mins);
    setDurationInput(String(mins));
    syncPomosFromMinutes(mins, overrideRecordType);
  };

  const resolveMaxDurationLimit = (
    overrideMaxDuration?: number,
    overrideTargetType?: "ACTIVITY" | "ITEM",
  ) => {
    if (overrideMaxDuration && overrideMaxDuration > 0) {
      return overrideMaxDuration;
    }
    const activeTargetType = overrideTargetType ?? targetType;
    if (activeTargetType === "ITEM" && selectedItemMinutes > 0) {
      return selectedItemMinutes;
    }
    return MAX_MANUAL_FOCUS_MINUTES;
  };

  const syncDurationWithWindow = (
    nextDuration: number,
    overrideRecordType?: FocusRecordType,
    overrideMaxDuration?: number,
    overrideTargetType?: "ACTIVITY" | "ITEM",
  ) => {
    const maxLimit = resolveMaxDurationLimit(
      overrideMaxDuration,
      overrideTargetType,
    );
    const clamped = Math.max(0, Math.min(maxLimit, nextDuration));
    setDurationMinutes(clamped);
    setDurationInput(String(clamped));
    if (clamped >= 1) {
      const window = computeTimeWindowFromDuration(endTimeStr, clamped);
      setStartTimeStr(window.startTimeStr);
      setEndTimeStr(window.endTimeStr);
      syncPomosFromMinutes(clamped, overrideRecordType);
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
    syncDurationWithWindow(parsed);
  };

  const handleDurationStep = (delta: number) => {
    syncDurationWithWindow(Math.max(1, durationMinutes + delta));
  };

  const handleStartTimeChange = (nextStart: string) => {
    const startMins = parseTimeToMinutes(nextStart);
    const endMins = parseTimeToMinutes(endTimeStr);
    if (startMins === null || endMins === null) {
      setStartTimeStr(nextStart);
      return;
    }

    const maxLimit = resolveMaxDurationLimit();
    if (endMins > startMins) {
      const rawDiff = endMins - startMins;
      if (rawDiff > maxLimit) {
        setStartTimeStr(nextStart);
        setEndTimeStr(minutesToTimeHHMM(startMins + maxLimit));
        applyDurationAndPomos(maxLimit);
      } else {
        setStartTimeStr(nextStart);
        applyDurationAndPomos(rawDiff);
      }
      return;
    }

    if (startMins >= 1439) {
      setStartTimeStr(minutesToTimeHHMM(1438));
      setEndTimeStr(minutesToTimeHHMM(1439));
      applyDurationAndPomos(1);
      return;
    }

    const desiredDuration = Math.max(
      1,
      Math.min(maxLimit, durationMinutes || 1),
    );
    const nextEndMins = Math.min(1439, startMins + desiredDuration);
    setStartTimeStr(nextStart);
    setEndTimeStr(minutesToTimeHHMM(nextEndMins));
    applyDurationAndPomos(nextEndMins - startMins);
  };

  const handleEndTimeChange = (nextEnd: string) => {
    const startMins = parseTimeToMinutes(startTimeStr);
    const endMins = parseTimeToMinutes(nextEnd);
    if (startMins === null || endMins === null) {
      setEndTimeStr(nextEnd);
      return;
    }

    const maxLimit = resolveMaxDurationLimit();
    if (endMins > startMins) {
      const rawDiff = endMins - startMins;
      if (rawDiff > maxLimit) {
        setStartTimeStr(minutesToTimeHHMM(endMins - maxLimit));
        setEndTimeStr(nextEnd);
        applyDurationAndPomos(maxLimit);
      } else {
        setEndTimeStr(nextEnd);
        applyDurationAndPomos(rawDiff);
      }
      return;
    }

    if (endMins <= 0) {
      setStartTimeStr(minutesToTimeHHMM(0));
      setEndTimeStr(minutesToTimeHHMM(1));
      applyDurationAndPomos(1);
      return;
    }

    const desiredDuration = Math.max(
      1,
      Math.min(maxLimit, durationMinutes || 1),
    );
    const nextStartMins = Math.max(0, endMins - desiredDuration);
    setStartTimeStr(minutesToTimeHHMM(nextStartMins));
    setEndTimeStr(nextEnd);
    applyDurationAndPomos(endMins - nextStartMins);
  };

  const maxDate = useMemo(() => {
    return getTodayDateString(new Date(), userTimeZone);
  }, [userTimeZone]);

  // Minutos elegíveis já contabilizados na data selecionada (excluindo o registro em edição)
  const priorFocusMinutesForDate = useMemo(() => {
    const filteredRecords = editingRecord
      ? records.filter((r) => r.id !== editingRecord.id)
      : records;
    return calculateRewardableMinutesForDate(
      filteredRecords,
      sessionDate,
      userTimeZone,
      "endTime",
    );
  }, [records, editingRecord, sessionDate, userTimeZone]);

  const effectivePomoTargetMinutes = useMemo(() => {
    if (recordType !== "POMO") return undefined;
    if (
      editingRecord &&
      (editingRecord.focusActivityId ?? "") === selectedActivityId &&
      editingRecord.pomoTargetMinutes
    ) {
      return editingRecord.pomoTargetMinutes;
    }
    return selectedActivity?.targetTimeMinutes;
  }, [
    recordType,
    editingRecord,
    selectedActivityId,
    selectedActivity?.targetTimeMinutes,
  ]);

  const estimatedRewards = useMemo(() => {
    return calculateFocusRewardEstimate(
      targetType,
      recordType,
      durationMinutes,
      completedPomos,
      priorFocusMinutesForDate,
      locale,
      effectivePomoTargetMinutes,
      isGamified,
    );
  }, [
    targetType,
    recordType,
    durationMinutes,
    completedPomos,
    priorFocusMinutesForDate,
    locale,
    effectivePomoTargetMinutes,
    isGamified,
  ]);

  const rewardEstimate = useMemo(() => {
    const baseEstimate = toFocusRewardEstimate(
      estimatedRewards,
      {
        durationMinutes,
        completedPomos,
        recordType,
        locale,
      },
      locale,
    );

    if (!editingRecord || targetType !== "ACTIVITY") {
      return baseEstimate;
    }

    const oldXp = editingRecord.xpEarned ?? 0;
    const oldCoins = Number(editingRecord.coinsEarned ?? 0);
    const xpDelta = estimatedRewards.xp - oldXp;
    const coinsDelta =
      Math.round((estimatedRewards.coins - oldCoins) * 100) / 100;

    const deltaValue =
      xpDelta === 0 && coinsDelta === 0
        ? t("editDeltaNoChange")
        : isGamified
          ? `${formatSignedInt(xpDelta)} XP • ${formatSignedCoins(coinsDelta, locale)} 🪙`
          : `${formatSignedInt(xpDelta)} pts • ${formatSignedCoins(coinsDelta, locale)}`;

    const nextBreakdown = [
      ...(baseEstimate.breakdown ?? []),
      {
        label: t("editDeltaLabel"),
        value: deltaValue,
      },
    ];

    const nextNotices = [...(baseEstimate.notices ?? [])];
    if (xpDelta < 0 || coinsDelta < 0) {
      nextNotices.push({
        tone: "info",
        title: t("editNegativeAdjustmentTitle"),
        message: t(
          isGamified
            ? "editNegativeAdjustmentMessage"
            : "editNegativeAdjustmentMessageProductivity",
        ),
      });
    }

    return {
      ...baseEstimate,
      breakdown: nextBreakdown,
      notices: nextNotices,
    };
  }, [
    estimatedRewards,
    durationMinutes,
    completedPomos,
    recordType,
    locale,
    editingRecord,
    targetType,
    isGamified,
    t,
  ]);

  const handleTargetTypeChange = (type: "ACTIVITY" | "ITEM") => {
    if (isEditMode) return;
    setTargetType(type);
    if (type === "ITEM") {
      const item =
        availableBackpackItems.find(
          (b) => b.inventoryItemId === selectedItemId,
        ) ?? availableBackpackItems[0];
      if (item) {
        setSelectedItemId(item.inventoryItemId || "");
        const mins = getItemRemainingMinutes(item.remainingSeconds);
        if (mins > 0) syncDurationWithWindow(mins, recordType, mins, "ITEM");
      }
    } else if (durationMinutes > MAX_MANUAL_FOCUS_MINUTES) {
      syncDurationWithWindow(
        MAX_MANUAL_FOCUS_MINUTES,
        recordType,
        MAX_MANUAL_FOCUS_MINUTES,
        "ACTIVITY",
      );
    }
  };

  const handleSelectActivity = (actId: string) => {
    setSelectedActivityId(actId);
    if (isEditMode) {
      return;
    }
    const act = selectableActivities.find((a) => a.id === actId);
    if (act?.recordType) {
      setRecordType(act.recordType);
    }
    if (act?.targetTimeMinutes) {
      syncDurationWithWindow(
        act.targetTimeMinutes,
        act.recordType ?? recordType,
        MAX_MANUAL_FOCUS_MINUTES,
        "ACTIVITY",
      );
    }
  };

  const handleSelectBackpackItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const itemMins = resolveItemEffectiveMinutes(itemId);
    if (isEditMode) {
      if (itemMins > 0 && durationMinutes > itemMins) {
        syncDurationWithWindow(itemMins, recordType, itemMins, "ITEM");
      }
      return;
    }
    if (itemMins > 0) {
      syncDurationWithWindow(itemMins, recordType, itemMins, "ITEM");
    }
  };

  const handleRecordTypeChange = (nextType: FocusRecordType) => {
    setRecordType(nextType);
    if (nextType === "POMO" && completedPomos <= 0 && durationMinutes > 0) {
      syncPomosFromMinutes(durationMinutes, "POMO");
    }
  };

  const handlePresetSelect = (minutes: number) => {
    syncDurationWithWindow(minutes);
  };

  const handleDurationChange = (minutes: number) => {
    syncDurationWithWindow(minutes);
  };

  const handleCompletedPomosStep = (delta: number) => {
    const minPomos = isEditMode ? 0 : 1;
    setCompletedPomos((prev) => Math.max(minPomos, Math.min(50, prev + delta)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      targetType === "ACTIVITY" &&
      !isOrphanedFreeSession &&
      !selectedActivityId &&
      !selectedTaskId
    ) {
      toast.error(t("toasts.selectActivityRequired"));
      return;
    }

    if (targetType === "ITEM" && !selectedItemId) {
      toast.error(
        t(isGamified ? "toasts.noBackpackItems" : "toasts.noInventoryItems"),
      );
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

    if (targetType === "ACTIVITY") {
      const now = new Date();
      const activeTz = useUserStore.getState().user?.timezone;
      const todayStr = getTodayDateString(now, activeTz);
      const baseDateStr = sessionDate || todayStr;
      if (baseDateStr > todayStr) {
        toast.error(t("toasts.futureDateNotAllowed"));
        return;
      }
      if (baseDateStr === todayStr) {
        const endMins = parseTimeToMinutes(endTimeStr);
        const nowParts = getDatePartsInTimeZone(now, activeTz);
        const nowMins = nowParts.hour * 60 + nowParts.minute;
        if (endMins !== null && endMins > nowMins) {
          toast.error(t("toasts.futureEndTimeNotAllowed"));
          return;
        }
      }
    }

    startTransition(async () => {
      try {
        const now = new Date();
        const activeTz = useUserStore.getState().user?.timezone;
        let startTime: string;
        let endTime: string;
        const todayDateKey = getTodayDateString(now, activeTz);
        let isSessionToday = true;

        const isEditingSameTimeWindow = Boolean(
          editingRecord &&
            editingStartParts &&
            editingEndParts &&
            sessionDate === editingEndParts.dateKey &&
            startTimeStr === editingStartParts.timeHHMM &&
            endTimeStr === editingEndParts.timeHHMM &&
            durationMinutes === editingInitialDurationMinutes,
        );

        if (targetType === "ITEM") {
          if (
            editingRecord &&
            durationMinutes === editingInitialDurationMinutes &&
            editingStartParts &&
            editingEndParts
          ) {
            startTime = editingStartParts.wallIso;
            endTime = editingEndParts.wallIso;
          } else if (editingRecord && editingEndParts) {
            endTime = editingEndParts.wallIso;
            const durationMs = durationMinutes * 60 * 1000;
            if (editingEndParts.hasExplicitTz && editingEndParts.timestampMs) {
              startTime = toLocalISOString(
                new Date(editingEndParts.timestampMs - durationMs),
                activeTz,
              );
            } else {
              const endWallMs = parseWallIsoToUtcMs(editingEndParts.wallIso);
              startTime =
                endWallMs !== null
                  ? formatWallUtc(new Date(endWallMs - durationMs))
                  : toLocalISOString(
                      new Date(now.getTime() - durationMs),
                      activeTz,
                    );
            }
          } else {
            endTime = toLocalISOString(now, activeTz);
            startTime = toLocalISOString(
              new Date(now.getTime() - durationMinutes * 60 * 1000),
              activeTz,
            );
          }
        } else if (
          isEditingSameTimeWindow &&
          editingStartParts &&
          editingEndParts
        ) {
          startTime = editingStartParts.wallIso;
          endTime = editingEndParts.wallIso;
          isSessionToday = editingEndParts.dateKey === todayDateKey;
        } else {
          const baseDateStr = sessionDate || todayDateKey;
          isSessionToday = baseDateStr === todayDateKey;
          const [y, m, d] = baseDateStr.split("-").map(Number);
          const startMins = parseTimeToMinutes(startTimeStr);
          const endMins = parseTimeToMinutes(endTimeStr);

          if (startMins !== null && endMins !== null && endMins > startMins) {
            startTime = formatWallUtc(
              new Date(
                Date.UTC(
                  y,
                  m - 1,
                  d,
                  Math.floor(startMins / 60),
                  startMins % 60,
                  0,
                ),
              ),
            );
            endTime = formatWallUtc(
              new Date(
                Date.UTC(
                  y,
                  m - 1,
                  d,
                  Math.floor(endMins / 60),
                  endMins % 60,
                  0,
                ),
              ),
            );
          } else {
            const nowParts = getDatePartsInTimeZone(now, activeTz);
            const fallbackEndMins =
              endMins ?? nowParts.hour * 60 + nowParts.minute;
            const endUtc = new Date(
              Date.UTC(
                y,
                m - 1,
                d,
                Math.floor(fallbackEndMins / 60),
                fallbackEndMins % 60,
                0,
              ),
            );
            const startUtc = new Date(
              endUtc.getTime() - durationMinutes * 60 * 1000,
            );
            startTime = formatWallUtc(startUtc);
            endTime = formatWallUtc(endUtc);
          }
        }

        const resolvedCompletedPomos =
          targetType !== "ITEM" && recordType === "POMO" ? completedPomos : 0;
        const resolvedPomoTargetMinutes =
          targetType !== "ITEM" && recordType === "POMO"
            ? effectivePomoTargetMinutes
            : undefined;

        if (editingRecord) {
          const res = await updateFocusRecord(editingRecord.id, {
            focusActivityId:
              targetType === "ACTIVITY" && selectedActivityId
                ? selectedActivityId
                : undefined,
            taskId:
              targetType === "ACTIVITY" && selectedTaskId
                ? selectedTaskId
                : undefined,
            inventoryItemId: targetType === "ITEM" ? selectedItemId : undefined,
            recordType: targetType === "ITEM" ? "STOPWATCH" : recordType,
            completedPomos: resolvedCompletedPomos,
            pomoTargetMinutes: resolvedPomoTargetMinutes,
            startTime,
            endTime,
            notes: notes.trim(),
          });

          if (res.success && res.data) {
            const matchedActivity =
              targetType === "ACTIVITY" && selectedActivityId
                ? selectableActivities.find((a) => a.id === selectedActivityId)
                : undefined;
            const matchedItem =
              targetType === "ITEM" && selectedItemId
                ? availableBackpackItems.find(
                    (b) => b.inventoryItemId === selectedItemId,
                  )
                : undefined;
            const mappedUpdated = mapFocusRecordDtoToRecord(
              res.data,
              matchedActivity,
              activeTz,
              matchedItem,
            );

            const oldTaskId = editingRecord.taskId;
            const newTaskId =
              targetType === "ACTIVITY" && selectedTaskId
                ? selectedTaskId
                : undefined;
            const oldTaskMins = Math.max(1, editingRecord.durationMinutes);
            const oldTaskPomos = editingRecord.completedPomos ?? 0;
            const newTaskMins = Math.max(
              1,
              Number(res.data.durationMinutes ?? durationMinutes),
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
                Number(res.data.durationMinutes ?? durationMinutes),
              );
              const todayFocusDelta =
                (isSessionToday ? newFocusMins : 0) -
                (wasOnToday ? oldFocusMins : 0);
              if (todayFocusDelta !== 0) {
                useUserStore
                  .getState()
                  .adjustFocusMinutesToday(todayFocusDelta, todayDateKey);
              }

              const oldXp = editingRecord.xpEarned ?? 0;
              const oldCoins = Number(editingRecord.coinsEarned ?? 0);
              const newXp = Number(res.data.xpEarned ?? 0);
              const newCoins = Number(res.data.coinsEarned ?? 0);
              const xpDelta = newXp - oldXp;
              const coinsDelta = Math.round((newCoins - oldCoins) * 100) / 100;

              let didLevelUp = false;
              if (xpDelta > 0 || coinsDelta > 0) {
                const rewardResult = awardUserRewards(
                  Math.max(0, xpDelta),
                  Math.max(0, coinsDelta),
                );
                didLevelUp = rewardResult.didLevelUp;
              }
              if (xpDelta < 0 || coinsDelta < 0) {
                deductUserPenalty(
                  Math.max(0, -xpDelta),
                  Math.max(0, -coinsDelta),
                );
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
            onRecordUpdated?.(mappedUpdated);
            onSuccess?.();
            onClose();
          } else {
            toast.error(
              (!res.success ? res.error : undefined) ||
                t("toasts.updateFailed"),
            );
          }
          return;
        }

        const res = await createFocusRecord({
          focusActivityId:
            targetType === "ACTIVITY" && selectedActivityId
              ? selectedActivityId
              : undefined,
          taskId:
            targetType === "ACTIVITY" && selectedTaskId
              ? selectedTaskId
              : undefined,
          inventoryItemId: targetType === "ITEM" ? selectedItemId : undefined,
          recordType: targetType === "ITEM" ? "STOPWATCH" : recordType,
          completedPomos: resolvedCompletedPomos,
          pomoTargetMinutes: resolvedPomoTargetMinutes,
          startTime,
          endTime,
          notes: notes.trim() || undefined,
        });

        if (res.success) {
          const xp = Number(res.data?.xpEarned ?? 0);
          const coins = Number(res.data?.coinsEarned ?? 0);

          if (targetType === "ACTIVITY" && selectedTaskId) {
            dispatchTaskFocusRecorded({
              taskId: selectedTaskId,
              durationMinutes: Math.max(
                1,
                Number(res.data?.durationMinutes ?? durationMinutes),
              ),
              cycles: resolvedCompletedPomos,
            });
          }

          if (targetType === "ACTIVITY") {
            const rewardResult = awardUserRewards(xp, coins);
            if (isSessionToday) {
              const savedDuration = Math.max(
                1,
                Number(res.data?.durationMinutes ?? durationMinutes),
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
    isEditMode,
    isOrphanedFreeSession,
    isPremium,
    selectableActivities,
    availableBackpackItems,
    targetType,
    handleTargetTypeChange,
    selectedActivityId,
    handleSelectActivity,
    selectedTaskId,
    setSelectedTaskId,
    selectedItemId,
    handleSelectBackpackItem,
    recordType,
    setRecordType: handleRecordTypeChange,
    durationMinutes,
    durationInput,
    handleDurationInputChange,
    handleDurationStep,
    setDurationMinutes: handleDurationChange,
    startTimeStr,
    endTimeStr,
    handleStartTimeChange,
    handleEndTimeChange,
    completedPomos,
    setCompletedPomos,
    maxDate,
    sessionDate,
    setSessionDate,
    notes,
    setNotes,
    isSubmitting: isPending,
    selectedItem,
    selectedItemMinutes,
    resolveItemEffectiveMinutes,
    selectedActivity,
    rewardEstimate,
    handlePresetSelect,
    handleCompletedPomosStep,
    handleSubmit,
  };
}
