import type { FocusRecord } from "@/types/focus";
import type { InventoryItemResponseDTO } from "@/types/inventory";
import {
  formatDateParts,
  formatTimeHHMM,
  getDateKeyInTimeZone,
  getDatePartsInTimeZone,
  getTodayDateString,
  hasTimeZoneSuffix,
  parseLocalDate,
  parseServerDate,
  parseTimeToMinutes,
  toLocalISOString,
} from "@/utils/date";
import {
  getItemRemainingMinutes,
  parseFocusTimestamp,
} from "@/utils/focusFormatters";

export interface ParsedRecordDateParts {
  dateKey: string;
  timeHHMM: string;
  wallIso: string;
  timestampMs: number | null;
  hasExplicitTz: boolean;
}

export function formatWallUtc(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${formatDateParts(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())}T${pad(dt.getUTCHours())}:${pad(dt.getUTCMinutes())}:${pad(dt.getUTCSeconds())}`;
}

export function parseWallIsoToUtcMs(wallIso: string): number | null {
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

export function parseRecordDateParts(
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

export function estimatePomosFromMinutes(mins: number): number {
  if (mins <= 45) return 1;
  if (mins <= 60) return 2;
  return Math.max(1, Math.round(mins / 30));
}

export function resolveRecordDurationSeconds(record: FocusRecord): number {
  const startParsed = parseFocusTimestamp(record.startTime);
  const endParsed = parseFocusTimestamp(record.endTime);
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
 * Calcula a diferença em minutos entre início e fim, suportando travessia de meia-noite
 * (ex: 23:30 → 00:15 = 45m) quando o intervalo noturno couber no limite máximo.
 */
export function resolveStartEndDiffMinutes(
  startMins: number,
  endMins: number,
  maxLimit: number,
): { diffMinutes: number; crossesMidnight: boolean } | null {
  if (endMins > startMins) {
    return { diffMinutes: endMins - startMins, crossesMidnight: false };
  }
  if (endMins < startMins) {
    const overnightDiff = 1440 - startMins + endMins;
    if (overnightDiff > 0 && overnightDiff <= maxLimit) {
      return { diffMinutes: overnightDiff, crossesMidnight: true };
    }
  }
  return null;
}

export function resolveItemEffectiveMinutesHelper(params: {
  itemId: string;
  itemsList: InventoryItemResponseDTO[];
  isEditMode: boolean;
  editingRecord?: FocusRecord | null;
  editingOldDurationSeconds: number;
}): number {
  const {
    itemId,
    itemsList,
    isEditMode,
    editingRecord,
    editingOldDurationSeconds,
  } = params;
  const item = itemsList.find((b) => b.inventoryItemId === itemId);
  if (!item) return 0;
  if (
    isEditMode &&
    editingRecord?.inventoryItemId &&
    itemId === editingRecord.inventoryItemId
  ) {
    if (item.remainingSeconds !== undefined && item.remainingSeconds !== null) {
      const effectiveSeconds =
        Math.max(0, item.remainingSeconds) + editingOldDurationSeconds;
      return Math.max(1, Math.floor(effectiveSeconds / 60));
    }
    return 0;
  }
  return getItemRemainingMinutes(item.remainingSeconds);
}

export function buildManualRecordTimestamps(params: {
  now: Date;
  activeTz?: string | null;
  targetType: "ACTIVITY" | "ITEM";
  sessionDate: string;
  startTimeStr: string;
  endTimeStr: string;
  durationMinutes: number;
  maxLimit: number;
  editingRecord?: FocusRecord | null;
  editingStartParts: ParsedRecordDateParts | null;
  editingEndParts: ParsedRecordDateParts | null;
  editingInitialDurationMinutes: number;
}): {
  startTime: string;
  endTime: string;
  todayDateKey: string;
  isSessionToday: boolean;
} {
  const {
    now,
    activeTz,
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
  } = params;

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
      return {
        startTime: editingStartParts.wallIso,
        endTime: editingEndParts.wallIso,
        todayDateKey,
        isSessionToday,
      };
    }
    if (editingRecord && editingEndParts) {
      const endTime = editingEndParts.wallIso;
      const durationMs = durationMinutes * 60 * 1000;
      let startTime: string;
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
            : toLocalISOString(new Date(now.getTime() - durationMs), activeTz);
      }
      return { startTime, endTime, todayDateKey, isSessionToday };
    }
    return {
      endTime: toLocalISOString(now, activeTz),
      startTime: toLocalISOString(
        new Date(now.getTime() - durationMinutes * 60 * 1000),
        activeTz,
      ),
      todayDateKey,
      isSessionToday,
    };
  }

  if (isEditingSameTimeWindow && editingStartParts && editingEndParts) {
    return {
      startTime: editingStartParts.wallIso,
      endTime: editingEndParts.wallIso,
      todayDateKey,
      isSessionToday: editingEndParts.dateKey === todayDateKey,
    };
  }

  const baseDateStr = sessionDate || todayDateKey;
  isSessionToday = baseDateStr === todayDateKey;
  const [y, m, d] = baseDateStr.split("-").map(Number);
  const startMins = parseTimeToMinutes(startTimeStr);
  const endMins = parseTimeToMinutes(endTimeStr);

  if (startMins !== null && endMins !== null) {
    const resolved = resolveStartEndDiffMinutes(startMins, endMins, maxLimit);
    if (resolved) {
      const endUtc = new Date(
        Date.UTC(y, m - 1, d, Math.floor(endMins / 60), endMins % 60, 0),
      );
      const startUtc = resolved.crossesMidnight
        ? new Date(endUtc.getTime() - resolved.diffMinutes * 60 * 1000)
        : new Date(
            Date.UTC(
              y,
              m - 1,
              d,
              Math.floor(startMins / 60),
              startMins % 60,
              0,
            ),
          );
      return {
        startTime: formatWallUtc(startUtc),
        endTime: formatWallUtc(endUtc),
        todayDateKey,
        isSessionToday,
      };
    }
  }

  const nowParts = getDatePartsInTimeZone(now, activeTz);
  const fallbackEndMins = endMins ?? nowParts.hour * 60 + nowParts.minute;
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
  const startUtc = new Date(endUtc.getTime() - durationMinutes * 60 * 1000);
  return {
    startTime: formatWallUtc(startUtc),
    endTime: formatWallUtc(endUtc),
    todayDateKey,
    isSessionToday,
  };
}
