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
      timePart.includes("Z") || timePart.includes("+") || timePart.includes("-");
    if (!hasTz) {
      str = `${str}Z`;
    }
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Formata strings de data ISO em formato brasileiro DD/MM/AA HH:MM
 */
export function formatDateTime(
  dateStr?: string | null,
  options?: { includeSeconds?: boolean; includeYearFull?: boolean },
): string {
  if (!dateStr) return "-";
  try {
    const d = parseServerDate(dateStr);
    if (!d) return dateStr;
    return d.toLocaleString("pt-BR", {
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
 * Formata uma data no padrão YYYY-MM-DD para exibição curta brasileira (DD/MM ou DD/MM/AAAA)
 */
export function formatShortDate(
  dateStr?: string | null,
  options?: { includeYear?: boolean; monthFormat?: "2-digit" | "short" },
): string {
  if (!dateStr) return "";
  try {
    const [y, m, d] = dateStr.split("T")[0].split("-").map(Number);
    if (!y || !m || !d) return dateStr;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: options?.monthFormat ?? "2-digit",
      ...(options?.includeYear ? { year: "numeric" } : {}),
    });
  } catch {
    return dateStr;
  }
}

/**
 * Retorna os limites (segunda-feira 00:00:00 até domingo 23:59:59.999) da semana para um offset relativo
 */
export function getWeekDateRange(
  baseDate: Date = new Date(),
  weekOffset = 0,
): { monday: Date; sunday: Date } {
  const current = new Date(baseDate);
  current.setDate(current.getDate() + weekOffset * 7);

  // Segunda-feira (0 = Segunda, 6 = Domingo)
  const dayOfWeek = (current.getDay() + 6) % 7;
  const monday = new Date(current);
  monday.setDate(current.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
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

export const CAPITALIZED_WEEK_DAYS_BR = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
];

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
 * - "Hoje" se for hoje (destaque ouro)
 * - "Amanhã" se for amanhã
 * - Dia da semana abreviado ("seg", "ter", "qua", etc.) se estiver dentro dos próximos 7 dias (2 a 7 dias)
 * - "17 Nov", "26 Out" (Dia + Mês abreviado) se estiver além de 7 dias
 * - "15 Out" (Dia + Mês abreviado) com isOverdue=true (vermelho) se estiver atrasada (< hoje)
 * - "Sem prazo" se não tiver data
 */
export function getTaskDueDateInfo(
  dueDate?: string | null,
  options?: {
    activeFilter?: string;
    selectedDate?: string | null;
  },
): TaskDueDateInfo {
  const activeFilter = options?.activeFilter;
  const selectedDate = options?.selectedDate;

  if (!dueDate) {
    if (activeFilter === "today") {
      return {
        label: "Hoje",
        isToday: true,
        isTomorrow: false,
        isOverdue: false,
        hasDueDate: false,
        diffDays: 0,
      };
    }
    return {
      label: "Sem prazo",
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const monthName = SHORT_MONTHS_BR[targetDate.getMonth()];
    const dayStr = String(d).padStart(2, "0");

    // Se estiver no filtro de hoje ou se a data selecionada coincidir com hoje
    if (activeFilter === "today" || (selectedDate && diffDays === 0)) {
      return {
        label: "Hoje",
        isToday: true,
        isTomorrow: false,
        isOverdue: false,
        hasDueDate: true,
        diffDays: 0,
      };
    }

    // Atrasada
    if (diffDays < 0) {
      return {
        label: `${dayStr} ${monthName}`,
        isToday: false,
        isTomorrow: false,
        isOverdue: true,
        hasDueDate: true,
        diffDays,
      };
    }

    // Hoje
    if (diffDays === 0) {
      return {
        label: "Hoje",
        isToday: true,
        isTomorrow: false,
        isOverdue: false,
        hasDueDate: true,
        diffDays: 0,
      };
    }

    // Amanhã
    if (diffDays === 1) {
      return {
        label: "Amanhã",
        isToday: false,
        isTomorrow: true,
        isOverdue: false,
        hasDueDate: true,
        diffDays: 1,
      };
    }

    // Dentro dos próximos 7 dias (2 a 7 dias)
    if (diffDays <= 7) {
      const weekDay = CAPITALIZED_WEEK_DAYS_BR[targetDate.getDay()];
      return {
        label: weekDay,
        isToday: false,
        isTomorrow: false,
        isOverdue: false,
        hasDueDate: true,
        diffDays,
      };
    }

    // Além dos 7 dias: Dia + Mês abreviado (ex: "17 Nov", "26 Out")
    return {
      label: `${dayStr} ${monthName}`,
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
): PopoverDueDateInfo {
  if (!dueDate) {
    return {
      label: "Sem prazo",
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffMs = targetDate.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const monthName = SHORT_MONTHS_BR[targetDate.getMonth()];
    const dayStr = String(d).padStart(2, "0");
    const capitalizedWeekDay = CAPITALIZED_WEEK_DAYS_BR[targetDate.getDay()];

    // Atrasada
    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      const daysText = overdueDays === 1 ? "1 dia" : `${overdueDays} dias`;
      return {
        label: `${dayStr} ${monthName} (atrasada há ${daysText})`,
        isOverdue: true,
        isToday: false,
        hasDueDate: true,
      };
    }

    // Hoje
    if (diffDays === 0) {
      return {
        label: `Hoje, ${dayStr} ${monthName}`,
        isOverdue: false,
        isToday: true,
        hasDueDate: true,
      };
    }

    // Amanhã
    if (diffDays === 1) {
      return {
        label: `Amanhã, ${dayStr} ${monthName}`,
        isOverdue: false,
        isToday: false,
        hasDueDate: true,
      };
    }

    // Dentro da semana (2 a 7 dias) -> "Ter, 20 Out"
    if (diffDays <= 7) {
      return {
        label: `${capitalizedWeekDay}, ${dayStr} ${monthName}`,
        isOverdue: false,
        isToday: false,
        hasDueDate: true,
      };
    }

    // Mais de 7 dias (> 1 semana) -> "26 Out (faltam 9 dias)"
    return {
      label: `${dayStr} ${monthName} (faltam ${diffDays} dias)`,
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

export const SHORT_WEEK_DAYS_BR = [
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
  "Dom",
];

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
  const firstWeekday = (firstDay.getDay() + 6) % 7;

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
