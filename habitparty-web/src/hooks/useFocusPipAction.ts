"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { buildVideoPipFrameData, useFocusPip } from "@/utils/focusPip";

/**
 * Hook unificado para abrir/alternar a janela Picture-in-Picture com título traduzido,
 * frame inicial sincronizado no modo fallback de vídeo e aviso quando não suportado.
 */
export function useFocusPipAction() {
  const t = useTranslations("focusWidget.pip");
  const { isGamified } = useExperienceMode();
  const { isOpen, isSupported, togglePip } = useFocusPip();

  const handleTogglePip = useCallback(async () => {
    const timerState = useFocusTimerStore.getState();
    const initialVideoFrame = buildVideoPipFrameData(timerState, {
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

    return togglePip({
      windowTitle: t("windowTitle"),
      initialVideoFrame,
      isInitiallyRunning: timerState.isActive && !timerState.isPaused,
      onUnsupported: () => toast.info(t("unsupported")),
    });
  }, [isGamified, t, togglePip]);

  return {
    isPipOpen: isOpen,
    isPipSupported: isSupported,
    togglePip: handleTogglePip,
  };
}
