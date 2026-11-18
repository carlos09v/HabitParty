import { FOCUS_REWARD_RULES } from "@/constants/focus";
import type { AppLocale } from "@/i18n/config";
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
 * Calcula o multiplicador de rendimento decrescente diário em escada (Daily Soft/Hard Cap):
 * - 0 a 240 min (0h a 4h): 100% (1.0)
 * - 240 a 360 min (4h a 6h): 50% (0.5)
 * - 360 a 480 min (6h a 8h): 25% (0.25)
 * - > 480 min (> 8h): 0% (0.0)
 */
export function calculateDailyFocusMultiplier(
  effectiveMinutes: number,
  priorFocusMinutesToday = 0,
): number {
  const safePrior = Math.max(0, priorFocusMinutesToday);
  const tier1 = FOCUS_REWARD_RULES.DAILY_SOFT_CAP_MINUTES;
  const tier2 = FOCUS_REWARD_RULES.DAILY_TIER2_CAP_MINUTES;
  const hardCap = FOCUS_REWARD_RULES.DAILY_HARD_CAP_MINUTES;

  if (safePrior >= hardCap || effectiveMinutes <= 0) {
    return 0.0;
  }

  const sessionEnd = safePrior + effectiveMinutes;
  if (sessionEnd <= tier1) {
    return 1.0;
  }

  const tier1Minutes = Math.max(0, Math.min(sessionEnd, tier1) - safePrior);
  const tier2Minutes = Math.max(
    0,
    Math.min(sessionEnd, tier2) - Math.max(safePrior, tier1),
  );
  const tier3Minutes = Math.max(
    0,
    Math.min(sessionEnd, hardCap) - Math.max(safePrior, tier2),
  );

  const weightedSum =
    tier1Minutes * 1.0 + tier2Minutes * 0.5 + tier3Minutes * 0.25;
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
    locale?: AppLocale;
  },
  locale: AppLocale = details?.locale ?? "pt-BR",
): RewardEstimate {
  const isEn = locale === "en";
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
      label: isEn ? "Logged Time" : "Tempo Registrado",
      value: isEn
        ? `${details.durationMinutes} ${details.durationMinutes === 1 ? "minute" : "minutes"}`
        : `${details.durationMinutes} minutos`,
    });
    if (details.recordType === "POMO" && details.completedPomos > 0) {
      const avgMins = Math.floor(
        details.durationMinutes / details.completedPomos,
      );
      breakdown.push({
        label: isEn ? "Pomodoro Cycles" : "Ciclos Pomodoro",
        value: isEn
          ? `${details.completedPomos} cycle(s) (avg. ${avgMins}m/cycle)`
          : `${details.completedPomos} ciclo(s) (méd. ${avgMins}m/ciclo)`,
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
  locale: AppLocale = "pt-BR",
  pomoTargetMinutes?: number,
): EstimatedRewardResult {
  const isEn = locale === "en";
  if (targetType === "ITEM") {
    return {
      xp: 0,
      coins: 0,
      isZeroReason: isEn
        ? "Backpack leisure items do not grant XP or Coins."
        : "Itens de lazer da mochila não concedem XP ou Moedas.",
    };
  }

  if (durationMinutes < FOCUS_REWARD_RULES.MIN_QUALIFYING_MINUTES) {
    return {
      xp: 0,
      coins: 0,
      isZeroReason: isEn
        ? `Sessions shorter than ${FOCUS_REWARD_RULES.MIN_QUALIFYING_MINUTES} min do not qualify for rewards.`
        : `Sessões menores que ${FOCUS_REWARD_RULES.MIN_QUALIFYING_MINUTES} min não qualificam para recompensas.`,
      notice: {
        type: "warning",
        title: isEn ? "Minimum Time" : "Tempo Mínimo",
        message: isEn
          ? `Sessions under ${FOCUS_REWARD_RULES.MIN_QUALIFYING_MINUTES} min do not earn XP or Coins.`
          : `Sessões com menos de ${FOCUS_REWARD_RULES.MIN_QUALIFYING_MINUTES} min não acumulam XP ou Moedas.`,
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
      title: isEn
        ? `${FOCUS_REWARD_RULES.MAX_EFFECTIVE_MINUTES} min Cap`
        : `Teto de ${FOCUS_REWARD_RULES.MAX_EFFECTIVE_MINUTES} min`,
      message: isEn
        ? `Time beyond ${FOCUS_REWARD_RULES.MAX_EFFECTIVE_MINUTES} min per session does not grant extra coins (anti-AFK).`
        : `Excedente acima de ${FOCUS_REWARD_RULES.MAX_EFFECTIVE_MINUTES} min por sessão não gera moedas adicionais (anti-AFK).`,
    };
  }

  if (recordType === "POMO" && completedPomos > 0) {
    const hasOvertimeBreakdown =
      typeof pomoTargetMinutes === "number" &&
      pomoTargetMinutes > 0 &&
      effectiveMinutes > completedPomos * pomoTargetMinutes;
    const configuredMinutes = hasOvertimeBreakdown
      ? completedPomos * pomoTargetMinutes
      : effectiveMinutes;
    const overtimeMinutes = hasOvertimeBreakdown
      ? effectiveMinutes - configuredMinutes
      : 0;
    const minutesPerPomo = hasOvertimeBreakdown
      ? pomoTargetMinutes
      : Math.floor(effectiveMinutes / completedPomos);

    if (minutesPerPomo < FOCUS_REWARD_RULES.ANTI_EXPLOIT_THRESHOLD_MINUTES) {
      // Anti-exploit: muitos ciclos para pouco tempo
      baseXp =
        (configuredMinutes / 30.0) *
        FOCUS_REWARD_RULES.UNCOMPLETED_POMO_XP_PER_30_MIN;
      baseCoins =
        (configuredMinutes / 30.0) *
        FOCUS_REWARD_RULES.UNCOMPLETED_POMO_COINS_PER_30_MIN;
      notice = {
        type: "warning",
        title: "Anti-Exploit",
        message: isEn
          ? `Average below ${FOCUS_REWARD_RULES.ANTI_EXPLOIT_THRESHOLD_MINUTES}m/cycle reduces rewards proportionally.`
          : `Média menor que ${FOCUS_REWARD_RULES.ANTI_EXPLOIT_THRESHOLD_MINUTES}m/ciclo reduz os ganhos proporcionalmente.`,
      };
    } else if (minutesPerPomo < FOCUS_REWARD_RULES.STANDARD_POMO_MIN_MINUTES) {
      // Pomodoro curto (15 a 24 min)
      baseXp = completedPomos * FOCUS_REWARD_RULES.SHORT_POMO_XP_PER_CYCLE;
      baseCoins =
        completedPomos * FOCUS_REWARD_RULES.SHORT_POMO_COINS_PER_CYCLE;
      if (!notice) {
        notice = {
          type: "info",
          title: isEn
            ? `Short Cycle (${FOCUS_REWARD_RULES.ANTI_EXPLOIT_THRESHOLD_MINUTES}m-${FOCUS_REWARD_RULES.STANDARD_POMO_MIN_MINUTES - 1}m)`
            : `Ciclo Curto (${FOCUS_REWARD_RULES.ANTI_EXPLOIT_THRESHOLD_MINUTES}m-${FOCUS_REWARD_RULES.STANDARD_POMO_MIN_MINUTES - 1}m)`,
          message: isEn
            ? `Average of ${minutesPerPomo}m/cycle (+${FOCUS_REWARD_RULES.SHORT_POMO_COINS_PER_CYCLE.toFixed(2)} 🪙/cycle). Standard range (${FOCUS_REWARD_RULES.STANDARD_POMO_MIN_MINUTES}m-${FOCUS_REWARD_RULES.STANDARD_POMO_MAX_MINUTES}m) yields +${FOCUS_REWARD_RULES.STANDARD_COINS_PER_CYCLE.toFixed(2)} 🪙.`
            : `Média de ${minutesPerPomo}m/ciclo (+${FOCUS_REWARD_RULES.SHORT_POMO_COINS_PER_CYCLE.toFixed(2)} 🪙/ciclo). Faixa padrão (${FOCUS_REWARD_RULES.STANDARD_POMO_MIN_MINUTES}m-${FOCUS_REWARD_RULES.STANDARD_POMO_MAX_MINUTES}m) rende +${FOCUS_REWARD_RULES.STANDARD_COINS_PER_CYCLE.toFixed(2)} 🪙.`,
        };
      }
    } else if (minutesPerPomo <= FOCUS_REWARD_RULES.STANDARD_POMO_MAX_MINUTES) {
      // Pomodoro padrão (25 a 49 min)
      baseXp = completedPomos * FOCUS_REWARD_RULES.STANDARD_XP_PER_CYCLE;
      baseCoins = completedPomos * FOCUS_REWARD_RULES.STANDARD_COINS_PER_CYCLE;
    } else {
      // Pomodoro longo / Deep work (>= 50 min)
      baseXp = completedPomos * FOCUS_REWARD_RULES.DEEP_WORK_XP_PER_CYCLE;
      baseCoins = completedPomos * FOCUS_REWARD_RULES.DEEP_WORK_COINS_PER_CYCLE;
      if (!notice) {
        notice = {
          type: "info",
          title: `Deep Work (${FOCUS_REWARD_RULES.DEEP_WORK_MIN_MINUTES}m+)`,
          message: isEn
            ? `Extended uninterrupted session qualifies for the maximum bonus (+${FOCUS_REWARD_RULES.DEEP_WORK_COINS_PER_CYCLE.toFixed(2)} 🪙/cycle)!`
            : `Sessão estendida ininterrupta qualifica para a bonificação máxima (+${FOCUS_REWARD_RULES.DEEP_WORK_COINS_PER_CYCLE.toFixed(2)} 🪙/ciclo)!`,
        };
      }
    }

    if (overtimeMinutes > 0) {
      baseXp +=
        (overtimeMinutes / 30.0) * FOCUS_REWARD_RULES.STOPWATCH_XP_PER_30_MIN;
      baseCoins +=
        (overtimeMinutes / 30.0) *
        FOCUS_REWARD_RULES.STOPWATCH_COINS_PER_30_MIN;
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
      isZeroReason: isEn
        ? `Daily reward cap (${FOCUS_REWARD_RULES.DAILY_HARD_CAP_MINUTES / 60}h) reached for this day.`
        : `Limite diário de recompensas (${FOCUS_REWARD_RULES.DAILY_HARD_CAP_MINUTES / 60}h) atingido neste dia.`,
      notice: {
        type: "warning",
        title: isEn ? "Daily Cap Reached (8h)" : "Teto Diário Atingido (8h)",
        message: isEn
          ? "You have already accumulated 8h of rewarded focus on this day. Time will be logged, but without extra XP/Coins."
          : "Você já acumulou 8h de foco recompensado neste dia. O tempo será registrado, mas sem XP/Moedas adicionais.",
      },
    };
  }

  if (multiplier < 1.0) {
    const inThirdTier =
      priorFocusMinutesToday >= FOCUS_REWARD_RULES.DAILY_TIER2_CAP_MINUTES;
    notice = {
      type: "warning",
      title: isEn
        ? inThirdTier
          ? "Daily Diminishing Returns (6h+)"
          : "Daily Diminishing Returns (4h+)"
        : inThirdTier
          ? "Rendimento Decrescente Diário (6h+)"
          : "Rendimento Decrescente Diário (4h+)",
      message: isEn
        ? "Daily focus stair-step: 4h–6h yields 50%, 6h–8h yields 25%, and above 8h yields 0%."
        : "Escada diária de foco: 4h–6h rendem 50%, 6h–8h rendem 25% e acima de 8h o rendimento é 0%.",
    };
  }

  const xp = Math.round(baseXp * multiplier);
  const coins = Math.round(baseCoins * multiplier * 100) / 100;

  return { xp, coins, notice };
}

/**
 * Lê a recompensa de um FocusRecord retornado pelo backend.
 * Regra fundamental: Sessões de itens da mochila NUNCA geram XP nem moedas.
 */
export function calculateRecordReward(record: FocusRecord): {
  xp: number;
  coins: number;
} {
  if (record.inventoryItemId) {
    return { xp: 0, coins: 0 };
  }

  return {
    xp: record.xpEarned ?? 0,
    coins: Number(record.coinsEarned ?? 0),
  };
}
