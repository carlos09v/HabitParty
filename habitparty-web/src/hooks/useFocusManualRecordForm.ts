"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import {
  MAX_FOCUS_ACTIVITIES_FREE,
  MAX_MANUAL_FOCUS_MINUTES,
} from "@/constants/focusRules";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFocusManualSubmission } from "@/hooks/useFocusManualSubmission";
import { useFocusManualTimeWindow } from "@/hooks/useFocusManualTimeWindow";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActivity,
  FocusableTaskItem,
  FocusRecord,
  FocusRecordType,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import { calculateRewardableMinutesForDate } from "@/utils/focusDailyYield";
import {
  getItemRemainingMinutes,
  isBackpackItemTimeDepleted,
} from "@/utils/focusFormatters";
import {
  formatSignedCoins,
  formatSignedInt,
} from "@/utils/focusRecordPostSave";
import {
  estimatePomosFromMinutes,
  parseRecordDateParts,
  resolveItemEffectiveMinutesHelper,
  resolveRecordDurationSeconds,
} from "@/utils/focusRecordTimeWindow";
import {
  calculateFocusRewardEstimate,
  toFocusRewardEstimate,
} from "@/utils/focusRewards";

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

/**
 * Orquestrador do formulário de inserção e edição manual de foco.
 * Compõe `useFocusManualTimeWindow` (duração/janela/meia-noite) e `useFocusManualSubmission`
 * (validação inline acessível + persistência).
 */
export function useFocusManualRecordForm({
  activities,
  backpackItems,
  allInventoryItems = [],
  focusableTasks = [],
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

  const isEditMode = Boolean(editingRecord);
  const isOrphanedFreeSession = Boolean(
    editingRecord &&
      !editingRecord.inventoryItemId &&
      !editingRecord.focusActivityId &&
      !editingRecord.taskId,
  );

  const editingStartParts = editingRecord
    ? parseRecordDateParts(editingRecord.startTime, userTimeZone)
    : null;
  const editingEndParts = editingRecord
    ? parseRecordDateParts(editingRecord.endTime, userTimeZone)
    : null;
  const editingOldDurationSeconds = editingRecord
    ? resolveRecordDurationSeconds(editingRecord)
    : 0;
  const editingInitialDurationMinutes = editingRecord
    ? Math.max(
        1,
        editingRecord.durationMinutes ||
          Math.round(editingOldDurationSeconds / 60) ||
          1,
      )
    : 0;

  const selectableActivities = (() => {
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
  })();

  const availableBackpackItems = (() => {
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
  })();

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

  const [selectedActivityId, setSelectedActivityId] = useState<string>(() => {
    if (editingRecord) {
      return editingRecord.focusActivityId ?? "";
    }
    if (initialTaskId && !initialActivityId) {
      return "";
    }
    return defaultInitActivity?.id ?? "";
  });

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

  const [notes, setNotes] = useState(() => editingRecord?.notes ?? "");

  const resolveItemEffectiveMinutes = (
    itemId: string,
    itemsList: InventoryItemResponseDTO[] = availableBackpackItems,
  ): number =>
    resolveItemEffectiveMinutesHelper({
      itemId,
      itemsList,
      isEditMode,
      editingRecord,
      editingOldDurationSeconds,
    });

  const selectedItem = availableBackpackItems.find(
    (b) => b.inventoryItemId === selectedItemId,
  );
  const selectedItemMinutes = resolveItemEffectiveMinutes(selectedItemId);
  const selectedActivity = selectableActivities.find(
    (a) => a.id === selectedActivityId,
  );

  const initialDurationMinutes = (() => {
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
  })();

  const initialCompletedPomos = (() => {
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
  })();

  const timeWindow = useFocusManualTimeWindow({
    userTimeZone,
    targetType,
    recordType,
    selectedItemMinutes,
    isEditMode,
    editingRecord,
    editingStartParts,
    editingEndParts,
    editingInitialDurationMinutes,
    initialDurationMinutes,
    initialCompletedPomos,
  });

  const filteredRecordsForYield = editingRecord
    ? records.filter((r) => r.id !== editingRecord.id)
    : records;
  const priorFocusMinutesForDate = calculateRewardableMinutesForDate(
    filteredRecordsForYield,
    timeWindow.sessionDate,
    userTimeZone,
    "endTime",
  );

  const effectivePomoTargetMinutes = (() => {
    if (recordType !== "POMO") return undefined;
    if (
      editingRecord &&
      (editingRecord.focusActivityId ?? "") === selectedActivityId &&
      editingRecord.pomoTargetMinutes
    ) {
      return editingRecord.pomoTargetMinutes;
    }
    return selectedActivity?.targetTimeMinutes;
  })();

  const estimatedRewards = calculateFocusRewardEstimate(
    targetType,
    recordType,
    timeWindow.durationMinutes,
    timeWindow.completedPomos,
    priorFocusMinutesForDate,
    locale,
    effectivePomoTargetMinutes,
    isGamified,
  );

  const rewardEstimate = (() => {
    const baseEstimate = toFocusRewardEstimate(
      estimatedRewards,
      {
        durationMinutes: timeWindow.durationMinutes,
        completedPomos: timeWindow.completedPomos,
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
          ? `${formatSignedInt(xpDelta)} XP • ${formatSignedCoins(coinsDelta, locale)} ${t("coinsUnitShort")}`
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
  })();

  const translator = (key: string, values?: Record<string, string | number>) =>
    t(key as never, values as never);

  const submission = useFocusManualSubmission({
    t: translator,
    locale,
    isGamified,
    userTimeZone,
    targetType,
    isOrphanedFreeSession,
    hasFocusableTasks: focusableTasks.length > 0,
    selectedActivityId,
    selectedTaskId,
    selectedItemId,
    selectedItemMinutes,
    selectableActivities,
    availableBackpackItems,
    recordType,
    durationMinutes: timeWindow.durationMinutes,
    completedPomos: timeWindow.completedPomos,
    effectivePomoTargetMinutes,
    sessionDate: timeWindow.sessionDate,
    startTimeStr: timeWindow.startTimeStr,
    endTimeStr: timeWindow.endTimeStr,
    notes,
    maxLimit: timeWindow.resolveMaxDurationLimit(),
    editingRecord,
    editingStartParts,
    editingEndParts,
    editingInitialDurationMinutes,
    onSuccess,
    onRecordUpdated,
    onClose,
  });

  const handleTargetTypeChange = (type: "ACTIVITY" | "ITEM") => {
    if (isEditMode) return;
    submission.resetValidation();
    setTargetType(type);
    if (type === "ITEM") {
      const item =
        availableBackpackItems.find(
          (b) => b.inventoryItemId === selectedItemId,
        ) ?? availableBackpackItems[0];
      if (item) {
        setSelectedItemId(item.inventoryItemId || "");
        const mins = getItemRemainingMinutes(item.remainingSeconds);
        if (mins > 0) {
          timeWindow.syncDurationWithWindow(mins, recordType, mins, "ITEM");
        }
      }
    } else if (timeWindow.durationMinutes > MAX_MANUAL_FOCUS_MINUTES) {
      timeWindow.syncDurationWithWindow(
        MAX_MANUAL_FOCUS_MINUTES,
        recordType,
        MAX_MANUAL_FOCUS_MINUTES,
        "ACTIVITY",
      );
    }
  };

  const handleSelectActivity = (actId: string) => {
    setSelectedActivityId(actId);
    if (isEditMode) return;
    const act = selectableActivities.find((a) => a.id === actId);
    if (act?.recordType) {
      setRecordType(act.recordType);
    }
    if (act?.targetTimeMinutes) {
      timeWindow.syncDurationWithWindow(
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
      if (itemMins > 0 && timeWindow.durationMinutes > itemMins) {
        timeWindow.syncDurationWithWindow(
          itemMins,
          recordType,
          itemMins,
          "ITEM",
        );
      }
      return;
    }
    if (itemMins > 0) {
      timeWindow.syncDurationWithWindow(itemMins, recordType, itemMins, "ITEM");
    }
  };

  const handleRecordTypeChange = (nextType: FocusRecordType) => {
    setRecordType(nextType);
    if (
      nextType === "POMO" &&
      timeWindow.completedPomos <= 0 &&
      timeWindow.durationMinutes > 0
    ) {
      timeWindow.syncPomosFromMinutes(timeWindow.durationMinutes, "POMO");
    }
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
    durationMinutes: timeWindow.durationMinutes,
    durationInput: timeWindow.durationInput,
    handleDurationInputChange: timeWindow.handleDurationInputChange,
    handleDurationStep: timeWindow.handleDurationStep,
    setDurationMinutes: timeWindow.handleDurationChange,
    startTimeStr: timeWindow.startTimeStr,
    endTimeStr: timeWindow.endTimeStr,
    crossesMidnight: timeWindow.crossesMidnight,
    handleStartTimeChange: timeWindow.handleStartTimeChange,
    handleEndTimeChange: timeWindow.handleEndTimeChange,
    completedPomos: timeWindow.completedPomos,
    setCompletedPomos: timeWindow.setCompletedPomos,
    maxDate: timeWindow.maxDate,
    sessionDate: timeWindow.sessionDate,
    setSessionDate: timeWindow.setSessionDate,
    notes,
    setNotes,
    isSubmitting: submission.isSubmitting,
    fieldErrors: submission.fieldErrors,
    selectedItem,
    selectedItemMinutes,
    resolveItemEffectiveMinutes,
    selectedActivity,
    rewardEstimate,
    handlePresetSelect: timeWindow.handlePresetSelect,
    handleCompletedPomosStep: timeWindow.handleCompletedPomosStep,
    handleSubmit: submission.handleSubmit,
  };
}
