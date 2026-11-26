"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createFocusRecord, updateFocusRecord } from "@/actions/focusActions";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActivity,
  FocusRecord,
  FocusRecordType,
} from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import {
  getDatePartsInTimeZone,
  getTodayDateString,
  parseTimeToMinutes,
} from "@/utils/date";
import { mapFocusRecordDtoToRecord } from "@/utils/focusMapper";
import {
  applyCreatedFocusRecordSideEffects,
  applyUpdatedFocusRecordSideEffects,
} from "@/utils/focusRecordPostSave";
import {
  buildManualRecordTimestamps,
  type ParsedRecordDateParts,
} from "@/utils/focusRecordTimeWindow";

export interface ManualRecordFieldErrors {
  target?: string;
  duration?: string;
  sessionDate?: string;
  endTime?: string;
}

interface UseFocusManualSubmissionParams {
  t: (key: string, values?: Record<string, string | number>) => string;
  locale: AppLocale;
  isGamified: boolean;
  userTimeZone?: string | null;
  targetType: "ACTIVITY" | "ITEM";
  isOrphanedFreeSession: boolean;
  hasFocusableTasks: boolean;
  selectedActivityId: string;
  selectedTaskId: string;
  selectedItemId: string;
  selectedItemMinutes: number;
  selectableActivities: FocusActivity[];
  availableBackpackItems: InventoryItemResponseDTO[];
  recordType: FocusRecordType;
  durationMinutes: number;
  completedPomos: number;
  effectivePomoTargetMinutes?: number;
  sessionDate: string;
  startTimeStr: string;
  endTimeStr: string;
  notes: string;
  maxLimit: number;
  editingRecord: FocusRecord | null;
  editingStartParts: ParsedRecordDateParts | null;
  editingEndParts: ParsedRecordDateParts | null;
  editingInitialDurationMinutes: number;
  onSuccess?: () => void;
  onRecordUpdated?: (updatedRecord: FocusRecord) => void;
  onClose: () => void;
}

/**
 * Gerencia validação inline acessível, foco no primeiro campo inválido
 * e submissão (criação/edição) do registro manual de foco.
 */
export function useFocusManualSubmission({
  t,
  locale,
  isGamified,
  userTimeZone,
  targetType,
  isOrphanedFreeSession,
  hasFocusableTasks,
  selectedActivityId,
  selectedTaskId,
  selectedItemId,
  selectedItemMinutes,
  selectableActivities,
  availableBackpackItems,
  recordType,
  durationMinutes,
  completedPomos,
  effectivePomoTargetMinutes,
  sessionDate,
  startTimeStr,
  endTimeStr,
  notes,
  maxLimit,
  editingRecord,
  editingStartParts,
  editingEndParts,
  editingInitialDurationMinutes,
  onSuccess,
  onRecordUpdated,
  onClose,
}: UseFocusManualSubmissionParams) {
  const [isPending, startTransition] = useTransition();
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const computeValidationErrors = (
    referenceNow: Date,
    activeTz?: string | null,
  ): ManualRecordFieldErrors => {
    const errors: ManualRecordFieldErrors = {};

    if (
      targetType === "ACTIVITY" &&
      !isOrphanedFreeSession &&
      !selectedActivityId &&
      !selectedTaskId
    ) {
      errors.target = t(
        hasFocusableTasks
          ? "toasts.selectActivityOrTaskRequired"
          : "toasts.selectActivityRequired",
      );
    }

    if (targetType === "ITEM" && !selectedItemId) {
      errors.target = t(
        isGamified ? "toasts.noBackpackItems" : "toasts.noInventoryItems",
      );
    }

    if (durationMinutes <= 0) {
      errors.duration = t("toasts.invalidDuration");
    } else if (
      targetType === "ITEM" &&
      selectedItemMinutes > 0 &&
      durationMinutes > selectedItemMinutes
    ) {
      errors.duration = t("toasts.exceedsItemBalance", {
        minutes: selectedItemMinutes,
      });
    }

    if (targetType === "ACTIVITY") {
      const todayStr = getTodayDateString(referenceNow, activeTz);
      const baseDateStr = sessionDate || todayStr;
      if (baseDateStr > todayStr) {
        errors.sessionDate = t("toasts.futureDateNotAllowed");
      } else if (baseDateStr === todayStr) {
        const endMins = parseTimeToMinutes(endTimeStr);
        const nowParts = getDatePartsInTimeZone(referenceNow, activeTz);
        const nowMins = nowParts.hour * 60 + nowParts.minute;
        if (endMins !== null && endMins > nowMins) {
          errors.endTime = t("toasts.futureEndTimeNotAllowed");
        }
      }
    }

    return errors;
  };

  const fieldErrors: ManualRecordFieldErrors = hasAttemptedSubmit
    ? computeValidationErrors(new Date(), userTimeZone)
    : {};

  const resetValidation = () => setHasAttemptedSubmit(false);

  const focusFirstInvalidField = (errors: ManualRecordFieldErrors) => {
    let targetId: string | null = null;
    if (errors.target) {
      targetId = targetType === "ITEM" ? "select-item" : "select-activity";
    } else if (errors.duration) {
      targetId = "duration-minutes";
    } else if (errors.sessionDate) {
      targetId = "session-date";
    } else if (errors.endTime) {
      targetId = "session-end-time";
    }

    if (targetId) {
      const idToFocus = targetId;
      window.requestAnimationFrame(() => {
        document.getElementById(idToFocus)?.focus();
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const activeTz = useUserStore.getState().user?.timezone ?? userTimeZone;
    const errors = computeValidationErrors(now, activeTz);

    if (Object.keys(errors).length > 0) {
      setHasAttemptedSubmit(true);
      focusFirstInvalidField(errors);
      return;
    }

    startTransition(async () => {
      try {
        const submitNow = new Date();
        const submitTz = useUserStore.getState().user?.timezone ?? activeTz;
        const { startTime, endTime, todayDateKey, isSessionToday } =
          buildManualRecordTimestamps({
            now: submitNow,
            activeTz: submitTz,
            targetType,
            sessionDate,
            startTimeStr,
            endTimeStr,
            durationMinutes,
            maxLimit,
            editingRecord,
            editingStartParts,
            editingEndParts,
            editingInitialDurationMinutes,
          });

        const resolvedCompletedPomos =
          targetType !== "ITEM" && recordType === "POMO" ? completedPomos : 0;
        const resolvedPomoTargetMinutes =
          targetType !== "ITEM" && recordType === "POMO"
            ? effectivePomoTargetMinutes
            : undefined;

        const basePayload = {
          focusActivityId:
            targetType === "ACTIVITY" && selectedActivityId
              ? selectedActivityId
              : undefined,
          taskId:
            targetType === "ACTIVITY" && selectedTaskId
              ? selectedTaskId
              : undefined,
          inventoryItemId: targetType === "ITEM" ? selectedItemId : undefined,
          recordType:
            targetType === "ITEM" ? ("STOPWATCH" as const) : recordType,
          completedPomos: resolvedCompletedPomos,
          pomoTargetMinutes: resolvedPomoTargetMinutes,
          startTime,
          endTime,
        };

        if (editingRecord) {
          const res = await updateFocusRecord(editingRecord.id, {
            ...basePayload,
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
              submitTz,
              matchedItem,
            );

            applyUpdatedFocusRecordSideEffects({
              editingRecord,
              resData: res.data,
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
            });

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
          ...basePayload,
          notes: notes.trim() || undefined,
        });

        if (res.success) {
          applyCreatedFocusRecordSideEffects({
            resData: res.data,
            targetType,
            selectedTaskId,
            durationMinutes,
            resolvedCompletedPomos,
            todayDateKey,
            isSessionToday,
            isGamified,
            locale,
            t,
          });
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
    isSubmitting: isPending,
    fieldErrors,
    resetValidation,
    handleSubmit,
  };
}
