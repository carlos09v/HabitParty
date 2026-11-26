import {
  ArrowRightLeft,
  Lock,
  type LucideIcon,
  Maximize2,
  PictureInPicture2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFocusPipAction } from "@/hooks/useFocusPipAction";
import type {
  FocusActiveTarget,
  FocusPhase,
  FocusRecordType,
} from "@/types/focus";
import { cn } from "@/utils";
import { FocusStageAudioControls } from "./FocusStageAudioControls";
import { FocusTimerSettingsPopover } from "./FocusTimerSettingsPopover";

interface FocusStageHeaderBarProps {
  target: FocusActiveTarget | null;
  TargetIcon: LucideIcon;
  phase: FocusPhase;
  mode: FocusRecordType;
  totalDurationSeconds?: number;
  isBreak: boolean;
  isOvertime?: boolean;
  isRunning: boolean;
  isActive: boolean;
  isInventoryItem: boolean;
  isTargetLocked: boolean;
  initialIsPremium?: boolean;
  /** Oculta a instância duplicada de controles de áudio quando o Modo Zen está ativo. */
  hideAudioControls?: boolean;
  onOpenTargetModal: () => void;
  onChangeMode: (mode: FocusRecordType) => void;
  onOpenZenMode: () => void;
  onOpenUpgradeModal?: () => void;
}

export function FocusStageHeaderBar({
  target,
  TargetIcon,
  phase,
  mode,
  totalDurationSeconds,
  isBreak,
  isOvertime = false,
  isRunning,
  isActive,
  isInventoryItem,
  isTargetLocked,
  initialIsPremium = false,
  hideAudioControls = false,
  onOpenTargetModal,
  onChangeMode,
  onOpenZenMode,
  onOpenUpgradeModal,
}: FocusStageHeaderBarProps) {
  const t = useTranslations("focus.hero");
  const { isGamified } = useExperienceMode();
  const { isPipOpen, isPipSupported, togglePip } = useFocusPipAction();

  return (
    <div className="relative z-30 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-2 sm:mb-3">
      {/* Esquerda: Alvo Ativo / Seleção */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            "rounded-xl flex items-center justify-center shrink-0 border transition-colors duration-300 w-9 h-9 sm:w-10 sm:h-10",
            isBreak
              ? "bg-emerald-500/15 dark:bg-emerald-500/20 border-emerald-500/45 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400 dark:shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              : isRunning
                ? "bg-amber-500/15 dark:bg-gold/20 border-amber-500/60 dark:border-gold/70 text-amber-700 dark:text-gold shadow-glow-gold-xs motion-safe:animate-pulse"
                : "bg-surface dark:bg-surface/90 border-neutral-700 dark:border-primary/40 text-neutral-200",
          )}
        >
          <TargetIcon size={18} aria-hidden="true" />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h2 className="font-bold text-neutral-100 text-subtitle-s sm:text-subtitle-m truncate max-w-[180px] sm:max-w-sm md:max-w-md">
              {target?.name || t("noActivitySelected")}
            </h2>

            {/* Badge da Fase Atual (pulsa apenas quando rodando ativamente e respeitando reduced-motion) */}
            {isBreak ? (
              <span
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/45 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold shrink-0 whitespace-nowrap",
                  isRunning && "motion-safe:animate-pulse",
                )}
              >
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400"
                />
                {totalDurationSeconds
                  ? phase === "LONG_BREAK"
                    ? t("longBreakBadgeDynamic", {
                        minutes: Math.max(
                          1,
                          Math.round(totalDurationSeconds / 60),
                        ),
                      })
                    : t("shortBreakBadgeDynamic", {
                        minutes: Math.max(
                          1,
                          Math.round(totalDurationSeconds / 60),
                        ),
                      })
                  : phase === "LONG_BREAK"
                    ? t("longBreakBadge")
                    : t("shortBreakBadge")}
              </span>
            ) : isOvertime ? (
              <span
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/15 dark:bg-cyan-500/20 border border-cyan-500/45 text-cyan-800 dark:text-cyan-300 text-[11px] font-bold shrink-0 whitespace-nowrap",
                  isRunning && "motion-safe:animate-pulse",
                )}
              >
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full bg-cyan-500 dark:bg-cyan-400"
                />
                {t("overtimeBadge")}
              </span>
            ) : isRunning ? (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 dark:bg-gold/20 border border-amber-500/45 dark:border-gold/50 text-amber-800 dark:text-gold text-[11px] font-bold motion-safe:animate-pulse shrink-0 whitespace-nowrap">
                <span
                  aria-hidden="true"
                  className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-gold"
                />
                {t("activeFocusBadge")}
              </span>
            ) : null}

            {/* Badge de Alvo Bloqueado (Plano Pro) ou Tipo Ativo */}
            {isTargetLocked ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 dark:bg-gold/20 border border-amber-500/40 dark:border-gold/40 text-amber-800 dark:text-gold shrink-0 whitespace-nowrap flex items-center gap-1">
                <Lock size={10} aria-hidden="true" />
                {t("pausedBadge")}
              </span>
            ) : isInventoryItem || isActive ? (
              <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-surface border border-neutral-700 dark:border-primary/30 text-neutral-300 shrink-0 whitespace-nowrap">
                {isInventoryItem
                  ? isGamified
                    ? t("modeBackpackCouponGamified")
                    : t("modeBackpackCouponProductivity")
                  : mode === "POMO"
                    ? t("modePomodoro")
                    : t("modeFreeStopwatch")}
              </span>
            ) : null}

            {/* Botão para Trocar/Vincular Alvo (alvo ≥ 28px / 36px touch) */}
            <button
              type="button"
              onClick={onOpenTargetModal}
              className="inline-flex items-center gap-1 min-h-7 pointer-coarse:min-h-9 px-2 py-1 rounded-lg text-xs font-semibold text-amber-700 hover:text-amber-800 dark:text-gold dark:hover:text-gold-hover hover:bg-amber-500/10 dark:hover:bg-gold/10 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              <ArrowRightLeft size={12} aria-hidden="true" />
              <span>{target ? t("switchTarget") : t("linkTarget")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Direita: Controles enxutos (Modo, Áudio unificado, Configs, PiP, Modo Zen) */}
      <div className="flex items-center gap-2 flex-wrap ml-auto sm:shrink-0">
        {/* Switcher Pomodoro / Cronômetro */}
        {!isInventoryItem && !isActive && (
          <div
            role="radiogroup"
            aria-label={t("modeSwitcherAria")}
            className="flex items-center rounded-xl bg-surface dark:bg-surface/90 p-1 border border-neutral-700 dark:border-primary/35 shadow-inner"
          >
            {/* biome-ignore lint/a11y/useSemanticElements: Segmented buttons in radiogroup toolbar pattern */}
            <button
              type="button"
              role="radio"
              aria-checked={mode === "POMO"}
              onClick={() => onChangeMode("POMO")}
              className={cn(
                "min-h-7 pointer-coarse:min-h-9 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer",
                mode === "POMO"
                  ? "bg-gold text-on-gold shadow-glow-gold-xs"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
            >
              {t("modePomodoro")}
            </button>
            {/* biome-ignore lint/a11y/useSemanticElements: Segmented buttons in radiogroup toolbar pattern */}
            <button
              type="button"
              role="radio"
              aria-checked={mode === "STOPWATCH"}
              onClick={() => onChangeMode("STOPWATCH")}
              className={cn(
                "min-h-7 pointer-coarse:min-h-9 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer",
                mode === "STOPWATCH"
                  ? "bg-gold text-on-gold shadow-glow-gold-xs"
                  : "text-neutral-400 hover:text-neutral-200",
              )}
            >
              {t("modeStopwatch")}
            </button>
          </div>
        )}

        {/* Controle Unificado de Áudio & Alertas (desmontado enquanto o Modo Zen está ativo) */}
        {!hideAudioControls && (
          <FocusStageAudioControls
            initialIsPremium={initialIsPremium}
            onOpenUpgradeModal={onOpenUpgradeModal}
          />
        )}

        {/* Preferências do Timer Pomodoro */}
        <FocusTimerSettingsPopover />

        {/* Botão Picture-in-Picture / Timer Flutuante */}
        {isPipSupported && (
          <button
            type="button"
            onClick={() => void togglePip()}
            aria-pressed={isPipOpen}
            aria-label={t("pipButton")}
            title={isPipOpen ? t("pipCloseTitle") : t("pipOpenTitle")}
            className={cn(
              "flex items-center gap-1.5 min-h-8 pointer-coarse:min-h-9 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer shadow-2xs dark:shadow-sm group",
              isPipOpen
                ? "border-gold/60 bg-gold/15 text-amber-800 dark:text-gold"
                : "border-neutral-700 dark:border-primary/30 bg-surface dark:bg-surface/90 hover:bg-amber-500/15 dark:hover:bg-gold/15 hover:border-amber-500/45 dark:hover:border-gold/50 text-neutral-200 hover:text-amber-700 dark:hover:text-gold",
            )}
          >
            <PictureInPicture2
              size={14}
              aria-hidden="true"
              className="group-hover:scale-110 transition-transform text-amber-800 dark:text-gold"
            />
            <span className="hidden md:inline">{t("pipButton")}</span>
          </button>
        )}

        {/* Botão Modo Zen / Tela Cheia */}
        <button
          type="button"
          onClick={onOpenZenMode}
          aria-label={t("zenModeTitle")}
          title={t("zenModeTitle")}
          className="flex items-center gap-1.5 min-h-8 pointer-coarse:min-h-9 px-2.5 sm:px-3 py-1.5 rounded-xl border border-neutral-700 dark:border-primary/30 bg-surface dark:bg-surface/90 hover:bg-amber-500/15 dark:hover:bg-gold/15 hover:border-amber-500/45 dark:hover:border-gold/50 text-neutral-200 hover:text-amber-700 dark:hover:text-gold text-xs font-bold transition-colors cursor-pointer shadow-2xs dark:shadow-sm group"
        >
          <Maximize2
            size={14}
            aria-hidden="true"
            className="group-hover:scale-110 transition-transform text-amber-800 dark:text-gold"
          />
          <span className="hidden sm:inline">{t("zenModeButton")}</span>
        </button>
      </div>
    </div>
  );
}
