import {
  DIFFICULTY_REWARDS,
  HABIT_IMPORTANCE_REWARDS,
  normalizeTaskDifficulty,
  normalizeTaskType,
} from "@/constants/task";
import type { AppLocale } from "@/i18n/config";
import type { EconomyBarData } from "@/types/dashboard";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import { parseServerDate } from "./date";

export interface WeeklyEarningsResult {
  bars: EconomyBarData[];
  currentWeekEarnings: number;
  currentWeekSpent: number;
}

export interface FormatCoinsOptions {
  /** Se deve usar notação compacta (ex: 1.2k, 10k) para valores >= 1000 */
  compact?: boolean;
  /** Número máximo de casas decimais (padrão 2 se houver centavos, 0 se inteiro) */
  maxDecimals?: number;
  /** Idioma para separador decimal e abreviação compacta (padrão: "pt-BR") */
  locale?: AppLocale;
}

/**
 * Formata valores de moedas prevenindo dízimas flutuantes (ex: 14.750000000000002 -> "14,75" ou "14.75")
 * e suportando abreviação compacta para manter a integridade de layouts estreitos (como a Sidebar).
 */
export function formatCoins(
  amount: number | string | null | undefined,
  options: FormatCoinsOptions = {},
): string {
  if (amount === null || amount === undefined) return "0";
  const num = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(num)) return "0";

  const { compact = false, maxDecimals = 2, locale = "pt-BR" } = options;
  const intlLocale = locale === "en" ? "en-US" : "pt-BR";

  if (compact && Math.abs(num) >= 1000) {
    return new Intl.NumberFormat(intlLocale, {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(num);
  }

  // Limpa dízimas de ponto flutuante arredondando para maxDecimals
  const factor = 10 ** maxDecimals;
  const rounded = Math.round(num * factor) / factor;

  return new Intl.NumberFormat(intlLocale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(rounded);
}

function formatPeriodRange(
  startDate: Date,
  locale: AppLocale = "pt-BR",
): string {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const startDay = String(startDate.getDate()).padStart(2, "0");
  const startMonth = String(startDate.getMonth() + 1).padStart(2, "0");
  const endDay = String(endDate.getDate()).padStart(2, "0");
  const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");

  if (locale === "en") {
    if (startMonth === endMonth) {
      return `${startMonth}/${startDay} to ${endDay}`;
    }
    return `${startMonth}/${startDay} to ${endMonth}/${endDay}`;
  }

  if (startMonth === endMonth) {
    return `${startDay} a ${endDay}/${startMonth}`;
  }
  return `${startDay}/${startMonth} a ${endDay}/${endMonth}`;
}

/**
 * Calcula os ganhos e gastos semanais de moedas.
 * Agrupa os dados nas últimas 4 semanas (rotuladas como -3 sem, -2 sem, Passada e Atual).
 */
export function calculateWeeklyTaskEarnings(
  transactions: TransactionHistoryResponseDTO[] = [],
  referenceDate: Date = new Date(),
  locale: AppLocale = "pt-BR",
): WeeklyEarningsResult {
  // Encontra o início da semana atual (Domingo às 00:00:00)
  const now = new Date(referenceDate);
  const dayOfWeek = now.getDay(); // 0 = Domingo, 6 = Sábado
  const startOfCurrentWeek = new Date(now);
  startOfCurrentWeek.setDate(now.getDate() - dayOfWeek);
  startOfCurrentWeek.setHours(0, 0, 0, 0);

  const startOfWeek3 = new Date(startOfCurrentWeek);
  startOfWeek3.setDate(startOfCurrentWeek.getDate() - 7);

  const startOfWeek2 = new Date(startOfCurrentWeek);
  startOfWeek2.setDate(startOfCurrentWeek.getDate() - 14);

  const startOfWeek1 = new Date(startOfCurrentWeek);
  startOfWeek1.setDate(startOfCurrentWeek.getDate() - 21);

  const weekGains = [0, 0, 0, 0];
  const weekSpent = [0, 0, 0, 0];

  for (const tx of transactions) {
    if (!tx.createdAt) continue;
    const txDate = parseServerDate(tx.createdAt);
    if (!txDate || Number.isNaN(txDate.getTime())) continue;

    // Determina o índice da semana (0: -3 sem, 1: -2 sem, 2: Passada, 3: Atual)
    let weekIndex = -1;
    if (txDate >= startOfCurrentWeek) {
      weekIndex = 3;
    } else if (txDate >= startOfWeek3) {
      weekIndex = 2;
    } else if (txDate >= startOfWeek2) {
      weekIndex = 1;
    } else if (txDate >= startOfWeek1) {
      weekIndex = 0;
    }

    if (weekIndex === -1) continue;

    const gold = tx.goldAmount ?? 0;
    const isRewardBought = tx.transactionType === "REWARD_BOUGHT";
    const isPenalty = tx.transactionType === "BAD_HABIT_PENALTY";

    if (isRewardBought) {
      const spentAmount = Math.abs(gold !== 0 ? gold : (tx.priceSnapshot ?? 0));
      weekSpent[weekIndex] += spentAmount;
    } else if (isPenalty) {
      if (gold < 0) {
        weekSpent[weekIndex] += Math.abs(gold);
      }
    } else if (gold > 0) {
      weekGains[weekIndex] += gold;
    } else if (gold < 0) {
      weekSpent[weekIndex] += Math.abs(gold);
    }
  }

  const maxVal = Math.max(...weekGains, ...weekSpent, 0);
  const weekStarts = [
    startOfWeek1,
    startOfWeek2,
    startOfWeek3,
    startOfCurrentWeek,
  ];
  const relativeLabels =
    locale === "en"
      ? ["-3 wks", "-2 wks", "Last", "Current"]
      : ["-3 sem", "-2 sem", "Passada", "Atual"];

  const bars: EconomyBarData[] = weekGains.map((gold, index) => {
    const spent = weekSpent[index];
    const isHighlight = index === 3;
    const heightPercent =
      maxVal > 0
        ? gold === 0
          ? 6
          : Math.max(12, Math.round((gold / maxVal) * 100))
        : 6;

    const spentHeightPercent =
      maxVal > 0
        ? spent === 0
          ? 6
          : Math.max(12, Math.round((spent / maxVal) * 100))
        : 6;

    const startDate = weekStarts[index];
    const periodLabel = startDate
      ? formatPeriodRange(startDate, locale)
      : undefined;

    return {
      label:
        relativeLabels[index] ??
        (locale === "en" ? `Wk ${index + 1}` : `Sem ${index + 1}`),
      periodLabel,
      gold,
      spent,
      heightPercent,
      spentHeightPercent,
      isHighlight,
    };
  });

  return {
    bars,
    currentWeekEarnings: weekGains[3],
    currentWeekSpent: weekSpent[3],
  };
}

export interface TaskRewardCalculationInput {
  type?: string;
  taskType?: string;
  difficulty?: string;
  importance?: string;
  importanceType?: string;
  streak?: number;
  currentStreak?: number;
  positiveCount?: number;
  repeatType?: string;
  resetCounter?: string;
  isHardcoreModeEnabled?: boolean;
  dueDate?: string;
  isPenaltyApplied?: boolean;
  locale?: AppLocale;
}

export type RewardStage = "INITIAL" | "ADAPTATION" | "FORMED";

export interface TaskRewardBreakdown {
  baseReward: { xp: number; gold: number };
  finalReward: { xp: number; gold: number };
  multiplier: number;
  decayPercentage: number;
  stage: RewardStage;
  stageLabel: string;
  stageBadgeVariant: "emerald" | "amber" | "purple";
  currentCount: number;
  thresholds: {
    adaptation: number;
    formed: number;
  };
  explanation: string;
  unit: "repetições" | "dias de ofensiva";
  hasDecay: boolean;
}

/**
 * Arredonda para 2 casas decimais seguindo RoundingMode.HALF_DOWN do BigDecimal no backend
 * (ex: 0.375 -> 0.37), usado nas recompensas reduzidas de Habit, Daily e Todo.
 */
function roundHalfDownTwoDecimals(value: number): number {
  const scaled = Number((value * 100).toPrecision(12));
  const floor = Math.floor(scaled);
  const fraction = scaled - floor;
  const rounded = fraction > 0.5 ? floor + 1 : floor;
  return rounded / 100;
}

/**
 * Retorna o detalhamento completo dos ganhos de uma tarefa, incluindo recompensa base,
 * estágio de consolidação (Inicial, Adaptação, Formado) e percentual de decaimento.
 */
export function getTaskRewardBreakdown(
  task: TaskRewardCalculationInput,
): TaskRewardBreakdown {
  const isEn = task.locale === "en";
  const normalizedType = normalizeTaskType(task);
  const currentCount =
    task.currentStreak ?? task.streak ?? task.positiveCount ?? 0;

  if (normalizedType === "habit") {
    const rawImportance = (
      task.importanceType ||
      task.importance ||
      "NORMAL"
    ).toUpperCase();
    const impKey =
      rawImportance === "LOW" || rawImportance === "HIGH"
        ? rawImportance
        : "NORMAL";
    const base = HABIT_IMPORTANCE_REWARDS[impKey];

    const resetCounter = (task.resetCounter || "DAILY").toUpperCase();
    const habitFormedThreshold =
      resetCounter === "WEEKLY" ? 8 : resetCounter === "MONTHLY" ? 6 : 21;
    const adaptationThreshold = Math.max(
      1,
      Math.floor(habitFormedThreshold / 3),
    );

    let multiplier = 1.0;
    let stage: RewardStage = "INITIAL";
    let stageLabel = isEn ? "Initial Stage" : "Fase Inicial";
    let decayPercentage = 0;
    let stageBadgeVariant: "emerald" | "amber" | "purple" = "emerald";

    if (currentCount >= habitFormedThreshold) {
      multiplier = 0.5;
      stage = "FORMED";
      stageLabel = isEn ? "Formed Habit" : "Hábito Formado";
      decayPercentage = 50;
      stageBadgeVariant = "purple";
    } else if (currentCount >= adaptationThreshold) {
      multiplier = 0.75;
      stage = "ADAPTATION";
      stageLabel = isEn ? "In Adaptation" : "Em Adaptação";
      decayPercentage = 25;
      stageBadgeVariant = "amber";
    }

    const finalXp = Math.max(1, Math.floor(base.xp * multiplier));
    const finalGold = Math.max(
      0.01,
      roundHalfDownTwoDecimals(base.gold * multiplier),
    );

    let explanation = `Recompensa base integral ($${base.gold.toFixed(2)}). Você realizou ${currentCount} repetição(ões).`;
    if (stage === "FORMED") {
      explanation = `Hábito consolidado (${currentCount}/${habitFormedThreshold} repetições). Paga 50% da base ($${base.gold.toFixed(2)}) para evitar inflação e incentivar novos hábitos!`;
    } else if (stage === "ADAPTATION") {
      explanation = `Fase de adaptação (${currentCount}/${adaptationThreshold} repetições). Paga 75% da base ($${base.gold.toFixed(2)}). Ao atingir ${habitFormedThreshold}, passará para 50%.`;
    } else {
      explanation = `Fase inicial: 100% da recompensa base ($${base.gold.toFixed(2)}). Ao atingir ${adaptationThreshold} repetições, entrará na fase de adaptação (-25%).`;
    }

    return {
      baseReward: { xp: base.xp, gold: base.gold },
      finalReward: { xp: finalXp, gold: finalGold },
      multiplier,
      decayPercentage,
      stage,
      stageLabel,
      stageBadgeVariant,
      currentCount,
      thresholds: {
        adaptation: adaptationThreshold,
        formed: habitFormedThreshold,
      },
      explanation,
      unit: "repetições",
      hasDecay: decayPercentage > 0,
    };
  }

  // To-Do ou Daily usam Dificuldade
  const rawDifficulty = normalizeTaskDifficulty(task.difficulty);
  const diffKey =
    rawDifficulty === "TRIVIAL" ||
    rawDifficulty === "EASY" ||
    rawDifficulty === "HARD"
      ? rawDifficulty
      : "MEDIUM";
  const base = DIFFICULTY_REWARDS[diffKey];

  if (normalizedType === "daily") {
    const repeatType = (task.repeatType || "DAILY").toUpperCase();
    const daysToForm =
      repeatType === "WEEKLY"
        ? 8
        : repeatType === "MONTHLY"
          ? 6
          : repeatType === "YEARLY"
            ? 3
            : 21;
    const adaptationThreshold = Math.max(1, Math.floor(daysToForm / 3));

    let multiplier = 1.0;
    let stage: RewardStage = "INITIAL";
    let stageLabel = isEn ? "Initial Stage" : "Fase Inicial";
    let decayPercentage = 0;
    let stageBadgeVariant: "emerald" | "amber" | "purple" = "emerald";

    if (currentCount >= daysToForm) {
      multiplier = 0.5;
      stage = "FORMED";
      stageLabel = isEn ? "Consolidated Routine" : "Rotina Consolidada";
      decayPercentage = 50;
      stageBadgeVariant = "purple";
    } else if (currentCount >= adaptationThreshold) {
      multiplier = 0.75;
      stage = "ADAPTATION";
      stageLabel = isEn ? "In Adaptation" : "Em Adaptação";
      decayPercentage = 25;
      stageBadgeVariant = "amber";
    }

    const finalXp = Math.max(1, Math.floor(base.xp * multiplier));
    const finalGold = Math.max(
      0.01,
      roundHalfDownTwoDecimals(base.gold * multiplier),
    );

    let explanation = `Ofensiva de ${currentCount} dia(s). Recompensa base integral ($${base.gold.toFixed(2)}).`;
    if (stage === "FORMED") {
      explanation = `Rotina consolidada (${currentCount}/${daysToForm} dias de ofensiva). Paga 50% da base ($${base.gold.toFixed(2)}) para evitar inflação e incentivar novos desafios!`;
    } else if (stage === "ADAPTATION") {
      explanation = `Adaptação da rotina (${currentCount}/${adaptationThreshold} dias). Paga 75% da base ($${base.gold.toFixed(2)}). Ao atingir ${daysToForm} dias, passará para 50%.`;
    } else {
      explanation = `Fase inicial: 100% da recompensa base ($${base.gold.toFixed(2)}). Ao atingir ${adaptationThreshold} dias, entrará em adaptação (-25%).`;
    }

    return {
      baseReward: { xp: base.xp, gold: base.gold },
      finalReward: { xp: finalXp, gold: finalGold },
      multiplier,
      decayPercentage,
      stage,
      stageLabel,
      stageBadgeVariant,
      currentCount,
      thresholds: {
        adaptation: adaptationThreshold,
        formed: daysToForm,
      },
      explanation,
      unit: "dias de ofensiva",
      hasDecay: decayPercentage > 0,
    };
  }

  // To-Do: se for modo Hardcore e estiver atrasado ou com penalidade aplicada, concede apenas 50%
  const isTodoOverdue = Boolean(
    task.dueDate && new Date(`${task.dueDate}T23:59:59`) < new Date(),
  );
  const isLateHardcoreTodo =
    normalizedType === "todo" &&
    Boolean(task.isHardcoreModeEnabled) &&
    (Boolean(task.isPenaltyApplied) || isTodoOverdue);

  if (isLateHardcoreTodo) {
    const finalXp = Math.max(1, Math.floor(base.xp * 0.5));
    const finalGold = Math.max(0.01, roundHalfDownTwoDecimals(base.gold * 0.5));

    return {
      baseReward: { xp: base.xp, gold: base.gold },
      finalReward: { xp: finalXp, gold: finalGold },
      multiplier: 0.5,
      decayPercentage: 50,
      stage: "FORMED",
      stageLabel: isEn
        ? "Late Delivery (Hardcore)"
        : "Entrega Tardia (Hardcore)",
      stageBadgeVariant: "amber",
      currentCount: 0,
      thresholds: { adaptation: 0, formed: 0 },
      explanation: `Afazer concluído após o prazo no Modo Hardcore. Rendimento reduzido em 50% ($${base.gold.toFixed(2)} -> $${finalGold.toFixed(2)}).`,
      unit: "repetições",
      hasDecay: true,
    };
  }

  // To-Do: sem decaimento de streak
  return {
    baseReward: { xp: base.xp, gold: base.gold },
    finalReward: { xp: base.xp, gold: base.gold },
    multiplier: 1.0,
    decayPercentage: 0,
    stage: "INITIAL",
    stageLabel: isEn ? "Standard" : "Padrão",
    stageBadgeVariant: "emerald",
    currentCount: 0,
    thresholds: { adaptation: 0, formed: 0 },
    explanation:
      "Tarefas do tipo Afazer (To-Do) concedem sempre 100% da recompensa da dificuldade ao serem concluídas.",
    unit: "repetições",
    hasDecay: false,
  };
}

/**
 * Calcula os ganhos de XP e Gold de uma tarefa de acordo com seu tipo,
 * dificuldade ou importância, e decaimento por ofensiva (streak).
 */
export function calculateTaskReward(task: TaskRewardCalculationInput): {
  xp: number;
  gold: number;
} {
  return getTaskRewardBreakdown(task).finalReward;
}

/**
 * Calcula a penalidade de XP e Moedas de uma tarefa (Modo Hardcore / Hábito Negativo).
 * Aplica 50% de multa sobre a recompensa calculada (mínimo de 0.01 moedas).
 */
export function calculateTaskPenalty(task: TaskRewardCalculationInput): {
  xp: number;
  gold: number;
} {
  const reward = calculateTaskReward(task);
  const penaltyRate = 0.5;
  const penaltyXp = Math.floor(reward.xp * penaltyRate);
  const penaltyGold = Math.max(
    0.01,
    Math.round(reward.gold * penaltyRate * 100) / 100,
  );
  return { xp: penaltyXp, gold: penaltyGold };
}

/**
 * Converte o detalhamento de ganhos de uma tarefa no contrato unificado `RewardEstimate`.
 */
export function toTaskRewardEstimate(
  breakdown: TaskRewardBreakdown,
  options?: { isHardcore?: boolean; taskType?: string; locale?: AppLocale },
): import("@/types/reward").RewardEstimate {
  const locale = options?.locale ?? "pt-BR";
  const isEn = locale === "en";
  const notices: import("@/types/reward").RewardEstimateNotice[] = [];

  if (breakdown.hasDecay) {
    notices.push({
      tone: "info",
      title: `${breakdown.stageLabel} (-${breakdown.decayPercentage}%)`,
      message: breakdown.explanation,
    });
  } else if (options?.taskType !== "TODO") {
    notices.push({
      tone: "info",
      title: "Base 100%",
      message: isEn
        ? "Full reward at the start. As you consolidate the habit/routine (7 and 21 days), gains gradually adjust to 75% and 50%."
        : "Recompensa integral no início. Ao consolidar o hábito/rotina (7 e 21 dias), o ganho ajusta gradualmente para 75% e 50%.",
    });
  }

  if (options?.isHardcore) {
    notices.push({
      tone: "warning",
      title: isEn ? "Hardcore Mode Active" : "Modo Hardcore Ativo",
      message: isEn
        ? "Failures or delays apply a -50% penalty on rewards."
        : "Falhas ou atrasos aplicam penalidade de -50% sobre os ganhos.",
    });
  }

  const breakdownItems: import("@/types/reward").RewardEstimateBreakdownItem[] =
    [
      {
        label: isEn ? "Base Reward" : "Recompensa Base",
        value: `+${formatCoins(breakdown.baseReward.gold, { locale })} 🪙 / +${breakdown.baseReward.xp} XP`,
      },
      ...(breakdown.hasDecay
        ? [
            {
              label: isEn ? "Habit Adjustment" : "Ajuste de Hábito",
              value: `-${breakdown.decayPercentage}% (${breakdown.stageLabel})`,
            },
          ]
        : []),
    ];

  return {
    gold: breakdown.finalReward.gold,
    xp: breakdown.finalReward.xp,
    status: breakdown.hasDecay ? "reduced" : "full",
    stageLabel: breakdown.hasDecay
      ? `${breakdown.stageLabel} (-${breakdown.decayPercentage}%)`
      : undefined,
    notices,
    breakdown: breakdownItems,
  };
}
