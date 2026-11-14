import type { AppLocale } from "@/i18n/config";
import type {
  DateFormat,
  DatePickerEventSchedulePatch,
  TimeFormat,
} from "@/types/ui";
import {
  formatShortMonthCalendarDate,
  formatTimeDisplay,
  getCapitalizedWeekDays,
  getTodayDateString,
  parseTimeToMinutes,
  resolveEffectiveDateFormat,
  resolveEffectiveTimeFormat,
} from "./date";
import { getDatePartsInTimeZone, resolveValidTimeZone } from "./timezone";

export interface TaskDueDateInfo {
  label: string;
  isToday: boolean;
  isTomorrow: boolean;
  isOverdue: boolean;
  hasDueDate: boolean;
  diffDays: number | null;
  /** Evento em andamento: hoje, entre `dueTime` (início) e `dueEndTime` (fim). */
  isInProgress?: boolean;
  /** Horário de término formatado ("HH:mm"), quando a tarefa possui `dueEndTime`. */
  endTime?: string | null;
}

interface ResolvedTaskSchedule {
  isAllDay: boolean;
  rawDueTime: string | null;
  rawStartTime: string | null;
  rawEndTime: string | null;
  effectiveStartRaw: string | null;
  displayDueTime: string | null;
  displayStartTime: string | null;
  displayEndTime: string | null;
  formattedTimeRange: string | null;
}

function resolveTaskScheduleStrings(options: {
  dueTime?: string | null;
  startTime?: string | null;
  dueEndTime?: string | null;
  isAllDay?: boolean | null;
  locale: AppLocale;
  timeFormat?: TimeFormat;
}): ResolvedTaskSchedule {
  const isAllDay = Boolean(options.isAllDay);
  const rawDueTime =
    !isAllDay && options.dueTime ? options.dueTime.slice(0, 5) : null;
  const rawStartTime =
    !isAllDay && options.startTime ? options.startTime.slice(0, 5) : null;
  const rawEndTime =
    !isAllDay && options.dueEndTime ? options.dueEndTime.slice(0, 5) : null;
  const effectiveStartRaw = rawStartTime ?? (rawEndTime ? rawDueTime : null);
  const timeFormat = resolveEffectiveTimeFormat(
    options.timeFormat,
    options.locale,
  );
  const displayDueTime = rawDueTime
    ? formatTimeDisplay(rawDueTime, { timeFormat, locale: options.locale })
    : null;
  const displayStartTime = effectiveStartRaw
    ? formatTimeDisplay(effectiveStartRaw, {
        timeFormat,
        locale: options.locale,
      })
    : null;
  const displayEndTime = rawEndTime
    ? formatTimeDisplay(rawEndTime, { timeFormat, locale: options.locale })
    : null;
  const allDayLabel = options.locale === "en" ? "All day" : "Dia inteiro";
  const formattedTimeRange = isAllDay
    ? allDayLabel
    : displayStartTime && displayEndTime
      ? `${displayStartTime}–${displayEndTime}`
      : (displayStartTime ?? displayDueTime);

  return {
    isAllDay,
    rawDueTime,
    rawStartTime,
    rawEndTime,
    effectiveStartRaw,
    displayDueTime,
    displayStartTime,
    displayEndTime,
    formattedTimeRange,
  };
}

function computeTaskTimeStatus(
  schedule: ResolvedTaskSchedule,
  diffDays: number,
  now: Date,
  timeZone?: string | null,
): { isTodayTimeOverdue: boolean; isInProgress: boolean } {
  const dueMinutes = parseTimeToMinutes(schedule.rawDueTime);
  const startMinutes = parseTimeToMinutes(schedule.effectiveStartRaw);
  const endMinutes = parseTimeToMinutes(schedule.rawEndTime);
  const nowParts = getDatePartsInTimeZone(now, timeZone);
  const currentMinutes = nowParts.hour * 60 + nowParts.minute;
  // Com horário de término (ou evento de dia inteiro), a tarefa só fica atrasada após o fim do evento/dia.
  const deadlineMinutes = schedule.isAllDay
    ? null
    : (endMinutes ?? (schedule.rawStartTime ? null : dueMinutes));
  const isTodayTimeOverdue =
    !schedule.isAllDay &&
    diffDays === 0 &&
    deadlineMinutes !== null &&
    deadlineMinutes < currentMinutes;
  const isInProgress =
    diffDays === 0 &&
    (schedule.isAllDay ||
      (startMinutes !== null &&
        startMinutes <= currentMinutes &&
        (endMinutes === null || currentMinutes <= endMinutes)));

  return { isTodayTimeOverdue, isInProgress };
}

export function getTaskDueDateInfo(
  dueDate?: string | null,
  options?: {
    activeFilter?: string;
    selectedDate?: string | null;
    locale?: AppLocale;
    dueTime?: string | null;
    /** Horário de início ("HH:mm") quando configurado como Evento. */
    startTime?: string | null;
    /** Horário de término ("HH:mm") quando configurado como Evento. */
    dueEndTime?: string | null;
    /** Evento de dia inteiro: marca o card como "Em andamento" durante todo o dia de hoje. */
    isAllDay?: boolean | null;
    dateFormat?: DateFormat;
    timeFormat?: TimeFormat;
    timeZone?: string | null;
  },
): TaskDueDateInfo {
  const activeFilter = options?.activeFilter;
  const locale = options?.locale ?? "pt-BR";
  const schedule = resolveTaskScheduleStrings({
    dueTime: options?.dueTime,
    startTime: options?.startTime,
    dueEndTime: options?.dueEndTime,
    isAllDay: options?.isAllDay,
    locale,
    timeFormat: options?.timeFormat,
  });
  const { displayEndTime, formattedTimeRange } = schedule;
  const isEn = locale === "en";
  const todayLabel = isEn ? "Today" : "Hoje";
  const tomorrowLabel = isEn ? "Tomorrow" : "Amanhã";
  const noDueDateLabel = isEn ? "No due date" : "Sem prazo";

  if (!dueDate) {
    if (activeFilter === "today") {
      return {
        label: formattedTimeRange || todayLabel,
        isToday: true,
        isTomorrow: false,
        isOverdue: false,
        hasDueDate: false,
        diffDays: 0,
        endTime: displayEndTime,
      };
    }
    return {
      label: noDueDateLabel,
      isToday: false,
      isTomorrow: false,
      isOverdue: false,
      hasDueDate: false,
      diffDays: null,
    };
  }

  try {
    const [y, m, d] = dueDate.split("T")[0].split("-").map(Number);
    if (!y || !m || !d) {
      return {
        label: dueDate,
        isToday: false,
        isTomorrow: false,
        isOverdue: false,
        hasDueDate: true,
        diffDays: null,
      };
    }

    const now = new Date();
    const nowParts = getDatePartsInTimeZone(now, options?.timeZone);
    const targetUtcMs = Date.UTC(y, m - 1, d);
    const todayUtcMs = Date.UTC(
      nowParts.year,
      nowParts.month - 1,
      nowParts.day,
    );
    const targetWeekday = new Date(targetUtcMs).getUTCDay();

    const diffDays = Math.round(
      (targetUtcMs - todayUtcMs) / (1000 * 60 * 60 * 24),
    );

    const { isTodayTimeOverdue, isInProgress } = computeTaskTimeStatus(
      schedule,
      diffDays,
      now,
      options?.timeZone,
    );

    const resolvedFormat = resolveEffectiveDateFormat(
      options?.dateFormat,
      locale,
    );
    const shortDayMonth = formatShortMonthCalendarDate(
      y,
      m,
      d,
      resolvedFormat,
      locale,
      false,
    );
    const appendTime = (baseLabel: string) =>
      formattedTimeRange ? `${baseLabel}, ${formattedTimeRange}` : baseLabel;

    if (diffDays < 0) {
      return {
        label: appendTime(shortDayMonth),
        isToday: false,
        isTomorrow: false,
        isOverdue: true,
        hasDueDate: true,
        diffDays,
        isInProgress: false,
        endTime: displayEndTime,
      };
    }

    if (diffDays === 0) {
      return {
        label: formattedTimeRange || todayLabel,
        isToday: true,
        isTomorrow: false,
        isOverdue: isTodayTimeOverdue,
        hasDueDate: true,
        diffDays: 0,
        isInProgress,
        endTime: displayEndTime,
      };
    }

    if (diffDays === 1) {
      return {
        label: appendTime(tomorrowLabel),
        isToday: false,
        isTomorrow: true,
        isOverdue: false,
        hasDueDate: true,
        diffDays: 1,
      };
    }

    if (diffDays <= 7) {
      const weekDay = getCapitalizedWeekDays(locale)[targetWeekday];
      return {
        label: appendTime(weekDay),
        isToday: false,
        isTomorrow: false,
        isOverdue: false,
        hasDueDate: true,
        diffDays,
      };
    }

    return {
      label: appendTime(shortDayMonth),
      isToday: false,
      isTomorrow: false,
      isOverdue: false,
      hasDueDate: true,
      diffDays,
    };
  } catch {
    return {
      label: dueDate,
      isToday: false,
      isTomorrow: false,
      isOverdue: false,
      hasDueDate: true,
      diffDays: null,
    };
  }
}

export interface PopoverDueDateInfo {
  label: string;
  isOverdue: boolean;
  isToday: boolean;
  hasDueDate: boolean;
}

export function getPopoverDueDateInfo(
  dueDate?: string | null,
  locale: AppLocale = "pt-BR",
  dueTime?: string | null,
  dateFormat?: DateFormat,
  dueEndTime?: string | null,
  startTime?: string | null,
  isAllDay?: boolean | null,
  timeFormat?: TimeFormat,
  timeZone?: string | null,
): PopoverDueDateInfo {
  const isEn = locale === "en";
  if (!dueDate) {
    return {
      label: isEn ? "No due date" : "Sem prazo",
      isOverdue: false,
      isToday: false,
      hasDueDate: false,
    };
  }

  try {
    const [y, m, d] = dueDate.split("T")[0].split("-").map(Number);
    if (!y || !m || !d) {
      return {
        label: dueDate,
        isOverdue: false,
        isToday: false,
        hasDueDate: true,
      };
    }

    const now = new Date();
    const nowParts = getDatePartsInTimeZone(now, timeZone);
    const targetUtcMs = Date.UTC(y, m - 1, d);
    const todayUtcMs = Date.UTC(
      nowParts.year,
      nowParts.month - 1,
      nowParts.day,
    );
    const diffDays = Math.round(
      (targetUtcMs - todayUtcMs) / (1000 * 60 * 60 * 24),
    );

    const schedule = resolveTaskScheduleStrings({
      dueTime,
      startTime,
      dueEndTime,
      isAllDay,
      locale,
      timeFormat,
    });
    const { isTodayTimeOverdue } = computeTaskTimeStatus(
      schedule,
      diffDays,
      now,
      timeZone,
    );
    const timeSuffix = schedule.formattedTimeRange
      ? ` · ${schedule.formattedTimeRange}`
      : "";

    const capitalizedWeekDay =
      getCapitalizedWeekDays(locale)[new Date(targetUtcMs).getUTCDay()];
    const resolvedFormat = resolveEffectiveDateFormat(dateFormat, locale);
    const shortDayMonth = formatShortMonthCalendarDate(
      y,
      m,
      d,
      resolvedFormat,
      locale,
      false,
    );

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      if (isEn) {
        const daysText =
          overdueDays === 1 ? "1 day overdue" : `${overdueDays} days overdue`;
        return {
          label: `${shortDayMonth}${timeSuffix} (${daysText})`,
          isOverdue: true,
          isToday: false,
          hasDueDate: true,
        };
      }
      const daysText = overdueDays === 1 ? "1 dia" : `${overdueDays} dias`;
      return {
        label: `${shortDayMonth}${timeSuffix} (atrasada há ${daysText})`,
        isOverdue: true,
        isToday: false,
        hasDueDate: true,
      };
    }

    if (diffDays === 0) {
      return {
        label: isEn
          ? `Today, ${shortDayMonth}${timeSuffix}`
          : `Hoje, ${shortDayMonth}${timeSuffix}`,
        isOverdue: isTodayTimeOverdue,
        isToday: true,
        hasDueDate: true,
      };
    }

    if (diffDays === 1) {
      return {
        label: isEn
          ? `Tomorrow, ${shortDayMonth}${timeSuffix}`
          : `Amanhã, ${shortDayMonth}${timeSuffix}`,
        isOverdue: false,
        isToday: false,
        hasDueDate: true,
      };
    }

    if (diffDays <= 7) {
      return {
        label: `${capitalizedWeekDay}, ${shortDayMonth}${timeSuffix}`,
        isOverdue: false,
        isToday: false,
        hasDueDate: true,
      };
    }

    return {
      label: isEn
        ? `${shortDayMonth}${timeSuffix} (in ${diffDays} days)`
        : `${shortDayMonth}${timeSuffix} (faltam ${diffDays} dias)`,
      isOverdue: false,
      isToday: false,
      hasDueDate: true,
    };
  } catch {
    return {
      label: dueDate,
      isOverdue: false,
      isToday: false,
      hasDueDate: true,
    };
  }
}

/**
 * Verifica se uma tarefa com Modo Hardcore ativado já ultrapassou o prazo (23:59:59 do dueDate)
 * e deve ter seu título, prazo e dificuldade bloqueados contra edição.
 */
export function isTaskHardcoreLocked(
  task?: { isHardcoreModeEnabled?: boolean; dueDate?: string | null } | null,
  now: Date = new Date(),
  timeZone?: string | null,
): boolean {
  if (!task?.isHardcoreModeEnabled || !task?.dueDate) return false;
  const datePart = task.dueDate.split("T")[0];
  if (!resolveValidTimeZone(timeZone)) {
    return new Date(`${datePart}T23:59:59`) < now;
  }
  return datePart < getTodayDateString(now, timeZone);
}

export interface EventScheduleState {
  dueDate?: string;
  dueTime?: string;
  startTime?: string;
  dueEndTime?: string;
  isAllDay?: boolean;
}

export interface NormalizedEventScheduleResult {
  dueDate?: string;
  dueTime?: string;
  startTime?: string;
  dueEndTime?: string;
  isAllDay?: boolean;
  taskPatch: {
    dueDate?: string;
    dueTime?: string;
    startTime?: string;
    dueEndTime?: string;
    isAllDay?: boolean;
  };
}

export function normalizeEventSchedulePatch(
  current: EventScheduleState,
  patch: DatePickerEventSchedulePatch,
  timeZone?: string | null,
): NormalizedEventScheduleResult {
  const cleanHm = (value?: string) => (value ? value.slice(0, 5) : "");
  const result: NormalizedEventScheduleResult = { taskPatch: {} };

  let effectiveDueTime = cleanHm(current.dueTime);
  let effectiveStartTime = cleanHm(current.startTime);
  let effectiveIsAllDay = Boolean(current.isAllDay);

  if (patch.dueTime !== undefined) {
    const nextDueTime = cleanHm(patch.dueTime);
    effectiveDueTime = nextDueTime;
    result.dueTime = nextDueTime;
    result.taskPatch.dueTime = nextDueTime || undefined;
  }

  if (patch.startTime !== undefined) {
    const nextStartTime = cleanHm(patch.startTime);
    effectiveStartTime = nextStartTime;
    result.startTime = nextStartTime;
    result.taskPatch.startTime = nextStartTime || undefined;
    if (!nextStartTime && patch.endTime === undefined) {
      result.dueEndTime = "";
      result.taskPatch.dueEndTime = undefined;
    }
  }

  if (patch.endTime !== undefined) {
    const nextEndTime = cleanHm(patch.endTime);
    result.dueEndTime = nextEndTime;
    result.taskPatch.dueEndTime = nextEndTime || undefined;
  }

  if (patch.isAllDay !== undefined) {
    effectiveIsAllDay = patch.isAllDay;
    result.isAllDay = patch.isAllDay;
    result.taskPatch.isAllDay = patch.isAllDay;
  }

  if (
    (effectiveDueTime || effectiveStartTime || effectiveIsAllDay) &&
    !current.dueDate
  ) {
    const todayIso = getTodayDateString(new Date(), timeZone);
    result.dueDate = todayIso;
    result.taskPatch.dueDate = todayIso;
  }

  return result;
}
