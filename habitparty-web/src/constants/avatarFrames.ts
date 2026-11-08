export type AvatarFrameId =
  | "none"
  | "cosmic_gold"
  | "cyber_neon"
  | "fire_phoenix"
  | "emerald_mystic"
  | "amethyst_void";

export interface AvatarFrameOption {
  id: AvatarFrameId;
  isPremium: boolean;
  ringClass: string;
  glowClass: string;
  previewGradient: string;
}

export const AVATAR_FRAMES: readonly AvatarFrameOption[] = [
  {
    id: "none",
    isPremium: false,
    ringClass: "",
    glowClass: "",
    previewGradient: "from-neutral-700 to-neutral-800",
  },
  {
    id: "cosmic_gold",
    isPremium: true,
    ringClass: "frame-cosmic-gold",
    glowClass: "shadow-[0_0_15px_rgba(237,229,57,0.55)]",
    previewGradient: "from-yellow-400 via-amber-300 to-yellow-500",
  },
  {
    id: "cyber_neon",
    isPremium: true,
    ringClass: "frame-cyber-neon",
    glowClass:
      "shadow-[0_0_15px_rgba(0,194,255,0.55),0_0_8px_rgba(237,43,229,0.45)]",
    previewGradient: "from-cyan-400 via-purple-500 to-fuchsia-500",
  },
  {
    id: "fire_phoenix",
    isPremium: true,
    ringClass: "frame-fire-phoenix",
    glowClass: "shadow-[0_0_15px_rgba(254,154,0,0.6)]",
    previewGradient: "from-red-500 via-orange-400 to-amber-300",
  },
  {
    id: "emerald_mystic",
    isPremium: true,
    ringClass: "frame-emerald-mystic",
    glowClass: "shadow-[0_0_15px_rgba(34,226,110,0.55)]",
    previewGradient: "from-emerald-400 via-teal-300 to-green-500",
  },
  {
    id: "amethyst_void",
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
