import { SINGLE_USE_TIER_SUGGESTED_PRICES } from "@/constants/reward";
import { DIFFICULTY_REWARDS } from "@/constants/task";
import type { PackageLevel, RewardCategory, RewardType } from "@/types/reward";
import {
  getMysteryBoxTier,
  toCategoryMessageKey,
  toPackageMessageKey,
  toRewardTypeMessageKey,
} from "@/utils/rewardMapper";

/** Ganho médio de referência de um dia produtivo completo (tarefas + ~2h-3h de foco). */
export const DAILY_PRODUCTIVE_COINS_BENCHMARK = 15;

/**
 * Minutos equivalentes de lazer por 1 Crédito/Moeda no benchmark 3:1–4:1
 * (60 min de lazer padrão = 15 Créditos -> 4 min/Crédito).
 */
export const LEISURE_MINUTES_PER_CREDIT = 4;

/**
 * Converte um valor de Créditos/Moedas na estimativa direta de minutos de lazer livre
 * segundo o benchmark oficial de 15 Créditos = 60 minutos.
 */
export function creditsToLeisureMinutes(credits: number): number {
  if (!Number.isFinite(credits) || credits <= 0) {
    return 0;
  }
  return Math.round(credits * LEISURE_MINUTES_PER_CREDIT);
}

/**
 * Formata uma duração estimada de lazer em texto compacto ("45 min", "1h", "2h 20m").
 */
export function formatLeisureDuration(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) {
    return "0 min";
  }
  const rounded = Math.round(totalMinutes);
  if (rounded < 60) {
    return `${rounded} min`;
  }
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

/**
 * Formata a equivalência de tempo de lazer de um saldo ou ganho em Créditos
 * (ex: "~1h", "~32 min", "< 1 min").
 */
export function formatCreditsLeisureEquivalence(credits: number): string {
  if (!Number.isFinite(credits) || credits <= 0) {
    return "0 min";
  }
  const minutes = creditsToLeisureMinutes(credits);
  if (minutes <= 0) {
    return "< 1 min";
  }
  return `~${formatLeisureDuration(minutes)}`;
}

export type RewardCategoryPriceProfile = "discounted" | "standard" | "premium";

/**
 * Classifica a categoria na calibragem de preço:
 * - Hobbies / Desenvolvimento / Bem-estar exercitam habilidades ou descanso ativo (-35%).
 * - Entretenimento puro tem dopamina rápida e custo elevado (+30%).
 * - Demais categorias mantêm o benchmark base (1.0x).
 */
export function getCategoryPriceProfile(
  category?: RewardCategory | string | null,
): RewardCategoryPriceProfile {
  const key = toCategoryMessageKey(category);
  if (key === "HOBBIES" || key === "DEVELOPMENT" || key === "WELLNESS") {
    return "discounted";
  }
  if (key === "ENTERTAINMENT") {
    return "premium";
  }
  return "standard";
}

export function getCategoryPriceMultiplier(
  category?: RewardCategory | string | null,
): number {
  const profile = getCategoryPriceProfile(category);
  if (profile === "discounted") return 0.65;
  if (profile === "premium") return 1.3;
  return 1;
}

export function adjustSuggestedPriceForCategory(
  basePrice: number,
  category?: RewardCategory | string | null,
): number {
  return Math.max(
    1,
    Math.round(basePrice * getCategoryPriceMultiplier(category)),
  );
}

/**
 * Calcula o preço sugerido calibrado para um cupom de tempo (TimeBased)
 * mantendo custo por minuto consistente, desconto progressivo leve para pacotes maiores
 * e ajuste opcional pelo perfil da categoria.
 */
export function calculateSuggestedCouponPrice(
  minutes: number,
  category?: RewardCategory | string | null,
): number {
  const safeMin = Math.max(5, Math.round(minutes || 30));
  let basePrice: number;
  if (safeMin === 30) basePrice = 8;
  else if (safeMin === 60) basePrice = 15;
  else if (safeMin === 120) basePrice = 28;
  else if (safeMin === 180) basePrice = 40;
  else if (safeMin === 240) basePrice = 50;
  else if (safeMin === 480) basePrice = 95;
  else if (safeMin < 30) {
    basePrice = Math.max(1, Math.round(safeMin * (8 / 30)));
  } else if (safeMin < 60) {
    basePrice = Math.round(8 + ((safeMin - 30) / 30) * 7);
  } else if (safeMin < 180) {
    basePrice = Math.round(15 + ((safeMin - 60) / 120) * 25);
  } else if (safeMin < 480) {
    basePrice = Math.round(40 + ((safeMin - 180) / 300) * 55);
  } else {
    basePrice = Math.round(safeMin * 0.2);
  }

  return adjustSuggestedPriceForCategory(basePrice, category);
}

export function calculateSuggestedSingleUsePrice(
  packageLevel?: PackageLevel,
  category?: RewardCategory | string | null,
): number | null {
  const pkgKey = toPackageMessageKey(packageLevel);
  const basePrice = SINGLE_USE_TIER_SUGGESTED_PRICES[pkgKey];
  if (typeof basePrice !== "number") {
    return null;
  }
  return adjustSuggestedPriceForCategory(basePrice, category);
}

export type RewardEffortDescriptor =
  | { key: "invalidZero" }
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
  categoryProfile: RewardCategoryPriceProfile;
  warning?: RewardPriceWarningDescriptor;
}

interface AnalyzeRewardPriceInput {
  type: RewardType;
  price: number;
  durationMinutes?: number;
  packageLevel?: PackageLevel;
  category?: RewardCategory | string | null;
}

/**
 * Mapeia um preço em moedas para uma equivalência estruturada em esforço
 * (tarefas + foco ou dias produtivos) usando a economia real do HabitParty.
 */
export function describeEffortEquivalence(
  price: number,
): RewardEffortDescriptor {
  if (!Number.isFinite(price) || price <= 0) {
    return { key: "invalidZero" };
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
  category,
}: AnalyzeRewardPriceInput): RewardPriceAnalysis {
  const safePrice = Number.isFinite(price) ? price : 0;
  const effort = describeEffortEquivalence(safePrice);

  const typeKey = toRewardTypeMessageKey(type);
  const categoryProfile: RewardCategoryPriceProfile =
    typeKey === "MysteryBox" ? "standard" : getCategoryPriceProfile(category);

  let suggestedPrice: number | null = null;
  if (typeKey === "TimeBased") {
    suggestedPrice = calculateSuggestedCouponPrice(durationMinutes, category);
  } else if (typeKey === "MysteryBox") {
    suggestedPrice = getMysteryBoxTier(packageLevel).recommendedPrice;
  } else if (typeKey === "SingleUse") {
    suggestedPrice = calculateSuggestedSingleUsePrice(packageLevel, category);
  }

  if (safePrice <= 0) {
    return {
      suggestedPrice,
      effort,
      status: "ok",
      categoryProfile,
    };
  }

  if (suggestedPrice !== null && suggestedPrice > 0) {
    if (safePrice < suggestedPrice * 0.5) {
      return {
        suggestedPrice,
        effort,
        status: "too_low",
        categoryProfile,
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
        categoryProfile,
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
      categoryProfile,
    };
  }

  // SingleUse: guia sem engessar itens reais maiores
  if (safePrice < 1) {
    return {
      suggestedPrice: null,
      effort,
      status: "too_low",
      categoryProfile,
      warning: { key: "singleUseTooLow" },
    };
  }

  if (safePrice > 250) {
    return {
      suggestedPrice: null,
      effort,
      status: "too_high",
      categoryProfile,
      warning: { key: "singleUseTooHigh" },
    };
  }

  return {
    suggestedPrice: null,
    effort,
    status: "ok",
    categoryProfile,
  };
}
