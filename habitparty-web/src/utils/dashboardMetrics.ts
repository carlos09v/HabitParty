import { FOCUS_REWARD_RULES } from "@/constants/focus";
import { ALL_WEEK_DAYS, normalizeTaskType } from "@/constants/task";
import type { AppLocale } from "@/i18n/config";
import { getUtilityTranslator } from "@/i18n/utilityTranslator";
import type { WeeklyCalendarTaskSummary } from "@/types/dashboard";
import type { FocusRecord } from "@/types/focus";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import type { Task } from "@/types/task";
import {
  DEFAULT_TIMEZONE,
  formatDateParts,
  getDateKeyInTimeZone,
  getDatePartsInTimeZone,
  getShortMonths,
  getShortWeekDays,
  getTodayDateString,
  isValidIanaTimeZone,
  parseDateParts,
  parseServerDate,
} from "./date";
import { toLocalDateKey } from "./focusMetrics";

export { getTodayDateString };

export function getCurrentHourInTimeZone(
  now: Date = new Date(),
  timeZone?: string | null,
): number {
  const effectiveZone = isValidIanaTimeZone(timeZone)
    ? timeZone.trim()
    : typeof window === "undefined"
      ? DEFAULT_TIMEZONE
      : null;

  if (effectiveZone) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        hourCycle: "h23",
        timeZone: effectiveZone,
      }).formatToParts(now);
      const hourPart = parts.find((p) => p.type === "hour")?.value;
      if (hourPart !== undefined) {
        const parsed = Number.parseInt(hourPart, 10);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    } catch {
      // Fallback para getHours() local caso Intl falhe
    }
  }

  return now.getHours();
}

export function getGreeting(
  now: Date = new Date(),
  locale: AppLocale = "pt-BR",
  timeZone?: string | null,
): string {
  const t = getUtilityTranslator(locale, "dashboard.greeting");
  const hour = getCurrentHourInTimeZone(now, timeZone);
  if (hour < 12) return t("morning");
  if (hour < 18) return t("afternoon");
  return t("evening");
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
  task: WeeklyCalendarTaskSummary,
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
    const dateObj = new Date(Date.UTC(parts.year, parts.month, parts.day));
    const repeatType = (task.repeatType || "DAILY").toUpperCase();
    const repeatEvery = Math.max(1, task.repeatEvery ?? 1);
    const anchorParts = parseDateParts(dueIso || startIso);

    if (repeatType === "DAILY") {
      if (repeatEvery > 1 && anchorParts) {
        const anchorMs = Date.UTC(
          anchorParts.year,
          anchorParts.month,
          anchorParts.day,
        );
        const diffDays = Math.round(
          (dateObj.getTime() - anchorMs) / 86_400_000,
        );
        return diffDays >= 0 && diffDays % repeatEvery === 0;
      }
      return true;
    }

    if (repeatType === "WEEKLY") {
      const dayName = ALL_WEEK_DAYS[dateObj.getUTCDay()];
      const matchesDay =
        !task.daysOfWeek ||
        task.daysOfWeek.length === 0 ||
        task.daysOfWeek.includes(dayName);
      if (!matchesDay) return false;

      if (repeatEvery > 1 && anchorParts) {
        const getMondayUtcMs = (d: Date) => {
          const day = d.getUTCDay();
          const offsetToMonday = day === 0 ? -6 : 1 - day;
          return d.getTime() + offsetToMonday * 86_400_000;
        };
        const anchorObj = new Date(
          Date.UTC(anchorParts.year, anchorParts.month, anchorParts.day),
        );
        const diffWeeks = Math.round(
          (getMondayUtcMs(dateObj) - getMondayUtcMs(anchorObj)) /
            (7 * 86_400_000),
        );
        return diffWeeks >= 0 && diffWeeks % repeatEvery === 0;
      }
      return true;
    }

    if (repeatType === "MONTHLY") {
      const startParts = parseDateParts(startIso || dueIso);
      if (!startParts) return false;
      const monthsDiff =
        (parts.year - startParts.year) * 12 + (parts.month - startParts.month);
      if (monthsDiff < 0 || (repeatEvery > 1 && monthsDiff % repeatEvery !== 0))
        return false;

      if (task.monthlyOption === "DAY_OF_THE_WEEK") {
        const startObj = new Date(
          Date.UTC(startParts.year, startParts.month, startParts.day),
        );
        const startOrdinalWeek = Math.floor((startParts.day - 1) / 7) + 1;
        const targetOrdinalWeek = Math.floor((parts.day - 1) / 7) + 1;
        return (
          dateObj.getUTCDay() === startObj.getUTCDay() &&
          targetOrdinalWeek === startOrdinalWeek
        );
      }
      return parts.day === startParts.day;
    }

    if (repeatType === "YEARLY") {
      const startParts = parseDateParts(startIso || dueIso);
      if (!startParts) return false;
      const yearsDiff = parts.year - startParts.year;
      if (yearsDiff < 0 || (repeatEvery > 1 && yearsDiff % repeatEvery !== 0))
        return false;
      return parts.month === startParts.month && parts.day === startParts.day;
    }

    return true;
  }

  return false;
}

/**
 * Verifica se uma tarefa foi efetivamente concluída na data local informada (`dateIso`),
 * protegendo contra estado cliente defasado após a virada da meia-noite.
 */
export function isTaskCompletedOnDate(
  task: WeeklyCalendarTaskSummary,
  dateIso: string,
  timeZone?: string | null,
): boolean {
  if (!task.completed) return false;
  const type = normalizeTaskType(task);
  if ((type === "daily" || type === "habit") && task.lastCompletedAt) {
    const parsed = parseServerDate(task.lastCompletedAt);
    if (parsed) {
      return getDateKeyInTimeZone(parsed, timeZone) === dateIso;
    }
  }
  return true;
}

export function getTodayTasks(tasks: Task[], todayDateStr: string): Task[] {
  return tasks.filter((task) =>
    isTaskScheduledForDate(task, todayDateStr, { includeHabits: false }),
  );
}

/**
 * Verifica se ao menos uma tarefa (incluindo hábitos ou To-Dos sem prazo) foi concluída hoje.
 */
export function hasAnyTaskCompletedOnDate(
  tasks: WeeklyCalendarTaskSummary[],
  dateIso: string,
  timeZone?: string | null,
): boolean {
  return tasks.some((task) => {
    if (!task.completed) return false;
    if (task.lastCompletedAt) {
      const parsed = parseServerDate(task.lastCompletedAt);
      if (parsed) {
        return getDateKeyInTimeZone(parsed, timeZone) === dateIso;
      }
    }
    return isTaskScheduledForDate(task, dateIso, { includeHabits: false });
  });
}

export function getTodayXp(
  transactions: TransactionHistoryResponseDTO[] = [],
  now: Date = new Date(),
  timeZone?: string | null,
): number {
  const todayKey = getTodayDateString(now, timeZone);

  return transactions.reduce((acc, tx) => {
    if (!tx.createdAt || (tx.xpAmount ?? 0) <= 0) return acc;
    const d = parseServerDate(tx.createdAt);
    if (d && getDateKeyInTimeZone(d, timeZone) === todayKey) {
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
  tasks: WeeklyCalendarTaskSummary[],
  transactions: TransactionHistoryResponseDTO[],
  weekOffset: number,
  todayIso: string,
  baseDate: Date = new Date(),
  locale: AppLocale = "pt-BR",
  timeZone?: string | null,
  focusRecords: FocusRecord[] = [],
  todayFocusMinutesOverride = 0,
): {
  weekDays: WeeklyCalendarDayItem[];
  weekRangeLabel: string;
  streakDaysInWeek: number;
} {
  const baseParts = getDatePartsInTimeZone(baseDate, timeZone);
  const baseUtcMs = Date.UTC(
    baseParts.year,
    baseParts.month - 1,
    baseParts.day,
  );
  const dayMs = 86_400_000;
  const startOfWeekUtcMs =
    baseUtcMs + (weekOffset * 7 - baseParts.weekday) * dayMs;
  const startOfWeek = new Date(startOfWeekUtcMs);
  const endOfWeek = new Date(startOfWeekUtcMs + 6 * dayMs);
  const shortWeekDays = getShortWeekDays(locale);
  const shortMonths = getShortMonths(locale);

  const taskCompletedDates = new Set<string>();
  for (const tx of transactions) {
    if (
      tx.createdAt &&
      tx.transactionType &&
      TASK_COMPLETION_TRANSACTION_TYPES.has(tx.transactionType)
    ) {
      const parsed = parseServerDate(tx.createdAt);
      if (parsed) {
        taskCompletedDates.add(getDateKeyInTimeZone(parsed, timeZone));
      }
    }
  }

  // Tarefas concluídas hoje garantem imediatamente a parte de tarefas do dia no calendário
  if (
    tasks.some((t) => {
      if (!t.completed || !t.lastCompletedAt) return false;
      const parsed = parseServerDate(t.lastCompletedAt);
      if (!parsed) return false;
      return getDateKeyInTimeZone(parsed, timeZone) === todayIso;
    })
  ) {
    taskCompletedDates.add(todayIso);
  }

  const focusMinutesByDate = new Map<string, number>();
  for (const rec of focusRecords) {
    if (rec.inventoryItemId) continue;
    const rawDate = rec.startTime || rec.endTime;
    if (!rawDate) continue;
    const dateKey = toLocalDateKey(rawDate, timeZone);
    if (!dateKey) continue;
    focusMinutesByDate.set(
      dateKey,
      (focusMinutesByDate.get(dateKey) ?? 0) +
        Math.max(0, rec.durationMinutes || 0),
    );
  }
  if (todayFocusMinutesOverride > 0) {
    focusMinutesByDate.set(
      todayIso,
      Math.max(
        focusMinutesByDate.get(todayIso) ?? 0,
        todayFocusMinutesOverride,
      ),
    );
  }

  const activityDates = new Set<string>(taskCompletedDates);
  for (const [dateKey, minutes] of focusMinutesByDate.entries()) {
    if (minutes >= FOCUS_REWARD_RULES.MIN_DAILY_STREAK_FOCUS_MINUTES) {
      activityDates.add(dateKey);
    }
  }

  let streakDaysInWeek = 0;

  const weekDays: WeeklyCalendarDayItem[] = shortWeekDays.map(
    (shortName, index) => {
      const d = new Date(startOfWeekUtcMs + index * dayMs);
      const dayNumber = d.getUTCDate();
      const monthIndex = d.getUTCMonth();

      const isoString = formatDateParts(
        d.getUTCFullYear(),
        monthIndex,
        dayNumber,
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
          t.dueDate?.split("T")[0] === isoString,
      ).length;

      const scheduledCount = tasks.filter((t) =>
        isTaskScheduledForDate(t, isoString, { includeHabits: false }),
      ).length;

      const tCal = getUtilityTranslator(locale, "dashboard.weeklyCalendar");
      const parts: string[] = [
        tCal("dayHeader", {
          weekDay: shortName,
          month: shortMonths[monthIndex],
          day: dayNumber,
          todaySuffix: isToday ? tCal("todaySuffix") : "",
        }),
      ];

      if (hasStreak) {
        parts.push(tCal("activeStreak"));
      }
      if (dueTodosCount > 0) {
        parts.push(tCal("dueTodosCount", { count: dueTodosCount }));
      } else if (scheduledCount > 0) {
        parts.push(tCal("scheduledCount", { count: scheduledCount }));
      }

      return {
        shortName,
        dayNumber,
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

  const startDay = String(startOfWeek.getUTCDate()).padStart(2, "0");
  const endDay = String(endOfWeek.getUTCDate()).padStart(2, "0");
  const startMonth = shortMonths[startOfWeek.getUTCMonth()];
  const endMonth = shortMonths[endOfWeek.getUTCMonth()];

  const weekRangeLabel =
    startOfWeek.getUTCMonth() === endOfWeek.getUTCMonth()
      ? `${startDay}–${endDay} ${startMonth}`
      : `${startDay} ${startMonth} – ${endDay} ${endMonth}`;

  return {
    weekDays,
    weekRangeLabel,
    streakDaysInWeek,
  };
}

export const TASK_COMPLETION_TRANSACTION_TYPES = new Set([
  "HABIT_COMPLETED",
  "DAILY_COMPLETED",
  "TODO_COMPLETED",
  "TASK_COMPLETED",
]);

export function getLatestTaskCompletionCreatedAt(
  transactions: TransactionHistoryResponseDTO[] = [],
): string | null {
  let latestCreatedAt: string | null = null;
  let latestTimestamp = -1;

  for (const tx of transactions) {
    if (!tx.createdAt || !tx.transactionType) continue;
    if (!TASK_COMPLETION_TRANSACTION_TYPES.has(tx.transactionType)) continue;
    const parsed = parseServerDate(tx.createdAt);
    const ts = parsed?.getTime() ?? -1;
    if (ts > latestTimestamp) {
      latestTimestamp = ts;
      latestCreatedAt = tx.createdAt;
    }
  }

  return latestCreatedAt;
}

/**
 * Verifica se há ao menos uma transação de conclusão de tarefa (Hábito positivo,
 * Diária ou Afazer) registrada hoje, refletindo a mesma regra usada no backend
 * para contabilizar a ofensiva diária mesmo em tarefas fora da lista de hoje.
 */
export function hasCompletedTaskInTransactionsToday(
  transactions: TransactionHistoryResponseDTO[] = [],
  now: Date = new Date(),
  timeZone?: string | null,
): boolean {
  const latest = getLatestTaskCompletionCreatedAt(transactions);
  if (!latest) return false;
  const d = parseServerDate(latest);
  if (!d) return false;
  return (
    getDateKeyInTimeZone(d, timeZone) === getTodayDateString(now, timeZone)
  );
}
