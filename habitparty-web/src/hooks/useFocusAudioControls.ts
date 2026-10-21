"use client";

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
        toast.error("Notificações não suportadas neste navegador.");
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
        toast.info("Notificações do navegador silenciadas.");
        return;
      }

      if (Notification.permission === "granted") {
        setNotificationPermission("granted");
        setBrowserNotificationsEnabled(true);
        toast.success(
          "Notificações do navegador ativadas para o fim do Pomodoro!",
        );
        return;
      }

      if (Notification.permission === "denied") {
        setNotificationPermission("denied");
        setBrowserNotificationsEnabled(false);
        toast.error(
          "Permissão bloqueada no navegador. Habilite as notificações nas configurações do site.",
        );
        return;
      }

      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission === "granted") {
          setBrowserNotificationsEnabled(true);
          toast.success(
            "Notificações permitidas! Você será avisado ao fim de cada Pomodoro.",
          );
        } else {
          setBrowserNotificationsEnabled(false);
          if (permission === "denied") {
            toast.error("Permissão de notificação negada.");
          }
        }
      } catch (_e) {
        toast.error("Não foi possível solicitar permissão para notificações.");
      }
    },
    [browserNotificationsEnabled, setBrowserNotificationsEnabled],
  );

  const selectAmbientSound = useCallback(
    (type: AmbientSoundType) => {
      if (type !== "none" && !isPremium) {
        toast.info(
          "Sons de foco ambiente são exclusivos para assinantes Premium! Faça o upgrade para desbloquear.",
        );
        onRequirePremiumUpgrade?.();
        return;
      }

      if (type === "none") {
        soundEffects.stopAmbientSound();
        setAmbientSoundType("none");
        setIsAmbientPlaying(false);
        toast.info("Som ambiente desligado.");
        return;
      }

      setAmbientSoundType(type);
      setIsAmbientPlaying(true);
      soundEffects.startAmbientSound(type, ambientVolume);

      const soundLabel =
        AMBIENT_SOUND_OPTIONS.find((s) => s.id === type)?.label || type;
      toast.success(`Som ambiente ativado: ${soundLabel}`);
    },
    [
      isPremium,
      ambientVolume,
      onRequirePremiumUpgrade,
      setAmbientSoundType,
      setIsAmbientPlaying,
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
