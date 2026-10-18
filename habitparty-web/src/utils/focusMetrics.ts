import type {
  FocusMetrics,
  FocusRecord,
  WeeklyFocusDayData,
} from "@/types/focus";

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
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
 * Estima a recompensa de uma sessão de foco com base nas regras calibradas do HabitParty,
 * espelhando exatamente a implementação de domínio do backend (FocusRewardCalculator).
 * Regra fundamental: Sessões de itens da mochila NUNCA geram XP nem moedas.
 */
export function calculateRecordReward(
  record: FocusRecord,
  priorFocusMinutesToday = 0,
): { xp: number; coins: number } {
  // Trava 1: Se for uso de item de inventário (mochila/recompensa de lazer), NUNCA gera XP ou Moedas
  if (record.inventoryItemId) {
    return { xp: 0, coins: 0 };
  }

  // Se o registro já possui os valores oficiais calculados e persistidos pelo backend
  if (
    record.xpEarned !== undefined &&
    record.xpEarned !== null &&
    record.coinsEarned !== undefined &&
    record.coinsEarned !== null
  ) {
    return {
      xp: record.xpEarned,
      coins: Number(record.coinsEarned),
    };
  }

  const durationMinutes = record.durationMinutes || 0;

  // Trava 2: Tempo mínimo de 10 minutos para qualificar para recompensa
  if (durationMinutes < 10) {
    return { xp: 0, coins: 0 };
  }

  // Trava 3: Teto por sessão única (máximo 90 minutos para conter esquecimento / AFK)
  const effectiveMinutes = Math.min(durationMinutes, 90);

  let baseXp = 0;
  let baseCoins = 0;

  const isPomo = record.recordType === "POMO";
  const completedPomos = record.completedPomos ?? 0;

  if (isPomo && completedPomos > 0) {
    const minutesPerPomo = Math.floor(effectiveMinutes / completedPomos);

    if (minutesPerPomo < 15) {
      // Anti-exploit: muitos pomos declarados para pouco tempo decorrido
      baseXp = (effectiveMinutes / 30.0) * 6.0;
      baseCoins = (effectiveMinutes / 30.0) * 0.15;
    } else if (minutesPerPomo < 25) {
      // Pomodoro curto (15 a 24 min)
      baseXp = completedPomos * 4.0;
      baseCoins = completedPomos * 0.1;
    } else if (minutesPerPomo <= 40) {
      // Pomodoro padrão (25 a 40 min)
      baseXp = completedPomos * 8.0;
      baseCoins = completedPomos * 0.25;
    } else {
      // Pomodoro longo / Deep work (> 40 min)
      baseXp = completedPomos * 15.0;
      baseCoins = completedPomos * 0.5;
    }
  } else if (isPomo) {
    // Pomodoro sem ciclo completado formalmente
    baseXp = (effectiveMinutes / 30.0) * 6.0;
    baseCoins = (effectiveMinutes / 30.0) * 0.15;
  } else {
    // STOPWATCH: ~7 XP e 0,20 moedas a cada 30 minutos
    baseXp = (effectiveMinutes / 30.0) * 7.0;
    baseCoins = (effectiveMinutes / 30.0) * 0.2;
  }

  // Trava 4: Rendimento Decrescente Diário (Daily Soft Cap)
  let multiplier = 1.0;
  const safePrior = Math.max(0, priorFocusMinutesToday);
  if (safePrior >= 360) {
    multiplier = 0.0; // Teto diário de 6h excedido
  } else {
    const endMinutes = safePrior + effectiveMinutes;
    if (endMinutes <= 240) {
      multiplier = 1.0;
    } else if (safePrior >= 240) {
      if (endMinutes <= 360) {
        multiplier = 0.5;
      } else {
        const tier2Minutes = 360 - safePrior;
        multiplier = (tier2Minutes * 0.5) / effectiveMinutes;
      }
    } else {
      const tier1Minutes = 240 - safePrior;
      const remaining = effectiveMinutes - tier1Minutes;
      const tier2Minutes = Math.min(remaining, 360 - 240);
      const weightedSum = tier1Minutes * 1.0 + tier2Minutes * 0.5;
      multiplier = weightedSum / effectiveMinutes;
    }
  }

  if (multiplier <= 0.0) {
    return { xp: 0, coins: 0 };
  }

  const finalXp = Math.round(baseXp * multiplier);
  const finalCoins = Math.round(baseCoins * multiplier * 100) / 100;

  return { xp: finalXp, coins: finalCoins };
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
