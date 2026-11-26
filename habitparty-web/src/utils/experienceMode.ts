import type { ExperienceMode } from "@/types/ui";

export const DEFAULT_EXPERIENCE_MODE: ExperienceMode = "PRODUCTIVITY";

/**
 * Resolve o modo de experiência de forma consistente entre Layout, Páginas SSR e Client Components.
 */
export function resolveExperienceMode(
  mode?: ExperienceMode | string | null,
): ExperienceMode {
  return mode === "GAMIFIED" ? "GAMIFIED" : DEFAULT_EXPERIENCE_MODE;
}
