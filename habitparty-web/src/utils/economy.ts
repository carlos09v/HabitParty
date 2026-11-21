import {
  DIFFICULTY_REWARDS,
  HABIT_IMPORTANCE_REWARDS,
  normalizeTaskDifficulty,
  normalizeTaskType,
} from "@/constants/task";
import { type AppLocale, toIntlLocale } from "@/i18n/config";
import { getUtilityTranslator } from "@/i18n/utilityTranslator";
import type { EconomyBarData } from "@/types/dashboard";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import {
  formatDateParts,
  getDateKeyInTimeZone,
  getDatePartsInTimeZone,
  getTodayDateString,
  parseServerDate,
} from "./date";

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
  const intlLocale = toIntlLocale(locale);

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
  const t = getUtilityTranslator(locale, "economy");
  const endDate = new Date(startDate.getTime() + 6 * 86_400_000);

  const startDay = String(startDate.getUTCDate()).padStart(2, "0");
  const startMonth = String(startDate.getUTCMonth() + 1).padStart(2, "0");
  const endDay = String(endDate.getUTCDate()).padStart(2, "0");
  const endMonth = String(endDate.getUTCMonth() + 1).padStart(2, "0");

  return t(
    startMonth === endMonth ? "periodSameMonth" : "periodDifferentMonths",
    {
      startDay,
      startMonth,
      endDay,
      endMonth,
    },
  );
}

/**
 * Calcula os ganhos e gastos semanais de moedas.
 * Agrupa os dados nas últimas 4 semanas (rotuladas como -3 sem, -2 sem, Passada e Atual).
 */
export function calculateWeeklyTaskEarnings(
  transactions: TransactionHistoryResponseDTO[] = [],
  referenceDate: Date = new Date(),
  locale: AppLocale = "pt-BR",
  timeZone?: string | null,
): WeeklyEarningsResult {
  const dayMs = 86_400_000;
  const refParts = getDatePartsInTimeZone(referenceDate, timeZone);
  const refUtcMs = Date.UTC(refParts.year, refParts.month - 1, refParts.day);
  const startOfCurrentWeek = new Date(refUtcMs - refParts.weekday * dayMs);
  const startOfWeek3 = new Date(startOfCurrentWeek.getTime() - 7 * dayMs);
  const startOfWeek2 = new Date(startOfCurrentWeek.getTime() - 14 * dayMs);
  const startOfWeek1 = new Date(startOfCurrentWeek.getTime() - 21 * dayMs);

  const toUtcDateKey = (d: Date) =>
    formatDateParts(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const currentWeekKey = toUtcDateKey(startOfCurrentWeek);
  const week3Key = toUtcDateKey(startOfWeek3);
  const week2Key = toUtcDateKey(startOfWeek2);
  const week1Key = toUtcDateKey(startOfWeek1);

  const weekGains = [0, 0, 0, 0];
  const weekSpent = [0, 0, 0, 0];

  for (const tx of transactions) {
    if (!tx.createdAt) continue;
    const txDate = parseServerDate(tx.createdAt);
    if (!txDate || Number.isNaN(txDate.getTime())) continue;
    const txKey = getDateKeyInTimeZone(txDate, timeZone);

    // Determina o índice da semana (0: -3 sem, 1: -2 sem, 2: Passada, 3: Atual)
    let weekIndex = -1;
    if (txKey >= currentWeekKey) {
      weekIndex = 3;
    } else if (txKey >= week3Key) {
      weekIndex = 2;
    } else if (txKey >= week2Key) {
      weekIndex = 1;
    } else if (txKey >= week1Key) {
      weekIndex = 0;
    }

    if (weekIndex === -1) continue;

    const gold = tx.goldAmount ?? 0;
    const isRewardBought =
      tx.transactionType === "REWARD_BOUGHT" ||
      tx.transactionType === "DEBT_PAID";
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
  const t = getUtilityTranslator(locale, "economy");
  const relativeLabels = [
    t("relativeWeeks.minus3"),
    t("relativeWeeks.minus2"),
    t("relativeWeeks.last"),
    t("relativeWeeks.current"),
  ];

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
      label: relativeLabels[index] ?? t("weekShort", { week: index + 1 }),
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
  timeZone?: string | null;
  isGamified?: boolean;
}

export type RewardStage =
  | "INITIAL"
  | "ADAPTATION"
  | "FORMED"
  | "CONSISTENCY_BONUS";

export interface TaskRewardBreakdown {
  baseReward: { xp: number; gold: number };
  finalReward: { xp: number; gold: number };
  multiplier: number;
  decayPercentage: number;
  bonusPercentage: number;
  stage: RewardStage;
  stageLabel: string;
  stageBadgeVariant: "emerald" | "amber" | "purple";
  currentCount: number;
  thresholds: {
    adaptation: number;
    formed: number;
  };
  explanation: string;
  unit: string;
  hasDecay: boolean;
  hasBonus: boolean;
}

/**
 * Arredonda para cima na metade (RoundingMode.HALF_UP do BigDecimal no backend),
 * usado para o bônus de consistência em Daily.
 */
function roundHalfUpTwoDecimals(value: number): number {
  const scaled = Number((value * 100).toPrecision(12));
  const floor = Math.floor(scaled);
  const fraction = scaled - floor;
  const rounded = fraction >= 0.5 ? floor + 1 : floor;
  return rounded / 100;
}

function roundHalfUpInt(value: number): number {
  const scaled = Number(value.toPrecision(12));
  const floor = Math.floor(scaled);
  const fraction = scaled - floor;
  return fraction >= 0.5 ? floor + 1 : floor;
}

/**
 * Arredonda para 2 casas decimais seguindo RoundingMode.HALF_DOWN do BigDecimal no backend
 * (ex: 0.375 -> 0.37), usado nas recompensas reduzidas de Habit e Todo.
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
  const locale: AppLocale = task.locale ?? "pt-BR";
  const t = getUtilityTranslator(locale, "economy");
  const isGamified = task.isGamified ?? true;
  const formatUnit = (formattedValue: string) =>
    isGamified
      ? `${formattedValue} 🪙`
      : `${formattedValue} ${t("creditsUnit")}`;
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
    let stageLabel = t("habitStages.initialLabel");
    let decayPercentage = 0;
    let stageBadgeVariant: "emerald" | "amber" | "purple" = "emerald";

    if (currentCount >= habitFormedThreshold) {
      multiplier = 0.5;
      stage = "FORMED";
      stageLabel = t("habitStages.formedLabel");
      decayPercentage = 50;
      stageBadgeVariant = "purple";
    } else if (currentCount >= adaptationThreshold) {
      multiplier = 0.75;
      stage = "ADAPTATION";
      stageLabel = t("habitStages.adaptationLabel");
      decayPercentage = 25;
      stageBadgeVariant = "amber";
    }

    const finalXp = Math.max(1, Math.floor(base.xp * multiplier));
    const finalGold = Math.max(
      0.01,
      roundHalfDownTwoDecimals(base.gold * multiplier),
    );
    const baseCoinsFormatted = formatUnit(formatCoins(base.gold, { locale }));

    let explanation = t("habitStages.initialExplanation", {
      baseCoinsFormatted,
      adaptationThreshold,
    });
    if (stage === "FORMED") {
      explanation = t("habitStages.formedExplanation", {
        currentCount,
        habitFormedThreshold,
        baseCoinsFormatted,
      });
    } else if (stage === "ADAPTATION") {
      explanation = t("habitStages.adaptationExplanation", {
        currentCount,
        adaptationThreshold,
        baseCoinsFormatted,
        habitFormedThreshold,
      });
    }

    return {
      baseReward: { xp: base.xp, gold: base.gold },
      finalReward: { xp: finalXp, gold: finalGold },
      multiplier,
      decayPercentage,
      bonusPercentage: 0,
      stage,
      stageLabel,
      stageBadgeVariant,
      currentCount,
      thresholds: {
        adaptation: adaptationThreshold,
        formed: habitFormedThreshold,
      },
      explanation,
      unit: t("units.repetitions"),
      hasDecay: decayPercentage > 0,
      hasBonus: false,
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
  const baseCoinsFormatted = formatUnit(formatCoins(base.gold, { locale }));

  if (normalizedType === "daily") {
    const consistencyBonusThreshold = 14;
    const hasConsistencyBonus = currentCount >= consistencyBonusThreshold;
    const multiplier = hasConsistencyBonus ? 1.1 : 1.0;
    const bonusPercentage = hasConsistencyBonus ? 10 : 0;
    const stage: RewardStage = hasConsistencyBonus
      ? "CONSISTENCY_BONUS"
      : "INITIAL";
    const stageLabel = hasConsistencyBonus
      ? t("dailyStages.bonusLabel")
      : t("dailyStages.baseLabel");

    const finalXp = Math.max(1, roundHalfUpInt(base.xp * multiplier));
    const finalGold = Math.max(
      0.01,
      roundHalfUpTwoDecimals(base.gold * multiplier),
    );
    const finalCoinsFormatted = formatUnit(formatCoins(finalGold, { locale }));

    const explanation = hasConsistencyBonus
      ? t("dailyStages.bonusExplanation", {
          currentCount,
          threshold: consistencyBonusThreshold,
          baseCoinsFormatted,
          finalCoinsFormatted,
        })
      : t("dailyStages.baseExplanation", {
          baseCoinsFormatted,
          threshold: consistencyBonusThreshold,
          currentCount,
        });

    return {
      baseReward: { xp: base.xp, gold: base.gold },
      finalReward: { xp: finalXp, gold: finalGold },
      multiplier,
      decayPercentage: 0,
      bonusPercentage,
      stage,
      stageLabel,
      stageBadgeVariant: "emerald",
      currentCount,
      thresholds: {
        adaptation: consistencyBonusThreshold,
        formed: consistencyBonusThreshold,
      },
      explanation,
      unit: t("units.scheduledCycles"),
      hasDecay: false,
      hasBonus: hasConsistencyBonus,
    };
  }

  // To-Do: se for modo Hardcore e estiver atrasado ou com penalidade aplicada, concede apenas 50%
  const dueDatePart = task.dueDate?.split("T")[0];
  const isTodoOverdue = Boolean(
    dueDatePart && dueDatePart < getTodayDateString(new Date(), task.timeZone),
  );
  const isLateHardcoreTodo =
    normalizedType === "todo" &&
    Boolean(task.isHardcoreModeEnabled) &&
    (Boolean(task.isPenaltyApplied) || isTodoOverdue);

  if (isLateHardcoreTodo) {
    const finalXp = Math.max(1, Math.floor(base.xp * 0.5));
    const finalGold = Math.max(0.01, roundHalfDownTwoDecimals(base.gold * 0.5));
    const finalCoinsFormatted = formatUnit(formatCoins(finalGold, { locale }));

    return {
      baseReward: { xp: base.xp, gold: base.gold },
      finalReward: { xp: finalXp, gold: finalGold },
      multiplier: 0.5,
      decayPercentage: 50,
      bonusPercentage: 0,
      stage: "FORMED",
      stageLabel: isGamified
        ? t("todoStages.lateHardcoreLabel")
        : t("todoStages.lateStrictLabel"),
      stageBadgeVariant: "amber",
      currentCount: 0,
      thresholds: { adaptation: 0, formed: 0 },
      explanation: isGamified
        ? t("todoStages.lateHardcoreExplanation", {
            baseCoinsFormatted,
            finalCoinsFormatted,
          })
        : t("todoStages.lateStrictExplanation", {
            baseCoinsFormatted,
            finalCoinsFormatted,
          }),
      unit: t("units.repetitions"),
      hasDecay: true,
      hasBonus: false,
    };
  }

  // To-Do: sem decaimento de streak
  return {
    baseReward: { xp: base.xp, gold: base.gold },
    finalReward: { xp: base.xp, gold: base.gold },
    multiplier: 1.0,
    decayPercentage: 0,
    bonusPercentage: 0,
    stage: "INITIAL",
    stageLabel: t("todoStages.standardLabel"),
    stageBadgeVariant: "emerald",
    currentCount: 0,
    thresholds: { adaptation: 0, formed: 0 },
    explanation: t("todoStages.standardExplanation"),
    unit: t("units.repetitions"),
    hasDecay: false,
    hasBonus: false,
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
  options?: {
    isHardcore?: boolean;
    taskType?: string;
    locale?: AppLocale;
    isGamified?: boolean;
  },
): import("@/types/reward").RewardEstimate {
  const locale = options?.locale ?? "pt-BR";
  const t = getUtilityTranslator(locale, "economy");
  const isGamified = options?.isGamified ?? true;
  const normalizedType = options?.taskType
    ? normalizeTaskType({ type: options.taskType })
    : undefined;
  const notices: import("@/types/reward").RewardEstimateNotice[] = [];

  if (breakdown.hasBonus) {
    notices.push({
      tone: "success",
      title: `${breakdown.stageLabel} (+${breakdown.bonusPercentage}%)`,
      message: breakdown.explanation,
    });
  } else if (breakdown.hasDecay) {
    notices.push({
      tone: "info",
      title: `${breakdown.stageLabel} (-${breakdown.decayPercentage}%)`,
      message: breakdown.explanation,
    });
  } else if (normalizedType === "daily") {
    notices.push({
      tone: "info",
      title: "Base 100%",
      message: breakdown.explanation,
    });
  } else if (normalizedType !== "todo") {
    notices.push({
      tone: "info",
      title: "Base 100%",
      message: t("notices.habitProgressExplanation", {
        adaptation: breakdown.thresholds.adaptation,
        formed: breakdown.thresholds.formed,
      }),
    });
  }

  if (options?.isHardcore) {
    notices.push({
      tone: "warning",
      title: isGamified
        ? t("notices.hardcoreTitle")
        : normalizedType === "todo"
          ? t("notices.strictDeadlineTitle")
          : t("notices.dailyCommitmentTitle"),
      message: t("notices.hardcorePenaltyMessage"),
    });
  }

  const breakdownItems: import("@/types/reward").RewardEstimateBreakdownItem[] =
    [
      {
        label: t("breakdown.baseReward"),
        value: isGamified
          ? `+${formatCoins(breakdown.baseReward.gold, { locale })} 🪙 / +${breakdown.baseReward.xp} XP`
          : t("breakdown.baseValueProductivity", {
              formattedGold: formatCoins(breakdown.baseReward.gold, { locale }),
              xp: breakdown.baseReward.xp,
            }),
      },
      ...(breakdown.hasBonus
        ? [
            {
              label: t("breakdown.routineBonus"),
              value: `+${breakdown.bonusPercentage}% (${breakdown.stageLabel})`,
            },
          ]
        : breakdown.hasDecay
          ? [
              {
                label:
                  normalizedType === "todo"
                    ? isGamified
                      ? t("breakdown.hardcorePenalty")
                      : t("breakdown.deadlinePenalty")
                    : t("breakdown.habitAdjustment"),
                value: `-${breakdown.decayPercentage}% (${breakdown.stageLabel})`,
              },
            ]
          : []),
    ];

  return {
    gold: breakdown.finalReward.gold,
    xp: breakdown.finalReward.xp,
    status: breakdown.hasBonus
      ? "boosted"
      : breakdown.hasDecay
        ? "reduced"
        : "full",
    stageLabel: breakdown.hasBonus
      ? `${breakdown.stageLabel} (+${breakdown.bonusPercentage}%)`
      : breakdown.hasDecay
        ? `${breakdown.stageLabel} (-${breakdown.decayPercentage}%)`
        : undefined,
    notices,
    breakdown: breakdownItems,
  };
}
