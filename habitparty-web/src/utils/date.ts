import type { AppLocale } from "@/i18n/config";
import type { DateFormat, TimeFormat } from "@/types/ui";
import {
  getDateKeyInTimeZone,
  getDatePartsInTimeZone,
  hasTimeZoneSuffix,
  parseServerDate,
} from "./timezone";

export * from "./calendarGrid";
export * from "./taskSchedule";
export * from "./timezone";

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

export function formatNumericCalendarDate(
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

export function formatShortMonthCalendarDate(
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
    timeZone?: string | null;
  },
): string {
  if (!dateStr) return "-";
  try {
    const hasExplicitTz = hasTimeZoneSuffix(dateStr);
    const d =
      options?.isLocal && !hasExplicitTz
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
    const effectiveTz =
      options?.isLocal && !hasExplicitTz ? undefined : options?.timeZone;
    const { year, month, day, hour, minute, second } = getDatePartsInTimeZone(
      d,
      effectiveTz,
    );
    const datePart = formatNumericCalendarDate(year, month, day, format, {
      includeYear: true,
      shortYear: !options?.includeYearFull && format !== "YYYY-MM-DD",
    });
    const baseTime = formatTimeParts(hour, minute, {
      timeFormat,
    });
    if (!options?.includeSeconds) {
      return `${datePart}, ${baseTime}`;
    }
    const secStr = `:${pad(second)}`;
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
 * Formata uma data YYYY-MM-DD ou timestamp ISO (convertendo UTC -> local/fuso do usuário quando possui hora)
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
    timeZone?: string | null;
  },
): string {
  if (!dateStr) return "";
  try {
    let y: number;
    let m: number;
    let d: number;
    const trimmed = dateStr.trim();
    if (trimmed.includes("T") || trimmed.includes(" ")) {
      const hasExplicitTz = hasTimeZoneSuffix(trimmed);
      const parsed =
        options?.isLocal && !hasExplicitTz
          ? parseLocalDate(trimmed)
          : parseServerDate(trimmed);
      if (!parsed) return dateStr;
      const effectiveTz =
        options?.isLocal && !hasExplicitTz ? undefined : options?.timeZone;
      const parts = getDatePartsInTimeZone(parsed, effectiveTz);
      y = parts.year;
      m = parts.month;
      d = parts.day;
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
 * convertendo corretamente de UTC para o fuso do usuário.
 */
export function formatMonthYear(
  dateStr?: string | null,
  locale: AppLocale = "pt-BR",
  timeZone?: string | null,
): string | null {
  if (!dateStr) return null;
  const parsed = parseServerDate(dateStr);
  if (!parsed) return null;
  const { month, year } = getDatePartsInTimeZone(parsed, timeZone);
  const monthName = getShortMonths(locale)[month - 1] ?? "";
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
export function toLocalISOString(
  date: Date = new Date(),
  timeZone?: string | null,
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const { year, month, day, hour, minute, second } = getDatePartsInTimeZone(
    date,
    timeZone,
  );
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}`;
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
 * Retorna a data de hoje no fuso horário do usuário no formato YYYY-MM-DD,
 * evitando o deslocamento prematuro de dia causado por toISOString() (UTC).
 */
export function getTodayDateString(
  now: Date = new Date(),
  timeZone?: string | null,
): string {
  return getDateKeyInTimeZone(now, timeZone);
}

/**
 * Retorna uma data com deslocamento relativo de dias (ex: +1 para amanhã, +7 para próxima semana)
 * no formato YYYY-MM-DD no fuso alvo, tratando corretamente viradas de mês, ano e horário de verão.
 */
export function getOffsetDateString(
  offsetDays: number,
  baseDate: Date = new Date(),
  timeZone?: string | null,
): string {
  const { year, month, day } = getDatePartsInTimeZone(baseDate, timeZone);
  const shifted = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return formatDateParts(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
}

/**
 * Retorna a data máxima de nascimento permitida (padrão: 12 anos atrás) no formato local YYYY-MM-DD,
 * respeitando o fuso horário do usuário quando informado.
 */
export function getMaxBirthDateString(
  minAgeYears = 12,
  now: Date = new Date(),
  timeZone?: string | null,
): string {
  const { year, month, day } = getDatePartsInTimeZone(now, timeZone);
  const shifted = new Date(Date.UTC(year - minAgeYears, month - 1, day));
  return formatDateParts(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate(),
  );
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
  options?: {
    timeFormat?: TimeFormat;
    locale?: AppLocale;
    timeZone?: string | null;
  },
): string {
  if (!timeVal) return "";
  const timeFormat = resolveEffectiveTimeFormat(
    options?.timeFormat,
    options?.locale,
  );
  if (timeVal instanceof Date) {
    const { hour, minute } = getDatePartsInTimeZone(timeVal, options?.timeZone);
    return formatTimeParts(hour, minute, {
      timeFormat,
    });
  }
  const { hour, minute } = parseTimeParts(timeVal);
  return formatTimeParts(hour, minute, { timeFormat });
}

/**
 * Extrai o horário de um objeto Date no formato HH:mm no fuso horário do usuário.
 */
export function formatTimeHHMM(
  date: Date = new Date(),
  timeZone?: string | null,
): string {
  const { hour, minute } = getDatePartsInTimeZone(date, timeZone);
  return formatTimeParts(hour, minute);
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
 * Converte uma string ISO de data (`YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm...`)
 * para timestamp UTC em milissegundos (00:00:00 UTC), ou `null` se inválida.
 */
export function parseIsoDateUtcMs(dateStr: string): number | null {
  const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
  if (!y || !m || !d) return null;
  return Date.UTC(y, m - 1, d);
}
