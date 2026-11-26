"use client";

import { useState } from "react";
import { MAX_MANUAL_FOCUS_MINUTES } from "@/constants/focusRules";
import type { FocusRecord, FocusRecordType } from "@/types/focus";
import {
  computeTimeWindowFromDuration,
  formatTimeHHMM,
  getTodayDateString,
  minutesToTimeHHMM,
  parseTimeToMinutes,
} from "@/utils/date";
import {
  estimatePomosFromMinutes,
  type ParsedRecordDateParts,
  resolveStartEndDiffMinutes,
} from "@/utils/focusRecordTimeWindow";

interface UseFocusManualTimeWindowParams {
  userTimeZone?: string | null;
  targetType: "ACTIVITY" | "ITEM";
  recordType: FocusRecordType;
  selectedItemMinutes: number;
  isEditMode: boolean;
  editingRecord: FocusRecord | null;
  editingStartParts: ParsedRecordDateParts | null;
  editingEndParts: ParsedRecordDateParts | null;
  editingInitialDurationMinutes: number;
  initialDurationMinutes: number;
  initialCompletedPomos: number;
}

/**
 * Gerencia duração, ciclos Pomodoro, data e janela início/fim do registro manual,
 * suportando travessia de meia-noite sem empurrar o horário final para o futuro.
 */
export function useFocusManualTimeWindow({
  userTimeZone,
  targetType,
  recordType,
  selectedItemMinutes,
  isEditMode,
  editingRecord,
  editingStartParts,
  editingEndParts,
  initialDurationMinutes,
  initialCompletedPomos,
}: UseFocusManualTimeWindowParams) {
  const [mountDate] = useState(() => new Date());

  const [durationMinutes, setDurationMinutes] = useState<number>(
    initialDurationMinutes,
  );
  const [durationInput, setDurationInput] = useState<string>(() =>
    String(initialDurationMinutes),
  );
  const [completedPomos, setCompletedPomos] = useState<number>(
    initialCompletedPomos,
  );

  const [sessionDate, setSessionDate] = useState<string>(
    () =>
      editingEndParts?.dateKey ?? getTodayDateString(mountDate, userTimeZone),
  );
  const [endTimeStr, setEndTimeStr] = useState<string>(
    () => editingEndParts?.timeHHMM ?? formatTimeHHMM(mountDate, userTimeZone),
  );
  const [startTimeStr, setStartTimeStr] = useState<string>(() => {
    if (editingStartParts) {
      return editingStartParts.timeHHMM;
    }
    const initialEnd = formatTimeHHMM(mountDate, userTimeZone);
    return computeTimeWindowFromDuration(initialEnd, initialDurationMinutes)
      .startTimeStr;
  });

  const maxDate = getTodayDateString(new Date(), userTimeZone);

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
    if (Number.isNaN(parsed)) return;
    syncDurationWithWindow(parsed);
  };

  const handleDurationStep = (delta: number) => {
    syncDurationWithWindow(Math.max(1, durationMinutes + delta));
  };

  const applyTimeBoundaryChange = (
    boundary: "start" | "end",
    nextValue: string,
  ) => {
    const startMins = parseTimeToMinutes(
      boundary === "start" ? nextValue : startTimeStr,
    );
    const endMins = parseTimeToMinutes(
      boundary === "end" ? nextValue : endTimeStr,
    );

    if (startMins === null || endMins === null) {
      if (boundary === "start") {
        setStartTimeStr(nextValue);
      } else {
        setEndTimeStr(nextValue);
      }
      return;
    }

    const maxLimit = resolveMaxDurationLimit();
    const resolved = resolveStartEndDiffMinutes(startMins, endMins, maxLimit);
    if (resolved) {
      if (resolved.diffMinutes > maxLimit) {
        if (boundary === "start") {
          setStartTimeStr(nextValue);
          setEndTimeStr(minutesToTimeHHMM((startMins + maxLimit) % 1440));
        } else {
          setStartTimeStr(
            minutesToTimeHHMM((endMins - maxLimit + 1440) % 1440),
          );
          setEndTimeStr(nextValue);
        }
        applyDurationAndPomos(maxLimit);
      } else {
        if (boundary === "start") {
          setStartTimeStr(nextValue);
        } else {
          setEndTimeStr(nextValue);
        }
        applyDurationAndPomos(resolved.diffMinutes);
      }
      return;
    }

    const desiredDuration = Math.max(
      1,
      Math.min(maxLimit, durationMinutes || 1),
    );
    if (boundary === "start") {
      setStartTimeStr(nextValue);
      setEndTimeStr(minutesToTimeHHMM((startMins + desiredDuration) % 1440));
    } else {
      setStartTimeStr(
        minutesToTimeHHMM((endMins - desiredDuration + 1440) % 1440),
      );
      setEndTimeStr(nextValue);
    }
    applyDurationAndPomos(desiredDuration);
  };

  const handleStartTimeChange = (nextStart: string) =>
    applyTimeBoundaryChange("start", nextStart);

  const handleEndTimeChange = (nextEnd: string) =>
    applyTimeBoundaryChange("end", nextEnd);

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

  const crossesMidnight = (() => {
    if (targetType === "ITEM") return false;
    const startMins = parseTimeToMinutes(startTimeStr);
    const endMins = parseTimeToMinutes(endTimeStr);
    if (startMins === null || endMins === null) return false;
    return Boolean(
      resolveStartEndDiffMinutes(startMins, endMins, resolveMaxDurationLimit())
        ?.crossesMidnight,
    );
  })();

  // Quando o fuso do usuário hidrata depois da montagem na edição, mantém datas coerentes.
  const syncedSessionDate =
    editingRecord && !sessionDate
      ? (editingEndParts?.dateKey ?? maxDate)
      : sessionDate;

  return {
    durationMinutes,
    durationInput,
    completedPomos,
    setCompletedPomos,
    sessionDate: syncedSessionDate,
    setSessionDate,
    startTimeStr,
    endTimeStr,
    crossesMidnight,
    maxDate,
    resolveMaxDurationLimit,
    syncPomosFromMinutes,
    syncDurationWithWindow,
    handleDurationInputChange,
    handleDurationStep,
    handleStartTimeChange,
    handleEndTimeChange,
    handlePresetSelect,
    handleDurationChange,
    handleCompletedPomosStep,
  };
}
