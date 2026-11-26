import {
  Award,
  BookOpen,
  Compass,
  Crown,
  Flame,
  Gem,
  type LucideIcon,
  Medal,
  MoonStar,
  Shield,
  ShieldAlert,
  Sparkles,
  Sunrise,
  Swords,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import type { AchievementItemResponseDTO } from "@/types/showcase";
import type { UserRetrospectiveData } from "@/types/social";
import type { UserResponseDTO } from "@/types/user";
import { parseServerDate } from "@/utils/date";

export {
  AVATAR_PRESETS,
  AVATAR_PRESETS_BY_ID,
  type AvatarPresetId,
  type AvatarPresetOption,
  isAvatarPresetUnlocked,
  resolveAvatarPreset,
} from "./avatarPresets";

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
  eligibleRetroArchetypes?: readonly string[] | null;
  nowMs?: number;
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
      const referenceNow = ctx.nowMs ?? Date.now();
      return referenceNow - created.getTime() >= VETERAN_MIN_MS;
    }
    default: {
      if (code.startsWith("RETRO_")) {
        const expectedArchetype = code.slice("RETRO_".length);
        if (ctx.eligibleRetroArchetypes?.includes(expectedArchetype)) {
          return true;
        }
        if (ctx.retrospective?.eligible) {
          return ctx.retrospective.archetype === expectedArchetype;
        }
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
