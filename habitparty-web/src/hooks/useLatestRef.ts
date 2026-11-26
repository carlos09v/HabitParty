"use client";

import { type RefObject, useRef } from "react";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";

/**
 * Mantém uma `ref` sincronizada com o valor mais recente sem mutar `ref.current`
 * durante a fase de render (compatível com React Compiler / React 19).
 */
export function useLatestRef<T>(value: T): RefObject<T> {
  const ref = useRef<T>(value);
  useIsomorphicLayoutEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}
