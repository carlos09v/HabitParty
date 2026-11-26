import {
  Award,
  BookOpen,
  Briefcase,
  Compass,
  Crosshair,
  Crown,
  Footprints,
  type LucideIcon,
  Shield,
  Sparkles,
  Sprout,
  Target,
  Zap,
} from "lucide-react";

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

/**
 * Limiares de XP espelhando `USER_LEVELS` sem importar `levels.ts`/`utilityTranslator.ts`,
 * evitando puxar os dois dicionários de utilidades no bundle global de `UserAvatar`.
 */
export const AVATAR_PRESETS: readonly AvatarPresetOption[] = [
  {
    id: "level_novice",
    unlockType: "LEVEL",
    minXp: 0,
    icon: Sprout,
    shapeKind: "sprout",
    cssGradient: "from-emerald-600 via-teal-600 to-emerald-800",
    canvasColors: ["#059669", "#065F46"],
    iconColorHex: "#ECFDF5",
  },
  {
    id: "level_apprentice",
    unlockType: "LEVEL",
    minXp: 100,
    icon: Footprints,
    shapeKind: "footprints",
    cssGradient: "from-teal-500 via-cyan-600 to-sky-800",
    canvasColors: ["#0D9488", "#075985"],
    iconColorHex: "#ECFEFF",
  },
  {
    id: "level_adventurer",
    unlockType: "LEVEL",
    minXp: 300,
    icon: Compass,
    shapeKind: "compass",
    cssGradient: "from-sky-500 via-blue-600 to-indigo-800",
    canvasColors: ["#0284C7", "#3730A3"],
    iconColorHex: "#F0F9FF",
  },
  {
    id: "level_challenger",
    unlockType: "LEVEL",
    minXp: 750,
    icon: Crosshair,
    shapeKind: "target",
    cssGradient: "from-blue-600 via-indigo-600 to-violet-800",
    canvasColors: ["#2563EB", "#5B21B6"],
    iconColorHex: "#EEF2FF",
  },
  {
    id: "level_amateur",
    unlockType: "LEVEL",
    minXp: 1500,
    icon: Briefcase,
    shapeKind: "briefcase",
    cssGradient: "from-indigo-500 via-violet-600 to-purple-800",
    canvasColors: ["#6366F1", "#6B21A8"],
    iconColorHex: "#F5F3FF",
  },
  {
    id: "level_professional",
    unlockType: "LEVEL",
    minXp: 3000,
    icon: Zap,
    shapeKind: "zap",
    cssGradient: "from-violet-600 via-purple-600 to-fuchsia-800",
    canvasColors: ["#7C3AED", "#86198F"],
    iconColorHex: "#FAF5FF",
  },
  {
    id: "level_expert",
    unlockType: "LEVEL",
    minXp: 6000,
    icon: Target,
    shapeKind: "target",
    cssGradient: "from-fuchsia-600 via-pink-600 to-rose-800",
    canvasColors: ["#C026D3", "#9F1239"],
    iconColorHex: "#FDF2F8",
  },
  {
    id: "level_veteran",
    unlockType: "LEVEL",
    minXp: 12000,
    icon: Shield,
    shapeKind: "shield",
    cssGradient: "from-rose-600 via-orange-600 to-amber-800",
    canvasColors: ["#E11D48", "#92400E"],
    iconColorHex: "#FFF7ED",
  },
  {
    id: "level_master",
    unlockType: "LEVEL",
    minXp: 25000,
    icon: BookOpen,
    shapeKind: "book",
    cssGradient: "from-amber-500 via-orange-600 to-yellow-800",
    canvasColors: ["#D97706", "#854D0E"],
    iconColorHex: "#FEFCE8",
  },
  {
    id: "level_legend",
    unlockType: "LEVEL",
    minXp: 60000,
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
