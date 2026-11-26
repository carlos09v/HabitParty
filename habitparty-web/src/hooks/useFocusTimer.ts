"use client";

import { useEffect } from "react";
import {
  DEFAULT_CYCLES_UNTIL_LONG_BREAK,
  DEFAULT_POMO_MINUTES,
} from "@/constants/focusRules";
import { useIsClient } from "@/hooks/useIsClient";
import { registerFocusSessionSavedCallback } from "@/store/focus/focusTimerState";
import { useFocusPreferencesStore } from "@/store/focusPreferencesStore";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import {
  canCompleteFocusSession,
  formatFocusDisplayTime,
  getFocusProgressPercent,
  getFocusTimerDerivedState,
  getNextFocusBreakMinutes,
  isFocusOvertime,
  isFocusSessionRewardCapped,
  isPartialPomoSession,
} from "@/utils/focusFormatters";

interface UseFocusTimerOptions {
  onSessionSaved?: () => void;
}

const STATIC_FOCUS_TIMER_ACTIONS = {
  toggleTimer: () => useFocusTimerStore.getState().toggleTimer(),
  pauseTimer: () => useFocusTimerStore.getState().pauseTimer(),
  resumeTimer: () => useFocusTimerStore.getState().resumeTimer(),
  resetTimer: () => useFocusTimerStore.getState().resetTimer(),
  stopFromWidget: () => useFocusTimerStore.getState().stopFromWidget(),
  skipBreak: () => useFocusTimerStore.getState().skipBreak(),
  startBreak: () => useFocusTimerStore.getState().startBreak(),
  completeSession: (
    notes?: string,
    options?: Parameters<
      ReturnType<typeof useFocusTimerStore.getState>["completeSession"]
    >[1],
  ) => useFocusTimerStore.getState().completeSession(notes, options),
  changeMode: (
    newMode: Parameters<
      ReturnType<typeof useFocusTimerStore.getState>["changeMode"]
    >[0],
  ) => useFocusTimerStore.getState().changeMode(newMode),
  changeDuration: (minutes: number) =>
    useFocusTimerStore.getState().changeDuration(minutes),
  startFocusActivity: (
    activity: Parameters<
      ReturnType<typeof useFocusTimerStore.getState>["startFocusActivity"]
    >[0],
  ) => useFocusTimerStore.getState().startFocusActivity(activity),
  startFocusItem: (
    item: Parameters<
      ReturnType<typeof useFocusTimerStore.getState>["startFocusItem"]
    >[0],
  ) => useFocusTimerStore.getState().startFocusItem(item),
  startFocusTask: (task: { id: string; title: string }) =>
    useFocusTimerStore.getState().startFocusTask(task),
  selectActivityTarget: (
    activity: Parameters<
      ReturnType<typeof useFocusTimerStore.getState>["selectActivityTarget"]
    >[0],
  ) => useFocusTimerStore.getState().selectActivityTarget(activity),
  selectItemTarget: (
    item: Parameters<
      ReturnType<typeof useFocusTimerStore.getState>["selectItemTarget"]
    >[0],
  ) => useFocusTimerStore.getState().selectItemTarget(item),
  selectTaskTarget: (task: { id: string; title: string } | null) =>
    useFocusTimerStore.getState().selectTaskTarget(task),
  unlinkTaskFromTarget: () =>
    useFocusTimerStore.getState().unlinkTaskFromTarget(),
  completeLinkedTask: (taskId: string, taskName?: string) =>
    useFocusTimerStore.getState().completeLinkedTask(taskId, taskName),
  resetTarget: () => useFocusTimerStore.getState().resetTarget(),
  transferTarget: (
    activity: Parameters<
      ReturnType<typeof useFocusTimerStore.getState>["transferTarget"]
    >[0],
  ) => useFocusTimerStore.getState().transferTarget(activity),
  linkActivityToTask: (
    activity: Parameters<
      ReturnType<typeof useFocusTimerStore.getState>["linkActivityToTask"]
    >[0],
  ) => useFocusTimerStore.getState().linkActivityToTask(activity),
  syncTargetMetadata: (
    metadata: Parameters<
      ReturnType<typeof useFocusTimerStore.getState>["syncTargetMetadata"]
    >[0],
  ) => useFocusTimerStore.getState().syncTargetMetadata(metadata),
} as const;

function useFocusBreakPreferences() {
  const isClient = useIsClient();
  const shortBreakMinutes = useFocusPreferencesStore(
    (s) => s.shortBreakMinutes,
  );
  const longBreakMinutes = useFocusPreferencesStore((s) => s.longBreakMinutes);
  const cyclesUntilLongBreak = useFocusPreferencesStore(
    (s) => s.cyclesUntilLongBreak,
  );

  return {
    prefs: isClient
      ? { shortBreakMinutes, longBreakMinutes, cyclesUntilLongBreak }
      : undefined,
    cyclesPerBlock: isClient
      ? Math.max(2, cyclesUntilLongBreak)
      : DEFAULT_CYCLES_UNTIL_LONG_BREAK,
  };
}

/**
 * Hook dedicado às anotações da sessão de foco.
 * Isolado de useFocusTimerControls para evitar que digitar no input de notas
 * provoque re-render em FocusContainer, FocusMain ou FocusHeroStage.
 */
export function useFocusSessionNotes() {
  const sessionNotes = useFocusTimerStore((s) => s.sessionNotes);
  const setSessionNotes = useFocusTimerStore((s) => s.setSessionNotes);
  return { sessionNotes, setSessionNotes };
}

/**
 * Ações estáveis da store do timer de foco em objeto estático no nível do módulo
 * (zero alocações e zero avaliações de seletores Zustand a 1Hz por consumidor).
 */
export function useFocusTimerActions() {
  return STATIC_FOCUS_TIMER_ACTIONS;
}

function useRegisterFocusSessionSavedCallback(onSessionSaved?: () => void) {
  useEffect(() => {
    if (!onSessionSaved) return;
    return registerFocusSessionSavedCallback(onSessionSaved);
  }, [onSessionSaved]);
}

/**
 * Fatia enxuta de estado para o `FocusContainer` (protegida contra mismatch de hidratação SSR).
 */
export function useFocusContainerTimerSlice({
  onSessionSaved,
}: UseFocusTimerOptions = {}) {
  useRegisterFocusSessionSavedCallback(onSessionSaved);
  const isClient = useIsClient();

  const rawIsActive = useFocusTimerStore((s) => s.isActive);
  const rawIsPaused = useFocusTimerStore((s) => s.isPaused);
  const rawMode = useFocusTimerStore((s) => s.mode);
  const rawPhase = useFocusTimerStore((s) => s.phase);
  const rawTarget = useFocusTimerStore((s) => s.target);
  const rawHasElapsedSeconds = useFocusTimerStore((s) => s.elapsedSeconds > 0);

  const isActive = isClient ? rawIsActive : false;
  const isPaused = isClient ? rawIsPaused : false;
  const mode = isClient ? rawMode : "POMO";
  const phase = isClient ? rawPhase : "WORK";
  const target = isClient ? rawTarget : null;
  const hasElapsedSeconds = isClient ? rawHasElapsedSeconds : false;

  return {
    isActive,
    isPaused,
    isRunning: isActive && !isPaused,
    mode,
    phase,
    target,
    hasElapsedSeconds,
    ...STATIC_FOCUS_TIMER_ACTIONS,
  };
}

/**
 * Fatia mínima para o `FocusMain` (protegida contra mismatch de hidratação SSR).
 */
export function useFocusMainTimerSlice() {
  const isClient = useIsClient();
  const rawIsActive = useFocusTimerStore((s) => s.isActive);
  const rawIsPaused = useFocusTimerStore((s) => s.isPaused);
  const rawTarget = useFocusTimerStore((s) => s.target);

  const isActive = isClient ? rawIsActive : false;
  const isPaused = isClient ? rawIsPaused : false;
  const target = isClient ? rawTarget : null;

  return {
    isActive,
    isPaused,
    isRunning: isActive && !isPaused,
    target,
    toggleTimer: STATIC_FOCUS_TIMER_ACTIONS.toggleTimer,
    resetTarget: STATIC_FOCUS_TIMER_ACTIONS.resetTarget,
    selectActivityTarget: STATIC_FOCUS_TIMER_ACTIONS.selectActivityTarget,
  };
}

/**
 * Hook com foco em CONTROLES e AÇÕES do Timer.
 * NÃO se inscreve nas variáveis que sofrem tick a cada 1 segundo (elapsedSeconds, secondsRemaining)
 * nem nas anotações de texto (sessionNotes).
 * Evita o re-render a cada segundo ou a cada tecla digitada em containers pais.
 */
export function useFocusTimerControls({
  onSessionSaved,
}: UseFocusTimerOptions = {}) {
  useRegisterFocusSessionSavedCallback(onSessionSaved);
  const isClient = useIsClient();

  const rawIsActive = useFocusTimerStore((s) => s.isActive);
  const rawIsPaused = useFocusTimerStore((s) => s.isPaused);
  const rawMode = useFocusTimerStore((s) => s.mode);
  const rawPhase = useFocusTimerStore((s) => s.phase);
  const rawTarget = useFocusTimerStore((s) => s.target);
  const rawTotalDurationSeconds = useFocusTimerStore(
    (s) => s.totalDurationSeconds,
  );
  const rawHasElapsedSeconds = useFocusTimerStore((s) => s.elapsedSeconds > 0);
  const rawCanComplete = useFocusTimerStore((s) => canCompleteFocusSession(s));
  const rawIsPartialPomo = useFocusTimerStore((s) => isPartialPomoSession(s));
  const rawIsOvertime = useFocusTimerStore((s) => isFocusOvertime(s));
  const rawIsSavingSession = useFocusTimerStore((s) => s.isSavingSession);
  const rawIsCompletingLinkedTask = useFocusTimerStore(
    (s) => s.isCompletingLinkedTask,
  );
  const rawIsSessionRewardCapped = useFocusTimerStore((s) =>
    isFocusSessionRewardCapped(s),
  );
  const rawCompletedCycles = useFocusTimerStore((s) => s.completedCycles);
  const { prefs: breakPrefs } = useFocusBreakPreferences();

  const isActive = isClient ? rawIsActive : false;
  const isPaused = isClient ? rawIsPaused : false;
  const mode = isClient ? rawMode : "POMO";
  const phase = isClient ? rawPhase : "WORK";
  const target = isClient ? rawTarget : null;
  const totalDurationSeconds = isClient
    ? rawTotalDurationSeconds
    : DEFAULT_POMO_MINUTES * 60;
  const hasElapsedSeconds = isClient ? rawHasElapsedSeconds : false;
  const canComplete = isClient ? rawCanComplete : false;
  const isPartialPomo = isClient ? rawIsPartialPomo : false;
  const isOvertime = isClient ? rawIsOvertime : false;
  const isSavingSession = isClient ? rawIsSavingSession : false;
  const isCompletingLinkedTask = isClient ? rawIsCompletingLinkedTask : false;
  const isSessionRewardCapped = isClient ? rawIsSessionRewardCapped : false;
  const completedCycles = isClient ? rawCompletedCycles : 0;
  const nextBreakMinutes = getNextFocusBreakMinutes(
    completedCycles,
    breakPrefs,
  );

  return {
    isActive,
    isPaused,
    isRunning: isActive && !isPaused,
    mode,
    phase,
    target,
    totalDurationSeconds,
    hasElapsedSeconds,
    canComplete,
    isPartialPomo,
    isOvertime,
    isSavingSession,
    isCompletingLinkedTask,
    isSessionRewardCapped,
    nextBreakMinutes,
    ...STATIC_FOCUS_TIMER_ACTIONS,
  };
}

/**
 * Hook para componentes que exibem a CONTAGEM EM TEMPO REAL (a cada 1 segundo).
 * Usado exclusivamente em componentes-folha visuais (FocusStageTimerCircle, SidebarFocusWidget, FocusPipWidget).
 */
export function useFocusTimerDisplay() {
  const isClient = useIsClient();
  const rawSecondsRemaining = useFocusTimerStore((s) => s.secondsRemaining);
  const rawElapsedSeconds = useFocusTimerStore((s) => s.elapsedSeconds);
  const rawTotalDurationSeconds = useFocusTimerStore(
    (s) => s.totalDurationSeconds,
  );
  const rawMode = useFocusTimerStore((s) => s.mode);
  const rawPhase = useFocusTimerStore((s) => s.phase);
  const rawTarget = useFocusTimerStore((s) => s.target);
  const rawIsActive = useFocusTimerStore((s) => s.isActive);
  const rawIsPaused = useFocusTimerStore((s) => s.isPaused);
  const rawCompletedCycles = useFocusTimerStore((s) => s.completedCycles);
  const { prefs: breakPrefs, cyclesPerBlock } = useFocusBreakPreferences();

  const secondsRemaining = isClient
    ? rawSecondsRemaining
    : DEFAULT_POMO_MINUTES * 60;
  const elapsedSeconds = isClient ? rawElapsedSeconds : 0;
  const totalDurationSeconds = isClient
    ? rawTotalDurationSeconds
    : DEFAULT_POMO_MINUTES * 60;
  const mode = isClient ? rawMode : "POMO";
  const phase = isClient ? rawPhase : "WORK";
  const target = isClient ? rawTarget : null;
  const isActive = isClient ? rawIsActive : false;
  const isPaused = isClient ? rawIsPaused : false;
  const completedCycles = isClient ? rawCompletedCycles : 0;

  const derived = getFocusTimerDerivedState(
    {
      isActive,
      isPaused,
      mode,
      phase,
      secondsRemaining,
      elapsedSeconds,
      totalDurationSeconds,
      completedCycles,
      target,
    },
    breakPrefs,
  );

  const formattedTime = formatFocusDisplayTime({
    mode,
    phase,
    secondsRemaining,
    elapsedSeconds,
    totalDurationSeconds,
    target,
  });

  const progressPercent = getFocusProgressPercent({
    mode,
    phase,
    secondsRemaining,
    elapsedSeconds,
    totalDurationSeconds,
    target,
  });

  return {
    formattedTime,
    progressPercent,
    secondsRemaining,
    elapsedSeconds,
    totalDurationSeconds,
    mode,
    phase,
    isBreak: derived.isBreak,
    isOvertime: derived.isOvertime,
    target,
    isActive,
    isPaused,
    isRunning: derived.isRunning,
    isInventoryItem: derived.isInventory,
    canComplete: derived.canComplete,
    isPartialPomo: derived.isPartialPomo,
    isSessionRewardCapped: derived.isSessionRewardCapped,
    nextBreakMinutes: derived.nextBreakMinutes,
    cyclesPerBlock,
    completedCycles,
  };
}
