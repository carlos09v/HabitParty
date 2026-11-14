import type { AppLocale } from "@/i18n/config";
import { getDateKeyInTimeZone } from "./timezone";

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

function formatGridDateParts(year: number, month: number, day: number): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function generateCalendarGrid(
  viewYear: number,
  viewMonth: number,
  selectedIso?: string | null,
  options?: { minDate?: string; maxDate?: string; timeZone?: string | null },
): CalendarDayCell[] {
  const now = new Date();
  const todayIso = getDateKeyInTimeZone(now, options?.timeZone);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const firstWeekday = firstDay.getDay();

  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days: CalendarDayCell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    const iso = formatGridDateParts(prevYear, prevMonth, prevDay);

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
    const iso = formatGridDateParts(viewYear, viewMonth, d);
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
    const iso = formatGridDateParts(nextYear, nextMonth, d);

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
