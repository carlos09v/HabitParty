"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Gerencia um conjunto de IDs em processamento assíncrono com leitura síncrona (Ref)
 * para bloquear cliques repetidos imediatos e estado reativo (Set) para feedback na UI.
 */
export function useInFlightSet() {
  const [activeIds, setActiveIds] = useState<Set<string>>(() => new Set());
  const activeIdsRef = useRef<Set<string>>(new Set());

  const has = useCallback((id: string) => activeIdsRef.current.has(id), []);

  const setPending = useCallback((id: string, active: boolean) => {
    if (active) {
      activeIdsRef.current.add(id);
    } else {
      activeIdsRef.current.delete(id);
    }
    setActiveIds((prev) => {
      if (prev.has(id) === active) return prev;
      const next = new Set(prev);
      if (active) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  return { activeIds, has, setPending };
}
