"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import {
  buildVideoPipFrameData,
  closeFocusPip,
  consumeProgrammaticVideoPause,
  consumeProgrammaticVideoPlay,
  getActiveVideoPipElement,
  invalidateVideoPipThemeCache,
  renderVideoPipFrame,
  syncDocumentPipTheme,
  syncVideoPipPlayback,
} from "@/utils/focusPip";
import { useFocusPipState } from "@/utils/focusPipState";
import { FocusPipWidget } from "./FocusPipWidget";

function buildVideoVisualSliceKey(
  st: ReturnType<typeof useFocusTimerStore.getState>,
): string {
  return [
    st.isActive ? "1" : "0",
    st.isPaused ? "1" : "0",
    st.mode,
    st.phase,
    st.secondsRemaining,
    st.elapsedSeconds,
    st.totalDurationSeconds,
    st.target?.id ?? "",
    st.target?.name ?? "",
    st.target?.taskName ?? "",
    st.target?.type ?? "",
  ].join("|");
}

/**
 * Runtime efetivo de Picture-in-Picture (carregado sob demanda via `FocusPipHost` apenas quando aberto).
 */
export function FocusPipRuntime() {
  const router = useRouter();
  const t = useTranslations("focusWidget.pip");
  const { isGamified } = useExperienceMode();
  const { isOpen, mode, container, pipWindow } = useFocusPipState();
  const lastVisualSliceRef = useRef<string>("");
  const lastVideoFrameKeyRef = useRef<string>("");

  const isActive = useFocusTimerStore((s) => s.isActive);
  const isPaused = useFocusTimerStore((s) => s.isPaused);
  const isRunning = isActive && !isPaused;

  const drawCurrentVideoFrame = useCallback(
    (force = false) => {
      const st = useFocusTimerStore.getState();
      const visualSlice = buildVideoVisualSliceKey(st);
      if (!force && visualSlice === lastVisualSliceRef.current) {
        return;
      }
      lastVisualSliceRef.current = visualSlice;

      const frame = buildVideoPipFrameData(st, {
        windowTitle: t("windowTitle"),
        noTarget: t("noTarget"),
        phaseFocus: t("phaseFocus"),
        phasePaused: t("phasePaused"),
        phaseOvertime: t("phaseOvertime"),
        phaseBreak: t("phaseBreak"),
        sessionCapBadge: isGamified
          ? t("sessionCapBadge")
          : t("sessionCapBadgeProductivity"),
      });
      const frameKey = [
        frame.timeText,
        frame.targetName,
        frame.phaseLabel,
        frame.taskName ?? "",
        frame.capLabel ?? "",
        frame.footerFallbackText ?? "",
        frame.isRunning ? "1" : "0",
        frame.isBreak ? "1" : "0",
        frame.isOvertime ? "1" : "0",
        Math.round(frame.progressPercent * 10),
      ].join("|");

      if (!force && frameKey === lastVideoFrameKeyRef.current) {
        return;
      }
      lastVideoFrameKeyRef.current = frameKey;
      renderVideoPipFrame(frame);
    },
    [isGamified, t],
  );

  // Mantém tema, classe dark/light e CSS vars sincronizados com o Document PiP
  useEffect(() => {
    if (!isOpen || !pipWindow || mode !== "document") return;

    syncDocumentPipTheme(pipWindow);
    const observer = new MutationObserver(() => {
      invalidateVideoPipThemeCache();
      syncDocumentPipTheme(pipWindow);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    return () => observer.disconnect();
  }, [isOpen, mode, pipWindow]);

  // Watchdog na janela Document PiP visível caso o Web Worker da aba sofra throttling em segundo plano
  useEffect(() => {
    if (!isOpen || mode !== "document" || !pipWindow || !isRunning) return;

    const intervalId = pipWindow.setInterval(() => {
      const st = useFocusTimerStore.getState();
      if (!st.isActive || st.isPaused || st.isSavingSession) return;
      if (!st.lastTickTimestamp || Date.now() - st.lastTickTimestamp >= 980) {
        st.tick();
      }
    }, 1000);

    return () => {
      try {
        if (!pipWindow.closed) {
          pipWindow.clearInterval(intervalId);
        }
      } catch {
        // Ignore cleanup errors on closed PiP window
      }
    };
  }, [isOpen, mode, pipWindow, isRunning]);

  // Garante fechamento limpo se a aba principal for recarregada/fechada ou o layout desmontar (ex: logout)
  useEffect(() => {
    if (!isOpen) return;
    const handlePageHide = () => closeFocusPip();
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      closeFocusPip();
    };
  }, []);

  // Atualiza frame Canvas no modo fallback (<video>.requestPictureInPicture) ignorando mutações não visuais (ex: sessionNotes)
  useEffect(() => {
    if (!isOpen || mode !== "video") return;

    drawCurrentVideoFrame(true);

    const unsubscribe = useFocusTimerStore.subscribe(() => {
      drawCurrentVideoFrame(false);
    });

    const themeObserver = new MutationObserver(() => {
      invalidateVideoPipThemeCache();
      drawCurrentVideoFrame(true);
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    return () => {
      unsubscribe();
      themeObserver.disconnect();
      lastVisualSliceRef.current = "";
      lastVideoFrameKeyRef.current = "";
    };
  }, [isOpen, mode, drawCurrentVideoFrame]);

  // Registra handlers da MediaSession e eventos nativos do <video> enquanto o Video PiP está aberto
  useEffect(() => {
    if (!isOpen || mode !== "video") {
      return;
    }

    const handlePlayIntent = () => {
      const st = useFocusTimerStore.getState();
      if (!st.isActive || st.isPaused) {
        if (
          !st.target ||
          (st.target.type === "inventory" && st.secondsRemaining <= 1)
        ) {
          syncVideoPipPlayback(false);
          if (
            typeof window !== "undefined" &&
            window.location.pathname !== "/focus"
          ) {
            router.push("/focus");
          }
          window.focus();
          return;
        }
        st.toggleTimer();
      }
    };

    const handlePauseIntent = () => {
      const st = useFocusTimerStore.getState();
      if (st.isActive && !st.isPaused && !st.isSavingSession) {
        st.pauseTimer();
      }
    };

    const videoEl = getActiveVideoPipElement();
    const onNativePlay = () => {
      if (consumeProgrammaticVideoPlay()) return;
      handlePlayIntent();
    };
    const onNativePause = () => {
      if (consumeProgrammaticVideoPause()) return;
      handlePauseIntent();
    };

    videoEl?.addEventListener("play", onNativePlay);
    videoEl?.addEventListener("pause", onNativePause);

    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      try {
        navigator.mediaSession.setActionHandler("play", handlePlayIntent);
        navigator.mediaSession.setActionHandler("pause", handlePauseIntent);
      } catch {
        // Ignore browsers without MediaSession action support
      }
    }

    return () => {
      videoEl?.removeEventListener("play", onNativePlay);
      videoEl?.removeEventListener("pause", onNativePause);
      if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
        try {
          navigator.mediaSession.setActionHandler("play", null);
          navigator.mediaSession.setActionHandler("pause", null);
          navigator.mediaSession.playbackState = "none";
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [isOpen, mode, router]);

  useEffect(() => {
    if (!isOpen || mode !== "video") {
      return;
    }
    syncVideoPipPlayback(isRunning);
    if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isRunning ? "playing" : "paused";
    }
  }, [isOpen, mode, isRunning]);

  if (!isOpen || mode !== "document" || !container) {
    return null;
  }

  return createPortal(<FocusPipWidget />, container);
}
