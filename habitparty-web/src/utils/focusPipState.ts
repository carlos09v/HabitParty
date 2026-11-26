"use client";

import { useSyncExternalStore } from "react";

export type FocusPipMode = "document" | "video" | null;

export interface FocusPipSnapshot {
  isOpen: boolean;
  isSupported: boolean;
  mode: FocusPipMode;
  container: HTMLElement | null;
  pipWindow: Window | null;
}

const SERVER_SNAPSHOT: FocusPipSnapshot = {
  isOpen: false,
  isSupported: false,
  mode: null,
  container: null,
  pipWindow: null,
};

const listeners = new Set<() => void>();
let clientSupportDetected: boolean | null = null;
let currentSnapshot: FocusPipSnapshot = SERVER_SNAPSHOT;

function detectFocusPipSupport(): boolean {
  if (typeof window === "undefined") return false;
  if ("documentPictureInPicture" in window) return true;
  if (typeof document !== "undefined") {
    return Boolean(
      document.pictureInPictureEnabled &&
        typeof HTMLVideoElement !== "undefined" &&
        "requestPictureInPicture" in HTMLVideoElement.prototype,
    );
  }
  return false;
}

export function getFocusPipSnapshot(): FocusPipSnapshot {
  if (typeof window === "undefined") {
    return SERVER_SNAPSHOT;
  }
  if (clientSupportDetected === null) {
    clientSupportDetected = detectFocusPipSupport();
    currentSnapshot =
      clientSupportDetected === SERVER_SNAPSHOT.isSupported
        ? SERVER_SNAPSHOT
        : {
            isOpen: false,
            isSupported: clientSupportDetected,
            mode: null,
            container: null,
            pipWindow: null,
          };
  }
  return currentSnapshot;
}

export function getFocusPipServerSnapshot(): FocusPipSnapshot {
  return SERVER_SNAPSHOT;
}

export function updateFocusPipSnapshot(next: {
  mode: FocusPipMode;
  container: HTMLElement | null;
  pipWindow: Window | null;
}): void {
  if (clientSupportDetected === null && typeof window !== "undefined") {
    clientSupportDetected = detectFocusPipSupport();
  }
  const isSupported = clientSupportDetected ?? false;
  const computed: FocusPipSnapshot =
    next.mode === null && isSupported === SERVER_SNAPSHOT.isSupported
      ? SERVER_SNAPSHOT
      : {
          isOpen: next.mode !== null,
          isSupported,
          mode: next.mode,
          container: next.container,
          pipWindow: next.pipWindow,
        };

  if (
    currentSnapshot.isOpen === computed.isOpen &&
    currentSnapshot.isSupported === computed.isSupported &&
    currentSnapshot.mode === computed.mode &&
    currentSnapshot.container === computed.container &&
    currentSnapshot.pipWindow === computed.pipWindow
  ) {
    return;
  }

  currentSnapshot = computed;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeFocusPip(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Assinatura leve do estado PiP (sem carregar o motor de Canvas/Video PiP no bundle inicial).
 */
export function useFocusPipState(): FocusPipSnapshot {
  return useSyncExternalStore(
    subscribeFocusPip,
    getFocusPipSnapshot,
    getFocusPipServerSnapshot,
  );
}
