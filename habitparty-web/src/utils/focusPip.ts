import type { FocusActiveTarget } from "@/types/focus";
import {
  formatFocusDisplayTime,
  getFocusProgressPercent,
  getFocusTimerDerivedState,
} from "@/utils/focusFormatters";
import {
  type FocusPipMode,
  type FocusPipSnapshot,
  getFocusPipSnapshot,
  updateFocusPipSnapshot,
} from "@/utils/focusPipState";

export type { FocusPipMode, FocusPipSnapshot };

interface DocumentPictureInPictureOptions {
  width?: number;
  height?: number;
  disallowReturnToOpener?: boolean;
}

interface DocumentPictureInPictureApi {
  window: Window | null;
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
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

let activePipWindow: Window | null = null;
let activeContainer: HTMLElement | null = null;
let activeVideoEl: HTMLVideoElement | null = null;
let activeCanvasEl: HTMLCanvasElement | null = null;
let activeCanvasCtx: CanvasRenderingContext2D | null = null;
let activeStream: MediaStream | null = null;
let activeVideoTrack: MediaStreamTrack | null = null;
let cachedVideoPipPalette: VideoPipPalette | null = null;
let desiredVideoPlaying = false;
let isVideoPipReady = false;
let deferredPauseTimeoutId: number | null = null;
let deferredPauseRvfcHandle: number | null = null;
let openGeneration = 0;
let pendingOpenPromise: Promise<boolean> | null = null;

// Contadores exatos de eventos programáticos play/pause em vez de janela cega de 450ms
// (um clique real de Play logo após um pause programático nunca é engolido).
let pendingProgrammaticPlays = 0;
let pendingProgrammaticPauses = 0;
let programmaticCounterResetId: number | null = null;

// Cache leve de truncation no Canvas para não re-medir char a char a 1Hz
const fitTextCache = new Map<string, string>();
const MAX_FIT_TEXT_CACHE_SIZE = 64;

function scheduleProgrammaticCounterReset() {
  if (typeof window === "undefined") return;
  if (programmaticCounterResetId !== null) {
    window.clearTimeout(programmaticCounterResetId);
  }
  programmaticCounterResetId = window.setTimeout(() => {
    programmaticCounterResetId = null;
    pendingProgrammaticPlays = 0;
    pendingProgrammaticPauses = 0;
  }, 250);
}

function markProgrammaticPlay() {
  pendingProgrammaticPlays += 1;
  scheduleProgrammaticCounterReset();
}

function markProgrammaticPause() {
  pendingProgrammaticPauses += 1;
  scheduleProgrammaticCounterReset();
}

export function consumeProgrammaticVideoPlay(): boolean {
  if (pendingProgrammaticPlays > 0) {
    pendingProgrammaticPlays -= 1;
    return true;
  }
  return false;
}

export function consumeProgrammaticVideoPause(): boolean {
  if (pendingProgrammaticPauses > 0) {
    pendingProgrammaticPauses -= 1;
    return true;
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

function publishPipSnapshot() {
  const mode: FocusPipMode = activePipWindow
    ? "document"
    : activeVideoEl
      ? "video"
      : null;

  updateFocusPipSnapshot({
    mode,
    container: activeContainer,
    pipWindow: activePipWindow,
  });
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

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

function cancelDeferredVideoPause(
  video: HTMLVideoElement | null = activeVideoEl,
): void {
  if (deferredPauseTimeoutId !== null && typeof window !== "undefined") {
    window.clearTimeout(deferredPauseTimeoutId);
    deferredPauseTimeoutId = null;
  }
  if (deferredPauseRvfcHandle !== null && video) {
    const rvfcVideo = video as VideoWithFrameCallback;
    rvfcVideo.cancelVideoFrameCallback?.(deferredPauseRvfcHandle);
    deferredPauseRvfcHandle = null;
  }
}

function pauseVideoProgrammatically(video: HTMLVideoElement): void {
  if (activeVideoEl !== video || desiredVideoPlaying) return;
  if (!video.paused) {
    markProgrammaticPause();
    video.pause();
  }
}

function scheduleDeferredVideoPause(video: HTMLVideoElement): void {
  cancelDeferredVideoPause(video);
  if (desiredVideoPlaying || activeVideoEl !== video || video.paused) {
    return;
  }

  const finishPause = () => {
    cancelDeferredVideoPause(video);
    pauseVideoProgrammatically(video);
  };

  if (typeof window !== "undefined") {
    deferredPauseTimeoutId = window.setTimeout(finishPause, 150);
  }

  const rvfcVideo = video as VideoWithFrameCallback;
  if (typeof rvfcVideo.requestVideoFrameCallback === "function") {
    deferredPauseRvfcHandle = rvfcVideo.requestVideoFrameCallback(() => {
      deferredPauseRvfcHandle = null;
      finishPause();
    });
  }
}

function teardownVideoPip() {
  cancelDeferredVideoPause(activeVideoEl);
  cleanupVideoResources(activeVideoEl, activeStream);
  if (activeCanvasEl) {
    activeCanvasEl.width = 0;
    activeCanvasEl.height = 0;
  }
  activeVideoTrack = null;
  activeStream = null;
  activeVideoEl = null;
  activeCanvasEl = null;
  activeCanvasCtx = null;
  desiredVideoPlaying = false;
  isVideoPipReady = false;
  pendingProgrammaticPlays = 0;
  pendingProgrammaticPauses = 0;
  if (programmaticCounterResetId !== null && typeof window !== "undefined") {
    window.clearTimeout(programmaticCounterResetId);
    programmaticCounterResetId = null;
  }
  fitTextCache.clear();
  invalidateVideoPipThemeCache();
}

export function getActiveVideoPipElement(): HTMLVideoElement | null {
  return activeVideoEl;
}

export function syncVideoPipPlayback(isRunning: boolean): void {
  desiredVideoPlaying = isRunning;
  const video = activeVideoEl;
  if (!video || !isVideoPipReady) return;
  if (isRunning) {
    cancelDeferredVideoPause(video);
    if (video.paused) {
      markProgrammaticPlay();
      void video.play().catch(() => {
        pendingProgrammaticPlays = Math.max(0, pendingProgrammaticPlays - 1);
      });
    }
  } else if (!video.paused) {
    scheduleDeferredVideoPause(video);
  }
}

export function closeFocusPip() {
  openGeneration += 1;
  pendingOpenPromise = null;
  teardownDocumentPip();
  teardownVideoPip();
  publishPipSnapshot();
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
    capLabel: isSessionRewardCapped ? labels.sessionCapBadge : undefined,
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
  const cacheKey = `${ctx.font}|${maxWidth}|${text}`;
  const cached = fitTextCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  let result = text;
  if (ctx.measureText(text).width > maxWidth) {
    let end = text.length;
    while (
      end > 1 &&
      ctx.measureText(`${text.slice(0, end)}…`).width > maxWidth
    ) {
      end -= 1;
    }
    result = `${text.slice(0, end).trimEnd()}…`;
  }

  if (fitTextCache.size >= MAX_FIT_TEXT_CACHE_SIZE) {
    fitTextCache.clear();
  }
  fitTextCache.set(cacheKey, result);
  return result;
}

export function renderVideoPipFrame(frame: VideoPipFrameData) {
  const canvas = activeCanvasEl;
  if (!canvas || canvas.width === 0 || canvas.height === 0) return;
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

  // Linked task, 2h cap, or localized fallback footer
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

  // Em navegadores com Video PiP (<video>.captureStream), um <video> já pausado congela o último quadro.
  // Reproduzimos brevemente um frame para apresentar o reset/estado novo antes de pausar novamente.
  const video = activeVideoEl;
  if (
    video &&
    isVideoPipReady &&
    !frame.isRunning &&
    !desiredVideoPlaying &&
    video.paused
  ) {
    markProgrammaticPlay();
    void video
      .play()
      .then(() => {
        if (activeVideoEl === video && !desiredVideoPlaying) {
          scheduleDeferredVideoPause(video);
        }
      })
      .catch(() => {
        pendingProgrammaticPlays = Math.max(0, pendingProgrammaticPlays - 1);
      });
  }
}

function createEfficientCanvasStream(canvas: HTMLCanvasElement): {
  stream: MediaStream;
  track: MediaStreamTrack | null;
} {
  // Prefere captureStream(0) + track.requestFrame() sob demanda (15× menos encoding que 15fps fixos).
  // Em navegadores sem requestFrame() (ex.: Firefox), recai para 1fps (suficiente para relógio de 1Hz).
  try {
    const manualStream = canvas.captureStream(0);
    const manualTrack = manualStream.getVideoTracks()[0] ?? null;
    if (
      manualTrack &&
      typeof (manualTrack as MediaStreamTrack & { requestFrame?: () => void })
        .requestFrame === "function"
    ) {
      return { stream: manualStream, track: manualTrack };
    }
    for (const t of manualStream.getTracks()) {
      t.stop();
    }
  } catch {
    // Fallback abaixo
  }
  const fallbackStream = canvas.captureStream(1);
  return {
    stream: fallbackStream,
    track: fallbackStream.getVideoTracks()[0] ?? null,
  };
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
          publishPipSnapshot();
        }
      });

      publishPipSnapshot();
      return true;
    } catch (err) {
      if (pipWin && !pipWin.closed) {
        try {
          pipWin.close();
        } catch {
          // Ignore close errors
        }
      }
      // Verifica geração ANTES de derrubar estado global para não fechar outra janela PiP recém-aberta
      if (myGeneration !== openGeneration) return false;
      teardownDocumentPip();
      publishPipSnapshot();

      // Se a API Document PiP existe e rejeitou por cancelamento/gesto do usuário,
      // não dispara `onUnsupported` nem tenta Video PiP sem user activation.
      const errorName = err instanceof Error ? err.name : "";
      if (errorName === "NotAllowedError" || errorName === "AbortError") {
        return false;
      }
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
      desiredVideoPlaying = Boolean(options?.isInitiallyRunning);
      isVideoPipReady = false;

      const { stream, track } = createEfficientCanvasStream(canvas);
      localStream = stream;
      activeStream = stream;
      activeVideoTrack = track;
      activeVideoEl = video;
      video.srcObject = stream;
      document.body.appendChild(video);

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

      video.addEventListener("leavepictureinpicture", () => {
        if (activeVideoEl === video) {
          teardownVideoPip();
          publishPipSnapshot();
        }
      });

      await video.play();
      if (myGeneration !== openGeneration) {
        cleanupVideoResources(localVideo, localStream);
        return false;
      }

      await video.requestPictureInPicture();
      if (myGeneration !== openGeneration || activeVideoEl !== video) {
        cleanupVideoResources(localVideo, localStream);
        return false;
      }

      isVideoPipReady = true;
      syncVideoPipPlayback(desiredVideoPlaying);
      publishPipSnapshot();
      return true;
    } catch {
      if (myGeneration !== openGeneration) {
        cleanupVideoResources(localVideo, localStream);
        return false;
      }
      if (activeVideoEl === localVideo) {
        teardownVideoPip();
      } else {
        cleanupVideoResources(localVideo, localStream);
      }
      publishPipSnapshot();
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
  if (getFocusPipSnapshot().isOpen) {
    closeFocusPip();
    return false;
  }
  return openFocusPip(options);
}
