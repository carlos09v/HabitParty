"use client";

import { useUIStore } from "@/store/uiStore";

/**
 * Lê e altera o estado de Modo Compacto sincronizado desde o SSR via StoreInitializer.
 * Aceita `propIsCompact` opcional para priorizar valores repassados por Server Components
 * sem provocar segundo ciclo de renderização (`useEffect`) após a hidratação.
 */
export function useCompactMode(propIsCompact?: boolean) {
  const compactMode = useUIStore((state) => state.compactMode);
  const toggleCompactMode = useUIStore((state) => state.toggleCompactMode);
  const setCompactMode = useUIStore((state) => state.setCompactMode);

  const isCompact = propIsCompact ?? compactMode;

  return {
    isCompact,
    compactMode,
    toggleCompactMode,
    setCompactMode,
    mounted: true,
  };
}
