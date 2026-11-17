"use client";

import { useSyncExternalStore } from "react";
import type { FocusActiveTarget } from "@/types/focus";
import {
  formatFocusDisplayTime,
  getFocusProgressPercent,
  getFocusTimerDerivedState,
} from "@/utils/focusFormatters";

interface DocumentPictureInPictureOptions {
  width?: number;
  height?: number;
  disallowReturnToOpener?: boolean;
}

interface DocumentPictureInPictureApi {
  window: Window | null;
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
}

export type FocusPipMode = "document" | "video" | null;

export interface FocusPipSnapshot {
  isOpen: boolean;
  isSupported: boolean;
  mode: FocusPipMode;
  container: HTMLElement | null;
  pipWindow: Window | null;
}

export interface VideoPipFrameData {
  timeText: string;
  targetName: string;
  phaseLabel: string;
  taskName?: string;
  capLabel?: string;
  footerFallbackText?: string;
  progressPercent: number;
  isRunning: boolean;
  isBreak: boolean;
  isOvertime: boolean;
}

export interface FocusPipOpenOptions {
  windowTitle?: string;
  initialVideoFrame?: VideoPipFrameData;
  isInitiallyRunning?: boolean;
  onUnsupported?: () => void;
}

interface VideoPipPalette {
  isLight: boolean;
  bgColor: string;
  surfaceColor: string;
  textPrimary: string;
  textMuted: string;
  goldInk: string;
  successColor: string;
  infoColor: string;
}

const VIDEO_PIP_LOGICAL_WIDTH = 480;
const VIDEO_PIP_LOGICAL_HEIGHT = 260;

const SERVER_SNAPSHOT: FocusPipSnapshot = {
  isOpen: false,
  isSupported: true,
  mode: null,
  container: null,
  pipWindow: null,
};

const listeners = new Set<() => void>();

let activePipWindow: Window | null = null;
let activeContainer: HTMLElement | null = null;
let activeVideoEl: HTMLVideoElement | null = null;
let activeCanvasEl: HTMLCanvasElement | null = null;
let activeCanvasCtx: CanvasRenderingContext2D | null = null;
let activeStream: MediaStream | null = null;
let activeVideoTrack: MediaStreamTrack | null = null;
let cachedVideoPipPalette: VideoPipPalette | null = null;
let programmaticVideoSyncUntil = 0;
let clientSupportDetected: boolean | null = null;
let openGeneration = 0;
let pendingOpenPromise: Promise<boolean> | null = null;

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

function getDocumentPipApi(): DocumentPictureInPictureApi | null {
  if (typeof window === "undefined") return null;
  return (
    (
      window as unknown as {
        documentPictureInPicture?: DocumentPictureInPictureApi;
      }
    ).documentPictureInPicture ?? null
  );
}

function rebuildSnapshot() {
  if (clientSupportDetected === null && typeof window !== "undefined") {
    clientSupportDetected = detectFocusPipSupport();
  }
  const isSupported = clientSupportDetected ?? false;
  const mode: FocusPipMode = activePipWindow
    ? "document"
    : activeVideoEl
      ? "video"
      : null;

  const next: FocusPipSnapshot =
    mode === null && isSupported === SERVER_SNAPSHOT.isSupported
      ? SERVER_SNAPSHOT
      : {
          isOpen: mode !== null,
          isSupported,
          mode,
          container: activeContainer,
          pipWindow: activePipWindow,
        };

  if (
    currentSnapshot.isOpen === next.isOpen &&
    currentSnapshot.isSupported === next.isSupported &&
    currentSnapshot.mode === next.mode &&
    currentSnapshot.container === next.container &&
    currentSnapshot.pipWindow === next.pipWindow
  ) {
    return;
  }

  currentSnapshot = next;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function ensureInitialSnapshot(): FocusPipSnapshot {
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

function getSnapshot(): FocusPipSnapshot {
  return ensureInitialSnapshot();
}

function getServerSnapshot(): FocusPipSnapshot {
  return SERVER_SNAPSHOT;
}

export function syncDocumentPipTheme(
  pipWindow: Window | null = activePipWindow,
) {
  if (!pipWindow || pipWindow.closed || typeof document === "undefined") return;
  const srcRoot = document.documentElement;
  const dstRoot = pipWindow.document.documentElement;

  dstRoot.className = srcRoot.className;
  dstRoot.lang = srcRoot.lang || "pt-BR";
  dstRoot.style.cssText = srcRoot.style.cssText;
  dstRoot.style.colorScheme = srcRoot.classList.contains("light")
    ? "light"
    : "dark";

  const themeAttr = srcRoot.getAttribute("data-theme");
  if (themeAttr) {
    dstRoot.setAttribute("data-theme", themeAttr);
  } else {
    dstRoot.removeAttribute("data-theme");
  }
}

async function copyStylesToPipWindow(pipWindow: Window): Promise<void> {
  const dstDoc = pipWindow.document;

  if (typeof document !== "undefined" && document.baseURI) {
    const baseEl = dstDoc.createElement("base");
    baseEl.href = document.baseURI;
    dstDoc.head.appendChild(baseEl);
  }

  const colorSchemeMeta = dstDoc.createElement("meta");
  colorSchemeMeta.name = "color-scheme";
  colorSchemeMeta.content = "light dark";
  dstDoc.head.appendChild(colorSchemeMeta);

  const palette = getVideoPipPalette();
  const criticalStyle = dstDoc.createElement("style");
  criticalStyle.textContent = `html,body{background-color:${palette.bgColor};color:${palette.textPrimary};margin:0;padding:0;}`;
  dstDoc.head.appendChild(criticalStyle);

  const linkPromises: Promise<void>[] = [];

  for (const sheet of Array.from(document.styleSheets)) {
    if (sheet.disabled) continue;
    const mediaText = sheet.media?.mediaText;
    if (mediaText === "print") continue;

    if (sheet.href) {
      const link = dstDoc.createElement("link");
      link.rel = "stylesheet";
      link.href = sheet.href;
      if (mediaText && mediaText !== "all") {
        link.media = mediaText;
      }
      if (
        sheet.ownerNode instanceof HTMLLinkElement &&
        sheet.ownerNode.crossOrigin
      ) {
        link.crossOrigin = sheet.ownerNode.crossOrigin;
      }
      const loadPromise = new Promise<void>((resolve) => {
        const done = () => resolve();
        link.addEventListener("load", done, { once: true });
        link.addEventListener("error", done, { once: true });
      });
      dstDoc.head.appendChild(link);
      if (!link.sheet) {
        linkPromises.push(loadPromise);
      }
      continue;
    }

    try {
      const ownerCss =
        sheet.ownerNode instanceof HTMLStyleElement
          ? sheet.ownerNode.textContent
          : null;
      const cssText =
        ownerCss && ownerCss.length > 0
          ? ownerCss
          : Array.from(sheet.cssRules)
              .map((rule) => rule.cssText)
              .join("\n");
      if (!cssText) continue;

      const style = dstDoc.createElement("style");
      if (mediaText && mediaText !== "all") {
        style.media = mediaText;
      }
      style.textContent = cssText;
      dstDoc.head.appendChild(style);
    } catch {
      // Ignore cross-origin or inaccessible inline stylesheet rules
    }
  }

  if (typeof document !== "undefined" && "adoptedStyleSheets" in document) {
    for (const sheet of document.adoptedStyleSheets) {
      if (sheet.disabled) continue;
      try {
        const rules = Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
        if (!rules) continue;
        const style = dstDoc.createElement("style");
        style.textContent = rules;
        dstDoc.head.appendChild(style);
      } catch {
        // Ignore inaccessible adopted stylesheets
      }
    }
  }

  if (linkPromises.length > 0) {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      await Promise.race([
        Promise.all(linkPromises),
        new Promise<void>((resolve) => {
          timeoutId = setTimeout(resolve, 150);
        }),
      ]);
    } finally {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    }
  }

  criticalStyle.remove();
}

function teardownDocumentPip() {
  if (activePipWindow && !activePipWindow.closed) {
    try {
      activePipWindow.close();
    } catch {
      // Ignore close errors
    }
  }
  activePipWindow = null;
  activeContainer = null;
}

function cleanupVideoResources(
  video: HTMLVideoElement | null,
  stream: MediaStream | null,
) {
  if (
    typeof document !== "undefined" &&
    video &&
    document.pictureInPictureElement === video
  ) {
    void document.exitPictureInPicture().catch(() => {});
  }
  if (stream) {
    for (const track of stream.getTracks()) {
      track.stop();
    }
  }
  if (video) {
    video.srcObject = null;
    video.remove();
  }
}

function teardownVideoPip() {
  cleanupVideoResources(activeVideoEl, activeStream);
  activeVideoTrack = null;
  activeStream = null;
  activeVideoEl = null;
  activeCanvasEl = null;
  activeCanvasCtx = null;
  invalidateVideoPipThemeCache();
}

export function getActiveVideoPipElement(): HTMLVideoElement | null {
  return activeVideoEl;
}

export function isProgrammaticVideoPipSync(): boolean {
  return Date.now() < programmaticVideoSyncUntil;
}

export function syncVideoPipPlayback(isRunning: boolean): void {
  const video = activeVideoEl;
  if (!video) return;
  programmaticVideoSyncUntil = Date.now() + 250;
  if (isRunning) {
    if (video.paused) {
      void video.play().catch(() => {});
    }
  } else if (!video.paused) {
    video.pause();
  }
}

export function closeFocusPip() {
  openGeneration += 1;
  pendingOpenPromise = null;
  teardownDocumentPip();
  teardownVideoPip();
  rebuildSnapshot();
}

export function buildVideoPipFrameData(
  timerState: {
    isActive: boolean;
    isPaused: boolean;
    mode: "POMO" | "STOPWATCH";
    phase?: "WORK" | "SHORT_BREAK" | "LONG_BREAK";
    secondsRemaining: number;
    elapsedSeconds: number;
    totalDurationSeconds?: number;
    completedCycles?: number;
    target?: FocusActiveTarget | null;
  },
  labels: {
    windowTitle: string;
    noTarget: string;
    phaseFocus: string;
    phasePaused: string;
    phaseOvertime: string;
    phaseBreak: string;
    sessionCapBadge: string;
  },
  isGamified: boolean,
): VideoPipFrameData {
  const { isRunning, isBreak, isOvertime, isSessionRewardCapped } =
    getFocusTimerDerivedState(timerState);
  const displayTime = formatFocusDisplayTime(timerState);
  const progressPercent = getFocusProgressPercent(timerState);
  const phaseLabel = isBreak
    ? labels.phaseBreak
    : isOvertime
      ? labels.phaseOvertime
      : isRunning
        ? labels.phaseFocus
        : labels.phasePaused;

  return {
    timeText: displayTime,
    targetName: timerState.target?.name || labels.noTarget,
    phaseLabel,
    taskName:
      timerState.target?.taskName ||
      (timerState.target?.type === "task" ? timerState.target.name : undefined),
    capLabel:
      isGamified && isSessionRewardCapped ? labels.sessionCapBadge : undefined,
    footerFallbackText: isRunning
      ? labels.windowTitle
      : `${labels.phasePaused} • HabitParty`,
    progressPercent,
    isRunning,
    isBreak,
    isOvertime,
  };
}

export function invalidateVideoPipThemeCache(): void {
  cachedVideoPipPalette = null;
}

function getVideoPipPalette(): VideoPipPalette {
  if (cachedVideoPipPalette) {
    return cachedVideoPipPalette;
  }

  const isLight =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("light");

  const styles =
    typeof window !== "undefined" && typeof document !== "undefined"
      ? getComputedStyle(document.documentElement)
      : null;

  const readToken = (token: string, fallback: string) => {
    const val = styles?.getPropertyValue(token).trim();
    return val || fallback;
  };

  cachedVideoPipPalette = {
    isLight,
    bgColor: readToken("--color-background", isLight ? "#f5f5f8" : "#210459"),
    surfaceColor: readToken("--color-surface", isLight ? "#ececf2" : "#331866"),
    textPrimary: readToken(
      "--color-neutral-50",
      isLight ? "#1e1e2a" : "#f9f8fc",
    ),
    textMuted: readToken(
      "--color-neutral-300",
      isLight ? "#4e4e63" : "#d4cfdf",
    ),
    goldInk: readToken("--color-gold-ink", isLight ? "#9e4807" : "#ede539"),
    successColor: readToken(
      "--color-success-300",
      isLight ? "#147a38" : "#6ee7b7",
    ),
    infoColor: readToken("--color-info", isLight ? "#0369a1" : "#00c2ff"),
  };

  return cachedVideoPipPalette;
}

function fitCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  let end = text.length;
  while (
    end > 1 &&
    ctx.measureText(`${text.slice(0, end)}…`).width > maxWidth
  ) {
    end -= 1;
  }
  return `${text.slice(0, end).trimEnd()}…`;
}

export function renderVideoPipFrame(frame: VideoPipFrameData) {
  const canvas = activeCanvasEl;
  if (!canvas) return;
  const ctx = activeCanvasCtx ?? canvas.getContext("2d", { alpha: false });
  if (!ctx) return;
  activeCanvasCtx = ctx;

  const w = VIDEO_PIP_LOGICAL_WIDTH;
  const h = VIDEO_PIP_LOGICAL_HEIGHT;
  const scale = canvas.width / w;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  const palette = getVideoPipPalette();

  ctx.fillStyle = palette.bgColor;
  ctx.fillRect(0, 0, w, h);

  const barAccent = frame.isBreak
    ? palette.isLight
      ? palette.successColor
      : "#10b981"
    : frame.isOvertime
      ? palette.isLight
        ? palette.infoColor
        : "#06b6d4"
      : palette.isLight
        ? palette.goldInk
        : "#ede539";

  const phaseTextColor = frame.isBreak
    ? palette.successColor
    : frame.isOvertime
      ? palette.infoColor
      : frame.isRunning
        ? palette.goldInk
        : palette.textMuted;

  // Top progress bar (track + fill)
  ctx.fillStyle = palette.surfaceColor;
  ctx.fillRect(0, 0, w, 6);
  const clampedProgress = Math.min(100, Math.max(0, frame.progressPercent));
  const fillWidth = Math.round((w * clampedProgress) / 100);
  if (fillWidth > 0) {
    ctx.fillStyle = barAccent;
    ctx.fillRect(0, 0, fillWidth, 6);
  }

  // Target name
  ctx.fillStyle = palette.textPrimary;
  ctx.font = "700 22px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(fitCanvasText(ctx, frame.targetName, w - 48), w / 2, 52);

  // Phase badge
  ctx.fillStyle = phaseTextColor;
  ctx.font = "700 15px system-ui, -apple-system, sans-serif";
  ctx.fillText(frame.phaseLabel, w / 2, 80);

  // Main Timer
  ctx.fillStyle = palette.textPrimary;
  ctx.font =
    frame.timeText.length > 6
      ? "800 54px ui-monospace, SFMono-Regular, monospace"
      : "800 68px ui-monospace, SFMono-Regular, monospace";
  ctx.fillText(frame.timeText, w / 2, 160, w - 40);

  // Linked task, 1h30 cap, or localized fallback footer
  const footerText =
    frame.capLabel ||
    (frame.taskName ? `✓ ${frame.taskName}` : "") ||
    frame.footerFallbackText ||
    (frame.isRunning ? "HabitParty • Focus" : "Paused • HabitParty");
  if (frame.capLabel || frame.taskName) {
    ctx.fillStyle = palette.isLight ? palette.goldInk : "#fbbf24";
    ctx.font = "600 15px system-ui, -apple-system, sans-serif";
    ctx.fillText(fitCanvasText(ctx, footerText, w - 48), w / 2, 208);
  } else {
    ctx.fillStyle = palette.textMuted;
    ctx.font = "600 14px system-ui, -apple-system, sans-serif";
    ctx.fillText(fitCanvasText(ctx, footerText, w - 48), w / 2, 208);
  }

  const track = activeVideoTrack as
    | (MediaStreamTrack & { requestFrame?: () => void })
    | null;
  track?.requestFrame?.();
}

async function executeOpenFocusPip(
  myGeneration: number,
  options?: FocusPipOpenOptions,
): Promise<boolean> {
  if (myGeneration !== openGeneration) return false;

  const docPip = getDocumentPipApi();
  if (docPip) {
    if (activePipWindow && !activePipWindow.closed) {
      activePipWindow.focus();
      return true;
    }

    teardownVideoPip();
    let pipWin: Window | null = null;
    try {
      pipWin = await docPip.requestWindow({
        width: 340,
        height: 225,
      });

      if (myGeneration !== openGeneration || pipWin.closed) {
        if (!pipWin.closed) {
          pipWin.close();
        }
        return false;
      }

      pipWin.document.title = options?.windowTitle || "HabitParty Focus";
      syncDocumentPipTheme(pipWin);
      await copyStylesToPipWindow(pipWin);

      if (myGeneration !== openGeneration || pipWin.closed) {
        if (!pipWin.closed) {
          pipWin.close();
        }
        return false;
      }

      const fontVarClasses =
        typeof document !== "undefined"
          ? document.body.className
              .split(/\s+/)
              .filter(
                (cls) =>
                  cls.includes("variable") ||
                  cls.startsWith("__") ||
                  cls === "font-sans",
              )
              .join(" ")
          : "";
      pipWin.document.body.className = [
        fontVarClasses,
        "bg-background text-neutral-100 antialiased overflow-hidden select-none m-0 p-0",
      ]
        .filter(Boolean)
        .join(" ");

      const rootEl = pipWin.document.createElement("div");
      rootEl.id = "habitparty-focus-pip-root";
      rootEl.className = "w-full h-dvh flex flex-col";
      pipWin.document.body.appendChild(rootEl);

      activePipWindow = pipWin;
      activeContainer = rootEl;

      const currentPipWin = pipWin;
      currentPipWin.addEventListener("pagehide", () => {
        if (activePipWindow === currentPipWin) {
          activePipWindow = null;
          activeContainer = null;
          rebuildSnapshot();
        }
      });

      rebuildSnapshot();
      return true;
    } catch {
      if (pipWin && !pipWin.closed) {
        try {
          pipWin.close();
        } catch {
          // Ignore close errors
        }
      }
      teardownDocumentPip();
      rebuildSnapshot();
      if (myGeneration !== openGeneration) return false;
    }
  }

  // Fallback for Firefox/Safari via offscreen Canvas -> Video PiP
  if (
    typeof document !== "undefined" &&
    document.pictureInPictureEnabled &&
    typeof HTMLVideoElement !== "undefined" &&
    "requestPictureInPicture" in HTMLVideoElement.prototype
  ) {
    if (activeVideoEl && document.pictureInPictureElement === activeVideoEl) {
      return true;
    }

    teardownVideoPip();
    let localVideo: HTMLVideoElement | null = null;
    let localStream: MediaStream | null = null;
    try {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement("canvas");
      canvas.width = VIDEO_PIP_LOGICAL_WIDTH * dpr;
      canvas.height = VIDEO_PIP_LOGICAL_HEIGHT * dpr;

      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.width = canvas.width;
      video.height = canvas.height;
      video.style.position = "fixed";
      video.style.width = "1px";
      video.style.height = "1px";
      video.style.opacity = "0";
      video.style.pointerEvents = "none";
      video.style.left = "-9999px";
      video.style.top = "0";
      localVideo = video;

      activeCanvasEl = canvas;
      activeCanvasCtx = canvas.getContext("2d", { alpha: false });
      renderVideoPipFrame(
        options?.initialVideoFrame ?? {
          timeText: "25:00",
          targetName: options?.windowTitle || "HabitParty Focus",
          phaseLabel: "Focus",
          progressPercent: 0,
          isRunning: false,
          isBreak: false,
          isOvertime: false,
        },
      );

      const stream = canvas.captureStream(2);
      localStream = stream;
      activeStream = stream;
      activeVideoTrack = stream.getVideoTracks()[0] ?? null;
      activeVideoEl = video;
      video.srcObject = stream;
      document.body.appendChild(video);

      video.addEventListener("leavepictureinpicture", () => {
        if (activeVideoEl === video) {
          teardownVideoPip();
          rebuildSnapshot();
        }
      });

      await video.play();
      if (myGeneration !== openGeneration) {
        cleanupVideoResources(localVideo, localStream);
        return false;
      }

      await video.requestPictureInPicture();
      if (myGeneration !== openGeneration) {
        cleanupVideoResources(localVideo, localStream);
        return false;
      }

      if (!options?.isInitiallyRunning) {
        syncVideoPipPlayback(false);
      }
      rebuildSnapshot();
      return true;
    } catch {
      if (activeVideoEl === localVideo) {
        teardownVideoPip();
      } else {
        cleanupVideoResources(localVideo, localStream);
      }
      rebuildSnapshot();
    }
  }

  options?.onUnsupported?.();
  return false;
}

export async function openFocusPip(
  options?: FocusPipOpenOptions,
): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (pendingOpenPromise) {
    return pendingOpenPromise;
  }

  const myGeneration = ++openGeneration;
  const promise = executeOpenFocusPip(myGeneration, options).finally(() => {
    if (pendingOpenPromise === promise) {
      pendingOpenPromise = null;
    }
  });
  pendingOpenPromise = promise;
  return promise;
}

export async function toggleFocusPip(
  options?: FocusPipOpenOptions,
): Promise<boolean> {
  if (pendingOpenPromise) {
    return pendingOpenPromise;
  }
  if (ensureInitialSnapshot().isOpen) {
    closeFocusPip();
    return false;
  }
  return openFocusPip(options);
}

export function useFocusPip() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return {
    ...snapshot,
    openPip: openFocusPip,
    closePip: closeFocusPip,
    togglePip: toggleFocusPip,
  };
}
