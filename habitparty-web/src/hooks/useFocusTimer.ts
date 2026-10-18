"use client";

import { useEffect } from "react";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import type { FocusTimerControlsState, FocusTimerState } from "@/types/focus";
import { formatFocusDisplayTime } from "@/utils/focusFormatters";

interface UseFocusTimerOptions {
  onSessionSaved?: () => void;
}

/**
 * Hook com foco em CONTROLES e AÇÕES do Timer.
 * NÃO se inscreve nas variáveis que sofrem tick a cada 1 segundo (elapsedSeconds, secondsRemaining).
 * Evita o re-render a cada segundo em containers pais (FocusContainer, FocusMain, FocusSidebarRight).
 */
export function useFocusTimerControls({
  onSessionSaved,
}: UseFocusTimerOptions = {}) {
  const isActive = useFocusTimerStore((s) => s.isActive);
  const isPaused = useFocusTimerStore((s) => s.isPaused);
  const mode = useFocusTimerStore((s) => s.mode);
  const phase = useFocusTimerStore((s) => s.phase);
  const target = useFocusTimerStore((s) => s.target);
  const totalDurationSeconds = useFocusTimerStore(
    (s) => s.totalDurationSeconds,
  );
  const startedAt = useFocusTimerStore((s) => s.startedAt);
  const hasElapsedSeconds = useFocusTimerStore((s) => s.elapsedSeconds > 0);
  const canComplete = useFocusTimerStore((s) => s.elapsedSeconds >= 60);
  const isPartialPomo = useFocusTimerStore(
    (s) =>
      s.mode === "POMO" &&
      s.phase === "WORK" &&
      s.secondsRemaining > 0 &&
      s.target?.type !== "inventory",
  );

  const toggleTimer = useFocusTimerStore((s) => s.toggleTimer);
  const pauseTimer = useFocusTimerStore((s) => s.pauseTimer);
  const resumeTimer = useFocusTimerStore((s) => s.resumeTimer);
  const resetTimer = useFocusTimerStore((s) => s.resetTimer);
  const skipBreak = useFocusTimerStore((s) => s.skipBreak);
  const completeSession = useFocusTimerStore((s) => s.completeSession);
  const changeMode = useFocusTimerStore((s) => s.changeMode);
  const changeDuration = useFocusTimerStore((s) => s.changeDuration);
  const startFocusActivity = useFocusTimerStore((s) => s.startFocusActivity);
  const startFocusItem = useFocusTimerStore((s) => s.startFocusItem);
  const selectActivityTarget = useFocusTimerStore(
    (s) => s.selectActivityTarget,
  );
  const resetTarget = useFocusTimerStore((s) => s.resetTarget);
  const transferTarget = useFocusTimerStore((s) => s.transferTarget);
  const sessionNotes = useFocusTimerStore((s) => s.sessionNotes);
  const setSessionNotes = useFocusTimerStore((s) => s.setSessionNotes);

  const isSoundEnabled = useFocusTimerStore((s) => s.isSoundEnabled);
  const timerSoundType = useFocusTimerStore((s) => s.timerSoundType);
  const toggleSound = useFocusTimerStore((s) => s.toggleSound);
  const setTimerSoundType = useFocusTimerStore((s) => s.setTimerSoundType);
  const setOnSessionSavedCallback = useFocusTimerStore(
    (s) => s.setOnSessionSavedCallback,
  );

  useEffect(() => {
    if (onSessionSaved) {
      setOnSessionSavedCallback(onSessionSaved);
    }
  }, [onSessionSaved, setOnSessionSavedCallback]);

  const controlsState: FocusTimerControlsState = {
    isActive,
    isPaused,
    mode,
    phase,
    target,
    totalDurationSeconds,
    startedAt,
    hasElapsedSeconds,
    canComplete,
    isPartialPomo,
  };

  return {
    // Estado livre de ticking
    controlsState,
    isActive,
    isPaused,
    isRunning: isActive && !isPaused,
    mode,
    phase,
    target,
    totalDurationSeconds,
    startedAt,
    hasElapsedSeconds,
    canComplete,
    isPartialPomo,
    sessionNotes,

    // Preferências de som
    isSoundEnabled,
    timerSoundType,
    toggleSound,
    setTimerSoundType,

    // Ações
    setSessionNotes,
    toggleTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    skipBreak,
    completeSession,
    changeMode,
    changeDuration,
    startFocusActivity,
    startFocusItem,
    selectActivityTarget,
    resetTarget,
    transferTarget,
  };
}

/**
 * Hook para componentes que exibem a CONTAGEM EM TEMPO REAL (a cada 1 segundo).
 * Usado exclusivamente em componentes-folha visuais (FocusHeroStage, SidebarFocusWidget).
 */
export function useFocusTimerDisplay() {
  const secondsRemaining = useFocusTimerStore((s) => s.secondsRemaining);
  const elapsedSeconds = useFocusTimerStore((s) => s.elapsedSeconds);
  const totalDurationSeconds = useFocusTimerStore(
    (s) => s.totalDurationSeconds,
  );
  const mode = useFocusTimerStore((s) => s.mode);
  const phase = useFocusTimerStore((s) => s.phase);
  const target = useFocusTimerStore((s) => s.target);
  const isActive = useFocusTimerStore((s) => s.isActive);
  const isPaused = useFocusTimerStore((s) => s.isPaused);
  const completedCycles = useFocusTimerStore((s) => s.completedCycles);

  const isRunning = isActive && !isPaused;
  const isInventoryItem = target?.type === "inventory";
  const isBreak = phase === "SHORT_BREAK" || phase === "LONG_BREAK";
  const isCountdown = mode === "POMO" || isInventoryItem || isBreak;

  const displaySeconds = isCountdown ? secondsRemaining : elapsedSeconds;
  const formattedTime = formatFocusDisplayTime({
    mode,
    secondsRemaining,
    elapsedSeconds,
    target,
  });

  let progressPercent = 0;
  if (isCountdown) {
    progressPercent =
      totalDurationSeconds > 0
        ? ((totalDurationSeconds - secondsRemaining) / totalDurationSeconds) *
          100
        : 0;
  } else {
    progressPercent = ((elapsedSeconds % 3600) / 3600) * 100;
  }

  return {
    displaySeconds,
    formattedTime,
    progressPercent,
    secondsRemaining,
    elapsedSeconds,
    totalDurationSeconds,
    mode,
    phase,
    isBreak,
    target,
    isActive,
    isPaused,
    isRunning,
    isInventoryItem,
    completedCycles,
  };
}

/**
 * Hook unificado para conveniência e compatibilidade regressiva.
 */
export function useFocusTimer(options: UseFocusTimerOptions = {}) {
  const controls = useFocusTimerControls(options);
  const display = useFocusTimerDisplay();

  const timerState: FocusTimerState = {
    isActive: controls.isActive,
    isPaused: controls.isPaused,
    mode: controls.mode,
    phase: controls.phase,
    secondsRemaining: display.secondsRemaining,
    totalDurationSeconds: controls.totalDurationSeconds,
    elapsedSeconds: display.elapsedSeconds,
    completedCycles: display.completedCycles,
    target: controls.target,
    startedAt: controls.startedAt,
  };

  return {
    ...controls,
    ...display,
    timerState,
  };
}
