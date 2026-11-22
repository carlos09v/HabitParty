import { toast } from "sonner";
import { DEFAULT_POMO_MINUTES } from "@/constants/focus";
import {
  buildIdleTimerPatch,
  type FocusStoreGetter,
  type FocusStoreSetter,
} from "@/store/focus/focusTimerState";
import { stopGlobalTicker } from "@/store/focus/focusTimerTicker";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import {
  sendBrowserNotification,
  updateDocumentTitle,
} from "@/utils/focusTimerBrowser";
import { tNotifMsg, tStoreMsg } from "@/utils/focusTimerMessages";
import { soundEffects } from "@/utils/soundEffects";

/**
 * Executa a transição de 1 tick da store do timer de foco, protegendo contra
 * retrocesso do relógio e duplicação de disparos entre Worker, PiP e visibilitychange.
 */
export function executeFocusTick(set: FocusStoreSetter, get: FocusStoreGetter) {
  const state = get();
  if (!state.isActive || state.isPaused || state.isSavingSession) {
    stopGlobalTicker();
    return;
  }

  const now = Date.now();
  const elapsedMs = state.lastTickTimestamp
    ? now - state.lastTickTimestamp
    : 1000;

  // Se o relógio do sistema recuou (> 1.5s), reancora para evitar congelamento
  if (elapsedMs < -1500) {
    set({ lastTickTimestamp: now });
    return;
  }

  // Evita avanço duplicado caso visibilitychange, Worker e PiP disparem no mesmo segundo
  if (elapsedMs < 900) {
    return;
  }

  const delta = state.lastTickTimestamp
    ? elapsedMs < 1000
      ? 1
      : Math.floor(elapsedMs / 1000)
    : 1;
  const nextTickTimestamp = state.lastTickTimestamp
    ? state.lastTickTimestamp + delta * 1000
    : now;

  const isBreak = state.phase === "SHORT_BREAK" || state.phase === "LONG_BREAK";
  const isWorkPomo =
    !isBreak && state.mode === "POMO" && state.target?.type !== "inventory";
  const isCountdown =
    state.mode === "POMO" || state.target?.type === "inventory" || isBreak;

  if (isWorkPomo) {
    const nextElapsed = state.elapsedSeconds + delta;
    const nextRemaining = Math.max(0, state.secondsRemaining - delta);
    const justCompletedCycle =
      !state.hasTriggeredOvertimeAlert && nextRemaining === 0;

    set({
      secondsRemaining: nextRemaining,
      elapsedSeconds: nextElapsed,
      lastTickTimestamp: nextTickTimestamp,
      hasTriggeredOvertimeAlert:
        state.hasTriggeredOvertimeAlert || justCompletedCycle,
    });
    updateDocumentTitle(get());

    if (justCompletedCycle) {
      if (useSoundPreferencesStore.getState().timerSoundsEnabled) {
        soundEffects.playFocusSessionCompleteSound();
      }
      triggerCelebrationConfetti();
      toast.success(tStoreMsg("overtimeStartedToast"));
      sendBrowserNotification(
        tNotifMsg("overtimeStartedTitle"),
        tNotifMsg("overtimeStartedBody"),
      );
    }
    return;
  }

  if (isCountdown) {
    if (state.secondsRemaining <= delta) {
      // Ciclo concluído (Pausa ou Cupom de Mochila): soma exatamente os segundos restantes
      stopGlobalTicker();
      const finalElapsed = state.elapsedSeconds + state.secondsRemaining;
      set({
        secondsRemaining: 0,
        elapsedSeconds: finalElapsed,
        lastTickTimestamp: null,
      });

      const soundPrefs = useSoundPreferencesStore.getState();

      // 1. Pausa concluída (SHORT_BREAK ou LONG_BREAK)
      if (isBreak) {
        if (soundPrefs.timerSoundsEnabled) {
          soundEffects.playBreakEndSound();
        }
        const workDuration =
          (state.target?.targetMinutes || DEFAULT_POMO_MINUTES) * 60;
        set(buildIdleTimerPatch(workDuration));
        updateDocumentTitle(get());
        toast.info(tStoreMsg("breakCompletedToast"));
        sendBrowserNotification(
          tNotifMsg("breakEndedTitle"),
          tNotifMsg("breakEndedBody"),
        );
        return;
      }

      // 2. Caso cupom de inventário ou outro countdown
      get().completeSession();
      return;
    }

    set((prev) => ({
      secondsRemaining: Math.max(0, prev.secondsRemaining - delta),
      elapsedSeconds: prev.elapsedSeconds + delta,
      lastTickTimestamp: nextTickTimestamp,
    }));
    updateDocumentTitle(get());
  } else {
    // Cronômetro livre (enquanto a aba estiver aberta)
    set((prev) => ({
      elapsedSeconds: prev.elapsedSeconds + delta,
      lastTickTimestamp: nextTickTimestamp,
    }));
    updateDocumentTitle(get());
  }
}
