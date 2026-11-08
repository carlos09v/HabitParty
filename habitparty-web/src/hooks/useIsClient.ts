"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Retorna `false` durante SSR/hidratação inicial e `true` sincronamente
 * no 1º render de qualquer montagem no cliente, evitando double-mount em Portals.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
}
