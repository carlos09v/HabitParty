import { create } from "zustand";
import { useFocusPreferencesStore } from "@/store/focusPreferencesStore";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import { useUserStore } from "@/store/userStore";
import type { FocusPhase } from "@/types/focus";
import { soundEffects } from "@/utils/soundEffects";

interface FocusAmbientSyncState {
  isPausedByTimer: boolean;
  isAudioActive: boolean;
  setPausedByTimer: (paused: boolean) => void;
  setAudioActive: (active: boolean) => void;
}

/**
 * Estado efêmero (não persistido) que indica quando o som ambiente foi silenciado
 * automaticamente pela preferência `pauseAmbientWithTimer` e se há áudio ambiente
 * realmente em execução na sessão atual do navegador.
 */
export const useFocusAmbientSyncStore = create<FocusAmbientSyncState>()(
  (set) => ({
    isPausedByTimer: false,
    isAudioActive: false,
    setPausedByTimer: (paused) =>
      set((state) =>
        state.isPausedByTimer === paused ? state : { isPausedByTimer: paused },
      ),
    setAudioActive: (active) =>
      set((state) =>
        state.isAudioActive === active ? state : { isAudioActive: active },
      ),
  }),
);

// Mantém isAudioActive sincronizado mesmo quando AudioContext.resume() resolve de forma assíncrona
soundEffects.subscribeAmbientState((activeType) => {
  useFocusAmbientSyncStore.getState().setAudioActive(activeType !== "none");
});

export function startAmbientAudio(
  type: Parameters<typeof soundEffects.startAmbientSound>[0],
  volume?: number,
): void {
  soundEffects.startAmbientSound(type, volume);
  useFocusAmbientSyncStore
    .getState()
    .setAudioActive(soundEffects.getActiveAmbientType() !== "none");
}

export function stopAmbientAudio(): void {
  soundEffects.stopAmbientSound();
  useFocusAmbientSyncStore.getState().setAudioActive(false);
}

export function isFocusTimerRunningWork(timerState: {
  isActive: boolean;
  isPaused: boolean;
  phase: FocusPhase;
}): boolean {
  return (
    timerState.isActive && !timerState.isPaused && timerState.phase === "WORK"
  );
}

export function clearAmbientPausedByTimer(): void {
  useFocusAmbientSyncStore.getState().setPausedByTimer(false);
}

/**
 * Retoma o som ambiente armado quando o timer entra em foco ativo.
 */
export function resumeAmbientIfArmed(): void {
  const soundPrefs = useSoundPreferencesStore.getState();
  useFocusAmbientSyncStore.getState().setPausedByTimer(false);
  if (!useUserStore.getState().is_Premium) {
    return;
  }
  if (
    soundPrefs.isAmbientPlaying &&
    soundPrefs.ambientSoundType !== "none" &&
    soundEffects.getActiveAmbientType() !== soundPrefs.ambientSoundType
  ) {
    startAmbientAudio(soundPrefs.ambientSoundType, soundPrefs.ambientVolume);
  }
}

/**
 * Toca o alerta de início do timer e opcionalmente retoma o som ambiente armado.
 */
export function playFocusStartSounds(withAmbient = false): void {
  const soundPrefs = useSoundPreferencesStore.getState();
  if (soundPrefs.timerSoundsEnabled) {
    const vol = soundPrefs.timerVolume ?? 0.8;
    soundEffects.playTimerStartSound(soundPrefs.timerSoundType, vol);
  }
  if (withAmbient) {
    resumeAmbientIfArmed();
  }
}

/**
 * Silencia o som ambiente caso a sincronização com o timer esteja habilitada,
 * marcando-o como pausado pelo timer para manter a UI consistente.
 */
export function pauseAmbientIfSynced(): void {
  if (!useFocusPreferencesStore.getState().pauseAmbientWithTimer) {
    return;
  }
  stopAmbientAudio();
  const soundPrefs = useSoundPreferencesStore.getState();
  const shouldMarkPaused =
    soundPrefs.isAmbientPlaying && soundPrefs.ambientSoundType !== "none";
  useFocusAmbientSyncStore.getState().setPausedByTimer(shouldMarkPaused);
}

/**
 * Reconcilia imediatamente o áudio ambiente quando o usuário altera `pauseAmbientWithTimer`
 * (ou restaura padrões) nas preferências do timer.
 */
export function reconcileAmbientWithTimerPreference(
  pauseAmbientWithTimer: boolean,
  timerState: {
    isActive: boolean;
    isPaused: boolean;
    phase: FocusPhase;
  },
): void {
  const soundPrefs = useSoundPreferencesStore.getState();
  if (!soundPrefs.isAmbientPlaying || soundPrefs.ambientSoundType === "none") {
    useFocusAmbientSyncStore.getState().setPausedByTimer(false);
    return;
  }

  const isRunningWork = isFocusTimerRunningWork(timerState);
  if (pauseAmbientWithTimer) {
    if (!isRunningWork) {
      stopAmbientAudio();
      useFocusAmbientSyncStore.getState().setPausedByTimer(true);
    } else {
      useFocusAmbientSyncStore.getState().setPausedByTimer(false);
    }
    return;
  }

  const isPausedByTimer = useFocusAmbientSyncStore.getState().isPausedByTimer;
  if (
    isPausedByTimer ||
    soundEffects.getActiveAmbientType() !== soundPrefs.ambientSoundType
  ) {
    useFocusAmbientSyncStore.getState().setPausedByTimer(false);
    if (useUserStore.getState().is_Premium) {
      startAmbientAudio(soundPrefs.ambientSoundType, soundPrefs.ambientVolume);
    }
  }
}

/**
 * Sincroniza o estado do som ambiente na montagem inicial (ex.: após reload),
 * refletindo se o áudio está pausado pelo timer ou restaurando a reprodução quando permitido.
 */
export function syncAmbientOnMount({
  isPremium,
  restoreAmbient,
  timerState,
}: {
  isPremium: boolean;
  restoreAmbient: boolean;
  timerState: {
    isActive: boolean;
    isPaused: boolean;
    phase: FocusPhase;
  };
}): void {
  const soundPrefs = useSoundPreferencesStore.getState();
  if (!soundPrefs.isAmbientPlaying || soundPrefs.ambientSoundType === "none") {
    useFocusAmbientSyncStore.getState().setPausedByTimer(false);
    useFocusAmbientSyncStore.getState().setAudioActive(false);
    return;
  }

  if (soundEffects.getActiveAmbientType() !== "none") {
    useFocusAmbientSyncStore.getState().setPausedByTimer(false);
    useFocusAmbientSyncStore.getState().setAudioActive(true);
    return;
  }

  const pauseAmbientWithTimer =
    useFocusPreferencesStore.getState().pauseAmbientWithTimer;
  const isRunningWork = isFocusTimerRunningWork(timerState);

  if (pauseAmbientWithTimer && !isRunningWork) {
    useFocusAmbientSyncStore.getState().setPausedByTimer(true);
    useFocusAmbientSyncStore.getState().setAudioActive(false);
    return;
  }

  if (restoreAmbient && isPremium) {
    useFocusAmbientSyncStore.getState().setPausedByTimer(false);
    startAmbientAudio(soundPrefs.ambientSoundType, soundPrefs.ambientVolume);
  } else {
    useFocusAmbientSyncStore.getState().setAudioActive(false);
  }
}
