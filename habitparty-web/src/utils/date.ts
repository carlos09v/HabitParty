import type { AppLocale } from "@/i18n/config";

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
 * Formata strings de data ISO em formato brasileiro DD/MM/AA HH:MM (ou localizado conforme `locale`)
 */
export function formatDateTime(
  dateStr?: string | null,
  options?: {
    includeSeconds?: boolean;
    includeYearFull?: boolean;
    isLocal?: boolean;
    locale?: AppLocale;
  },
): string {
  if (!dateStr) return "-";
  try {
    const d = options?.isLocal
      ? parseLocalDate(dateStr)
      : parseServerDate(dateStr);
    if (!d) return dateStr;
    const intlLocale = options?.locale === "en" ? "en-US" : "pt-BR";
    return d.toLocaleString(intlLocale, {
      day: "2-digit",
      month: "2-digit",
      year: options?.includeYearFull ? "numeric" : "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      ...(options?.includeSeconds ? { second: "2-digit" } : {}),
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formata uma data no padrão YYYY-MM-DD para exibição curta (DD/MM ou DD/MM/AAAA em pt-BR; MM/DD ou MM/DD/YYYY em en)
 */
export function formatShortDate(
  dateStr?: string | null,
  options?: {
    includeYear?: boolean;
    monthFormat?: "2-digit" | "short";
    locale?: AppLocale;
  },
): string {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(y, m - 1, d);
    const intlLocale = options?.locale === "en" ? "en-US" : "pt-BR";
    return dateObj.toLocaleDateString(intlLocale, {
      day: "2-digit",
      month: options?.monthFormat ?? "2-digit",
      ...(options?.includeYear ? { year: "numeric" } : {}),
    });
  } catch {
    return dateStr;
  }
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
}

/**
 * Calcula o rótulo relativo e status de prazo para cards e tabelas de tarefas To-Do:
 * - "Hoje" / "Today" se for hoje (destaque ouro)
 * - "Amanhã" / "Tomorrow" se for amanhã
 * - Dia da semana abreviado ("Seg", "Ter" / "Mon", "Tue") se estiver dentro dos próximos 7 dias (2 a 7 dias)
 * - "17 Nov" / "Nov 17" (Dia + Mês abreviado) se estiver além de 7 dias
 * - "15 Out" / "Oct 15" com isOverdue=true (vermelho) se estiver atrasada (< hoje)
 * - "Sem prazo" / "No due date" se não tiver data
 */
export function getTaskDueDateInfo(
  dueDate?: string | null,
  options?: {
    activeFilter?: string;
    selectedDate?: string | null;
    locale?: AppLocale;
    dueTime?: string | null;
  },
): TaskDueDateInfo {
  const activeFilter = options?.activeFilter;
  const locale = options?.locale ?? "pt-BR";
  const formattedDueTime = options?.dueTime
    ? options.dueTime.slice(0, 5)
    : null;
  const isEn = locale === "en";
  const todayLabel = isEn ? "Today" : "Hoje";
  const tomorrowLabel = isEn ? "Tomorrow" : "Amanhã";
  const noDueDateLabel = isEn ? "No due date" : "Sem prazo";

  if (!dueDate) {
    if (activeFilter === "today") {
      return {
        label: formattedDueTime || todayLabel,
        isToday: true,
        isTomorrow: false,
        isOverdue: false,
        hasDueDate: false,
        diffDays: 0,
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

    const dueMinutes = parseTimeToMinutes(formattedDueTime);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isTodayTimeOverdue =
      diffDays === 0 && dueMinutes !== null && dueMinutes < currentMinutes;

    const monthName = getShortMonths(locale)[targetDate.getMonth()];
    const dayStr = String(d).padStart(2, "0");
    const shortDayMonth = isEn
      ? `${monthName} ${dayStr}`
      : `${dayStr} ${monthName}`;
    const appendTime = (baseLabel: string) =>
      formattedDueTime ? `${baseLabel}, ${formattedDueTime}` : baseLabel;

    // Atrasada (data anterior a hoje)
    if (diffDays < 0) {
      return {
        label: appendTime(shortDayMonth),
        isToday: false,
        isTomorrow: false,
        isOverdue: true,
        hasDueDate: true,
        diffDays,
      };
    }

    // Hoje (ou filtro de hoje para uma tarefa de hoje) -> exibe a hora se houver dueTime, senão "Hoje"
    if (diffDays === 0) {
      return {
        label: formattedDueTime || todayLabel,
        isToday: true,
        isTomorrow: false,
        isOverdue: isTodayTimeOverdue,
        hasDueDate: true,
        diffDays: 0,
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

    const dueMinutes = parseTimeToMinutes(dueTime ? dueTime.slice(0, 5) : null);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isTodayTimeOverdue =
      diffDays === 0 && dueMinutes !== null && dueMinutes < currentMinutes;

    const monthName = getShortMonths(locale)[targetDate.getMonth()];
    const dayStr = String(d).padStart(2, "0");
    const capitalizedWeekDay =
      getCapitalizedWeekDays(locale)[targetDate.getDay()];
    const shortDayMonth = isEn
      ? `${monthName} ${dayStr}`
      : `${dayStr} ${monthName}`;

    // Atrasada
    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      if (isEn) {
        const daysText =
          overdueDays === 1 ? "1 day overdue" : `${overdueDays} days overdue`;
        return {
          label: `${shortDayMonth} (${daysText})`,
          isOverdue: true,
          isToday: false,
          hasDueDate: true,
        };
      }
      const daysText = overdueDays === 1 ? "1 dia" : `${overdueDays} dias`;
      return {
        label: `${shortDayMonth} (atrasada há ${daysText})`,
        isOverdue: true,
        isToday: false,
        hasDueDate: true,
      };
    }

    // Hoje
    if (diffDays === 0) {
      return {
        label: isEn ? `Today, ${shortDayMonth}` : `Hoje, ${shortDayMonth}`,
        isOverdue: isTodayTimeOverdue,
        isToday: true,
        hasDueDate: true,
      };
    }

    // Amanhã
    if (diffDays === 1) {
      return {
        label: isEn ? `Tomorrow, ${shortDayMonth}` : `Amanhã, ${shortDayMonth}`,
        isOverdue: false,
        isToday: false,
        hasDueDate: true,
      };
    }

    // Dentro da semana (2 a 7 dias) -> "Ter, 20 Out" / "Tue, Oct 20"
    if (diffDays <= 7) {
      return {
        label: `${capitalizedWeekDay}, ${shortDayMonth}`,
        isOverdue: false,
        isToday: false,
        hasDueDate: true,
      };
    }

    // Mais de 7 dias (> 1 semana) -> "26 Out (faltam 9 dias)" / "Oct 26 (in 9 days)"
    return {
      label: isEn
        ? `${shortDayMonth} (in ${diffDays} days)`
        : `${shortDayMonth} (faltam ${diffDays} dias)`,
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
 * Formata hora e minuto numéricos no padrão HH:mm (24h).
 */
export function formatTimeParts(hour: number, minute: number): string {
  const h = String(Math.max(0, Math.min(23, hour))).padStart(2, "0");
  const m = String(Math.max(0, Math.min(59, minute))).padStart(2, "0");
  return `${h}:${m}`;
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
