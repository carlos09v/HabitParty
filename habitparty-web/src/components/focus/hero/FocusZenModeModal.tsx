"use client";

import {
  CheckCircle2,
  Coffee,
  FastForward,
  Loader2,
  Minimize2,
  Moon,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Sun,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFocusPipAction } from "@/hooks/useFocusPipAction";
import { useThemeMode } from "@/hooks/useThemeMode";
import type {
  FocusActiveTarget,
  FocusPhase,
  FocusRecordType,
} from "@/types/focus";
import type { TimerSoundType } from "@/types/settings";
import { cn } from "@/utils";
import { FocusDailyYieldBadge } from "../stage/FocusDailyYieldBadge";
import { FocusStageAudioControls } from "../stage/FocusStageAudioControls";
import { FocusStageTimerCircle } from "../stage/FocusStageTimerCircle";

interface FocusZenModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBreak: boolean;
  isOvertime?: boolean;
  nextBreakMinutes?: number;
  isRunning: boolean;
  isActive: boolean;
  isSavingSession?: boolean;
  isSessionRewardCapped?: boolean;
  todayProductiveMinutes?: number;
  mode: FocusRecordType;
  phase: FocusPhase;
  target: FocusActiveTarget | null;
  canComplete: boolean;
  isSoundEnabled: boolean;
  timerSoundType: TimerSoundType;
  TargetIcon: React.ComponentType<{ size?: number; className?: string }>;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onSkipBreak: () => void;
  onStartBreak?: () => void;
  onComplete: () => void;
  onToggleSound: () => void;
  onChangeSoundType: (type: TimerSoundType) => void;
  onOpenUpgradeModal?: () => void;
}

/**
 * Modo Zen em tela cheia para foco imersivo sem distrações.
 * Extraído do FocusHeroStage para melhorar manutenibilidade e modularização.
 */
export function FocusZenModeModal({
  isOpen,
  onClose,
  isBreak,
  isOvertime = false,
  nextBreakMinutes = 5,
  isRunning,
  isActive,
  isSavingSession = false,
  isSessionRewardCapped = false,
  todayProductiveMinutes,
  mode,
  target,
  canComplete,
  isSoundEnabled,
  timerSoundType,
  TargetIcon,
  onToggleTimer,
  onResetTimer,
  onSkipBreak,
  onStartBreak,
  onComplete,
  onToggleSound,
  onChangeSoundType,
  onOpenUpgradeModal,
}: FocusZenModeModalProps) {
  const t = useTranslations("focus.zenMode");
  const { isGamified } = useExperienceMode();
  const { isLight } = useThemeMode();
  const { isPipOpen, isPipSupported, togglePip } = useFocusPipAction();
  const [isLightsOff, setIsLightsOff] = useState(false);

  // Fecha o Modo Zen com a tecla Esc e bloqueia scroll do body enquanto aberto
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const isDimmed = isLight && isLightsOff;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("dialogAria")}
      className={cn(
        "fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-10 md:p-12 overflow-y-auto overscroll-contain custom-scrollbar select-none animate-in fade-in duration-200 transition-colors",
        isDimmed
          ? "zen-dimmed-dark bg-background"
          : "bg-surface dark:bg-background",
      )}
    >
      {/* Fundo Cósmico / Santuário Difuso com Aura Radial Suave */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-1000",
          isBreak
            ? "bg-[radial-gradient(ellipse_at_center,_rgba(20,122,56,0.10)_0%,_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.12)_0%,_transparent_70%)]"
            : "bg-[radial-gradient(ellipse_at_center,_rgba(245,184,21,0.12)_0%,_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(234,179,8,0.10)_0%,_transparent_70%)]",
        )}
      />

      {/* Top Bar Zen: Info do Alvo + Dimmer Local + Botão Fechar (controles periféricos atenuados) */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 w-full max-w-4xl mx-auto opacity-80 sm:opacity-60 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border shrink-0",
              isBreak
                ? "bg-emerald-500/15 dark:bg-emerald-500/20 border-emerald-500/45 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                : "bg-amber-500/15 dark:bg-gold/20 border-amber-500/45 dark:border-gold/50 text-gold-ink dark:text-gold",
            )}
          >
            <TargetIcon size={20} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-neutral-100 text-body-m truncate">
              {target?.name || t("defaultTitle")}
            </span>
            <span className="text-tiny text-neutral-400 truncate">
              {isBreak
                ? t("restorativeBreak")
                : mode === "POMO"
                  ? t("pomodoroCycle")
                  : t("stopwatch")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          <span className="text-tiny text-neutral-400 hidden md:inline">
            {t.rich("pressEscHint", {
              kbd: (chunks) => (
                <kbd className="px-1.5 py-0.5 rounded bg-card/80 dark:bg-surface border border-neutral-700 text-neutral-300">
                  {chunks}
                </kbd>
              ),
            })}
          </span>

          {isLight && (
            <button
              type="button"
              onClick={() => setIsLightsOff((prev) => !prev)}
              aria-pressed={isLightsOff}
              className={cn(
                "flex items-center gap-1.5 px-2.5 sm:px-3 min-h-9 rounded-xl border text-xs font-semibold transition-colors cursor-pointer",
                isLightsOff
                  ? "border-gold/50 bg-gold/15 text-gold hover:bg-gold/25"
                  : "border-neutral-700 bg-card/80 text-neutral-300 hover:text-neutral-50 hover:border-neutral-500 shadow-2xs",
              )}
              title={isLightsOff ? t("lightsOnTitle") : t("lightsOffTitle")}
            >
              {isLightsOff ? <Sun size={15} /> : <Moon size={15} />}
              <span className="hidden min-[380px]:inline">
                {isLightsOff ? t("lightsOnButton") : t("lightsOffButton")}
              </span>
            </button>
          )}

          {isPipSupported && (
            <button
              type="button"
              onClick={() => void togglePip()}
              aria-pressed={isPipOpen}
              className={cn(
                "flex items-center gap-1.5 px-2.5 sm:px-3 min-h-9 rounded-xl border text-xs font-semibold transition-colors cursor-pointer",
                isPipOpen
                  ? "border-gold/50 bg-gold/15 text-gold hover:bg-gold/25"
                  : "border-neutral-700 bg-card/80 dark:bg-surface/80 text-neutral-300 hover:text-neutral-50 dark:hover:text-white hover:border-neutral-500",
              )}
              title={isPipOpen ? t("pipCloseTitle") : t("pipOpenTitle")}
            >
              <PictureInPicture2 size={15} />
              <span className="hidden min-[380px]:inline">
                {t("pipButton")}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 min-h-9 rounded-xl border border-neutral-700 bg-card/80 dark:bg-surface/80 text-neutral-300 hover:text-neutral-50 dark:hover:text-white hover:border-neutral-500 transition-colors cursor-pointer"
            title={t("exitTitle")}
            aria-label={t("exitTitle")}
          >
            <Minimize2 size={16} />
            <span className="text-xs font-semibold">{t("exitButton")}</span>
          </button>
        </div>
      </div>

      {/* Centro Zen: Timer Gigante */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-4 w-full">
        <FocusStageTimerCircle size="zen" onToggle={onToggleTimer} />

        {isSessionRewardCapped && (
          <div
            title={
              isGamified
                ? t("sessionCapReachedTitle")
                : t("sessionCapReachedTitleProductivity")
            }
            className={cn(
              "mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold shadow-2xs",
              isGamified
                ? "border-amber-500/40 bg-amber-500/12 text-amber-700 dark:text-amber-300"
                : "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
            )}
          >
            <span>
              {isGamified
                ? t("sessionCapReachedBadge")
                : t("sessionCapReachedBadgeProductivity")}
            </span>
          </div>
        )}

        {typeof todayProductiveMinutes === "number" && (
          <FocusDailyYieldBadge
            todayProductiveMinutes={todayProductiveMinutes}
            size="md"
            className="mt-2"
          />
        )}

        {/* Controles de Ação no Modo Zen */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8 w-full max-w-md px-2">
          {isActive && (
            <button
              type="button"
              disabled={isSavingSession}
              onClick={onResetTimer}
              title={t("resetTitle")}
              aria-label={t("resetTitle")}
              className="w-14 h-14 rounded-2xl border border-neutral-700 bg-card/80 dark:bg-surface/80 text-neutral-300 hover:text-gold hover:border-gold/50 flex items-center justify-center transition-[opacity,color,border-color,background-color] duration-150 cursor-pointer shadow-lg opacity-60 hover:opacity-100 focus-visible:opacity-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw size={22} />
            </button>
          )}

          <button
            type="button"
            disabled={isSavingSession}
            onClick={onToggleTimer}
            className={cn(
              "px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2.5 transition-[transform,background-color,color] duration-150 cursor-pointer shadow-xl disabled:opacity-60 disabled:cursor-not-allowed",
              isBreak
                ? "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md dark:shadow-[0_0_24px_rgba(16,185,129,0.5)]"
                : isRunning
                  ? "bg-amber-500 hover:bg-amber-600 text-neutral-950"
                  : "bg-gold hover:bg-gold-hover text-on-gold shadow-glow-gold-md hover:scale-105",
            )}
          >
            {isRunning ? (
              <>
                <Pause size={22} className="fill-current" />
                <span>{t("pause")}</span>
              </>
            ) : (
              <>
                <Play size={22} className="fill-current ml-0.5" />
                <span>{isActive ? t("resume") : t("start")}</span>
              </>
            )}
          </button>

          {isBreak && (
            <button
              type="button"
              disabled={isSavingSession}
              onClick={onSkipBreak}
              title={t("skipBreakTitle")}
              className="px-5 py-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg opacity-60 hover:opacity-100 focus-visible:opacity-100 transition-[opacity,background-color,border-color,color] duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FastForward size={18} />
              <span>{t("skipBreak")}</span>
            </button>
          )}

          {isOvertime && !isBreak && onStartBreak && (
            <button
              type="button"
              disabled={isSavingSession}
              onClick={onStartBreak}
              title={
                isSavingSession
                  ? t("savingSessionTitle")
                  : t("startBreakTitle", { minutes: nextBreakMinutes })
              }
              className="px-5 py-4 rounded-2xl border border-cyan-600/45 dark:border-cyan-400/50 bg-cyan-500/15 dark:bg-cyan-500/20 hover:bg-cyan-500/25 dark:hover:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg transition-[opacity,background-color,border-color,color] duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingSession ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Coffee size={18} />
              )}
              <span>
                {t("startBreakButton", { minutes: nextBreakMinutes })}
              </span>
            </button>
          )}

          {canComplete && !isBreak && (
            <button
              type="button"
              disabled={isSavingSession}
              aria-busy={isSavingSession}
              onClick={onComplete}
              title={
                isSavingSession ? t("savingSessionTitle") : t("completeTitle")
              }
              aria-label={
                isSavingSession ? t("savingSessionTitle") : t("completeTitle")
              }
              className="w-14 h-14 rounded-2xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-[opacity,background-color,border-color,color] duration-150 cursor-pointer shadow-lg opacity-60 hover:opacity-100 focus-visible:opacity-100 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSavingSession ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <CheckCircle2 size={24} />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Rodapé Zen: Controles de Áudio (periférico atenuado) */}
      <div className="relative z-10 flex items-center justify-center w-full max-w-md mx-auto pt-4 opacity-80 sm:opacity-60 hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
        <FocusStageAudioControls
          isSoundEnabled={isSoundEnabled}
          timerSoundType={timerSoundType}
          onToggleSound={onToggleSound}
          onChangeSoundType={onChangeSoundType}
          onOpenUpgradeModal={onOpenUpgradeModal}
        />
      </div>
    </div>,
    document.body,
  );
}
