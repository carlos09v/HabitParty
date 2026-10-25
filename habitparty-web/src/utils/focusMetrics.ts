import type { ActivityPeriodOption } from "@/constants/dashboard";
import type {
  FocusMetrics,
  FocusRecord,
  WeeklyFocusDayData,
} from "@/types/focus";
import { getWeekDateRange, parseServerDate } from "./date";
import { calculateRecordReward } from "./focusRewards";

export { calculateRecordReward };

export interface FocusMetricsCalculationResult {
  metrics: FocusMetrics;
  weeklyDays: WeeklyFocusDayData[];
  totalWeekMinutes: number;
  weekLabel: string;
  weekDateRange: string;
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

/**
 * Converte um Date ou string ISO para chave YYYY-MM-DD no fuso horário local.
 */
export function toLocalDateKey(dateInput: Date | string): string {
  const d =
    typeof dateInput === "string"
      ? dateInput.includes("T")
        ? parseServerDate(dateInput)
        : new Date(`${dateInput}T12:00:00`)
      : dateInput;
  if (!d || Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Calcula o mapa de minutos focados por atividade para um determinado período
 * ("today", "this_week", "this_month") ou data selecionada (YYYY-MM-DD),
 * respeitando o fuso horário local do usuário.
 */
export function calculateActivityDurationMap(
  records: FocusRecord[],
  period: ActivityPeriodOption,
  selectedDate?: string | null,
  referenceDate: Date = new Date(),
): Record<string, number> {
  const map: Record<string, number> = {};
  const todayStr = toLocalDateKey(referenceDate);
  const { monday, sunday } = getWeekDateRange(referenceDate, 0);

  for (const rec of records) {
    if (!rec.focusActivityId || !rec.endTime) continue;

    const recDate = parseServerDate(rec.endTime);
    if (!recDate) continue;
    const recDateStr = toLocalDateKey(recDate);

    let matches = false;
    if (selectedDate) {
      matches = recDateStr === selectedDate;
    } else if (period === "today") {
      matches = recDateStr === todayStr;
    } else if (period === "this_week") {
      matches = recDate >= monday && recDate <= sunday;
    } else if (period === "this_month") {
      matches =
        recDate.getFullYear() === referenceDate.getFullYear() &&
        recDate.getMonth() === referenceDate.getMonth();
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

  let streak = 0;
  // Meio-dia para evitar inconsistências em trocas de horário
  const cursor = new Date(`${currentCheckStr}T12:00:00`);

  while (true) {
    const key = toLocalDateKey(cursor);
    if (uniqueDays.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
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
): FocusMetricsCalculationResult {
  const todayStr = toLocalDateKey(referenceDate);

  const yesterday = new Date(referenceDate);
  yesterday.setDate(referenceDate.getDate() - 1);
  const yesterdayStr = toLocalDateKey(yesterday);

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
    const recDate = toLocalDateKey(rec.endTime);
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

  // Base para a semana selecionada (aplicando weekOffset em blocos de 7 dias)
  const targetDate = new Date(referenceDate);
  targetDate.setDate(referenceDate.getDate() + weekOffset * 7);

  // Encontra o Domingo da semana correspondente (0 = Domingo)
  const currentDayIdx = targetDate.getDay();
  const startOfWeek = new Date(targetDate);
  startOfWeek.setDate(targetDate.getDate() - currentDayIdx);
  startOfWeek.setHours(0, 0, 0, 0);

  const calculatedDays: WeeklyFocusDayData[] = [];
  let weekTotal = 0;
  let maxDayMins = 1;

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    const dateKey = toLocalDateKey(d);
    const mins = dayMinutesMap[dateKey] || 0;
    weekTotal += mins;
    if (mins > maxDayMins) {
      maxDayMins = mins;
    }

    calculatedDays.push({
      dayLabel: DAY_LABELS[i],
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
  let weekLabel = "Esta semana";
  if (weekOffset === -1) {
    weekLabel = "Sem. passada";
  } else if (weekOffset < -1) {
    weekLabel = `Sem. ${weekOffset}`;
  } else if (weekOffset > 0) {
    weekLabel = `Sem. +${weekOffset}`;
  }

  // Range de data (ex: "12/10 a 18/10")
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const startDay = String(startOfWeek.getDate()).padStart(2, "0");
  const startMonth = String(startOfWeek.getMonth() + 1).padStart(2, "0");
  const endDay = String(endOfWeek.getDate()).padStart(2, "0");
  const endMonth = String(endOfWeek.getMonth() + 1).padStart(2, "0");
  const weekDateRange = `${startDay}/${startMonth} a ${endDay}/${endMonth}`;

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
