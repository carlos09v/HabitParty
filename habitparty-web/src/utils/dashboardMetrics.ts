import { ALL_WEEK_DAYS, normalizeTaskType } from "@/constants/task";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import type { Task } from "@/types/task";
import {
  formatDateParts,
  getTodayDateString,
  getWeekDateRange,
  parseDateParts,
  parseServerDate,
  SHORT_MONTHS_BR,
  SHORT_WEEK_DAYS_BR,
} from "./date";

export { getTodayDateString };

export function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function getFirstName(
  fullName?: string | null,
  username?: string | null,
): string {
  return fullName?.trim().split(/\s+/)[0] || username || "Aventureiro";
}

/**
 * Verifica de forma unificada se uma tarefa está agendada para uma data ISO específica (YYYY-MM-DD).
 * - Afazeres (todo): verifica se `dueDate === dateIso`.
 * - Diárias (daily): respeita `startDate` (se houver) e `daysOfWeek` do dia da semana correspondente.
 * - Hábitos (habit): incluídos apenas quando `options.includeHabits` é `true`.
 */
export function isTaskScheduledForDate(
  task: Task,
  dateIso: string,
  options?: { includeHabits?: boolean },
): boolean {
  if (task.dueDate === dateIso) return true;

  const type = normalizeTaskType(task);
  if (type === "habit") {
    return Boolean(options?.includeHabits);
  }

  if (type === "daily") {
    if (task.startDate && task.startDate.split("T")[0] > dateIso) {
      return false;
    }
    const parts = parseDateParts(dateIso);
    if (!parts) return true;
    const dateObj = new Date(parts.year, parts.month, parts.day);
    const dayName = ALL_WEEK_DAYS[dateObj.getDay()];
    return (
      !task.daysOfWeek ||
      task.daysOfWeek.length === 0 ||
      task.daysOfWeek.includes(dayName)
    );
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
): {
  weekDays: WeeklyCalendarDayItem[];
  weekRangeLabel: string;
  streakDaysInWeek: number;
} {
  const { monday, sunday } = getWeekDateRange(baseDate, weekOffset);

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

  const weekDays: WeeklyCalendarDayItem[] = SHORT_WEEK_DAYS_BR.map(
    (shortName, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);

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
        `${shortName}, ${d.getDate()} de ${SHORT_MONTHS_BR[d.getMonth()]}${isToday ? " (Hoje)" : ""}`,
      ];

      if (hasStreak) {
        parts.push("🔥 Ofensiva ativa no dia");
      }
      if (dueTodosCount > 0) {
        parts.push(
          `${dueTodosCount} ${dueTodosCount === 1 ? "prazo de afazer" : "prazos de afazeres"}`,
        );
      } else if (scheduledCount > 0) {
        parts.push(
          `${scheduledCount} ${scheduledCount === 1 ? "rotina programada" : "rotinas programadas"}`,
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

  const startDay = String(monday.getDate()).padStart(2, "0");
  const endDay = String(sunday.getDate()).padStart(2, "0");
  const startMonth = SHORT_MONTHS_BR[monday.getMonth()];
  const endMonth = SHORT_MONTHS_BR[sunday.getMonth()];

  const weekRangeLabel =
    monday.getMonth() === sunday.getMonth()
      ? `${startDay}–${endDay} ${startMonth}`
      : `${startDay} ${startMonth} – ${endDay} ${endMonth}`;

  return {
    weekDays,
    weekRangeLabel,
    streakDaysInWeek,
  };
}
