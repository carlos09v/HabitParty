import { DIFFICULTY_REWARDS } from "@/constants/task";
import type { PackageLevel, RewardType } from "@/types/reward";
import { getMysteryBoxTier } from "@/utils/rewardMapper";

/** Ganho médio de referência de um dia produtivo completo (tarefas + ~2h-3h de foco). */
export const DAILY_PRODUCTIVE_COINS_BENCHMARK = 15;

/**
 * Calcula o preço sugerido calibrado para um cupom de tempo (TimeBased)
 * mantendo custo por minuto consistente e desconto progressivo leve para pacotes maiores.
 */
export function calculateSuggestedCouponPrice(minutes: number): number {
  const safeMin = Math.max(5, Math.round(minutes || 30));
  if (safeMin === 30) return 8;
  if (safeMin === 60) return 15;
  if (safeMin === 120) return 28;
  if (safeMin === 180) return 40;
  if (safeMin === 240) return 50;
  if (safeMin === 480) return 95;

  if (safeMin < 30) {
    return Math.max(1, Math.round(safeMin * (8 / 30)));
  }
  if (safeMin < 60) {
    return Math.round(8 + ((safeMin - 30) / 30) * 7);
  }
  if (safeMin < 180) {
    return Math.round(15 + ((safeMin - 60) / 120) * 25);
  }
  if (safeMin < 480) {
    return Math.round(40 + ((safeMin - 180) / 300) * 55);
  }
  return Math.round(safeMin * 0.2);
}

export type RewardEffortDescriptor =
  | { key: "free" }
  | { key: "easyTasks"; count: number }
  | { key: "hardSingleTask" }
  | { key: "mediumTasks"; count: number }
  | { key: "halfDayMix" }
  | { key: "oneProductiveDay"; hardCount: number }
  | { key: "multipleProductiveDays"; days: number };

export type RewardPriceWarningDescriptor =
  | { key: "belowCalibrated"; suggestedPrice: number }
  | { key: "aboveCalibrated"; suggestedPrice: number }
  | { key: "singleUseTooLow" }
  | { key: "singleUseTooHigh" };

export interface RewardPriceAnalysis {
  suggestedPrice: number | null;
  effort: RewardEffortDescriptor;
  status: "ok" | "too_low" | "too_high";
  warning?: RewardPriceWarningDescriptor;
}

interface AnalyzeRewardPriceInput {
  type: RewardType;
  price: number;
  durationMinutes?: number;
  packageLevel?: PackageLevel;
}

/**
 * Mapeia um preço em moedas para uma equivalência estruturada em esforço
 * (tarefas + foco ou dias produtivos) usando a economia real do HabitParty.
 */
export function describeEffortEquivalence(
  price: number,
): RewardEffortDescriptor {
  if (!Number.isFinite(price) || price <= 0) {
    return { key: "free" };
  }

  const easyGold = DIFFICULTY_REWARDS.EASY.gold; // 0.75
  const mediumGold = DIFFICULTY_REWARDS.MEDIUM.gold; // 2.5
  const hardGold = DIFFICULTY_REWARDS.HARD.gold; // 5.0

  if (price < mediumGold) {
    return {
      key: "easyTasks",
      count: Math.max(1, Math.round(price / easyGold)),
    };
  }

  if (price < 6) {
    if (price >= hardGold * 0.9) {
      return { key: "hardSingleTask" };
    }
    return {
      key: "mediumTasks",
      count: Math.max(1, Math.round(price / mediumGold)),
    };
  }

  if (price <= 10) {
    return { key: "halfDayMix" };
  }

  if (price <= 20) {
    return {
      key: "oneProductiveDay",
      hardCount: Math.max(2, Math.round(price / hardGold)),
    };
  }

  return {
    key: "multipleProductiveDays",
    days: price / DAILY_PRODUCTIVE_COINS_BENCHMARK,
  };
}

/**
 * Avalia se o custo definido para uma recompensa está calibrado ou se foge muito
 * do padrão econômico (barato demais -> inflação; caro demais -> frustração).
 */
export function analyzeRewardPrice({
  type,
  price,
  durationMinutes = 30,
  packageLevel,
}: AnalyzeRewardPriceInput): RewardPriceAnalysis {
  const safePrice = Number.isFinite(price) ? price : 0;
  const effort = describeEffortEquivalence(safePrice);

  let suggestedPrice: number | null = null;
  if (type === "TimeBased") {
    suggestedPrice = calculateSuggestedCouponPrice(durationMinutes);
  } else if (type === "MysteryBox") {
    suggestedPrice = getMysteryBoxTier(packageLevel).recommendedPrice;
  }

  if (safePrice <= 0) {
    return {
      suggestedPrice,
      effort,
      status: "ok",
    };
  }

  if (suggestedPrice !== null && suggestedPrice > 0) {
    if (safePrice < suggestedPrice * 0.5) {
      return {
        suggestedPrice,
        effort,
        status: "too_low",
        warning: {
          key: "belowCalibrated",
          suggestedPrice,
        },
      };
    }

    if (safePrice > suggestedPrice * 2.0) {
      return {
        suggestedPrice,
        effort,
        status: "too_high",
        warning: {
          key: "aboveCalibrated",
          suggestedPrice,
        },
      };
    }

    return {
      suggestedPrice,
      effort,
      status: "ok",
    };
  }

  // SingleUse: guia sem engessar itens reais maiores
  if (safePrice < 2) {
    return {
      suggestedPrice: null,
      effort,
      status: "too_low",
      warning: { key: "singleUseTooLow" },
    };
  }

  if (safePrice > 250) {
    return {
      suggestedPrice: null,
      effort,
      status: "too_high",
      warning: { key: "singleUseTooHigh" },
    };
  }

  return {
    suggestedPrice: null,
    effort,
    status: "ok",
  };
}
