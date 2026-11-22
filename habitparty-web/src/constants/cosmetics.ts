import {
  Award,
  BookOpen,
  Briefcase,
  Compass,
  Crosshair,
  Crown,
  Flame,
  Footprints,
  Gem,
  type LucideIcon,
  Medal,
  MoonStar,
  Shield,
  ShieldAlert,
  Sparkles,
  Sprout,
  Sunrise,
  Swords,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import type { AchievementItemResponseDTO } from "@/types/showcase";
import type { UserRetrospectiveData } from "@/types/social";
import type { UserResponseDTO } from "@/types/user";
import { parseServerDate } from "@/utils/date";
import { USER_LEVELS } from "@/utils/levels";

export type ProfileTitleCategory = "ACHIEVEMENT" | "ACCOUNT" | "RETROSPECTIVE";

export type ProfileTitleCode =
  | "NIGHT_OWL"
  | "EARLY_BIRD"
  | "HARDCORE_SURVIVOR"
  | "FOCUS_MARATHON_90"
  | "TASK_HARD_25"
  | "STREAK_90"
  | "FOCUS_HOURS_200"
  | "GOLD_15000"
  | "STREAK_365"
  | "TASK_1000"
  | "FOUNDER"
  | "VIP_GUARDIAN"
  | "ARTIFACT_COLLECTOR"
  | "TROPHY_HUNTER_1000"
  | "JOURNEY_VETERAN"
  | "RETRO_DEEP_FOCUS_SAGE"
  | "RETRO_STREAK_GUARDIAN"
  | "RETRO_CHALLENGE_SEEKER"
  | "RETRO_ARCHITECT"
  | "RETRO_RISING_SPARK";

export interface ProfileTitleDefinition {
  code: ProfileTitleCode;
  category: ProfileTitleCategory;
  icon: LucideIcon;
  accentClass: string;
}

export const PROFILE_TITLES: readonly ProfileTitleDefinition[] = [
  {
    code: "NIGHT_OWL",
    category: "ACHIEVEMENT",
    icon: MoonStar,
    accentClass: "text-indigo-600 dark:text-indigo-300",
  },
  {
    code: "EARLY_BIRD",
    category: "ACHIEVEMENT",
    icon: Sunrise,
    accentClass: "text-amber-800 dark:text-amber-300",
  },
  {
    code: "HARDCORE_SURVIVOR",
    category: "ACHIEVEMENT",
    icon: ShieldAlert,
    accentClass: "text-rose-700 dark:text-rose-300",
  },
  {
    code: "FOCUS_MARATHON_90",
    category: "ACHIEVEMENT",
    icon: Timer,
    accentClass: "text-sky-700 dark:text-sky-300",
  },
  {
    code: "TASK_HARD_25",
    category: "ACHIEVEMENT",
    icon: Swords,
    accentClass: "text-orange-800 dark:text-orange-300",
  },
  {
    code: "STREAK_90",
    category: "ACHIEVEMENT",
    icon: Shield,
    accentClass: "text-emerald-800 dark:text-emerald-300",
  },
  {
    code: "FOCUS_HOURS_200",
    category: "ACHIEVEMENT",
    icon: Zap,
    accentClass: "text-cyan-600 dark:text-cyan-300",
  },
  {
    code: "GOLD_15000",
    category: "ACHIEVEMENT",
    icon: Gem,
    accentClass: "text-yellow-600 dark:text-gold",
  },
  {
    code: "STREAK_365",
    category: "ACHIEVEMENT",
    icon: Flame,
    accentClass: "text-amber-800 dark:text-amber-400",
  },
  {
    code: "TASK_1000",
    category: "ACHIEVEMENT",
    icon: Crown,
    accentClass: "text-amber-700 dark:text-gold",
  },
  {
    code: "TROPHY_HUNTER_1000",
    category: "ACHIEVEMENT",
    icon: Trophy,
    accentClass: "text-purple-600 dark:text-purple-300",
  },
  {
    code: "FOUNDER",
    category: "ACCOUNT",
    icon: Crown,
    accentClass: "text-amber-700 dark:text-gold",
  },
  {
    code: "VIP_GUARDIAN",
    category: "ACCOUNT",
    icon: Sparkles,
    accentClass: "text-amber-700 dark:text-gold",
  },
  {
    code: "ARTIFACT_COLLECTOR",
    category: "ACCOUNT",
    icon: Award,
    accentClass: "text-sky-700 dark:text-sky-300",
  },
  {
    code: "JOURNEY_VETERAN",
    category: "ACCOUNT",
    icon: Medal,
    accentClass: "text-emerald-800 dark:text-emerald-300",
  },
  {
    code: "RETRO_DEEP_FOCUS_SAGE",
    category: "RETROSPECTIVE",
    icon: BookOpen,
    accentClass: "text-purple-600 dark:text-purple-300",
  },
  {
    code: "RETRO_STREAK_GUARDIAN",
    category: "RETROSPECTIVE",
    icon: Flame,
    accentClass: "text-orange-800 dark:text-orange-300",
  },
  {
    code: "RETRO_CHALLENGE_SEEKER",
    category: "RETROSPECTIVE",
    icon: Swords,
    accentClass: "text-rose-700 dark:text-rose-300",
  },
  {
    code: "RETRO_ARCHITECT",
    category: "RETROSPECTIVE",
    icon: Compass,
    accentClass: "text-sky-700 dark:text-sky-300",
  },
  {
    code: "RETRO_RISING_SPARK",
    category: "RETROSPECTIVE",
    icon: Sparkles,
    accentClass: "text-amber-800 dark:text-amber-300",
  },
] as const;

export const PROFILE_TITLES_BY_CODE: Record<string, ProfileTitleDefinition> =
  Object.fromEntries(PROFILE_TITLES.map((item) => [item.code, item]));

export interface CosmeticTitleUnlockContext {
  user?: UserResponseDTO | null;
  achievements?: AchievementItemResponseDTO[];
  unlockedArtifactsCount?: number;
  retrospective?: UserRetrospectiveData | null;
}

const VETERAN_MIN_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Avalia se um título está desbloqueado para o usuário, espelhando `CosmeticCatalog.java`.
 */
export function isProfileTitleUnlocked(
  code: ProfileTitleCode,
  ctx: CosmeticTitleUnlockContext,
): boolean {
  const user = ctx.user;
  const def = PROFILE_TITLES_BY_CODE[code];
  if (!def) return false;

  if (def.category === "ACHIEVEMENT") {
    return Boolean(
      ctx.achievements?.some((a) => a.code === code && a.unlocked),
    );
  }

  switch (code) {
    case "FOUNDER":
      return Boolean(user?.isFounder);
    case "VIP_GUARDIAN":
      return Boolean(user?.isPremium);
    case "ARTIFACT_COLLECTOR":
      return (ctx.unlockedArtifactsCount ?? 0) >= 10;
    case "JOURNEY_VETERAN": {
      if (!user?.emailVerified || !user.createdAt) return false;
      const created = parseServerDate(user.createdAt);
      if (!created) return false;
      return Date.now() - created.getTime() >= VETERAN_MIN_MS;
    }
    default: {
      if (code.startsWith("RETRO_") && ctx.retrospective?.eligible) {
        return `RETRO_${ctx.retrospective.archetype}` === code;
      }
      return false;
    }
  }
}

type TranslatorLike = {
  (key: never): string;
  has: (key: never) => boolean;
};

/**
 * Resolve o rótulo localizado do título equipado conforme o modo (Aventura vs Produtividade).
 */
export function resolveProfileTitleLabel(
  titleCode: string | null | undefined,
  isGamified: boolean,
  tTitles: TranslatorLike,
): string | null {
  if (!titleCode || titleCode.trim().toUpperCase() === "NONE") {
    return null;
  }
  const clean = titleCode.trim().toUpperCase();
  const modeKey = isGamified
    ? `items.${clean}.gamified`
    : `items.${clean}.essential`;
  if (tTitles.has(modeKey as never)) {
    return tTitles(modeKey as never);
  }
  return clean;
}

export type AvatarPresetId =
  | "level_novice"
  | "level_apprentice"
  | "level_adventurer"
  | "level_challenger"
  | "level_amateur"
  | "level_professional"
  | "level_expert"
  | "level_veteran"
  | "level_master"
  | "level_legend"
  | "vip_cosmic"
  | "founder_crest";

export interface AvatarPresetOption {
  id: AvatarPresetId;
  unlockType: "LEVEL" | "PREMIUM" | "FOUNDER";
  minXp: number;
  icon: LucideIcon;
  shapeKind:
    | "sprout"
    | "footprints"
    | "compass"
    | "target"
    | "briefcase"
    | "zap"
    | "shield"
    | "book"
    | "crown"
    | "sparkles"
    | "award";
  cssGradient: string;
  canvasColors: [string, string];
  iconColorHex: string;
}

const LEVEL_MIN_XP: Record<string, number> = Object.fromEntries(
  USER_LEVELS.map((l) => [l.tier, l.minXpRequired]),
);

export const AVATAR_PRESETS: readonly AvatarPresetOption[] = [
  {
    id: "level_novice",
    unlockType: "LEVEL",
    minXp: LEVEL_MIN_XP.NOVICE ?? 0,
    icon: Sprout,
    shapeKind: "sprout",
    cssGradient: "from-emerald-600 via-teal-600 to-emerald-800",
    canvasColors: ["#059669", "#065F46"],
    iconColorHex: "#ECFDF5",
  },
  {
    id: "level_apprentice",
    unlockType: "LEVEL",
    minXp: LEVEL_MIN_XP.APPRENTICE ?? 100,
    icon: Footprints,
    shapeKind: "footprints",
    cssGradient: "from-teal-500 via-cyan-600 to-sky-800",
    canvasColors: ["#0D9488", "#075985"],
    iconColorHex: "#ECFEFF",
  },
  {
    id: "level_adventurer",
    unlockType: "LEVEL",
    minXp: LEVEL_MIN_XP.ADVENTURER ?? 300,
    icon: Compass,
    shapeKind: "compass",
    cssGradient: "from-sky-500 via-blue-600 to-indigo-800",
    canvasColors: ["#0284C7", "#3730A3"],
    iconColorHex: "#F0F9FF",
  },
  {
    id: "level_challenger",
    unlockType: "LEVEL",
    minXp: LEVEL_MIN_XP.CHALLENGER ?? 750,
    icon: Crosshair,
    shapeKind: "target",
    cssGradient: "from-blue-600 via-indigo-600 to-violet-800",
    canvasColors: ["#2563EB", "#5B21B6"],
    iconColorHex: "#EEF2FF",
  },
  {
    id: "level_amateur",
    unlockType: "LEVEL",
    minXp: LEVEL_MIN_XP.AMATEUR ?? 1500,
    icon: Briefcase,
    shapeKind: "briefcase",
    cssGradient: "from-indigo-500 via-violet-600 to-purple-800",
    canvasColors: ["#6366F1", "#6B21A8"],
    iconColorHex: "#F5F3FF",
  },
  {
    id: "level_professional",
    unlockType: "LEVEL",
    minXp: LEVEL_MIN_XP.PROFESSIONAL ?? 3000,
    icon: Zap,
    shapeKind: "zap",
    cssGradient: "from-violet-600 via-purple-600 to-fuchsia-800",
    canvasColors: ["#7C3AED", "#86198F"],
    iconColorHex: "#FAF5FF",
  },
  {
    id: "level_expert",
    unlockType: "LEVEL",
    minXp: LEVEL_MIN_XP.EXPERT ?? 6000,
    icon: Target,
    shapeKind: "target",
    cssGradient: "from-fuchsia-600 via-pink-600 to-rose-800",
    canvasColors: ["#C026D3", "#9F1239"],
    iconColorHex: "#FDF2F8",
  },
  {
    id: "level_veteran",
    unlockType: "LEVEL",
    minXp: LEVEL_MIN_XP.VETERAN ?? 12000,
    icon: Shield,
    shapeKind: "shield",
    cssGradient: "from-rose-600 via-orange-600 to-amber-800",
    canvasColors: ["#E11D48", "#92400E"],
    iconColorHex: "#FFF7ED",
  },
  {
    id: "level_master",
    unlockType: "LEVEL",
    minXp: LEVEL_MIN_XP.MASTER ?? 25000,
    icon: BookOpen,
    shapeKind: "book",
    cssGradient: "from-amber-500 via-orange-600 to-yellow-800",
    canvasColors: ["#D97706", "#854D0E"],
    iconColorHex: "#FEFCE8",
  },
  {
    id: "level_legend",
    unlockType: "LEVEL",
    minXp: LEVEL_MIN_XP.LEGEND ?? 60000,
    icon: Crown,
    shapeKind: "crown",
    cssGradient: "from-yellow-400 via-amber-500 to-orange-700",
    canvasColors: ["#FACC15", "#B45309"],
    iconColorHex: "#1F1205",
  },
  {
    id: "vip_cosmic",
    unlockType: "PREMIUM",
    minXp: 0,
    icon: Sparkles,
    shapeKind: "sparkles",
    cssGradient: "from-purple-600 via-fuchsia-600 to-amber-500",
    canvasColors: ["#9333EA", "#D97706"],
    iconColorHex: "#FEF9C3",
  },
  {
    id: "founder_crest",
    unlockType: "FOUNDER",
    minXp: 0,
    icon: Award,
    shapeKind: "award",
    cssGradient: "from-amber-400 via-yellow-500 to-indigo-800",
    canvasColors: ["#F59E0B", "#312E81"],
    iconColorHex: "#FFFFFF",
  },
] as const;

export const AVATAR_PRESETS_BY_ID: Record<string, AvatarPresetOption> =
  Object.fromEntries(AVATAR_PRESETS.map((preset) => [preset.id, preset]));

export function resolveAvatarPreset(
  presetId?: string | null,
): AvatarPresetOption | null {
  if (!presetId) return null;
  const clean = presetId.trim().toLowerCase();
  if (!clean || clean === "none") return null;
  return AVATAR_PRESETS_BY_ID[clean] ?? null;
}

export function isAvatarPresetUnlocked(
  preset: AvatarPresetOption,
  ctx: {
    totalXp: number;
    isPremium: boolean;
    isFounder: boolean;
    equippedPresetId?: string | null;
  },
): boolean {
  switch (preset.unlockType) {
    case "LEVEL":
      return ctx.totalXp >= preset.minXp;
    case "PREMIUM":
      return ctx.isPremium;
    case "FOUNDER":
      return ctx.isFounder;
  }
}
