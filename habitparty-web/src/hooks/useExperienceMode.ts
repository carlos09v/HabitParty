"use client";

import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import type { ExperienceMode } from "@/types/ui";

/**
 * Lê e altera o Modo de Experiência ("GAMIFIED" vs "PRODUCTIVITY")
 * sincronizado com o banco de dados via Server Action (PUT /users).
 */
export function useExperienceMode(propMode?: ExperienceMode) {
  const hydrated = useUIStore((state) => state.hydrated);
  const uiExperienceMode = useUIStore((state) => state.experienceMode);
  const userExperienceMode = useUserStore(
    (state) => state.user?.experienceMode,
  );
  const setExperienceMode = useUIStore((state) => state.setExperienceMode);

  const effectiveMode: ExperienceMode =
    propMode ??
    (hydrated ? uiExperienceMode : (userExperienceMode ?? uiExperienceMode));
  const isGamified = effectiveMode === "GAMIFIED";
  const isProductivity = effectiveMode === "PRODUCTIVITY";

  return {
    experienceMode: effectiveMode,
    isGamified,
    isProductivity,
    setExperienceMode,
  };
}
