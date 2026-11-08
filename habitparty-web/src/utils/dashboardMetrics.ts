import { ALL_WEEK_DAYS, normalizeTaskType } from "@/constants/task";
import type { AppLocale } from "@/i18n/config";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import type { Task } from "@/types/task";
import {
  formatDateParts,
  getShortMonths,
  getShortWeekDays,
  getTodayDateString,
  getWeekDateRange,
  parseDateParts,
  parseServerDate,
} from "./date";

export { getTodayDateString };

export function getGreeting(
  now: Date = new Date(),
  locale: AppLocale = "pt-BR",
): string {
  let hour = now.getHours();
  if (typeof window === "undefined") {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hourCycle: "h23",
        timeZone: "America/Sao_Paulo",
      }).formatToParts(now);
      const hourPart = parts.find((p) => p.type === "hour")?.value;
      if (hourPart !== undefined) {
        const parsed = Number.parseInt(hourPart, 10);
        if (!Number.isNaN(parsed)) {
          hour = parsed;
        }
      }
    } catch {
      // Fallback para getHours() local caso Intl falhe
    }
  }
  if (locale === "en") {
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function getFirstName(
  fullName?: string | null,
  username?: string | null,
  defaultName = "Aventureiro",
): string {
  return fullName?.trim().split(/\s+/)[0] || username || defaultName;
}

/**
 * Verifica de forma unificada se uma tarefa está agendada para uma data ISO específica (YYYY-MM-DD).
 * - Afazeres (todo): verifica se `dueDate === dateIso`.
 * - Diárias (daily): respeita `startDate` (se houver) e `repeatType` (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`).
 * - Hábitos (habit): incluídos apenas quando `options.includeHabits` é `true`.
 */
export function isTaskScheduledForDate(
  task: Task,
  dateIso: string,
  options?: { includeHabits?: boolean },
): boolean {
  const type = normalizeTaskType(task);

  if (type === "habit") {
    return Boolean(options?.includeHabits);
  }

  if (type === "todo") {
    return Boolean(task.dueDate && task.dueDate.split("T")[0] === dateIso);
  }

  if (type === "daily") {
    const startIso = task.startDate ? task.startDate.split("T")[0] : undefined;
    if (startIso && startIso > dateIso) {
      return false;
    }

    const dueIso = task.dueDate ? task.dueDate.split("T")[0] : undefined;
    if (dueIso === dateIso) {
      return true;
    }

    const parts = parseDateParts(dateIso);
    if (!parts) return true;
    const dateObj = new Date(parts.year, parts.month, parts.day);
    const repeatType = (task.repeatType || "DAILY").toUpperCase();

    if (repeatType === "DAILY") {
      return true;
    }

    if (repeatType === "WEEKLY") {
      const dayName = ALL_WEEK_DAYS[dateObj.getDay()];
      return (
        !task.daysOfWeek ||
        task.daysOfWeek.length === 0 ||
        task.daysOfWeek.includes(dayName)
      );
    }

    if (repeatType === "MONTHLY") {
      const startParts = parseDateParts(startIso || dueIso);
      if (!startParts) return false;
      if (task.monthlyOption === "DAY_OF_THE_WEEK") {
        const startObj = new Date(
          startParts.year,
          startParts.month,
          startParts.day,
        );
        const startOrdinalWeek = Math.floor((startParts.day - 1) / 7) + 1;
        const targetOrdinalWeek = Math.floor((parts.day - 1) / 7) + 1;
        return (
          dateObj.getDay() === startObj.getDay() &&
          targetOrdinalWeek === startOrdinalWeek
        );
      }
      return parts.day === startParts.day;
    }

    if (repeatType === "YEARLY") {
      const startParts = parseDateParts(startIso || dueIso);
      if (!startParts) return false;
      return parts.month === startParts.month && parts.day === startParts.day;
    }

    return true;
  }

  return false;
}

export function getTodayTasks(tasks: Task[], todayDateStr: string): Task[] {
  return tasks.filter((task) =>
    isTaskScheduledForDate(task, todayDateStr, { includeHabits: false }),
  );
}

export function getTodayXp(
  transactions: TransactionHistoryResponseDTO[] = [],
  now: Date = new Date(),
): number {
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  return transactions.reduce((acc, tx) => {
    if (!tx.createdAt || (tx.xpAmount ?? 0) <= 0) return acc;
    const d = parseServerDate(tx.createdAt);
    if (d && d >= todayStart) {
      return acc + (tx.xpAmount ?? 0);
    }
    return acc;
  }, 0);
}

/**
 * Gera os números de página (com reticências "...") para paginação de tabelas.
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
): (number | "dots")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "dots", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "dots",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "dots",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "dots",
    totalPages,
  ];
}

export interface WeeklyCalendarDayItem {
  shortName: string;
  dayNumber: number;
  isoString: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  hasStreak: boolean;
  dueTodosCount: number;
  scheduledCount: number;
  tooltipText: string;
}

/**
 * Constrói os dados dos 7 dias da semana para o Rastreador de Ofensiva & Prazos (WeeklyCalendar),
 * diferenciando conquistas/ofensiva (dias com ganho de XP/conclusão) de prazos reais de To-Dos.
 */
export function buildWeeklyCalendarData(
  tasks: Task[],
  transactions: TransactionHistoryResponseDTO[],
  weekOffset: number,
  todayIso: string,
  baseDate: Date = new Date(),
  locale: AppLocale = "pt-BR",
): {
  weekDays: WeeklyCalendarDayItem[];
  weekRangeLabel: string;
  streakDaysInWeek: number;
} {
  const { startOfWeek, endOfWeek } = getWeekDateRange(baseDate, weekOffset);
  const shortWeekDays = getShortWeekDays(locale);
  const shortMonths = getShortMonths(locale);

  const activityDates = new Set<string>();
  for (const tx of transactions) {
    if (tx.createdAt && (tx.xpAmount ?? 0) > 0) {
      const parsed = parseServerDate(tx.createdAt);
      if (parsed) {
        activityDates.add(
          formatDateParts(
            parsed.getFullYear(),
            parsed.getMonth(),
            parsed.getDate(),
          ),
        );
      }
    }
  }

  // Se alguma tarefa foi concluída hoje (mesmo em estado otimista), garante ofensiva hoje
  if (tasks.some((t) => t.completed)) {
    activityDates.add(todayIso);
  }

  let streakDaysInWeek = 0;

  const weekDays: WeeklyCalendarDayItem[] = shortWeekDays.map(
    (shortName, index) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + index);

      const isoString = formatDateParts(
        d.getFullYear(),
        d.getMonth(),
        d.getDate(),
      );
      const isToday = isoString === todayIso;
      const isPast = isoString < todayIso;
      const isFuture = isoString > todayIso;

      const hasStreak = activityDates.has(isoString);
      if (hasStreak) {
        streakDaysInWeek++;
      }

      const dueTodosCount = tasks.filter(
        (t) =>
          normalizeTaskType(t) === "todo" &&
          !t.completed &&
          t.dueDate === isoString,
      ).length;

      const scheduledCount = tasks.filter((t) =>
        isTaskScheduledForDate(t, isoString, { includeHabits: false }),
      ).length;

      const parts: string[] = [
        locale === "en"
          ? `${shortName}, ${shortMonths[d.getMonth()]} ${d.getDate()}${isToday ? " (Today)" : ""}`
          : `${shortName}, ${d.getDate()} de ${shortMonths[d.getMonth()]}${isToday ? " (Hoje)" : ""}`,
      ];

      if (hasStreak) {
        parts.push(
          locale === "en"
            ? "🔥 Active streak on this day"
            : "🔥 Ofensiva ativa no dia",
        );
      }
      if (dueTodosCount > 0) {
        parts.push(
          locale === "en"
            ? `${dueTodosCount} ${dueTodosCount === 1 ? "to-do due" : "to-dos due"}`
            : `${dueTodosCount} ${dueTodosCount === 1 ? "prazo de afazer" : "prazos de afazeres"}`,
        );
      } else if (scheduledCount > 0) {
        parts.push(
          locale === "en"
            ? `${scheduledCount} ${scheduledCount === 1 ? "scheduled routine" : "scheduled routines"}`
            : `${scheduledCount} ${scheduledCount === 1 ? "rotina programada" : "rotinas programadas"}`,
        );
      }

      return {
        shortName,
        dayNumber: d.getDate(),
        isoString,
        isToday,
        isPast,
        isFuture,
        hasStreak,
        dueTodosCount,
        scheduledCount,
        tooltipText: parts.join(" • "),
      };
    },
  );

  const startDay = String(startOfWeek.getDate()).padStart(2, "0");
  const endDay = String(endOfWeek.getDate()).padStart(2, "0");
  const startMonth = shortMonths[startOfWeek.getMonth()];
  const endMonth = shortMonths[endOfWeek.getMonth()];

  const weekRangeLabel =
    startOfWeek.getMonth() === endOfWeek.getMonth()
      ? `${startDay}–${endDay} ${startMonth}`
      : `${startDay} ${startMonth} – ${endDay} ${endMonth}`;

  return {
    weekDays,
    weekRangeLabel,
    streakDaysInWeek,
  };
}
