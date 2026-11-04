"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AMBIENT_SOUND_OPTIONS } from "@/constants/settings";
import { useSoundPreferencesStore } from "@/store/soundPreferencesStore";
import { useUserStore } from "@/store/userStore";
import type { AmbientSoundType } from "@/types/settings";
import { soundEffects } from "@/utils/soundEffects";

interface UseFocusAudioControlsOptions {
  onRequirePremiumUpgrade?: () => void;
  restoreAmbientOnMount?: boolean;
}

/**
 * Hook compartilhado para controle de notificações do navegador e ruídos de foco ambiente.
 * Elimina a duplicação entre FocusStageAudioControls e SoundNotificationSettings.
 */
export function useFocusAudioControls({
  onRequirePremiumUpgrade,
  restoreAmbientOnMount = false,
}: UseFocusAudioControlsOptions = {}) {
  const t = useTranslations("focus.audio.toasts");
  const tWidget = useTranslations("focusWidget");
  const isPremium = useUserStore((s) => s.is_Premium);
  const {
    uiSoundsEnabled,
    timerSoundsEnabled,
    timerVolume,
    timerSoundType,
    browserNotificationsEnabled,
    ambientSoundType,
    ambientVolume,
    isAmbientPlaying,
    toggleUiSounds,
    toggleTimerSounds,
    setTimerVolume,
    setTimerSoundType,
    setBrowserNotificationsEnabled,
    setAmbientSoundType,
    setAmbientVolume,
    setIsAmbientPlaying,
  } = useSoundPreferencesStore();

  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Restaura o som ambiente caso a página seja recarregada com isAmbientPlaying ativo
  useEffect(() => {
    if (
      restoreAmbientOnMount &&
      isPremium &&
      isAmbientPlaying &&
      ambientSoundType !== "none" &&
      soundEffects.getActiveAmbientType() === "none"
    ) {
      soundEffects.startAmbientSound(ambientSoundType, ambientVolume);
    }
  }, [
    restoreAmbientOnMount,
    isPremium,
    isAmbientPlaying,
    ambientSoundType,
    ambientVolume,
  ]);

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
        setBrowserNotificationsEnabled(false);
        toast.info(t("notificationsMuted"));
        return;
      }

      if (Notification.permission === "granted") {
        setNotificationPermission("granted");
        setBrowserNotificationsEnabled(true);
        toast.success(t("notificationsEnabled"));
        return;
      }

      if (Notification.permission === "denied") {
        setNotificationPermission("denied");
        setBrowserNotificationsEnabled(false);
        toast.error(t("notificationsBlocked"));
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission === "granted") {
          setBrowserNotificationsEnabled(true);
          toast.success(t("notificationsGranted"));
        } else {
          setBrowserNotificationsEnabled(false);
          if (permission === "denied") {
            toast.error(t("notificationsDenied"));
          }
        }
      } catch (_e) {
        toast.error(t("notificationsRequestError"));
      }
    },
    [browserNotificationsEnabled, setBrowserNotificationsEnabled, t],
  );

  const selectAmbientSound = useCallback(
    (type: AmbientSoundType) => {
      if (type !== "none" && !isPremium) {
        toast.info(t("ambientPremiumRequired"));
        onRequirePremiumUpgrade?.();
        return;
      }

      if (type === "none") {
        soundEffects.stopAmbientSound();
        setAmbientSoundType("none");
        setIsAmbientPlaying(false);
        toast.info(t("ambientOff"));
        return;
      }

      setAmbientSoundType(type);
      setIsAmbientPlaying(true);
      soundEffects.startAmbientSound(type, ambientVolume);

      const soundLabel = tWidget.has(
        `ambientSounds.${type}` as Parameters<typeof tWidget.has>[0],
      )
        ? tWidget(`ambientSounds.${type}` as Parameters<typeof tWidget>[0])
        : AMBIENT_SOUND_OPTIONS.find((s) => s.id === type)?.label || type;
      toast.success(t("ambientOn", { label: soundLabel }));
    },
    [
      isPremium,
      ambientVolume,
      onRequirePremiumUpgrade,
      setAmbientSoundType,
      setIsAmbientPlaying,
      t,
      tWidget,
    ],
  );

  const changeAmbientVolume = useCallback(
    (newVol: number) => {
      setAmbientVolume(newVol);
      soundEffects.setAmbientVolume(newVol);
    },
    [setAmbientVolume],
  );

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
    ambientVolume,
    isAmbientPlaying,
    toggleUiSounds,
    toggleTimerSounds,
    setTimerVolume,
    setTimerSoundType,
    toggleBrowserNotifications,
    selectAmbientSound,
    changeAmbientVolume,
  };
}
