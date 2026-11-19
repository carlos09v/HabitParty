"use client";

import {
  CheckCircle2,
  Coffee,
  ExternalLink,
  FastForward,
  ListTodo,
  Loader2,
  Pause,
  Play,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFocusTimerDisplay } from "@/hooks/useFocusTimer";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { cn } from "@/utils";
import { closeFocusPip } from "@/utils/focusPip";

export function FocusPipWidget() {
  const router = useRouter();
  const t = useTranslations("focusWidget.pip");
  const { isGamified } = useExperienceMode();
  const {
    formattedTime: displayTime,
    progressPercent,
    isPaused,
    target,
    isRunning,
    isBreak,
    isOvertime,
    canComplete,
    isPartialPomo,
    isSessionRewardCapped,
    nextBreakMinutes,
  } = useFocusTimerDisplay();

  const isSavingSession = useFocusTimerStore((s) => s.isSavingSession);
  const isCompletingLinkedTask = useFocusTimerStore(
    (s) => s.isCompletingLinkedTask,
  );

  const toggleTimer = useFocusTimerStore((s) => s.toggleTimer);
  const startBreak = useFocusTimerStore((s) => s.startBreak);
  const skipBreak = useFocusTimerStore((s) => s.skipBreak);
  const completeSession = useFocusTimerStore((s) => s.completeSession);
  const completeLinkedTask = useFocusTimerStore((s) => s.completeLinkedTask);

  const linkedTaskId =
    target?.taskId || (target?.type === "task" ? target.id : undefined);
  const linkedTaskTitle =
    target?.taskName || (target?.type === "task" ? target.name : undefined);

  const phaseLabel = isBreak
    ? t("phaseBreak")
    : isOvertime
      ? t("phaseOvertime")
      : isRunning
        ? t("phaseFocus")
        : t("phasePaused");

  const handleReturnToFocus = () => {
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/focus"
    ) {
      router.push("/focus");
    }
    window.focus();
  };

  const timerFontClass =
    displayTime.length > 6
      ? "text-[clamp(1.375rem,min(9.5vw,15dvh),2.25rem)]"
      : "text-[clamp(1.5rem,min(11vw,16.5dvh),2.5rem)]";

  return (
    <div className="w-full h-dvh min-h-0 overflow-hidden flex flex-col justify-between bg-background text-neutral-100 p-2.5 sm:p-3 gap-1.5 sm:gap-2 select-none">
      {/* Top Progress Strip */}
      <div className="w-full h-1.5 rounded-full bg-neutral-700 dark:bg-surface overflow-hidden shrink-0">
        <div
          className={cn(
            "h-full transition-[width] duration-500",
            isBreak
              ? "bg-emerald-600 dark:bg-emerald-500"
              : isOvertime
                ? "bg-cyan-600 dark:bg-cyan-400"
                : "bg-amber-600 dark:bg-gold",
          )}
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      {/* Header: Target + Phase + Utility */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                isBreak
                  ? "bg-emerald-600 dark:bg-emerald-500"
                  : isOvertime
                    ? "bg-cyan-600 dark:bg-cyan-400 animate-pulse"
                    : isRunning
                      ? "bg-amber-600 dark:bg-gold animate-pulse"
                      : "bg-neutral-500",
              )}
            />
            <span className="text-xs font-bold text-neutral-50 truncate">
              {target?.name || t("noTarget")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className={cn(
                "text-[11px] font-semibold",
                isBreak
                  ? "text-emerald-700 dark:text-emerald-300"
                  : isOvertime
                    ? "text-cyan-700 dark:text-cyan-300"
                    : isRunning
                      ? "text-amber-800 dark:text-gold"
                      : "text-neutral-300",
              )}
            >
              {phaseLabel}
            </span>
            {isSessionRewardCapped && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-300 leading-none">
                {isGamified
                  ? t("sessionCapBadge")
                  : t("sessionCapBadgeProductivity")}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleReturnToFocus}
            title={t("returnToApp")}
            aria-label={t("returnToApp")}
            className="w-7 h-7 rounded-lg border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/80 hover:border-amber-500/50 dark:hover:border-gold/50 hover:text-amber-700 dark:hover:text-gold text-neutral-200 flex items-center justify-center transition-colors cursor-pointer shadow-2xs dark:shadow-none"
          >
            <ExternalLink size={13} />
          </button>
          <button
            type="button"
            onClick={closeFocusPip}
            title={t("close")}
            aria-label={t("close")}
            className="w-7 h-7 rounded-lg border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/80 hover:border-red-500/50 dark:hover:border-red-500/40 hover:text-red-700 dark:hover:text-red-400 text-neutral-200 flex items-center justify-center transition-colors cursor-pointer shadow-2xs dark:shadow-none"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Main Digital Timer */}
      <div className="flex flex-col items-center justify-center my-auto min-h-0">
        <span
          className={cn(
            "font-mono font-black tracking-tight tabular-nums leading-none",
            timerFontClass,
            isBreak
              ? "text-emerald-700 dark:text-emerald-300"
              : isOvertime
                ? "text-cyan-700 dark:text-cyan-300"
                : isRunning
                  ? "text-gold"
                  : "text-neutral-50",
          )}
        >
          {displayTime}
        </span>

        {linkedTaskId && linkedTaskTitle && (
          <div className="mt-1.5 flex items-center gap-1.5 max-w-[min(100%,19rem)] px-2 py-0.5 rounded-lg bg-card dark:bg-surface/80 border border-neutral-700 dark:border-primary/25 shadow-2xs dark:shadow-none">
            <ListTodo size={11} className="text-gold shrink-0" />
            <span className="text-[11px] font-medium text-neutral-100 truncate min-w-0 flex-1">
              {linkedTaskTitle}
            </span>
            <button
              type="button"
              disabled={isCompletingLinkedTask}
              aria-busy={isCompletingLinkedTask}
              onClick={() =>
                void completeLinkedTask(linkedTaskId, linkedTaskTitle)
              }
              title={t("completeTask")}
              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline inline-flex items-center gap-0.5 shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCompletingLinkedTask ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <CheckCircle2 size={10} />
              )}
              <span>{t("complete")}</span>
            </button>
          </div>
        )}
      </div>

      {/* Primary Action Bar */}
      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
        {!target ? (
          <button
            type="button"
            onClick={handleReturnToFocus}
            className="flex-1 min-w-0 py-1.5 sm:py-2 px-3 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/80 hover:border-amber-500/50 dark:hover:border-gold/50 text-neutral-100 transition-colors cursor-pointer shadow-2xs dark:shadow-none"
          >
            <ExternalLink size={13} className="text-gold shrink-0" />
            <span className="truncate">{t("selectActivityPrompt")}</span>
          </button>
        ) : (
          <button
            type="button"
            disabled={isSavingSession}
            onClick={toggleTimer}
            className={cn(
              "flex-1 min-w-0 py-1.5 sm:py-2 px-3 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap",
              isBreak
                ? "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-neutral-950"
                : isRunning
                  ? "bg-amber-500 hover:bg-amber-600 text-neutral-950"
                  : "bg-gold hover:bg-gold-hover text-on-gold shadow-glow-gold-xs",
            )}
          >
            {isRunning ? (
              <>
                <Pause size={14} className="fill-current" />
                <span>{t("pause")}</span>
              </>
            ) : (
              <>
                <Play size={14} className="fill-current" />
                <span>{isPaused ? t("resume") : t("start")}</span>
              </>
            )}
          </button>
        )}

        {isBreak && (
          <button
            type="button"
            disabled={isSavingSession}
            onClick={skipBreak}
            className="py-1.5 sm:py-2 px-3 rounded-xl border border-emerald-600/40 dark:border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300 font-bold text-xs inline-flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <FastForward size={13} />
            <span>{t("skipBreak")}</span>
          </button>
        )}

        {isOvertime && !isBreak && (
          <button
            type="button"
            disabled={isSavingSession}
            aria-busy={isSavingSession}
            onClick={() => void startBreak()}
            className="py-1.5 sm:py-2 px-2.5 rounded-xl border border-cyan-600/45 dark:border-cyan-500/45 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-800 dark:text-cyan-200 font-bold text-xs inline-flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSavingSession ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Coffee size={13} />
            )}
            <span>{t("startBreak", { minutes: nextBreakMinutes })}</span>
          </button>
        )}

        {canComplete && (
          <button
            type="button"
            disabled={isSavingSession}
            aria-busy={isSavingSession}
            onClick={() => void completeSession()}
            className="py-1.5 sm:py-2 px-3 rounded-xl border border-emerald-600/40 dark:border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs inline-flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isSavingSession ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <CheckCircle2 size={13} />
            )}
            <span>{isPartialPomo ? t("savePartial") : t("complete")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
