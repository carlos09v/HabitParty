import {
  CheckCircle2,
  Coffee,
  ExternalLink,
  FastForward,
  Loader2,
  Lock,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils";

export interface FocusTimerActionButtonsProps {
  variant: "stage" | "zen" | "pip";
  isActive: boolean;
  isPaused: boolean;
  isRunning: boolean;
  isBreak: boolean;
  isOvertime: boolean;
  canComplete: boolean;
  isPartialPomo?: boolean;
  isSavingSession?: boolean;
  isTargetLocked?: boolean;
  hasTarget?: boolean;
  nextBreakMinutes: number;
  onToggleTimer: () => void;
  onStartBreak?: () => void;
  onComplete: () => void;
  onSkipBreak: () => void;
  onResetTimer?: () => void;
  onOpenUpgradeModal?: () => void;
  onSelectTargetFallback?: () => void;
}

export interface FocusTimerActionButtonsLabels {
  toolbarAria?: string;
  selectTargetPrompt?: string;
  lockedTitle?: string;
  lockedButton?: string;
  primaryTitle?: string;
  pauseLabel: string;
  resumeLabel: string;
  startLabel: string;
  skipBreakTitle?: string;
  skipBreakLabel: string;
  startBreakTitle?: string;
  startBreakLabel: string;
  completeTitle?: string;
  completeAriaLabel?: string;
  completeLabel?: string;
  resetTitle?: string;
  resetAriaLabel?: string;
}

interface FocusTimerActionButtonsViewProps
  extends Omit<
    FocusTimerActionButtonsProps,
    "nextBreakMinutes" | "isPartialPomo"
  > {
  labels: FocusTimerActionButtonsLabels;
}

const VARIANT_CLASSES = {
  stage: {
    container: "flex flex-wrap items-center gap-2 w-full",
    primary:
      "flex-1 min-w-[150px] py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-[transform,background-color,color] duration-150 cursor-pointer shadow-md disabled:opacity-60 disabled:cursor-not-allowed",
    primaryBreak:
      "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-sm dark:shadow-[0_0_16px_rgba(16,185,129,0.4)]",
    primaryRunning:
      "bg-amber-500 hover:bg-amber-600 text-neutral-950 shadow-amber-500/20",
    primaryIdle:
      "bg-gold hover:bg-gold-hover text-on-gold shadow-glow-gold-md hover:scale-[1.01]",
    skipBreak:
      "shrink-0 py-2.5 px-3 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
    startBreak:
      "shrink-0 py-2.5 px-3.5 rounded-xl border border-cyan-500/45 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-800 dark:text-cyan-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-[transform,background-color,border-color,color] duration-150 cursor-pointer shadow-sm hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed",
    complete:
      "shrink-0 py-2.5 px-3.5 rounded-xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-[transform,background-color,border-color,color] duration-150 cursor-pointer shadow-sm hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed",
    reset:
      "shrink-0 w-10 h-10 rounded-xl border border-primary/30 bg-surface/80 text-neutral-300 hover:text-gold hover:border-gold/50 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
    iconPrimary: 16,
    iconSecondary: 15,
    iconSkip: 14,
    iconReset: 15,
  },
  zen: {
    container:
      "flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-5 sm:mt-7 w-full max-w-md px-2",
    primary:
      "px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2.5 transition-[transform,background-color,color] duration-150 cursor-pointer shadow-xl disabled:opacity-60 disabled:cursor-not-allowed",
    primaryBreak:
      "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-md dark:shadow-[0_0_24px_rgba(16,185,129,0.5)]",
    primaryRunning: "bg-amber-500 hover:bg-amber-600 text-neutral-950",
    primaryIdle:
      "bg-gold hover:bg-gold-hover text-on-gold shadow-glow-gold-md hover:scale-105",
    skipBreak:
      "px-5 py-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg opacity-100 pointer-fine:opacity-75 hover:opacity-100 focus-visible:opacity-100 transition-[opacity,background-color,border-color,color] duration-150 disabled:opacity-40 disabled:cursor-not-allowed",
    startBreak:
      "px-5 py-4 rounded-2xl border border-cyan-600/45 dark:border-cyan-400/50 bg-cyan-500/15 dark:bg-cyan-500/20 hover:bg-cyan-500/25 dark:hover:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 font-bold text-sm flex items-center gap-2 cursor-pointer shadow-lg transition-[opacity,background-color,border-color,color] duration-150 disabled:opacity-60 disabled:cursor-not-allowed",
    complete:
      "w-14 h-14 rounded-2xl border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center transition-[opacity,background-color,border-color,color] duration-150 cursor-pointer shadow-lg opacity-100 pointer-fine:opacity-75 hover:opacity-100 focus-visible:opacity-100 disabled:opacity-60 disabled:cursor-not-allowed",
    reset:
      "w-14 h-14 rounded-2xl border border-neutral-700 bg-card/80 dark:bg-surface/80 text-neutral-300 hover:text-gold hover:border-gold/50 flex items-center justify-center transition-[opacity,color,border-color,background-color] duration-150 cursor-pointer shadow-lg opacity-100 pointer-fine:opacity-75 hover:opacity-100 focus-visible:opacity-100 disabled:opacity-40 disabled:cursor-not-allowed",
    iconPrimary: 22,
    iconSecondary: 18,
    iconSkip: 18,
    iconReset: 22,
  },
  pip: {
    container: "flex items-center gap-1.5 shrink-0 flex-wrap",
    primary:
      "flex-1 min-w-0 py-1.5 sm:py-2 px-3 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap",
    primaryBreak:
      "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-neutral-950",
    primaryRunning: "bg-amber-500 hover:bg-amber-600 text-neutral-950",
    primaryIdle: "bg-gold hover:bg-gold-hover text-on-gold shadow-glow-gold-xs",
    skipBreak:
      "py-1.5 sm:py-2 px-3 rounded-xl border border-emerald-600/40 dark:border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-bold text-xs inline-flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap",
    startBreak:
      "py-1.5 sm:py-2 px-2.5 rounded-xl border border-cyan-600/45 dark:border-cyan-500/45 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-800 dark:text-cyan-200 font-bold text-xs inline-flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap",
    complete:
      "py-1.5 sm:py-2 px-3 rounded-xl border border-emerald-600/40 dark:border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs inline-flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap",
    reset: "",
    iconPrimary: 14,
    iconSecondary: 13,
    iconSkip: 13,
    iconReset: 14,
  },
} as const;

/**
 * Componente puramente apresentacional da barra de ações do Timer de Foco.
 * Recebe rótulos já traduzidos para evitar carregar namespaces fora de escopo (ex.: no Document PiP).
 */
export function FocusTimerActionButtonsView({
  variant,
  isActive,
  isPaused,
  isRunning,
  isBreak,
  isOvertime,
  canComplete,
  isSavingSession = false,
  isTargetLocked = false,
  hasTarget = true,
  onToggleTimer,
  onStartBreak,
  onComplete,
  onSkipBreak,
  onResetTimer,
  onOpenUpgradeModal,
  onSelectTargetFallback,
  labels,
}: FocusTimerActionButtonsViewProps) {
  const styles = VARIANT_CLASSES[variant];
  const isResuming = isActive && isPaused;

  const resetButton =
    variant !== "pip" && isActive && onResetTimer ? (
      <button
        type="button"
        disabled={isSavingSession}
        onClick={onResetTimer}
        title={labels.resetTitle}
        aria-label={labels.resetAriaLabel ?? labels.resetTitle}
        className={styles.reset}
      >
        <RotateCcw size={styles.iconReset} aria-hidden="true" />
      </button>
    ) : null;

  const primaryButton =
    (variant === "stage" || variant === "zen") &&
    isTargetLocked &&
    !isRunning ? (
      <button
        type="button"
        onClick={onOpenUpgradeModal}
        title={labels.lockedTitle}
        className={cn(
          "font-bold flex items-center justify-center gap-2 transition-[transform,background-color,color] duration-150 cursor-pointer shadow-md bg-gold hover:bg-gold-hover text-on-gold shadow-glow-gold-md",
          variant === "zen"
            ? "px-7 sm:px-10 py-3.5 sm:py-4 rounded-2xl text-body-m sm:text-subtitle-m hover:scale-[1.03]"
            : "flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-sm hover:scale-[1.01]",
        )}
      >
        <Lock size={variant === "zen" ? 18 : 16} />
        <span>{labels.lockedButton}</span>
      </button>
    ) : variant === "pip" && !hasTarget ? (
      <button
        type="button"
        onClick={onSelectTargetFallback}
        className="flex-1 min-w-0 py-1.5 sm:py-2 px-3 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/80 hover:border-amber-500/50 dark:hover:border-gold/50 text-neutral-100 transition-colors cursor-pointer shadow-2xs dark:shadow-none"
      >
        <ExternalLink size={13} className="text-gold shrink-0" />
        <span className="truncate">{labels.selectTargetPrompt}</span>
      </button>
    ) : (
      <button
        type="button"
        disabled={isSavingSession}
        onClick={onToggleTimer}
        title={labels.primaryTitle}
        className={cn(
          styles.primary,
          isBreak
            ? styles.primaryBreak
            : isRunning
              ? styles.primaryRunning
              : styles.primaryIdle,
        )}
      >
        {isRunning ? (
          <>
            <Pause
              size={styles.iconPrimary}
              className={cn("fill-current", variant === "stage" && "shrink-0")}
            />
            <span className={variant === "stage" ? "truncate" : undefined}>
              {labels.pauseLabel}
            </span>
          </>
        ) : (
          <>
            <Play
              size={styles.iconPrimary}
              className={cn(
                "fill-current",
                variant !== "pip" && "ml-0.5",
                variant === "stage" && "shrink-0",
              )}
            />
            <span className={variant === "stage" ? "truncate" : undefined}>
              {isResuming ? labels.resumeLabel : labels.startLabel}
            </span>
          </>
        )}
      </button>
    );

  const skipBreakButton = isBreak ? (
    <button
      type="button"
      disabled={isSavingSession}
      onClick={onSkipBreak}
      title={labels.skipBreakTitle}
      className={styles.skipBreak}
    >
      <FastForward
        size={styles.iconSkip}
        className={variant === "stage" ? "shrink-0" : undefined}
      />
      <span>{labels.skipBreakLabel}</span>
    </button>
  ) : null;

  const startBreakButton =
    isOvertime && !isBreak && onStartBreak ? (
      <button
        type="button"
        disabled={isSavingSession}
        aria-busy={variant !== "zen" ? isSavingSession : undefined}
        onClick={onStartBreak}
        title={labels.startBreakTitle}
        className={styles.startBreak}
      >
        {isSavingSession ? (
          <Loader2
            size={styles.iconSecondary}
            className={cn("animate-spin", variant === "stage" && "shrink-0")}
          />
        ) : (
          <Coffee
            size={styles.iconSecondary}
            className={variant === "stage" ? "shrink-0" : undefined}
          />
        )}
        <span>{labels.startBreakLabel}</span>
      </button>
    ) : null;

  const completeButton =
    canComplete && !isBreak ? (
      <button
        type="button"
        disabled={isSavingSession}
        aria-busy={isSavingSession}
        onClick={onComplete}
        title={labels.completeTitle}
        aria-label={labels.completeAriaLabel}
        className={styles.complete}
      >
        {isSavingSession ? (
          <Loader2
            size={variant === "zen" ? 24 : styles.iconSecondary}
            className={cn("animate-spin", variant === "stage" && "shrink-0")}
          />
        ) : (
          <CheckCircle2
            size={variant === "zen" ? 24 : styles.iconSecondary}
            className={variant === "stage" ? "shrink-0" : undefined}
          />
        )}
        {labels.completeLabel && <span>{labels.completeLabel}</span>}
      </button>
    ) : null;

  if (variant === "stage") {
    return (
      <div
        role="toolbar"
        aria-label={labels.toolbarAria}
        className={styles.container}
      >
        {primaryButton}
        {startBreakButton}
        {completeButton}
        {skipBreakButton}
        {resetButton}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {variant === "zen" && resetButton}
      {primaryButton}
      {skipBreakButton}
      {startBreakButton}
      {completeButton}
    </div>
  );
}

function PipTimerActionButtons(props: FocusTimerActionButtonsProps) {
  const tPip = useTranslations("focusWidget.pip");
  const { isPartialPomo = false, nextBreakMinutes, ...rest } = props;

  return (
    <FocusTimerActionButtonsView
      {...rest}
      labels={{
        selectTargetPrompt: tPip("selectActivityPrompt"),
        pauseLabel: tPip("pause"),
        resumeLabel: tPip("resume"),
        startLabel: tPip("start"),
        skipBreakLabel: tPip("skipBreak"),
        startBreakLabel: tPip("startBreak", { minutes: nextBreakMinutes }),
        completeLabel: isPartialPomo ? tPip("savePartial") : tPip("complete"),
      }}
    />
  );
}

function ZenTimerActionButtons(props: FocusTimerActionButtonsProps) {
  const tZen = useTranslations("focus.zenMode");
  const {
    isPartialPomo = false,
    isSavingSession = false,
    nextBreakMinutes,
    ...rest
  } = props;
  const completeLabelText = isSavingSession
    ? tZen("savingSessionTitle")
    : isPartialPomo
      ? tZen("savePartialTitle")
      : tZen("completeTitle");

  return (
    <FocusTimerActionButtonsView
      {...rest}
      isSavingSession={isSavingSession}
      labels={{
        lockedTitle: tZen("lockedTitle"),
        lockedButton: tZen("lockedButton"),
        resetTitle: tZen("resetTitle"),
        resetAriaLabel: tZen("resetTitle"),
        pauseLabel: tZen("pause"),
        resumeLabel: tZen("resume"),
        startLabel: tZen("start"),
        skipBreakTitle: tZen("skipBreakTitle"),
        skipBreakLabel: tZen("skipBreak"),
        startBreakTitle: isSavingSession
          ? tZen("savingSessionTitle")
          : tZen("startBreakTitle", { minutes: nextBreakMinutes }),
        startBreakLabel: tZen("startBreakButton", {
          minutes: nextBreakMinutes,
        }),
        completeTitle: completeLabelText,
        completeAriaLabel: completeLabelText,
      }}
    />
  );
}

function StageTimerActionButtons(props: FocusTimerActionButtonsProps) {
  const tHero = useTranslations("focus.hero");
  const {
    isPartialPomo = false,
    isSavingSession = false,
    nextBreakMinutes,
    ...rest
  } = props;

  return (
    <FocusTimerActionButtonsView
      {...rest}
      isSavingSession={isSavingSession}
      labels={{
        toolbarAria: tHero("controlsToolbarAria"),
        lockedTitle: tHero("lockedActivityTitle"),
        lockedButton: tHero("lockedActivityButton"),
        primaryTitle: tHero("spaceShortcutTitle"),
        pauseLabel: tHero("pauseFocus"),
        resumeLabel: tHero("resumeFocus"),
        startLabel: tHero("startFocus"),
        startBreakTitle: tHero("startBreakTitle", {
          minutes: nextBreakMinutes,
        }),
        startBreakLabel: isSavingSession
          ? tHero("savingSessionButton")
          : tHero("startBreakButton", { minutes: nextBreakMinutes }),
        completeTitle: isPartialPomo
          ? tHero("savePartialTitle")
          : tHero("completeSessionTitle"),
        completeLabel: isSavingSession
          ? tHero("savingSessionButton")
          : isPartialPomo
            ? tHero("savePartialButton")
            : tHero("completeSessionButton"),
        skipBreakTitle: tHero("skipBreakTitle"),
        skipBreakLabel: tHero("skipBreakButton"),
        resetTitle: tHero("resetTitle"),
        resetAriaLabel: tHero("resetButton"),
      }}
    />
  );
}

/**
 * Barra unificada de ações do Timer de Foco compartilhada entre
 * Palco principal (`stage`), Modo Zen (`zen`) e Picture-in-Picture (`pip`).
 * Cada variante carrega apenas o namespace de traduções presente no seu escopo.
 */
export function FocusTimerActionButtons(props: FocusTimerActionButtonsProps) {
  if (props.variant === "pip") {
    return <PipTimerActionButtons {...props} />;
  }
  if (props.variant === "zen") {
    return <ZenTimerActionButtons {...props} />;
  }
  return <StageTimerActionButtons {...props} />;
}
