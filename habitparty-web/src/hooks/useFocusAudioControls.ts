"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  clearAmbientPausedByTimer,
  startAmbientAudio,
  stopAmbientAudio,
  syncAmbientOnMount,
  useFocusAmbientSyncStore,
} from "@/store/focus/focusAmbientSync";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import { useUserStore } from "@/store/userStore";
import type { AmbientSoundType } from "@/types/settings";
import { soundEffects } from "@/utils/soundEffects";

const AMBIENT_VOLUME_PERSIST_DEBOUNCE_MS = 150;

const soundPrefActions = {
  toggleUiSounds: () => useSoundPreferencesStore.getState().toggleUiSounds(),
  toggleTimerSounds: () =>
    useSoundPreferencesStore.getState().toggleTimerSounds(),
  setTimerVolume: (vol: number) =>
    useSoundPreferencesStore.getState().setTimerVolume(vol),
  setTimerSoundType: (
    type: Parameters<
      ReturnType<typeof useSoundPreferencesStore.getState>["setTimerSoundType"]
    >[0],
  ) => useSoundPreferencesStore.getState().setTimerSoundType(type),
  setBrowserNotificationsEnabled: (enabled: boolean) =>
    useSoundPreferencesStore.getState().setBrowserNotificationsEnabled(enabled),
  setAmbientSoundType: (type: AmbientSoundType) =>
    useSoundPreferencesStore.getState().setAmbientSoundType(type),
  setAmbientVolume: (vol: number) =>
    useSoundPreferencesStore.getState().setAmbientVolume(vol),
  setIsAmbientPlaying: (playing: boolean) =>
    useSoundPreferencesStore.getState().setIsAmbientPlaying(playing),
};

interface UseFocusAudioControlsOptions {
  initialIsPremium?: boolean;
  onRequirePremiumUpgrade?: () => void;
  restoreAmbientOnMount?: boolean;
}

/**
 * Hook compartilhado para controle de notificações do navegador e ruídos de foco ambiente.
 * Elimina a duplicação entre FocusStageAudioControls e SoundNotificationSettings.
 */
export function useFocusAudioControls({
  initialIsPremium = false,
  onRequirePremiumUpgrade,
  restoreAmbientOnMount = false,
}: UseFocusAudioControlsOptions = {}) {
  const t = useTranslations("focus.audio.toasts");
  const hasHydratedUser = useUserStore((s) => s.user !== null);
  const storeIsPremium = useUserStore((s) => s.is_Premium);
  const isPremium = hasHydratedUser ? storeIsPremium : initialIsPremium;

  const uiSoundsEnabled = useSoundPreferencesStore((s) => s.uiSoundsEnabled);
  const timerSoundsEnabled = useSoundPreferencesStore(
    (s) => s.timerSoundsEnabled,
  );
  const timerVolume = useSoundPreferencesStore((s) => s.timerVolume);
  const timerSoundType = useSoundPreferencesStore((s) => s.timerSoundType);
  const browserNotificationsEnabled = useSoundPreferencesStore(
    (s) => s.browserNotificationsEnabled,
  );
  const ambientSoundType = useSoundPreferencesStore((s) => s.ambientSoundType);
  const storedAmbientVolume = useSoundPreferencesStore((s) => s.ambientVolume);
  const storedIsAmbientPlaying = useSoundPreferencesStore(
    (s) => s.isAmbientPlaying,
  );
  const isAmbientPausedByTimer = useFocusAmbientSyncStore(
    (s) => s.isPausedByTimer,
  );
  const isAmbientAudioActive = useFocusAmbientSyncStore((s) => s.isAudioActive);
  const isAmbientPlaying =
    storedIsAmbientPlaying &&
    !isAmbientPausedByTimer &&
    isAmbientAudioActive &&
    ambientSoundType !== "none";

  const [liveAmbientVolume, setLiveAmbientVolume] =
    useState<number>(storedAmbientVolume);
  const pendingVolumePersistRef = useRef<number | null>(null);
  const volumeDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Sincroniza volume caso alterado por outro componente (ex.: Configurações)
  useEffect(() => {
    if (pendingVolumePersistRef.current === null) {
      setLiveAmbientVolume(storedAmbientVolume);
    }
  }, [storedAmbientVolume]);

  useEffect(() => {
    return () => {
      if (volumeDebounceTimerRef.current !== null) {
        clearTimeout(volumeDebounceTimerRef.current);
        volumeDebounceTimerRef.current = null;
      }
      if (pendingVolumePersistRef.current !== null) {
        soundPrefActions.setAmbientVolume(pendingVolumePersistRef.current);
        pendingVolumePersistRef.current = null;
      }
    };
  }, []);

  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [mounted, setMounted] = useState(false);
  const hasSyncedOnMountRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Se o plano Premium expirar enquanto o som ambiente estava marcado como ativo, encerra e limpa o estado.
  // Aguarda a hidratação do userStore para não apagar a preferência salva de usuários Pro no reload.
  useEffect(() => {
    if (!hasHydratedUser) return;
    if (!storeIsPremium && storedIsAmbientPlaying) {
      stopAmbientAudio();
      clearAmbientPausedByTimer();
      soundPrefActions.setIsAmbientPlaying(false);
    }
  }, [hasHydratedUser, storeIsPremium, storedIsAmbientPlaying]);

  // Restaura o som ambiente caso a página seja recarregada com isAmbientPlaying ativo,
  // respeitando a preferência de sincronizar o som ambiente com o estado do timer
  useEffect(() => {
    if (hasSyncedOnMountRef.current) return;
    if (restoreAmbientOnMount && !hasHydratedUser) return;
    syncAmbientOnMount({
      isPremium,
      restoreAmbient: restoreAmbientOnMount,
      timerState: useFocusTimerStore.getState(),
    });
    hasSyncedOnMountRef.current = true;
  }, [restoreAmbientOnMount, hasHydratedUser, isPremium]);

  const hasNotificationPermission = notificationPermission === "granted";

  const toggleBrowserNotifications = useCallback(
    async (explicitNextState?: boolean) => {
      if (typeof window === "undefined" || !("Notification" in window)) {
        toast.error(t("notificationsUnsupported"));
        return;
      }

      const targetEnabled =
        explicitNextState !== undefined
          ? explicitNextState
          : !(
              browserNotificationsEnabled &&
              Notification.permission === "granted"
            );

      if (!targetEnabled) {
        soundPrefActions.setBrowserNotificationsEnabled(false);
        toast.info(t("notificationsMuted"));
        return;
      }

      if (Notification.permission === "granted") {
        setNotificationPermission("granted");
        soundPrefActions.setBrowserNotificationsEnabled(true);
        toast.success(t("notificationsEnabled"));
        return;
      }

      if (Notification.permission === "denied") {
        setNotificationPermission("denied");
        soundPrefActions.setBrowserNotificationsEnabled(false);
        toast.error(t("notificationsBlocked"));
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission === "granted") {
          soundPrefActions.setBrowserNotificationsEnabled(true);
          toast.success(t("notificationsGranted"));
        } else {
          soundPrefActions.setBrowserNotificationsEnabled(false);
          if (permission === "denied") {
            toast.error(t("notificationsDenied"));
          }
        }
      } catch (_e) {
        toast.error(t("notificationsRequestError"));
      }
    },
    [browserNotificationsEnabled, t],
  );

  const selectAmbientSound = useCallback(
    (type: AmbientSoundType) => {
      if (type !== "none" && !isPremium) {
        toast.info(t("ambientPremiumRequired"));
        onRequirePremiumUpgrade?.();
        return;
      }

      hasSyncedOnMountRef.current = true;

      if (type === "none") {
        stopAmbientAudio();
        clearAmbientPausedByTimer();
        soundPrefActions.setAmbientSoundType("none");
        soundPrefActions.setIsAmbientPlaying(false);
        return;
      }

      // Clicar novamente no mesmo som ambiente em reprodução pausa a prévia
      if (type === ambientSoundType && isAmbientPlaying) {
        stopAmbientAudio();
        clearAmbientPausedByTimer();
        soundPrefActions.setIsAmbientPlaying(false);
        return;
      }

      clearAmbientPausedByTimer();
      soundPrefActions.setAmbientSoundType(type);
      soundPrefActions.setIsAmbientPlaying(true);
      startAmbientAudio(type, liveAmbientVolume);
    },
    [
      isPremium,
      ambientSoundType,
      isAmbientPlaying,
      liveAmbientVolume,
      onRequirePremiumUpgrade,
      t,
    ],
  );

  const toggleAmbientPlayback = useCallback(() => {
    if (ambientSoundType === "none") return;
    if (!isPremium) {
      toast.info(t("ambientPremiumRequired"));
      onRequirePremiumUpgrade?.();
      return;
    }

    hasSyncedOnMountRef.current = true;

    if (isAmbientPlaying) {
      stopAmbientAudio();
      clearAmbientPausedByTimer();
      soundPrefActions.setIsAmbientPlaying(false);
    } else {
      clearAmbientPausedByTimer();
      soundPrefActions.setIsAmbientPlaying(true);
      startAmbientAudio(ambientSoundType, liveAmbientVolume);
    }
  }, [
    ambientSoundType,
    isPremium,
    isAmbientPlaying,
    liveAmbientVolume,
    onRequirePremiumUpgrade,
    t,
  ]);

  const changeAmbientVolume = useCallback((newVol: number) => {
    setLiveAmbientVolume(newVol);
    soundEffects.setAmbientVolume(newVol);
    pendingVolumePersistRef.current = newVol;

    if (volumeDebounceTimerRef.current !== null) {
      clearTimeout(volumeDebounceTimerRef.current);
    }
    volumeDebounceTimerRef.current = setTimeout(() => {
      volumeDebounceTimerRef.current = null;
      const toPersist = pendingVolumePersistRef.current;
      pendingVolumePersistRef.current = null;
      if (toPersist !== null) {
        soundPrefActions.setAmbientVolume(toPersist);
      }
    }, AMBIENT_VOLUME_PERSIST_DEBOUNCE_MS);
  }, []);

  return {
    mounted,
    isPremium,
    uiSoundsEnabled,
    timerSoundsEnabled,
    timerVolume,
    timerSoundType,
    browserNotificationsEnabled,
    notificationPermission,
    hasNotificationPermission,
    ambientSoundType,
    ambientVolume: liveAmbientVolume,
    isAmbientPlaying,
    toggleUiSounds: soundPrefActions.toggleUiSounds,
    toggleTimerSounds: soundPrefActions.toggleTimerSounds,
    setTimerVolume: soundPrefActions.setTimerVolume,
    setTimerSoundType: soundPrefActions.setTimerSoundType,
    toggleBrowserNotifications,
    selectAmbientSound,
    toggleAmbientPlayback,
    changeAmbientVolume,
  };
}
