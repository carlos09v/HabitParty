"use client";

import { useLocaleSwitchWatcher } from "@/hooks/useLocaleSwitcher";

/**
 * Componente sem UI que encerra a troca de idioma quando a nova árvore
 * (no idioma de destino) é aplicada. Montado uma única vez no root layout.
 */
export function LocaleSwitchWatcher() {
  useLocaleSwitchWatcher();
  return null;
}
