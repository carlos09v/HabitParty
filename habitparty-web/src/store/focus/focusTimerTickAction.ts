import { toast } from "sonner";
import { FOCUS_REWARD_RULES } from "@/constants/focusRules";
import {
  pauseAmbientIfSynced,
  resumeAmbientIfArmed,
} from "@/store/focus/focusAmbientSync";
import {
  buildIdleTimerPatch,
  type FocusStoreGetter,
  type FocusStoreSetter,
  resolveWorkDurationSeconds,
} from "@/store/focus/focusTimerState";
import {
  startGlobalTicker,
  stopGlobalTicker,
} from "@/store/focus/focusTimerTicker";
import { useFocusPreferencesStore } from "@/store/focusPreferencesStore";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import { triggerCelebrationConfetti } from "@/utils/confetti";
import { resolveFocusBreakPlan } from "@/utils/focusFormatters";
import {
  sendBrowserNotification,
  tNotifMsg,
  tStoreMsg,
  updateDocumentTitle,
} from "@/utils/focusTimerBrowser";
import { soundEffects } from "@/utils/soundEffects";

/**
 * Limite máximo de salto contínuo entre ticks (120 min).
 * Acima disso o dispositivo entrou em hibernação/suspensão do SO e não deve somar horas fantasmas
 * no cronômetro nem drenar cupons da mochila silenciosamente.
 */
const MAX_CONTINUOUS_TICK_GAP_SECONDS =
  FOCUS_REWARD_RULES.MAX_EFFECTIVE_MINUTES * 60;

/**
 * Executa a transição de 1 tick da store do timer de foco, protegendo contra
 * retrocesso do relógio, hibernação do SO e duplicação de disparos entre Worker, PiP e visibilitychange.
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

  // Proteção pós-hibernação do SO: pausa sem somar horas fantasmas
  if (delta > MAX_CONTINUOUS_TICK_GAP_SECONDS) {
    stopGlobalTicker();
    pauseAmbientIfSynced();
    set({
      isPaused: true,
      lastTickTimestamp: null,
    });
    updateDocumentTitle(get());
    return;
  }

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
    const focusPrefs = useFocusPreferencesStore.getState();
    const shouldAutoStartBreak =
      justCompletedCycle && focusPrefs.autoStartBreak;

    set({
      secondsRemaining: nextRemaining,
      elapsedSeconds: shouldAutoStartBreak
        ? state.elapsedSeconds + state.secondsRemaining
        : nextElapsed,
      lastTickTimestamp: nextTickTimestamp,
      hasTriggeredOvertimeAlert:
        state.hasTriggeredOvertimeAlert || justCompletedCycle,
    });
    updateDocumentTitle(get());

    if (justCompletedCycle) {
      if (shouldAutoStartBreak) {
        const { isLongBreak: isNextLongBreak, minutes: nextBreakMinutes } =
          resolveFocusBreakPlan(state.completedCycles + 1, focusPrefs);
        const breakLabel = isNextLongBreak
          ? tStoreMsg("longBreakLabelDynamic", { minutes: nextBreakMinutes })
          : tStoreMsg("shortBreakLabelDynamic", { minutes: nextBreakMinutes });

        void get()
          .startBreak()
          .then((started) => {
            if (!started) return;
            triggerCelebrationConfetti();
            const completedCount = get().completedCycles;
            toast.info(
              tStoreMsg("cycleCompletedToast", {
                cycles: completedCount,
                breakLabel,
              }),
            );
            sendBrowserNotification(
              tNotifMsg("cycleCompletedTitle"),
              tNotifMsg("cycleCompletedBody", {
                cycles: completedCount,
                breakLabel,
              }),
            );
          });
        return;
      }

      triggerCelebrationConfetti();
      if (useSoundPreferencesStore.getState().timerSoundsEnabled) {
        soundEffects.playFocusSessionCompleteSound();
      }
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
      stopGlobalTicker();
      const soundPrefs = useSoundPreferencesStore.getState();

      // 1. Pausa concluída (SHORT_BREAK ou LONG_BREAK) — transição única sem duplo set()
      if (isBreak) {
        if (soundPrefs.timerSoundsEnabled) {
          soundEffects.playBreakEndSound();
        }
        const workDuration = resolveWorkDurationSeconds(state);
        const focusPrefs = useFocusPreferencesStore.getState();

        if (
          focusPrefs.autoStartNextCycle &&
          state.target &&
          state.target.type !== "inventory"
        ) {
          set(
            buildIdleTimerPatch(workDuration, {
              isActive: true,
              isPaused: false,
              lastTickTimestamp: Date.now(),
            }),
          );
          resumeAmbientIfArmed();
          updateDocumentTitle(get());
          startGlobalTicker(get().tick);
          toast.success(tStoreMsg("breakCompletedAutoStartToast"));
          sendBrowserNotification(
            tNotifMsg("breakEndedTitle"),
            tNotifMsg("breakEndedAutoStartBody"),
          );
          return;
        }

        set(buildIdleTimerPatch(workDuration));
        pauseAmbientIfSynced();
        updateDocumentTitle(get());
        toast.info(tStoreMsg("breakCompletedToast"));
        sendBrowserNotification(
          tNotifMsg("breakEndedTitle"),
          tNotifMsg("breakEndedBody"),
        );
        return;
      }

      // 2. Cupom de mochila esgotado: pausa explicitamente em 00:00 antes de salvar
      // para evitar loop infinito a 1Hz caso a chamada de API falhe.
      const finalElapsed = state.elapsedSeconds + state.secondsRemaining;
      set({
        isPaused: true,
        secondsRemaining: 0,
        elapsedSeconds: finalElapsed,
        lastTickTimestamp: null,
      });
      updateDocumentTitle(get());
      void get().completeSession();
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
