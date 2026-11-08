"use client";

import { useEffect } from "react";

/**
 * Pré-carrega chunks `dynamic()` no período ocioso do navegador após a página estabilizar,
 * eliminando o atraso de rede/parse na 1ª abertura sem competir com a hidratação inicial.
 */
export function useIdlePreload(preload: () => void, delayFallbackMs = 1200) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(
        () => {
          preload();
        },
        { timeout: 2500 },
      );
      return () => window.cancelIdleCallback(idleId);
    }

    const timerId = globalThis.setTimeout(preload, delayFallbackMs);
    return () => globalThis.clearTimeout(timerId);
  }, [preload, delayFallbackMs]);
}
