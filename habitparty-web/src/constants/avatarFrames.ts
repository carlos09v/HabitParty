import type { AchievementItemResponseDTO } from "@/types/showcase";
import { USER_LEVELS } from "@/utils/levels";

const LEVEL_MIN_XP: Record<string, number> = Object.fromEntries(
  USER_LEVELS.map((l) => [l.tier, l.minXpRequired]),
);

export type MasteryFrameId =
  | "forged_silver"
  | "obsidian_crest"
  | "chronos_bronze"
  | "legend_laurel";

export type AvatarFrameId =
  | "none"
  | "cosmic_gold"
  | "cyber_neon"
  | "fire_phoenix"
  | "emerald_mystic"
  | "amethyst_void"
  | MasteryFrameId;

export function isMasteryFrameId(id: AvatarFrameId): id is MasteryFrameId {
  return (
    id === "forged_silver" ||
    id === "obsidian_crest" ||
    id === "chronos_bronze" ||
    id === "legend_laurel"
  );
}

export type AvatarFrameCategory = "FREE" | "VIP" | "MASTERY";

export interface AvatarFrameOption {
  id: AvatarFrameId;
  category: AvatarFrameCategory;
  isPremium: boolean;
  ringClass: string;
  glowClass: string;
  previewGradient: string;
}

export const AVATAR_FRAMES: readonly AvatarFrameOption[] = [
  {
    id: "none",
    category: "FREE",
    isPremium: false,
    ringClass: "",
    glowClass: "",
    previewGradient: "from-neutral-700 to-neutral-800",
  },
  {
    id: "forged_silver",
    category: "MASTERY",
    isPremium: false,
    ringClass: "frame-forged-silver",
    glowClass: "shadow-[0_0_14px_rgba(203,213,225,0.45)]",
    previewGradient: "from-slate-300 via-slate-100 to-slate-500",
  },
  {
    id: "obsidian_crest",
    category: "MASTERY",
    isPremium: false,
    ringClass: "frame-obsidian-crest",
    glowClass: "shadow-[0_0_15px_rgba(99,102,241,0.42)]",
    previewGradient: "from-slate-800 via-indigo-900 to-slate-500",
  },
  {
    id: "chronos_bronze",
    category: "MASTERY",
    isPremium: false,
    ringClass: "frame-chronos-bronze",
    glowClass: "shadow-[0_0_14px_rgba(217,119,6,0.46)]",
    previewGradient: "from-amber-700 via-amber-400 to-yellow-700",
  },
  {
    id: "legend_laurel",
    category: "MASTERY",
    isPremium: false,
    ringClass: "frame-legend-laurel",
    glowClass: "shadow-[0_0_16px_rgba(234,179,8,0.52)]",
    previewGradient: "from-amber-300 via-emerald-400 to-yellow-500",
  },
  {
    id: "cosmic_gold",
    category: "VIP",
    isPremium: true,
    ringClass: "frame-cosmic-gold",
    glowClass: "shadow-[0_0_15px_rgba(237,229,57,0.55)]",
    previewGradient: "from-yellow-400 via-amber-300 to-yellow-500",
  },
  {
    id: "cyber_neon",
    category: "VIP",
    isPremium: true,
    ringClass: "frame-cyber-neon",
    glowClass:
      "shadow-[0_0_15px_rgba(0,194,255,0.55),0_0_8px_rgba(237,43,229,0.45)]",
    previewGradient: "from-cyan-400 via-purple-500 to-fuchsia-500",
  },
  {
    id: "fire_phoenix",
    category: "VIP",
    isPremium: true,
    ringClass: "frame-fire-phoenix",
    glowClass: "shadow-[0_0_15px_rgba(254,154,0,0.6)]",
    previewGradient: "from-red-500 via-orange-400 to-amber-300",
  },
  {
    id: "emerald_mystic",
    category: "VIP",
    isPremium: true,
    ringClass: "frame-emerald-mystic",
    glowClass: "shadow-[0_0_15px_rgba(34,226,110,0.55)]",
    previewGradient: "from-emerald-400 via-teal-300 to-green-500",
  },
  {
    id: "amethyst_void",
    category: "VIP",
    isPremium: true,
    ringClass: "frame-amethyst-void",
    glowClass: "shadow-[0_0_16px_rgba(168,99,255,0.6)]",
    previewGradient: "from-purple-500 via-fuchsia-400 to-violet-600",
  },
] as const;

export function getAvatarFrame(id?: string): AvatarFrameOption {
  if (!id) return AVATAR_FRAMES[0];
  const found = AVATAR_FRAMES.find((f) => f.id === id);
  return found || AVATAR_FRAMES[0];
}

/**
 * Normaliza uma string opcional de moldura para um `AvatarFrameId` válido.
 */
export function resolveAvatarFrameId(frame?: string | null): AvatarFrameId {
  return getAvatarFrame(frame ?? undefined).id;
}

export interface AvatarFrameUnlockContext {
  isPremium: boolean;
  totalXp: number;
  achievements?: AchievementItemResponseDTO[];
}

/**
 * Avalia se uma moldura está desbloqueada para o usuário, alinhado com CosmeticCatalog.java.
 */
export function isAvatarFrameUnlocked(
  frame: AvatarFrameOption,
  ctx: AvatarFrameUnlockContext,
): boolean {
  if (frame.category === "FREE") return true;
  if (frame.isPremium) return ctx.isPremium;

  const achievements = ctx.achievements ?? [];
  switch (frame.id) {
    case "forged_silver":
      return ctx.totalXp >= (LEVEL_MIN_XP.EXPERT ?? 6000);
    case "obsidian_crest":
      return achievements.some(
        (a) => a.code === "TROPHY_HUNTER_1000" && a.unlocked,
      );
    case "chronos_bronze": {
      const focusAchs = achievements.filter((a) => a.category === "FOCUS");
      return focusAchs.length > 0 && focusAchs.every((a) => a.unlocked);
    }
    case "legend_laurel":
      return ctx.totalXp >= (LEVEL_MIN_XP.LEGEND ?? 60000);
    default:
      return false;
  }
}
