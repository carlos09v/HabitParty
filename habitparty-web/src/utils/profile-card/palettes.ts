import type { ThemePalette } from "./types";

export const DARK_PALETTE: ThemePalette = {
  bgStart: "#0B0816",
  bgEnd: "#1A1236",
  panelBg: "rgba(255, 255, 255, 0.055)",
  panelBorder: "rgba(167, 139, 250, 0.25)",
  textPrimary: "#F8FAFC",
  textSecondary: "#CBD5E1",
  textMuted: "#94A3B8",
  gold: "#EDE539",
  goldSoftBg: "rgba(237, 229, 57, 0.14)",
  goldBorder: "rgba(237, 229, 57, 0.48)",
  accentPurple: "#8B5CF6",
  accentCyan: "#38BDF8",
  barTrack: "rgba(15, 23, 42, 0.75)",
  avatarFallbackBg: "#2E1F5E",
};

export const LIGHT_PALETTE: ThemePalette = {
  bgStart: "#F8F7FC",
  bgEnd: "#EAE5F8",
  panelBg: "rgba(255, 255, 255, 0.88)",
  panelBorder: "rgba(109, 40, 217, 0.18)",
  textPrimary: "#18132B",
  textSecondary: "#332B52",
  // Slate-600 ensures >= 6.8:1 WCAG AAA contrast on light card surfaces
  textMuted: "#475569",
  gold: "#B45309",
  goldSoftBg: "rgba(245, 158, 11, 0.14)",
  goldBorder: "rgba(217, 119, 6, 0.42)",
  accentPurple: "#6D28D9",
  accentCyan: "#0284C7",
  barTrack: "rgba(203, 213, 225, 0.65)",
  avatarFallbackBg: "#DDD6FE",
};

export const FRAME_GRADIENTS: Record<string, [string, string]> = {
  cosmic_gold: ["#FACC15", "#F59E0B"],
  cyber_neon: ["#06B6D4", "#EC4899"],
  fire_phoenix: ["#EF4444", "#F59E0B"],
  emerald_mystic: ["#10B981", "#2DD4BF"],
  amethyst_void: ["#8B5CF6", "#E879F9"],
};
