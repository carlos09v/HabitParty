import type {
  AccountBadgeId,
  AchievementCategory,
  AchievementRarity,
  StatMetricId,
} from "@/types/showcase";

export interface RarityThemeTokens {
  rarity: AchievementRarity;
  points: number;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBorder: string;
  cardGlow: string;
  iconBg: string;
  iconText: string;
  progressFill: string;
  accentGradient: string;
}

export const RARITY_THEMES: Record<AchievementRarity, RarityThemeTokens> = {
  COMMON: {
    rarity: "COMMON",
    points: 10,
    badgeBg: "bg-slate-500/15 dark:bg-slate-400/15",
    badgeText: "text-slate-700 dark:text-slate-300",
    badgeBorder: "border-slate-500/30 dark:border-slate-400/30",
    cardBorder: "border-neutral-700 dark:border-slate-500/35",
    cardGlow:
      "shadow-xs dark:shadow-none hover:border-slate-400/70 dark:hover:border-slate-400/55",
    iconBg:
      "bg-gradient-to-br from-slate-500/20 to-slate-600/10 border-slate-400/35",
    iconText: "text-slate-700 dark:text-slate-200",
    progressFill: "bg-emerald-500",
    accentGradient: "from-slate-400/25 via-transparent to-transparent",
  },
  UNCOMMON: {
    rarity: "UNCOMMON",
    points: 25,
    badgeBg: "bg-emerald-500/15",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    badgeBorder: "border-emerald-500/35",
    cardBorder: "border-emerald-500/35",
    cardGlow:
      "shadow-xs hover:border-emerald-500/60 dark:hover:border-emerald-400/60 dark:shadow-[0_0_20px_-8px_rgba(16,185,129,0.22)]",
    iconBg:
      "bg-gradient-to-br from-emerald-500/25 to-teal-500/10 border-emerald-400/40",
    iconText: "text-emerald-700 dark:text-emerald-300",
    progressFill: "bg-emerald-500",
    accentGradient: "from-emerald-500/25 via-transparent to-transparent",
  },
  RARE: {
    rarity: "RARE",
    points: 50,
    badgeBg: "bg-sky-500/15",
    badgeText: "text-sky-700 dark:text-sky-300",
    badgeBorder: "border-sky-500/35",
    cardBorder: "border-sky-500/40",
    cardGlow:
      "shadow-xs hover:border-sky-500/70 dark:hover:border-sky-400/70 dark:shadow-[0_0_24px_-6px_rgba(14,165,233,0.28)]",
    iconBg:
      "bg-gradient-to-br from-sky-500/25 to-blue-600/15 border-sky-400/45",
    iconText: "text-sky-700 dark:text-sky-300",
    progressFill: "bg-sky-500",
    accentGradient: "from-sky-500/25 via-transparent to-transparent",
  },
  EPIC: {
    rarity: "EPIC",
    points: 100,
    badgeBg: "bg-purple-500/15",
    badgeText: "text-purple-700 dark:text-purple-300",
    badgeBorder: "border-purple-500/40",
    cardBorder: "border-purple-500/45",
    cardGlow:
      "shadow-xs hover:border-purple-500/70 dark:hover:border-purple-400/75 dark:shadow-[0_0_28px_-6px_rgba(168,85,247,0.34)]",
    iconBg:
      "bg-gradient-to-br from-purple-500/30 to-fuchsia-600/15 border-purple-400/50",
    iconText: "text-purple-700 dark:text-purple-300",
    progressFill: "bg-purple-500",
    accentGradient: "from-purple-500/30 via-fuchsia-500/10 to-transparent",
  },
  LEGENDARY: {
    rarity: "LEGENDARY",
    points: 250,
    badgeBg: "bg-gold/20",
    badgeText: "text-amber-700 dark:text-gold",
    badgeBorder: "border-gold/50",
    cardBorder: "border-gold/55",
    cardGlow:
      "shadow-xs hover:border-amber-500 dark:hover:border-gold dark:shadow-[0_0_32px_-6px_rgba(245,158,11,0.42)]",
    iconBg:
      "bg-gradient-to-br from-gold/30 via-amber-500/20 to-orange-500/10 border-gold/60",
    iconText: "text-amber-700 dark:text-gold",
    progressFill: "bg-gradient-to-r from-amber-500 via-gold to-yellow-300",
    accentGradient: "from-gold/35 via-amber-500/12 to-transparent",
  },
};

export const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  "TASKS",
  "STREAKS",
  "FOCUS",
  "ECONOMY",
  "PROGRESSION",
  "SPECIAL",
];

export const ACHIEVEMENT_RARITIES: AchievementRarity[] = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
];

export const ACCOUNT_BADGE_DEFINITIONS: {
  id: AccountBadgeId;
  rarity: AchievementRarity;
  iconKey: string;
}[] = [
  {
    id: "FOUNDER",
    rarity: "LEGENDARY",
    iconKey: "crown-star",
  },
  {
    id: "PREMIUM_GUARDIAN",
    rarity: "EPIC",
    iconKey: "crown-gold",
  },
  {
    id: "VERIFIED_ADVENTURER",
    rarity: "RARE",
    iconKey: "shield-check",
  },
  {
    id: "LEVEL_RANK",
    rarity: "EPIC",
    iconKey: "sparkles-gold",
  },
];

export const STAT_METRIC_DEFINITIONS: {
  id: StatMetricId;
  rarity: AchievementRarity;
  iconKey: string;
}[] = [
  {
    id: "HIGHEST_STREAK",
    rarity: "LEGENDARY",
    iconKey: "flame-solar",
  },
  {
    id: "CURRENT_STREAK",
    rarity: "RARE",
    iconKey: "flame",
  },
  {
    id: "TOTAL_TASKS",
    rarity: "EPIC",
    iconKey: "swords",
  },
  {
    id: "FOCUS_HOURS",
    rarity: "EPIC",
    iconKey: "hourglass-gold",
  },
  {
    id: "TOTAL_XP",
    rarity: "RARE",
    iconKey: "zap",
  },
  {
    id: "ACHIEVEMENT_POINTS",
    rarity: "LEGENDARY",
    iconKey: "trophy",
  },
];

export const MAX_SHOWCASE_HIGHLIGHTS = 4;
export const DEFAULT_MAX_ACHIEVEMENT_POINTS = 4170;
export const DEFAULT_TOTAL_ACHIEVEMENTS_COUNT = 63;
export const ACHIEVEMENTS_PER_PAGE = 9;
export const HIGHLIGHT_MODAL_ITEMS_PER_PAGE = 6;

export const ACCOUNT_BADGES_BY_ID = Object.fromEntries(
  ACCOUNT_BADGE_DEFINITIONS.map((b) => [b.id, b]),
) as Record<AccountBadgeId, (typeof ACCOUNT_BADGE_DEFINITIONS)[number]>;

export const STAT_METRICS_BY_ID = Object.fromEntries(
  STAT_METRIC_DEFINITIONS.map((m) => [m.id, m]),
) as Record<StatMetricId, (typeof STAT_METRIC_DEFINITIONS)[number]>;
