import { FOCUS_REWARD_RULES } from "@/constants/focus";
import type { FocusRecord, FocusRecordType } from "@/types/focus";
import type {
  RewardEstimate,
  RewardEstimateBreakdownItem,
  RewardEstimateNotice,
} from "@/types/reward";

export interface EstimatedRewardNotice {
  type: "info" | "warning";
  title: string;
  message: string;
}

export interface EstimatedRewardResult {
  xp: number;
  coins: number;
  isZeroReason?: string;
  notice?: EstimatedRewardNotice;
}

/**
 * Calcula o multiplicador de rendimento decrescente diário (Daily Soft/Hard Cap):
 * - 0 a 240 min (4h): 100% (1.0)
 * - 240 a 360 min (4h a 6h): 50% (0.5)
 * - > 360 min (> 6h): 0% (0.0)
 */
export function calculateDailyFocusMultiplier(
  effectiveMinutes: number,
  priorFocusMinutesToday = 0,
): number {
  const safePrior = Math.max(0, priorFocusMinutesToday);
  const softCap = FOCUS_REWARD_RULES.DAILY_SOFT_CAP_MINUTES;
  const hardCap = FOCUS_REWARD_RULES.DAILY_HARD_CAP_MINUTES;

  if (safePrior >= hardCap || effectiveMinutes <= 0) {
    return 0.0;
  }

  const endMinutes = safePrior + effectiveMinutes;
  if (endMinutes <= softCap) {
    return 1.0;
  }

  if (safePrior >= softCap) {
    if (endMinutes <= hardCap) {
      return 0.5;
    }
    const tier2Minutes = hardCap - safePrior;
    return (tier2Minutes * 0.5) / effectiveMinutes;
  }

  const tier1Minutes = softCap - safePrior;
  const remaining = effectiveMinutes - tier1Minutes;
  const tier2Minutes = Math.min(remaining, hardCap - softCap);
  const weightedSum = tier1Minutes * 1.0 + tier2Minutes * 0.5;
  return weightedSum / effectiveMinutes;
}

/**
 * Converte o resultado de estimativa de foco no contrato unificado `RewardEstimate`.
 */
export function toFocusRewardEstimate(
  result: EstimatedRewardResult,
  details?: {
    durationMinutes: number;
    completedPomos: number;
    recordType: FocusRecordType;
  },
): RewardEstimate {
  const notices: RewardEstimateNotice[] = [];
  if (result.notice) {
    notices.push({
      tone: result.notice.type,
      title: result.notice.title,
      message: result.notice.message,
    });
  }

  const breakdown: RewardEstimateBreakdownItem[] = [];
  if (details && details.durationMinutes > 0) {
    breakdown.push({
      label: "Tempo Registrado",
      value: `${details.durationMinutes} minutos`,
    });
    if (details.recordType === "POMO" && details.completedPomos > 0) {
      const avgMins = Math.floor(
        details.durationMinutes / details.completedPomos,
      );
      breakdown.push({
        label: "Ciclos Pomodoro",
        value: `${details.completedPomos} ciclo(s) (méd. ${avgMins}m/ciclo)`,
      });
    }
  }

  return {
    gold: result.coins,
    xp: result.xp,
    zeroReason: result.isZeroReason,
    status:
      result.coins === 0 && result.xp === 0
        ? "none"
        : result.notice?.type === "warning"
          ? "reduced"
          : "full",
    notices,
    breakdown,
  };
}

/**
 * Calcula uma prévia do rendimento de XP e Moedas (fonte única da verdade de regras de foco),
 * emitindo alertas claros sobre tetos, anti-exploit, rendimento decrescente diário e ritmos de ciclos.
 */
export function calculateFocusRewardEstimate(
  targetType: "ACTIVITY" | "ITEM",
  recordType: FocusRecordType,
  durationMinutes: number,
  completedPomos: number,
  priorFocusMinutesToday = 0,
): EstimatedRewardResult {
  if (targetType === "ITEM") {
    return {
      xp: 0,
      coins: 0,
      isZeroReason: "Itens de lazer da mochila não concedem XP ou Moedas.",
    };
  }

  if (durationMinutes < FOCUS_REWARD_RULES.MIN_QUALIFYING_MINUTES) {
    return {
      xp: 0,
      coins: 0,
      isZeroReason: `Sessões menores que ${FOCUS_REWARD_RULES.MIN_QUALIFYING_MINUTES} min não qualificam para recompensas.`,
      notice: {
        type: "warning",
        title: "Tempo Mínimo",
        message: `Sessões com menos de ${FOCUS_REWARD_RULES.MIN_QUALIFYING_MINUTES} min não acumulam XP ou Moedas.`,
      },
    };
  }

  const effectiveMinutes = Math.min(
    durationMinutes,
    FOCUS_REWARD_RULES.MAX_EFFECTIVE_MINUTES,
  );
  let baseXp = 0;
  let baseCoins = 0;
  let notice: EstimatedRewardNotice | undefined;

  // Alerta de Teto de minutos por sessão
  if (durationMinutes > FOCUS_REWARD_RULES.MAX_EFFECTIVE_MINUTES) {
    notice = {
      type: "warning",
      title: `Teto de ${FOCUS_REWARD_RULES.MAX_EFFECTIVE_MINUTES} min`,
      message: `Excedente acima de ${FOCUS_REWARD_RULES.MAX_EFFECTIVE_MINUTES} min por sessão não gera moedas adicionais (anti-AFK).`,
    };
  }

  if (recordType === "POMO" && completedPomos > 0) {
    const minutesPerPomo = Math.floor(effectiveMinutes / completedPomos);

    if (minutesPerPomo < FOCUS_REWARD_RULES.ANTI_EXPLOIT_THRESHOLD_MINUTES) {
      // Anti-exploit: muitos ciclos para pouco tempo
      baseXp =
        (effectiveMinutes / 30.0) *
        FOCUS_REWARD_RULES.UNCOMPLETED_POMO_XP_PER_30_MIN;
      baseCoins =
        (effectiveMinutes / 30.0) *
        FOCUS_REWARD_RULES.UNCOMPLETED_POMO_COINS_PER_30_MIN;
      notice = {
        type: "warning",
        title: "Anti-Exploit",
        message: `Média menor que ${FOCUS_REWARD_RULES.ANTI_EXPLOIT_THRESHOLD_MINUTES}m/ciclo reduz os ganhos proporcionalmente.`,
      };
    } else if (minutesPerPomo < FOCUS_REWARD_RULES.STANDARD_POMO_MIN_MINUTES) {
      // Pomodoro curto (15 a 24 min)
      baseXp = completedPomos * FOCUS_REWARD_RULES.SHORT_POMO_XP_PER_CYCLE;
      baseCoins =
        completedPomos * FOCUS_REWARD_RULES.SHORT_POMO_COINS_PER_CYCLE;
      if (!notice) {
        notice = {
          type: "info",
          title: `Ciclo Curto (${FOCUS_REWARD_RULES.ANTI_EXPLOIT_THRESHOLD_MINUTES}m-${FOCUS_REWARD_RULES.STANDARD_POMO_MIN_MINUTES - 1}m)`,
          message: `Média de ${minutesPerPomo}m/ciclo (+${FOCUS_REWARD_RULES.SHORT_POMO_COINS_PER_CYCLE.toFixed(2)} 🪙/ciclo). Faixa padrão (${FOCUS_REWARD_RULES.STANDARD_POMO_MIN_MINUTES}m-${FOCUS_REWARD_RULES.STANDARD_POMO_MAX_MINUTES}m) rende +${FOCUS_REWARD_RULES.STANDARD_COINS_PER_CYCLE.toFixed(2)} 🪙.`,
        };
      }
    } else if (minutesPerPomo <= FOCUS_REWARD_RULES.STANDARD_POMO_MAX_MINUTES) {
      // Pomodoro padrão (25 a 40 min)
      baseXp = completedPomos * FOCUS_REWARD_RULES.STANDARD_XP_PER_CYCLE;
      baseCoins = completedPomos * FOCUS_REWARD_RULES.STANDARD_COINS_PER_CYCLE;
    } else {
      // Pomodoro longo / Deep work (> 40 min)
      baseXp = completedPomos * FOCUS_REWARD_RULES.DEEP_WORK_XP_PER_CYCLE;
      baseCoins = completedPomos * FOCUS_REWARD_RULES.DEEP_WORK_COINS_PER_CYCLE;
      if (!notice) {
        notice = {
          type: "info",
          title: `Deep Work (> ${FOCUS_REWARD_RULES.STANDARD_POMO_MAX_MINUTES}m)`,
          message: `Sessão estendida ininterrupta qualifica para a bonificação máxima (+${FOCUS_REWARD_RULES.DEEP_WORK_COINS_PER_CYCLE.toFixed(2)} 🪙/ciclo)!`,
        };
      }
    }
  } else if (recordType === "POMO") {
    baseXp =
      (effectiveMinutes / 30.0) *
      FOCUS_REWARD_RULES.UNCOMPLETED_POMO_XP_PER_30_MIN;
    baseCoins =
      (effectiveMinutes / 30.0) *
      FOCUS_REWARD_RULES.UNCOMPLETED_POMO_COINS_PER_30_MIN;
  } else {
    // STOPWATCH
    baseXp =
      (effectiveMinutes / 30.0) * FOCUS_REWARD_RULES.STOPWATCH_XP_PER_30_MIN;
    baseCoins =
      (effectiveMinutes / 30.0) * FOCUS_REWARD_RULES.STOPWATCH_COINS_PER_30_MIN;
  }

  const multiplier = calculateDailyFocusMultiplier(
    effectiveMinutes,
    priorFocusMinutesToday,
  );

  if (multiplier <= 0.0) {
    return {
      xp: 0,
      coins: 0,
      isZeroReason: `Limite diário de recompensas (${FOCUS_REWARD_RULES.DAILY_HARD_CAP_MINUTES / 60}h) atingido neste dia.`,
      notice: {
        type: "warning",
        title: "Teto Diário Atingido (6h)",
        message:
          "Você já acumulou 6h de foco recompensado neste dia. O tempo será registrado, mas sem XP/Moedas adicionais.",
      },
    };
  }

  if (multiplier < 1.0) {
    notice = {
      type: "warning",
      title: "Rendimento Decrescente Diário (4h+)",
      message:
        "Acima de 4h focadas no mesmo dia, as recompensas de XP e Moedas rendem 50% até o teto de 6h.",
    };
  }

  const xp = Math.round(baseXp * multiplier);
  const coins = Math.round(baseCoins * multiplier * 100) / 100;

  return { xp, coins, notice };
}

/**
 * Estima ou lê a recompensa de um FocusRecord existente usando a regra unificada.
 * Regra fundamental: Sessões de itens da mochila NUNCA geram XP nem moedas.
 */
export function calculateRecordReward(
  record: FocusRecord,
  priorFocusMinutesToday = 0,
): { xp: number; coins: number } {
  if (record.inventoryItemId) {
    return { xp: 0, coins: 0 };
  }

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

  const estimate = calculateFocusRewardEstimate(
    "ACTIVITY",
    record.recordType,
    record.durationMinutes || 0,
    record.completedPomos ?? 0,
    priorFocusMinutesToday,
  );

  return { xp: estimate.xp, coins: estimate.coins };
}
