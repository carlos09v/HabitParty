"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * `useLayoutEffect` no cliente e `useEffect` no SSR, evitando warnings do React
 * durante a renderização no servidor.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
