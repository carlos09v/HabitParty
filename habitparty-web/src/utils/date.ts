import type { AppLocale } from "@/i18n/config";
import type {
  DateFormat,
  DatePickerEventSchedulePatch,
  TimeFormat,
} from "@/types/ui";

/**
 * Detecta o formato de data preferido com base no locale do navegador/SO (ou subtag de Accept-Language).
 */
export function detectBrowserDateFormat(
  localeSubtag?: string | null,
  fallbackLocale?: AppLocale,
): DateFormat {
  const tag =
    localeSubtag?.trim() ||
    (typeof navigator !== "undefined" ? navigator.language : undefined);
  if (tag) {
    try {
      const parts = new Intl.DateTimeFormat(tag, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(new Date(2026, 11, 31));
      const firstDatePart = parts.find(
        (p) => p.type === "day" || p.type === "month" || p.type === "year",
      );
      if (firstDatePart?.type === "year") return "YYYY-MM-DD";
      if (firstDatePart?.type === "month") return "MM/DD/YYYY";
      if (firstDatePart?.type === "day") return "DD/MM/YYYY";
    } catch {
      // Fallback caso o subtag seja inválido
    }
  }
  return fallbackLocale === "en" ? "MM/DD/YYYY" : "DD/MM/YYYY";
}

export function resolveEffectiveDateFormat(
  dateFormat?: DateFormat,
  locale?: AppLocale,
): DateFormat {
  if (dateFormat) return dateFormat;
  return detectBrowserDateFormat(undefined, locale);
}

/**
 * Detecta o formato de hora preferido com base no locale do navegador/SO (ou subtag de Accept-Language).
 */
export function detectBrowserTimeFormat(
  localeSubtag?: string | null,
  fallbackLocale?: AppLocale,
): TimeFormat {
  const tag =
    localeSubtag?.trim() ||
    (typeof navigator !== "undefined" ? navigator.language : undefined);
  if (tag) {
    try {
      const resolved = new Intl.DateTimeFormat(tag, {
        hour: "numeric",
      }).resolvedOptions();
      if (resolved.hour12 !== undefined) {
        return resolved.hour12 ? "12h" : "24h";
      }
    } catch {
      // Fallback caso o subtag seja inválido
    }
  }
  return fallbackLocale === "en" ? "12h" : "24h";
}

export function resolveEffectiveTimeFormat(
  timeFormat?: TimeFormat,
  locale?: AppLocale,
): TimeFormat {
  if (timeFormat) return timeFormat;
  return detectBrowserTimeFormat(undefined, locale);
}

function formatNumericCalendarDate(
  year: number,
  month: number,
  day: number,
  format: DateFormat,
  options?: { includeYear?: boolean; shortYear?: boolean },
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const dayStr = pad(day);
  const monthStr = pad(month);
  const includeYear = options?.includeYear ?? true;
  const yearStr = options?.shortYear ? String(year).slice(-2) : String(year);

  if (format === "MM/DD/YYYY") {
    return includeYear
      ? `${monthStr}/${dayStr}/${yearStr}`
      : `${monthStr}/${dayStr}`;
  }
  if (format === "YYYY-MM-DD") {
    return includeYear
      ? `${year}-${monthStr}-${dayStr}`
      : `${monthStr}-${dayStr}`;
  }
  return includeYear
    ? `${dayStr}/${monthStr}/${yearStr}`
    : `${dayStr}/${monthStr}`;
}

function formatShortMonthCalendarDate(
  year: number,
  month: number,
  day: number,
  format: DateFormat,
  locale: AppLocale = "pt-BR",
  includeYear = false,
): string {
  const dayStr = String(day).padStart(2, "0");
  const monthName = getShortMonths(locale)[month - 1] ?? "";
  if (format === "MM/DD/YYYY") {
    return includeYear
      ? `${monthName} ${dayStr}, ${year}`
      : `${monthName} ${dayStr}`;
  }
  if (format === "YYYY-MM-DD") {
    return includeYear
      ? `${year} ${monthName} ${dayStr}`
      : `${monthName} ${dayStr}`;
  }
  return includeYear
    ? `${dayStr} ${monthName} ${year}`
    : `${dayStr} ${monthName}`;
}

/**
 * Converte com precisão uma string de data vinda do servidor (UTC ou local) para Date,
 * garantindo que datas sem indicador de fuso geradas em UTC sejam interpretadas
 * corretamente e convertidas para o fuso horário local do navegador do usuário.
 */
export function parseServerDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  let str = dateStr.trim();
  if (str.includes(" ")) {
    str = str.replace(" ", "T");
  }
  if (str.includes("T")) {
    const timePart = str.split("T")[1];
    const hasTz =
      timePart.includes("Z") ||
      timePart.includes("+") ||
      timePart.includes("-");
    if (!hasTz) {
      str = `${str}Z`;
    }
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Converte uma string de data que já está no fuso horário local do usuário
 * (ex: gerada e enviada via toLocalISOString) para Date, sem adicionar sufixo UTC ('Z').
 */
export function parseLocalDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  let str = dateStr.trim();
  if (str.includes(" ")) {
    str = str.replace(" ", "T");
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Formata strings de data ISO respeitando a preferência de formato (`DD/MM/YYYY`, `MM/DD/YYYY`, `YYYY-MM-DD`)
 * ou o padrão localizado conforme `locale`.
 */
export function formatDateTime(
  dateStr?: string | null,
  options?: {
    includeSeconds?: boolean;
    includeYearFull?: boolean;
    isLocal?: boolean;
    locale?: AppLocale;
    dateFormat?: DateFormat;
    timeFormat?: TimeFormat;
  },
): string {
  if (!dateStr) return "-";
  try {
    const d = options?.isLocal
      ? parseLocalDate(dateStr)
      : parseServerDate(dateStr);
    if (!d) return dateStr;
    const format = resolveEffectiveDateFormat(
      options?.dateFormat,
      options?.locale,
    );
    const timeFormat = resolveEffectiveTimeFormat(
      options?.timeFormat,
      options?.locale,
    );
    const pad = (n: number) => String(n).padStart(2, "0");
    const datePart = formatNumericCalendarDate(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate(),
      format,
      {
        includeYear: true,
        shortYear: !options?.includeYearFull && format !== "YYYY-MM-DD",
      },
    );
    const baseTime = formatTimeParts(d.getHours(), d.getMinutes(), {
      timeFormat,
    });
    if (!options?.includeSeconds) {
      return `${datePart}, ${baseTime}`;
    }
    const secStr = `:${pad(d.getSeconds())}`;
    if (timeFormat === "12h") {
      const [hhmm, period] = baseTime.split(" ");
      return `${datePart}, ${hhmm}${secStr} ${period}`;
    }
    return `${datePart}, ${baseTime}${secStr}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formata uma data YYYY-MM-DD ou timestamp ISO (convertendo UTC -> local quando possui hora)
 * para exibição curta respeitando `dateFormat` ou `locale`.
 */
export function formatShortDate(
  dateStr?: string | null,
  options?: {
    includeYear?: boolean;
    monthFormat?: "2-digit" | "short";
    isLocal?: boolean;
    locale?: AppLocale;
    dateFormat?: DateFormat;
  },
): string {
  if (!dateStr) return "";
  try {
    let y: number;
    let m: number;
    let d: number;
    const trimmed = dateStr.trim();
    if (trimmed.includes("T") || trimmed.includes(" ")) {
      const parsed = options?.isLocal
        ? parseLocalDate(trimmed)
        : parseServerDate(trimmed);
      if (!parsed) return dateStr;
      y = parsed.getFullYear();
      m = parsed.getMonth() + 1;
      d = parsed.getDate();
    } else {
      [y, m, d] = trimmed.split("-").map(Number);
    }
    if (!y || !m || !d) return dateStr;
    const format = resolveEffectiveDateFormat(
      options?.dateFormat,
      options?.locale,
    );
    if (options?.monthFormat === "short") {
      return formatShortMonthCalendarDate(
        y,
        m,
        d,
        format,
        options?.locale ?? "pt-BR",
        Boolean(options?.includeYear),
      );
    }
    return formatNumericCalendarDate(y, m, d, format, {
      includeYear: Boolean(options?.includeYear),
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formata mês e ano de um timestamp do servidor (ex: "Membro desde Nov 2026"),
 * convertendo corretamente de UTC para o fuso local do usuário.
 */
export function formatMonthYear(
  dateStr?: string | null,
  locale: AppLocale = "pt-BR",
): string | null {
  if (!dateStr) return null;
  const parsed = parseServerDate(dateStr);
  if (!parsed) return null;
  const monthName = getShortMonths(locale)[parsed.getMonth()] ?? "";
  const year = parsed.getFullYear();
  return `${monthName} ${year}`;
}

/**
 * Retorna os limites (domingo 00:00:00 até sábado 23:59:59.999) da semana para um offset relativo.
 * Mantém aliases `monday` e `sunday` por retrocompatibilidade com chamadas existentes.
 */
export function getWeekDateRange(
  baseDate: Date = new Date(),
  weekOffset = 0,
): { startOfWeek: Date; endOfWeek: Date; monday: Date; sunday: Date } {
  const current = new Date(baseDate);
  current.setDate(current.getDate() + weekOffset * 7);

  // Domingo (0 = Domingo, 6 = Sábado)
  const dayOfWeek = current.getDay();
  const startOfWeek = new Date(current);
  startOfWeek.setDate(current.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return {
    startOfWeek,
    endOfWeek,
    monday: startOfWeek,
    sunday: endOfWeek,
  };
}

/**
 * Converte um objeto Date em string no formato local YYYY-MM-DDTHH:mm:ss
 * para envio a endpoints do backend que esperam LocalDateTime, prevenindo
 * deslocamento indevido de fuso horário causado pelo toISOString() (UTC).
 */
export function toLocalISOString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

export const SHORT_MONTHS_BR = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export const SHORT_MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const CAPITALIZED_WEEK_DAYS_BR = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
];

export const CAPITALIZED_WEEK_DAYS_EN = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export function getShortMonths(locale: AppLocale = "pt-BR"): readonly string[] {
  return locale === "en" ? SHORT_MONTHS_EN : SHORT_MONTHS_BR;
}

export function getCapitalizedWeekDays(
  locale: AppLocale = "pt-BR",
): readonly string[] {
  return locale === "en" ? CAPITALIZED_WEEK_DAYS_EN : CAPITALIZED_WEEK_DAYS_BR;
}

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
): { isTodayTimeOverdue: boolean; isInProgress: boolean } {
  const dueMinutes = parseTimeToMinutes(schedule.rawDueTime);
  const startMinutes = parseTimeToMinutes(schedule.effectiveStartRaw);
  const endMinutes = parseTimeToMinutes(schedule.rawEndTime);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
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

    const targetDate = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffMs = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const { isTodayTimeOverdue, isInProgress } = computeTaskTimeStatus(
      schedule,
      diffDays,
      now,
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

    // Atrasada (data anterior a hoje)
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

    // Hoje (ou filtro de hoje para uma tarefa de hoje) -> exibe a hora se houver dueTime, senão "Hoje"
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

    // Amanhã
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

    // Dentro dos próximos 7 dias (2 a 7 dias)
    if (diffDays <= 7) {
      const weekDay = getCapitalizedWeekDays(locale)[targetDate.getDay()];
      return {
        label: appendTime(weekDay),
        isToday: false,
        isTomorrow: false,
        isOverdue: false,
        hasDueDate: true,
        diffDays,
      };
    }

    // Além dos 7 dias: Dia + Mês abreviado (ex: "17 Nov, 14:30" / "Nov 17, 14:30")
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

/**
 * Calcula o rótulo da data para o botão do popover:
 * - Se tiver mais de 7 dias (> 1 semana): Dia + Mês abreviado + contagem de dias restantes (ex: "26 Out (faltam 9 dias)")
 * - Se estiver dentro da semana: Dia da semana abreviado + Dia + Mês (ex: "Ter, 20 Out")
 * - Se for hoje: "Hoje, 17 Out"
 * - Se for amanhã: "Amanhã, 18 Out"
 * - Se for atrasada: "15 Out (atrasada há 2 dias)" com isOverdue=true
 * - Se não tiver data: "Sem prazo"
 */
export function getPopoverDueDateInfo(
  dueDate?: string | null,
  locale: AppLocale = "pt-BR",
  dueTime?: string | null,
  dateFormat?: DateFormat,
  dueEndTime?: string | null,
  startTime?: string | null,
  isAllDay?: boolean | null,
  timeFormat?: TimeFormat,
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

    const targetDate = new Date(y, m - 1, d);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const diffMs = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

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
    );
    const timeSuffix = schedule.formattedTimeRange
      ? ` · ${schedule.formattedTimeRange}`
      : "";

    const capitalizedWeekDay =
      getCapitalizedWeekDays(locale)[targetDate.getDay()];
    const resolvedFormat = resolveEffectiveDateFormat(dateFormat, locale);
    const shortDayMonth = formatShortMonthCalendarDate(
      y,
      m,
      d,
      resolvedFormat,
      locale,
      false,
    );

    // Atrasada
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

    // Hoje
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

    // Amanhã
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

    // Dentro da semana (2 a 7 dias) -> "Ter, 20 Out" / "Tue, Oct 20"
    if (diffDays <= 7) {
      return {
        label: `${capitalizedWeekDay}, ${shortDayMonth}${timeSuffix}`,
        isOverdue: false,
        isToday: false,
        hasDueDate: true,
      };
    }

    // Mais de 7 dias (> 1 semana) -> "26 Out (faltam 9 dias)" / "Oct 26 (in 9 days)"
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

export const FULL_MONTHS_BR = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export const FULL_MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const SHORT_WEEK_DAYS_BR = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
];

export const SHORT_WEEK_DAYS_EN = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export function getFullMonths(locale: AppLocale = "pt-BR"): readonly string[] {
  return locale === "en" ? FULL_MONTHS_EN : FULL_MONTHS_BR;
}

export function getShortWeekDays(
  locale: AppLocale = "pt-BR",
): readonly string[] {
  return locale === "en" ? SHORT_WEEK_DAYS_EN : SHORT_WEEK_DAYS_BR;
}

export interface CalendarDayCell {
  year: number;
  month: number;
  day: number;
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isoString: string;
}

export function parseDateParts(
  dateStr?: string | null,
): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m - 1, day: d };
}

export function formatDateParts(
  year: number,
  month: number,
  day: number,
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

/**
 * Retorna a data de hoje no fuso horário local do usuário no formato YYYY-MM-DD,
 * evitando o deslocamento prematuro de dia causado por toISOString() (UTC).
 */
export function getTodayDateString(now: Date = new Date()): string {
  return formatDateParts(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Retorna uma data com deslocamento relativo de dias (ex: +1 para amanhã, +7 para próxima semana)
 * no formato local YYYY-MM-DD, tratando corretamente viradas de mês e ano.
 */
export function getOffsetDateString(
  offsetDays: number,
  baseDate: Date = new Date(),
): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return formatDateParts(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Retorna a data máxima de nascimento permitida (padrão: 12 anos atrás) no formato local YYYY-MM-DD,
 * sem sofrer desvio de fuso horário UTC.
 */
export function getMaxBirthDateString(
  minAgeYears = 12,
  now: Date = new Date(),
): string {
  const d = new Date(now);
  d.setFullYear(d.getFullYear() - minAgeYears);
  return formatDateParts(d.getFullYear(), d.getMonth(), d.getDate());
}

export const HOURS_LIST: readonly number[] = Array.from(
  { length: 24 },
  (_, i) => i,
);

export const QUICK_MINUTES_LIST: readonly number[] = [
  0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
];

/**
 * Extrai hora (0-23) e minuto (0-59) a partir de uma string HH:mm.
 * Caso vazia ou inválida, utiliza o horário local atual como fallback.
 */
export function parseTimeParts(val?: string | null): {
  hour: number;
  minute: number;
} {
  if (!val || !val.includes(":")) {
    const now = new Date();
    return { hour: now.getHours(), minute: now.getMinutes() };
  }
  const [hStr, mStr] = val.split(":");
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr, 10);
  return {
    hour: Number.isNaN(h) ? 0 : Math.max(0, Math.min(23, h)),
    minute: Number.isNaN(m) ? 0 : Math.max(0, Math.min(59, m)),
  };
}

/**
 * Formata hora e minuto numéricos no padrão HH:mm (24h) ou hh:mm A (12h).
 */
export function formatTimeParts(
  hour: number,
  minute: number,
  options?: { timeFormat?: TimeFormat },
): string {
  const m = String(Math.max(0, Math.min(59, minute))).padStart(2, "0");
  if (options?.timeFormat === "12h") {
    const period = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 === 0 ? 12 : hour % 12;
    const hStr = String(h12).padStart(2, "0");
    return `${hStr}:${m} ${period}`;
  }
  const h = String(Math.max(0, Math.min(23, hour))).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Formata um horário (Date ou string HH:mm) respeitando o formato de hora preferido ("24h" ou "12h").
 */
export function formatTimeDisplay(
  timeVal?: string | Date | null,
  options?: { timeFormat?: TimeFormat; locale?: AppLocale },
): string {
  if (!timeVal) return "";
  const timeFormat = resolveEffectiveTimeFormat(
    options?.timeFormat,
    options?.locale,
  );
  if (timeVal instanceof Date) {
    return formatTimeParts(timeVal.getHours(), timeVal.getMinutes(), {
      timeFormat,
    });
  }
  const { hour, minute } = parseTimeParts(timeVal);
  return formatTimeParts(hour, minute, { timeFormat });
}

/**
 * Extrai o horário local de um objeto Date no formato HH:mm.
 */
export function formatTimeHHMM(date: Date = new Date()): string {
  return formatTimeParts(date.getHours(), date.getMinutes());
}

/**
 * Converte uma string HH:mm para total de minutos desde 00:00 (0 a 1439).
 */
export function parseTimeToMinutes(hhmm?: string | null): number | null {
  if (!hhmm || !hhmm.includes(":")) return null;
  const [hStr, mStr] = hhmm.split(":");
  const h = Number.parseInt(hStr, 10);
  const m = Number.parseInt(mStr, 10);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return Math.max(0, Math.min(1439, h * 60 + m));
}

/**
 * Converte um total de minutos (0 a 1439) para string no formato HH:mm.
 */
export function minutesToTimeHHMM(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.round(totalMinutes)));
  return formatTimeParts(Math.floor(clamped / 60), clamped % 60);
}

/**
 * Calcula a janela de início e fim (HH:mm) a partir de um horário final e duração em minutos.
 */
export function computeTimeWindowFromDuration(
  endHHMM: string,
  durationMins: number,
): { startTimeStr: string; endTimeStr: string } {
  const safeDuration = Math.max(1, Math.min(1439, durationMins));
  const endMins = parseTimeToMinutes(endHHMM) ?? 18 * 60;
  if (endMins - safeDuration >= 0) {
    return {
      startTimeStr: minutesToTimeHHMM(endMins - safeDuration),
      endTimeStr: minutesToTimeHHMM(endMins),
    };
  }
  const shiftedEnd = Math.min(1439, safeDuration);
  return {
    startTimeStr: "00:00",
    endTimeStr: minutesToTimeHHMM(shiftedEnd),
  };
}

/**
 * Verifica se uma tarefa com Modo Hardcore ativado já ultrapassou o prazo (23:59:59 do dueDate)
 * e deve ter seu título, prazo e dificuldade bloqueados contra edição.
 */
export function isTaskHardcoreLocked(
  task?: { isHardcoreModeEnabled?: boolean; dueDate?: string | null } | null,
  now: Date = new Date(),
): boolean {
  if (!task?.isHardcoreModeEnabled || !task?.dueDate) return false;
  const datePart = task.dueDate.split("T")[0];
  return new Date(`${datePart}T23:59:59`) < now;
}

export function generateCalendarGrid(
  viewYear: number,
  viewMonth: number,
  selectedIso?: string | null,
  options?: { minDate?: string; maxDate?: string },
): CalendarDayCell[] {
  const now = new Date();
  const todayIso = formatDateParts(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const firstDay = new Date(viewYear, viewMonth, 1);
  const firstWeekday = firstDay.getDay();

  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days: CalendarDayCell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const iso = formatDateParts(prevYear, prevMonth, prevDay);

    days.push({
      year: prevYear,
      month: prevMonth,
      day: prevDay,
      isCurrentMonth: false,
      isSelected: selectedIso === iso,
      isToday: todayIso === iso,
      isDisabled: Boolean(
        (options?.minDate && iso < options.minDate) ||
          (options?.maxDate && iso > options.maxDate),
      ),
      isoString: iso,
    });
  }

  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const iso = formatDateParts(viewYear, viewMonth, d);
    days.push({
      year: viewYear,
      month: viewMonth,
      day: d,
      isCurrentMonth: true,
      isSelected: selectedIso === iso,
      isToday: todayIso === iso,
      isDisabled: Boolean(
        (options?.minDate && iso < options.minDate) ||
          (options?.maxDate && iso > options.maxDate),
      ),
      isoString: iso,
    });
  }

  const remaining = (7 - (days.length % 7)) % 7;
  const totalNeeded =
    days.length + remaining < 35 ? 35 - days.length : remaining;

  for (let d = 1; d <= totalNeeded; d++) {
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    const iso = formatDateParts(nextYear, nextMonth, d);

    days.push({
      year: nextYear,
      month: nextMonth,
      day: d,
      isCurrentMonth: false,
      isSelected: selectedIso === iso,
      isToday: todayIso === iso,
      isDisabled: Boolean(
        (options?.minDate && iso < options.minDate) ||
          (options?.maxDate && iso > options.maxDate),
      ),
      isoString: iso,
    });
  }

  return days;
}

/**
 * Converte uma string ISO de data (`YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm...`)
 * para timestamp UTC em milissegundos (00:00:00 UTC), ou `null` se inválida.
 */
export function parseIsoDateUtcMs(dateStr: string): number | null {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d);
}

export interface EventScheduleState {
  dueDate?: string;
  dueTime?: string;
  startTime?: string;
  dueEndTime?: string;
  isAllDay?: boolean;
}

export interface NormalizedEventScheduleResult {
  /** Valores normalizados de UI (`""` quando limpo, `undefined` se inalterado). */
  dueDate?: string;
  dueTime?: string;
  startTime?: string;
  dueEndTime?: string;
  isAllDay?: boolean;
  /** Campos prontos para persistência/patch de Task (`undefined` apaga o valor). */
  taskPatch: {
    dueDate?: string;
    dueTime?: string;
    startTime?: string;
    dueEndTime?: string;
    isAllDay?: boolean;
  };
}

/**
 * Normaliza patches atômicos de agenda/horário emitidos pelo `DatePicker`:
 * trunca para `HH:mm`, limpa `dueEndTime` órfão quando `startTime` é removido
 * e preenche `dueDate` com a data local de hoje caso um horário/dia inteiro seja
 * ativado sem data selecionada.
 */
export function normalizeEventSchedulePatch(
  current: EventScheduleState,
  patch: DatePickerEventSchedulePatch,
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
    const todayIso = getTodayDateString();
    result.dueDate = todayIso;
    result.taskPatch.dueDate = todayIso;
  }

  return result;
}
