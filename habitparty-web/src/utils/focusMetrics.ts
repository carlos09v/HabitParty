import type { ActivityPeriodOption } from "@/constants/dashboard";
import type { AppLocale } from "@/i18n/config";
import type {
  FocusMetrics,
  FocusRecord,
  WeeklyFocusDayData,
} from "@/types/focus";
import {
  formatDateParts,
  getDateKeyInTimeZone,
  getDatePartsInTimeZone,
  getOffsetDateString,
  getShortWeekDays,
  parseServerDate,
} from "./date";
import { calculateRecordReward } from "./focusRewards";

export { calculateRecordReward };

export interface FocusMetricsCalculationResult {
  metrics: FocusMetrics;
  weeklyDays: WeeklyFocusDayData[];
  totalWeekMinutes: number;
  weekLabel: string;
  weekDateRange: string;
}

/**
 * Converte um Date ou string ISO/calendário para chave YYYY-MM-DD no fuso horário alvo do usuário.
 */
export function toLocalDateKey(
  dateInput: Date | string,
  timeZone?: string | null,
): string {
  if (dateInput instanceof Date) {
    if (Number.isNaN(dateInput.getTime())) return "";
    return getDateKeyInTimeZone(dateInput, timeZone);
  }
  const trimmed = dateInput.trim();
  if (!trimmed) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const timePart = trimmed.split("T")[1] ?? trimmed.split(" ")[1] ?? "";
  const hasExplicitTz = /([zZ]|[+-]\d{2}(?::?\d{2})?)$/.test(timePart.trim());
  if (!hasExplicitTz) {
    // String naive (sem offset) já representa wall-clock; extrair YYYY-MM-DD direto evita dupla conversão.
    const datePrefix = trimmed.split("T")[0]?.split(" ")[0] ?? "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePrefix)) {
      return datePrefix;
    }
    return "";
  }
  const parsed = parseServerDate(trimmed);
  if (!parsed) return "";
  return getDateKeyInTimeZone(parsed, timeZone);
}

/**
 * Calcula o mapa de minutos focados por atividade para um determinado período
 * ("today", "this_week", "this_month") ou data selecionada (YYYY-MM-DD),
 * respeitando o fuso horário do usuário.
 */
export function calculateActivityDurationMap(
  records: FocusRecord[],
  period: ActivityPeriodOption,
  selectedDate?: string | null,
  referenceDate: Date = new Date(),
  timeZone?: string | null,
): Record<string, number> {
  const map: Record<string, number> = {};
  const todayStr = getDateKeyInTimeZone(referenceDate, timeZone);
  const refParts = getDatePartsInTimeZone(referenceDate, timeZone);
  const weekStartUtc = new Date(
    Date.UTC(
      refParts.year,
      refParts.month - 1,
      refParts.day - refParts.weekday,
    ),
  );
  const weekEndUtc = new Date(
    Date.UTC(
      refParts.year,
      refParts.month - 1,
      refParts.day - refParts.weekday + 6,
    ),
  );
  const weekStartStr = formatDateParts(
    weekStartUtc.getUTCFullYear(),
    weekStartUtc.getUTCMonth(),
    weekStartUtc.getUTCDate(),
  );
  const weekEndStr = formatDateParts(
    weekEndUtc.getUTCFullYear(),
    weekEndUtc.getUTCMonth(),
    weekEndUtc.getUTCDate(),
  );

  for (const rec of records) {
    if (!rec.focusActivityId || !rec.endTime) continue;

    const recDateStr = toLocalDateKey(rec.endTime, timeZone);
    if (!recDateStr) continue;

    let matches = false;
    if (selectedDate) {
      matches = recDateStr === selectedDate;
    } else if (period === "today") {
      matches = recDateStr === todayStr;
    } else if (period === "this_week") {
      matches = recDateStr >= weekStartStr && recDateStr <= weekEndStr;
    } else if (period === "this_month") {
      matches = recDateStr.slice(0, 7) === todayStr.slice(0, 7);
    }

    if (matches) {
      map[rec.focusActivityId] =
        (map[rec.focusActivityId] || 0) + (rec.durationMinutes || 0);
    }
  }

  return map;
}

/**
 * Calcula o streak de dias consecutivos de foco.
 */
function calculateConsecutiveStreak(
  uniqueDays: Set<string>,
  todayStr: string,
  yesterdayStr: string,
): number {
  if (uniqueDays.size === 0) return 0;

  // Se focou hoje, o streak conta a partir de hoje. Se ainda não focou hoje, mas focou ontem, preserva a partir de ontem.
  const currentCheckStr = uniqueDays.has(todayStr)
    ? todayStr
    : uniqueDays.has(yesterdayStr)
      ? yesterdayStr
      : null;

  if (!currentCheckStr) return 0;

  const [y, m, d] = currentCheckStr.split("-").map(Number);
  if (!y || !m || !d) return 0;

  let streak = 0;
  const cursor = new Date(Date.UTC(y, m - 1, d));

  while (true) {
    const key = formatDateParts(
      cursor.getUTCFullYear(),
      cursor.getUTCMonth(),
      cursor.getUTCDate(),
    );
    if (uniqueDays.has(key)) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calcula métricas agregadas e dados do gráfico semanal de foco de forma pura e determinística.
 * Suporta weekOffset para navegar por semanas anteriores (< Esta Semana >).
 */
export function calculateFocusMetrics(
  records: FocusRecord[],
  weekOffset = 0,
  referenceDate: Date = new Date(),
  locale: AppLocale = "pt-BR",
  timeZone?: string | null,
): FocusMetricsCalculationResult {
  const isEn = locale === "en";
  const shortWeekDays = getShortWeekDays(locale);
  const todayStr = getDateKeyInTimeZone(referenceDate, timeZone);
  const yesterdayStr = getOffsetDateString(-1, referenceDate, timeZone);

  let todayCount = 0;
  let totalCount = 0;
  let todayMinutes = 0;
  let totalMinutes = 0;
  let todayPomos = 0;
  let totalPomos = 0;
  let todayXp = 0;
  let totalXp = 0;
  let todayGold = 0;
  let totalGold = 0;

  const dayMinutesMap: Record<string, number> = {};
  const uniqueDays = new Set<string>();

  for (const rec of records) {
    const recDate = toLocalDateKey(rec.endTime, timeZone);
    if (!recDate) continue;

    const mins = rec.durationMinutes || 0;
    // Trava de integridade: ignora sessões vazias/acidentais sem duração mínima de 1 minuto
    if (mins <= 0) continue;

    totalCount++;
    uniqueDays.add(recDate);
    totalMinutes += mins;

    // Regra de Pomodoro: somente ciclos completados com sucesso pontuam como pomo
    const pomos =
      rec.completedPomos && rec.completedPomos > 0 ? rec.completedPomos : 0;
    totalPomos += pomos;

    // Regra: Somente atividades geram XP e Moedas. Mochila (rec.inventoryItemId) gera 0.
    const reward = calculateRecordReward(rec);
    totalXp += reward.xp;
    totalGold += reward.coins;

    if (recDate === todayStr) {
      todayCount++;
      todayMinutes += mins;
      todayPomos += pomos;
      todayXp += reward.xp;
      todayGold += reward.coins;
    }

    dayMinutesMap[recDate] = (dayMinutesMap[recDate] || 0) + mins;
  }

  const refParts = getDatePartsInTimeZone(referenceDate, timeZone);
  const targetUtc = new Date(
    Date.UTC(refParts.year, refParts.month - 1, refParts.day + weekOffset * 7),
  );
  const currentDayIdx = targetUtc.getUTCDay();
  const startOfWeekUtc = new Date(
    Date.UTC(
      targetUtc.getUTCFullYear(),
      targetUtc.getUTCMonth(),
      targetUtc.getUTCDate() - currentDayIdx,
    ),
  );

  const calculatedDays: WeeklyFocusDayData[] = [];
  let weekTotal = 0;
  let maxDayMins = 1;

  for (let i = 0; i < 7; i++) {
    const d = new Date(
      Date.UTC(
        startOfWeekUtc.getUTCFullYear(),
        startOfWeekUtc.getUTCMonth(),
        startOfWeekUtc.getUTCDate() + i,
      ),
    );
    const dateKey = formatDateParts(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
    );
    const mins = dayMinutesMap[dateKey] || 0;
    weekTotal += mins;
    if (mins > maxDayMins) {
      maxDayMins = mins;
    }

    calculatedDays.push({
      dayLabel: shortWeekDays[i],
      fullDate: dateKey,
      minutes: mins,
      heightPercent: 0,
      isToday: dateKey === todayStr,
    });
  }

  const weeklyDaysWithHeight = calculatedDays.map((item) => ({
    ...item,
    heightPercent: Math.min(100, Math.round((item.minutes / maxDayMins) * 100)),
  }));

  // Rótulo conciso da semana para caber perfeitamente na sidebar sem quebrar o título
  let weekLabel = isEn ? "This week" : "Esta semana";
  if (weekOffset === -1) {
    weekLabel = isEn ? "Last wk." : "Sem. passada";
  } else if (weekOffset < -1) {
    weekLabel = isEn ? `Wk. ${weekOffset}` : `Sem. ${weekOffset}`;
  } else if (weekOffset > 0) {
    weekLabel = isEn ? `Wk. +${weekOffset}` : `Sem. +${weekOffset}`;
  }

  // Range de data (ex: "12/10 a 18/10" ou "10/12 to 10/18")
  const endOfWeekUtc = new Date(
    Date.UTC(
      startOfWeekUtc.getUTCFullYear(),
      startOfWeekUtc.getUTCMonth(),
      startOfWeekUtc.getUTCDate() + 6,
    ),
  );
  const startDay = String(startOfWeekUtc.getUTCDate()).padStart(2, "0");
  const startMonth = String(startOfWeekUtc.getUTCMonth() + 1).padStart(2, "0");
  const endDay = String(endOfWeekUtc.getUTCDate()).padStart(2, "0");
  const endMonth = String(endOfWeekUtc.getUTCMonth() + 1).padStart(2, "0");
  const weekDateRange = isEn
    ? `${startMonth}/${startDay} to ${endMonth}/${endDay}`
    : `${startDay}/${startMonth} a ${endDay}/${endMonth}`;

  const todayAverageMinutes =
    todayCount > 0 ? Math.round(todayMinutes / todayCount) : 0;
  const totalAverageMinutes =
    totalCount > 0 ? Math.round(totalMinutes / totalCount) : 0;

  const metrics: FocusMetrics = {
    todayRecordsCount: todayCount,
    totalRecordsCount: totalCount,
    activeStreakDays: calculateConsecutiveStreak(
      uniqueDays,
      todayStr,
      yesterdayStr,
    ),
    totalActiveDays: uniqueDays.size,
    todayXp,
    totalXp,
    todayGold: Math.round(todayGold * 100) / 100,
    totalGold: Math.round(totalGold * 100) / 100,
    todayFocusMinutes: todayMinutes,
    totalFocusMinutes: totalMinutes,
    todayPomosCount: todayPomos,
    totalPomosCount: totalPomos,
    todayAverageMinutes,
    totalAverageMinutes,
  };

  return {
    metrics,
    weeklyDays: weeklyDaysWithHeight,
    totalWeekMinutes: weekTotal,
    weekLabel,
    weekDateRange,
  };
}
