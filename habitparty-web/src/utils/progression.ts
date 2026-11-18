import { FOCUS_REWARD_RULES } from "@/constants/focus";
import { DIFFICULTY_REWARDS, HABIT_IMPORTANCE_REWARDS } from "@/constants/task";
import type { AppLocale } from "@/i18n/config";
import type { FriendConnectionItem } from "@/types/social";
import {
  getCurrentLevel,
  localizeLevelTitle,
  USER_LEVELS,
} from "@/utils/levels";

export type UserLevelEntry = (typeof USER_LEVELS)[number];
export type UserLevelTier = UserLevelEntry["tier"];

export type ProgressionEraId =
  | "foundation"
  | "consistency"
  | "mastery"
  | "apex";

export interface RankTierMetadata {
  tier: UserLevelTier;
  rankOrder: number; // 1 (Base: NOVICE) -> 10 (Apex: LEGEND)
  era: ProgressionEraId;
  achievementCode: string | null;
  /** Largura proporcional visual da camada na pirâmide (desktop sm+) */
  desktopWidthPercent: number;
  /** Largura mínima confortável no mobile mantendo o efeito escalonado */
  mobileWidthPercent: number;
  /** Cores semânticas com contraste garantido em tema claro e escuro */
  badgeClass: string;
  accentTextClass: string;
  activeBorderClass: string;
  barGradientClass: string;
}

export const RANK_ERA_ORDER: readonly ProgressionEraId[] = [
  "apex",
  "mastery",
  "consistency",
  "foundation",
] as const;

export const RANK_TIER_METADATA: Record<UserLevelTier, RankTierMetadata> = {
  NOVICE: {
    tier: "NOVICE",
    rankOrder: 1,
    era: "foundation",
    achievementCode: null,
    desktopWidthPercent: 100,
    mobileWidthPercent: 100,
    badgeClass:
      "bg-neutral-500/15 text-neutral-700 dark:text-neutral-300 border-neutral-500/35",
    accentTextClass: "text-neutral-700 dark:text-neutral-200",
    activeBorderClass: "border-neutral-500/50 dark:border-neutral-400/50",
    barGradientClass: "from-neutral-500 to-neutral-400",
  },
  APPRENTICE: {
    tier: "APPRENTICE",
    rankOrder: 2,
    era: "foundation",
    achievementCode: "LEVEL_APPRENTICE",
    desktopWidthPercent: 95,
    mobileWidthPercent: 98,
    badgeClass:
      "bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/35",
    accentTextClass: "text-sky-700 dark:text-sky-300",
    activeBorderClass: "border-sky-500/50",
    barGradientClass: "from-sky-500 to-cyan-400",
  },
  ADVENTURER: {
    tier: "ADVENTURER",
    rankOrder: 3,
    era: "foundation",
    achievementCode: "LEVEL_ADVENTURER",
    desktopWidthPercent: 90,
    mobileWidthPercent: 96,
    badgeClass:
      "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/35",
    accentTextClass: "text-cyan-700 dark:text-cyan-300",
    activeBorderClass: "border-cyan-500/50",
    barGradientClass: "from-cyan-500 to-teal-400",
  },
  CHALLENGER: {
    tier: "CHALLENGER",
    rankOrder: 4,
    era: "consistency",
    achievementCode: "LEVEL_CHALLENGER",
    desktopWidthPercent: 85,
    mobileWidthPercent: 94,
    badgeClass:
      "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/35",
    accentTextClass: "text-emerald-700 dark:text-emerald-300",
    activeBorderClass: "border-emerald-500/50",
    barGradientClass: "from-emerald-500 to-green-400",
  },
  AMATEUR: {
    tier: "AMATEUR",
    rankOrder: 5,
    era: "consistency",
    achievementCode: null,
    desktopWidthPercent: 80,
    mobileWidthPercent: 92,
    badgeClass:
      "bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/35",
    accentTextClass: "text-teal-700 dark:text-teal-300",
    activeBorderClass: "border-teal-500/50",
    barGradientClass: "from-teal-500 to-emerald-400",
  },
  PROFESSIONAL: {
    tier: "PROFESSIONAL",
    rankOrder: 6,
    era: "consistency",
    achievementCode: "LEVEL_PROFESSIONAL",
    desktopWidthPercent: 75,
    mobileWidthPercent: 90,
    badgeClass:
      "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border-indigo-500/35",
    accentTextClass: "text-indigo-700 dark:text-indigo-300",
    activeBorderClass: "border-indigo-500/50",
    barGradientClass: "from-indigo-500 to-blue-400",
  },
  EXPERT: {
    tier: "EXPERT",
    rankOrder: 7,
    era: "mastery",
    achievementCode: "LEVEL_EXPERT",
    desktopWidthPercent: 70,
    mobileWidthPercent: 88,
    badgeClass:
      "bg-violet-500/15 text-violet-800 dark:text-violet-300 border-violet-500/35",
    accentTextClass: "text-violet-700 dark:text-violet-300",
    activeBorderClass: "border-violet-500/50",
    barGradientClass: "from-violet-500 to-purple-400",
  },
  VETERAN: {
    tier: "VETERAN",
    rankOrder: 8,
    era: "mastery",
    achievementCode: "LEVEL_VETERAN",
    desktopWidthPercent: 65,
    mobileWidthPercent: 86,
    badgeClass:
      "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/35",
    accentTextClass: "text-purple-700 dark:text-purple-300",
    activeBorderClass: "border-purple-500/50",
    barGradientClass: "from-purple-500 to-fuchsia-400",
  },
  MASTER: {
    tier: "MASTER",
    rankOrder: 9,
    era: "apex",
    achievementCode: "LEVEL_MASTER",
    desktopWidthPercent: 60,
    mobileWidthPercent: 84,
    badgeClass:
      "bg-fuchsia-500/15 text-fuchsia-800 dark:text-fuchsia-300 border-fuchsia-500/35",
    accentTextClass: "text-fuchsia-700 dark:text-fuchsia-300",
    activeBorderClass: "border-fuchsia-500/50",
    barGradientClass: "from-fuchsia-500 to-pink-400",
  },
  LEGEND: {
    tier: "LEGEND",
    rankOrder: 10,
    era: "apex",
    achievementCode: "LEVEL_LEGEND",
    desktopWidthPercent: 55,
    mobileWidthPercent: 82,
    badgeClass:
      "bg-amber-500/15 text-amber-800 dark:text-gold border-amber-500/45 dark:border-gold/45",
    accentTextClass: "text-amber-700 dark:text-gold",
    activeBorderClass: "border-amber-500/60 dark:border-gold/60",
    barGradientClass: "from-amber-500 via-gold to-yellow-300",
  },
};

export interface ProgressionTierView {
  entry: UserLevelEntry;
  meta: RankTierMetadata;
  localizedTitle: string;
  secondaryTitle: string;
  minXp: number;
  nextMinXp: number | null;
  tierSpanXp: number | null;
}

/**
 * Constrói os 10 degraus da pirâmide ordenados do topo (Lenda) à base (Novato),
 * preservando compatibilidade com os modos Aventura e Essencial.
 */
export function buildProgressionPyramidTiers(
  locale: AppLocale,
  isGamified: boolean,
): ProgressionTierView[] {
  const asc = USER_LEVELS.map((entry, idx) => {
    const nextEntry = USER_LEVELS[idx + 1] ?? null;
    const minXp = entry.minXpRequired;
    const nextMinXp = nextEntry ? nextEntry.minXpRequired : null;
    return {
      entry,
      meta: RANK_TIER_METADATA[entry.tier],
      localizedTitle: localizeLevelTitle(entry.tier, locale, isGamified),
      secondaryTitle: localizeLevelTitle(entry.tier, locale, !isGamified),
      minXp,
      nextMinXp,
      tierSpanXp: nextMinXp !== null ? nextMinXp - minXp : null,
    };
  });

  return asc.reverse();
}

export interface RankEffortBreakdown {
  remainingXp: number;
  mediumTasks: number;
  hardTasks: number;
  normalHabits: number;
  standardPomodoros: number;
  deepWorkPomodoros: number;
  estimatedDaysAtPace: number;
}

/**
 * Calcula equivalências reais de esforço para conquistar a quantidade restante de XP,
 * usando diretamente as constantes de recompensas do sistema.
 */
export function calculateRankEffortBreakdown(
  remainingXp: number,
  dailyXpPace = 60,
): RankEffortBreakdown {
  const safeRemaining = Math.max(0, Math.round(remainingXp));
  const safePace = Math.max(1, Math.round(dailyXpPace));

  if (safeRemaining === 0) {
    return {
      remainingXp: 0,
      mediumTasks: 0,
      hardTasks: 0,
      normalHabits: 0,
      standardPomodoros: 0,
      deepWorkPomodoros: 0,
      estimatedDaysAtPace: 0,
    };
  }

  return {
    remainingXp: safeRemaining,
    mediumTasks: Math.ceil(safeRemaining / DIFFICULTY_REWARDS.MEDIUM.xp),
    hardTasks: Math.ceil(safeRemaining / DIFFICULTY_REWARDS.HARD.xp),
    normalHabits: Math.ceil(safeRemaining / HABIT_IMPORTANCE_REWARDS.NORMAL.xp),
    standardPomodoros: Math.ceil(
      safeRemaining / FOCUS_REWARD_RULES.STANDARD_XP_PER_CYCLE,
    ),
    deepWorkPomodoros: Math.ceil(
      safeRemaining / FOCUS_REWARD_RULES.DEEP_WORK_XP_PER_CYCLE,
    ),
    estimatedDaysAtPace: Math.ceil(safeRemaining / safePace),
  };
}

/**
 * Agrupa amigos aceitos pela patente atual correspondente ao seu totalXp.
 */
export function groupFriendsByLevelTier(
  friends: readonly FriendConnectionItem[] = [],
): Map<UserLevelTier, FriendConnectionItem[]> {
  const grouped = new Map<UserLevelTier, FriendConnectionItem[]>();
  for (const conn of friends) {
    const friendXp = Math.max(0, conn.user.totalXp ?? 0);
    const tier = getCurrentLevel(friendXp).tier;
    const list = grouped.get(tier) ?? [];
    list.push(conn);
    grouped.set(tier, list);
  }
  return grouped;
}
