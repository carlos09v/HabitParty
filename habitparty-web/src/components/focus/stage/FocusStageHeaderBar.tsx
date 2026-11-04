"use client";

import { ArrowRightLeft, Lock, type LucideIcon, Maximize2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type {
  FocusActiveTarget,
  FocusPhase,
  FocusRecordType,
} from "@/types/focus";
import { cn } from "@/utils";
import { FocusStageAudioControls } from "./FocusStageAudioControls";

interface FocusStageHeaderBarProps {
  target: FocusActiveTarget | null;
  TargetIcon: LucideIcon;
  phase: FocusPhase;
  mode: FocusRecordType;
  isBreak: boolean;
  isRunning: boolean;
  isActive: boolean;
  isInventoryItem: boolean;
  isTargetLocked: boolean;
  isSoundEnabled: boolean;
  timerSoundType: "zen" | "arcade";
  onOpenTargetModal: () => void;
  onChangeMode: (mode: FocusRecordType) => void;
  onToggleSound: () => void;
  onChangeSoundType: (type: "zen" | "arcade") => void;
  onOpenZenMode: () => void;
  onOpenUpgradeModal?: () => void;
}

export const FocusStageHeaderBar = memo(function FocusStageHeaderBar({
  target,
  TargetIcon,
  phase,
  mode,
  isBreak,
  isRunning,
  isActive,
  isInventoryItem,
  isTargetLocked,
  isSoundEnabled,
  timerSoundType,
  onOpenTargetModal,
  onChangeMode,
  onToggleSound,
  onChangeSoundType,
  onOpenZenMode,
  onOpenUpgradeModal,
}: FocusStageHeaderBarProps) {
  const t = useTranslations("focus.hero");
  const { isGamified } = useExperienceMode();

  return (
    <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 mb-2 sm:mb-3">
      {/* Esquerda: Alvo Ativo / Seleção */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 w-9 h-9 sm:w-10 sm:h-10",
            isBreak
              ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              : isRunning
                ? "bg-gold/20 border-gold/70 text-gold shadow-glow-gold-xs animate-pulse"
                : "bg-surface/90 border-primary/40 text-neutral-200",
          )}
        >
          <TargetIcon size={18} />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-neutral-100 text-subtitle-s sm:text-subtitle-m truncate max-w-[180px] xs:max-w-xs sm:max-w-md">
              {target?.name || t("noActivitySelected")}
            </h3>

            {/* Badge da Fase Atual */}
            {isBreak ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-label-g font-bold animate-pulse shrink-0 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {phase === "LONG_BREAK"
                  ? t("longBreakBadge")
                  : t("shortBreakBadge")}
              </span>
            ) : isRunning ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gold/20 border border-gold/50 text-gold text-label-g font-bold animate-pulse shrink-0 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                {t("activeFocusBadge")}
              </span>
            ) : null}

            {/* Badge do Tipo de Alvo */}
            {isTargetLocked ? (
              <span className="text-tiny px-2 py-0.5 rounded-full font-bold bg-gold/20 border border-gold/40 text-gold shrink-0 whitespace-nowrap flex items-center gap-1">
                <Lock size={10} />
                {t("pausedBadge")}
              </span>
            ) : (
              <span className="text-tiny px-2 py-0.5 rounded-full font-semibold bg-surface border border-primary/30 text-neutral-300 shrink-0 whitespace-nowrap">
                {isInventoryItem
                  ? isGamified
                    ? t("modeBackpackCouponGamified")
                    : t("modeBackpackCouponProductivity")
                  : mode === "POMO"
                    ? t("modePomodoro")
                    : t("modeFreeStopwatch")}
              </span>
            )}

            {/* Botão para Trocar/Vincular Alvo */}
            <button
              type="button"
              onClick={onOpenTargetModal}
              className="inline-flex items-center gap-1 text-label-g font-semibold text-gold hover:text-gold-hover hover:underline cursor-pointer ml-1 shrink-0 whitespace-nowrap"
            >
              <ArrowRightLeft size={11} />
              <span>{target ? t("switchTarget") : t("linkTarget")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Direita: Switcher Modo + Áudio + Botão Modo Zen */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap ml-auto shrink-0">
        {/* Switcher Pomodoro / Cronômetro */}
        {!isInventoryItem && !isActive && (
          <div className="flex items-center rounded-xl bg-surface dark:bg-surface/90 p-1 border border-neutral-700 dark:border-primary/35 shadow-inner">
            <button
              type="button"
              onClick={() => onChangeMode("POMO")}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                mode === "POMO"
                  ? "bg-gold text-on-gold shadow-glow-gold-xs"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
            >
              {t("modePomodoro")}
            </button>
            <button
              type="button"
              onClick={() => onChangeMode("STOPWATCH")}
              className={cn(
                "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                mode === "STOPWATCH"
                  ? "bg-gold text-on-gold shadow-glow-gold-xs"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
            >
              {t("modeStopwatch")}
            </button>
          </div>
        )}

        {/* Controles de Som */}
        <FocusStageAudioControls
          isSoundEnabled={isSoundEnabled}
          timerSoundType={timerSoundType}
          onToggleSound={onToggleSound}
          onChangeSoundType={onChangeSoundType}
          onOpenUpgradeModal={onOpenUpgradeModal}
        />

        {/* Botão Modo Zen / Tela Cheia */}
        <button
          type="button"
          onClick={onOpenZenMode}
          title={t("zenModeTitle")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-700 dark:border-primary/30 bg-surface dark:bg-surface/90 hover:bg-gold/15 hover:border-gold/50 text-neutral-200 hover:text-gold text-xs font-bold transition-all cursor-pointer shadow-2xs dark:shadow-sm group"
        >
          <Maximize2
            size={14}
            className="group-hover:scale-110 transition-transform text-gold"
          />
          <span className="hidden sm:inline">{t("zenModeButton")}</span>
        </button>
      </div>
    </div>
  );
});
