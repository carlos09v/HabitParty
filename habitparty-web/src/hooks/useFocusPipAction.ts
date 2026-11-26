"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { useFocusPipState } from "@/utils/focusPipState";

/**
 * Hook unificado para abrir/alternar a janela Picture-in-Picture carregando o motor
 * Canvas/Document PiP sob demanda apenas quando o usuário interage com o botão.
 */
export function useFocusPipAction() {
  const t = useTranslations("focusWidget.pip");
  const { isGamified } = useExperienceMode();
  const { isOpen, isSupported } = useFocusPipState();

  const handleTogglePip = useCallback(async () => {
    const { buildVideoPipFrameData, toggleFocusPip } = await import(
      "@/utils/focusPip"
    );
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

    return toggleFocusPip({
      windowTitle: t("windowTitle"),
      initialVideoFrame,
      isInitiallyRunning: timerState.isActive && !timerState.isPaused,
      onUnsupported: () => toast.info(t("unsupported")),
    });
  }, [isGamified, t]);

  return {
    isPipOpen: isOpen,
    isPipSupported: isSupported,
    togglePip: handleTogglePip,
  };
}
