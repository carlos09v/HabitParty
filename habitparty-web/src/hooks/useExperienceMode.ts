"use client";

import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
} from "react";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/userStore";
import type { ExperienceMode } from "@/types/ui";

const ExperienceModeFallbackContext = createContext<ExperienceMode | undefined>(
  undefined,
);

/**
 * Fornece o modo de experiência resolvido no servidor (SSR) para evitar flash
 * visual ou divergência de hidratação antes de o `StoreInitializer` montar no cliente.
 */
export function ExperienceModeFallbackProvider({
  mode,
  children,
}: {
  mode: ExperienceMode;
  children: ReactNode;
}) {
  return createElement(
    ExperienceModeFallbackContext.Provider,
    { value: mode },
    children,
  );
}

/**
 * Lê e altera o Modo de Experiência ("GAMIFIED" vs "PRODUCTIVITY")
 * sincronizado com o banco de dados via Server Action (PUT /users).
 * O parâmetro `fallbackMode` é usado no SSR antes da hidratação do store.
 */
export function useExperienceMode(fallbackMode?: ExperienceMode) {
  const contextFallbackMode = useContext(ExperienceModeFallbackContext);
  const hydrated = useUIStore((state) => state.hydrated);
  const uiExperienceMode = useUIStore((state) => state.experienceMode);
  const userExperienceMode = useUserStore(
    (state) => state.user?.experienceMode,
  );
  const setExperienceMode = useUIStore((state) => state.setExperienceMode);

  const effectiveMode: ExperienceMode = hydrated
    ? uiExperienceMode
    : (fallbackMode ??
      contextFallbackMode ??
      userExperienceMode ??
      uiExperienceMode);
  const isGamified = effectiveMode === "GAMIFIED";
  const isProductivity = effectiveMode === "PRODUCTIVITY";

  return {
    experienceMode: effectiveMode,
    isGamified,
    isProductivity,
    setExperienceMode,
  };
}
