import type { ActivityPeriodOption } from "@/constants/dashboard";
import type { AppLocale } from "@/i18n/config";
import { getUtilityTranslator } from "@/i18n/utilityTranslator";
import type { DashboardFocusRecordSummary } from "@/types/dashboard";
import type {
  FocusMetrics,
  FocusRecord,
  FocusSummaryData,
  WeeklyFocusDayData,
} from "@/types/focus";
import type { DateFormat } from "@/types/ui";
import {
  formatDateParts,
  formatNumericCalendarDate,
  getDateKeyInTimeZone,
  getDatePartsInTimeZone,
  getOffsetDateString,
  getShortWeekDays,
  hasTimeZoneSuffix,
  parseServerDate,
  resolveEffectiveDateFormat,
} from "./date";
import { getRewardableFocusMinutes } from "./focusDailyYield";
import { calculateRecordReward } from "./focusRewards";

export interface WeeklyFocusChartResult {
  weeklyDays: WeeklyFocusDayData[];
  totalWeekMinutes: number;
  weekLabel: string;
  weekDateRange: string;
}

export interface FocusMetricsCalculationResult extends WeeklyFocusChartResult {
  metrics: FocusMetrics;
}

export interface FocusSinglePassAggregation {
  metrics: FocusMetrics;
  dayMinutesMap: Record<string, number>;
  globalTodayProductiveMinutes: number;
  globalTodayRewardableMinutes: number;
  todayDurationByActivityId: Record<string, number>;
}

/**
 * Extrai a fatia `FocusMetrics` de um `FocusSummaryData` retornado pelo backend.
 */
export function focusSummaryToMetrics(summary: FocusSummaryData): FocusMetrics {
  return {
    todayRecordsCount: summary.todayRecordsCount,
    totalRecordsCount: summary.totalRecordsCount,
    activeStreakDays: summary.activeStreakDays,
    totalActiveDays: summary.totalActiveDays,
    todayXp: summary.todayXp,
    totalXp: summary.totalXp,
    todayGold: summary.todayGold,
    totalGold: summary.totalGold,
    todayFocusMinutes: summary.todayFocusMinutes,
    totalFocusMinutes: summary.totalFocusMinutes,
    todayPomosCount: summary.todayPomosCount,
    totalPomosCount: summary.totalPomosCount,
    todayAverageMinutes: summary.todayAverageMinutes,
    totalAverageMinutes: summary.totalAverageMinutes,
  };
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
  const hasExplicitTz = hasTimeZoneSuffix(trimmed);
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
  records: DashboardFocusRecordSummary[],
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
 * Agrega métricas, mapa diário, totais produtivos/elegíveis do dia e mapa por atividade
 * em uma única varredura O(N) sobre os registros (substituindo 4 varreduras separadas).
 */
export function aggregateFocusRecordsSinglePass(
  records: FocusRecord[],
  options: {
    referenceDate?: Date;
    todayStr?: string;
    yesterdayStr?: string;
    timeZone?: string | null;
    activityIdFilter?: string | null;
  } = {},
): FocusSinglePassAggregation {
  const referenceDate = options.referenceDate ?? new Date();
  const timeZone = options.timeZone;
  const todayStr =
    options.todayStr || getDateKeyInTimeZone(referenceDate, timeZone);
  const yesterdayStr =
    options.yesterdayStr || getOffsetDateString(-1, referenceDate, timeZone);
  const activityIdFilter = options.activityIdFilter ?? null;

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

  let globalTodayProductiveMinutes = 0;
  let globalTodayRewardableMinutes = 0;
  const todayDurationByActivityId: Record<string, number> = {};
  const dayMinutesMap: Record<string, number> = {};
  const uniqueDays = new Set<string>();

  for (const rec of records) {
    // Regra: itens da mochila (lazer) não contam para foco produtivo, metas nem ofensiva de foco.
    if (rec.inventoryItemId) continue;

    const recDate = toLocalDateKey(rec.endTime, timeZone);
    if (!recDate) continue;

    const mins = rec.durationMinutes || 0;
    if (mins <= 0) continue;

    const isToday = recDate === todayStr;
    if (isToday) {
      globalTodayProductiveMinutes += mins;
      globalTodayRewardableMinutes += getRewardableFocusMinutes(mins);
      if (rec.focusActivityId) {
        todayDurationByActivityId[rec.focusActivityId] =
          (todayDurationByActivityId[rec.focusActivityId] || 0) + mins;
      }
    }

    if (activityIdFilter && rec.focusActivityId !== activityIdFilter) {
      continue;
    }

    totalCount++;
    uniqueDays.add(recDate);
    totalMinutes += mins;

    const pomos =
      rec.completedPomos && rec.completedPomos > 0 ? rec.completedPomos : 0;
    totalPomos += pomos;

    const reward = calculateRecordReward(rec);
    totalXp += reward.xp;
    totalGold += reward.coins;

    if (isToday) {
      todayCount++;
      todayMinutes += mins;
      todayPomos += pomos;
      todayXp += reward.xp;
      todayGold += reward.coins;
    }

    dayMinutesMap[recDate] = (dayMinutesMap[recDate] || 0) + mins;
  }

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
    dayMinutesMap,
    globalTodayProductiveMinutes,
    globalTodayRewardableMinutes,
    todayDurationByActivityId,
  };
}

/**
 * Monta os 7 dias do gráfico semanal em O(7) a partir do mapa `YYYY-MM-DD -> minutos`,
 * desacoplando a navegação semanal (< Esta Semana >) do cálculo de métricas agregadas.
 */
export function buildWeeklyFocusChartData(
  dayMinutesMap: Record<string, number>,
  weekOffset = 0,
  referenceDate: Date = new Date(),
  locale: AppLocale = "pt-BR",
  timeZone?: string | null,
  dateFormat?: DateFormat,
): WeeklyFocusChartResult {
  const t = getUtilityTranslator(locale, "focus.metrics");
  const shortWeekDays = getShortWeekDays(locale);
  const todayStr = getDateKeyInTimeZone(referenceDate, timeZone);

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

  const weeklyDays = calculatedDays.map((item) => ({
    ...item,
    heightPercent: Math.min(100, Math.round((item.minutes / maxDayMins) * 100)),
  }));

  let weekLabel = t("thisWeek");
  if (weekOffset === -1) {
    weekLabel = t("lastWeek");
  } else if (weekOffset < -1) {
    weekLabel = t("offsetWeekNegative", { offset: weekOffset });
  } else if (weekOffset > 0) {
    weekLabel = t("offsetWeekPositive", { offset: weekOffset });
  }

  const endOfWeekUtc = new Date(
    Date.UTC(
      startOfWeekUtc.getUTCFullYear(),
      startOfWeekUtc.getUTCMonth(),
      startOfWeekUtc.getUTCDate() + 6,
    ),
  );
  const effectiveFormat = resolveEffectiveDateFormat(dateFormat, locale);
  const startFormatted = formatNumericCalendarDate(
    startOfWeekUtc.getUTCFullYear(),
    startOfWeekUtc.getUTCMonth() + 1,
    startOfWeekUtc.getUTCDate(),
    effectiveFormat,
    { includeYear: false },
  );
  const endFormatted = formatNumericCalendarDate(
    endOfWeekUtc.getUTCFullYear(),
    endOfWeekUtc.getUTCMonth() + 1,
    endOfWeekUtc.getUTCDate(),
    effectiveFormat,
    { includeYear: false },
  );
  const weekDateRange = t("dateRangeFormatted", {
    start: startFormatted,
    end: endFormatted,
  });

  return {
    weeklyDays,
    totalWeekMinutes: weekTotal,
    weekLabel,
    weekDateRange,
  };
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
  dateFormat?: DateFormat,
): FocusMetricsCalculationResult {
  const { metrics, dayMinutesMap } = aggregateFocusRecordsSinglePass(records, {
    referenceDate,
    timeZone,
  });
  const weekly = buildWeeklyFocusChartData(
    dayMinutesMap,
    weekOffset,
    referenceDate,
    locale,
    timeZone,
    dateFormat,
  );
  return {
    metrics,
    ...weekly,
  };
}
