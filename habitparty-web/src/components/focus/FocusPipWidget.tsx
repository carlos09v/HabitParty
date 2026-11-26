import { CheckCircle2, ExternalLink, ListTodo, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import {
  useFocusTimerActions,
  useFocusTimerControls,
  useFocusTimerDisplay,
} from "@/hooks/useFocusTimer";
import { cn } from "@/utils/cn";
import { resolveLinkedTask } from "@/utils/focusFormatters";
import { closeFocusPip } from "@/utils/focusPip";
import { FocusSessionCapBadgeView } from "./stage/FocusSessionCapBadge";
import { FocusTimerActionButtons } from "./stage/FocusTimerActionButtons";

/**
 * Folha isolada a 1Hz para a barra de progresso do Document PiP.
 */
function FocusPipProgressStrip() {
  const { progressPercent, isBreak, isOvertime } = useFocusTimerDisplay();

  return (
    <div className="w-full h-1.5 rounded-full bg-neutral-700 dark:bg-surface overflow-hidden shrink-0">
      <div
        className={cn(
          "h-full origin-left transition-transform duration-500",
          isBreak
            ? "bg-emerald-600 dark:bg-emerald-500"
            : isOvertime
              ? "bg-cyan-600 dark:bg-cyan-400"
              : "bg-amber-600 dark:bg-gold",
        )}
        style={{
          transform: `scaleX(${Math.min(1, Math.max(0, progressPercent / 100))})`,
        }}
      />
    </div>
  );
}

/**
 * Folha isolada a 1Hz para o relógio digital do Document PiP.
 */
function FocusPipClockDisplay() {
  const {
    formattedTime: displayTime,
    isBreak,
    isOvertime,
    isRunning,
  } = useFocusTimerDisplay();

  const timerFontClass =
    displayTime.length > 6
      ? "text-[clamp(1.375rem,min(9.5vw,15dvh),2.25rem)]"
      : "text-[clamp(1.5rem,min(11vw,16.5dvh),2.5rem)]";

  return (
    <span
      role="timer"
      aria-live="off"
      className={cn(
        "font-mono font-black tracking-tight tabular-nums leading-none",
        timerFontClass,
        isBreak
          ? "text-emerald-700 dark:text-emerald-300"
          : isOvertime
            ? "text-cyan-700 dark:text-cyan-300"
            : isRunning
              ? "text-amber-700 dark:text-gold"
              : "text-neutral-50",
      )}
    >
      {displayTime}
    </span>
  );
}

export function FocusPipWidget() {
  const router = useRouter();
  const t = useTranslations("focusWidget.pip");
  const { isGamified } = useExperienceMode();
  const {
    isActive,
    isPaused,
    target,
    isRunning,
    phase,
    isOvertime,
    canComplete,
    isPartialPomo,
    isSessionRewardCapped,
    nextBreakMinutes,
    isSavingSession,
    isCompletingLinkedTask,
  } = useFocusTimerControls();
  const {
    toggleTimer,
    startBreak,
    skipBreak,
    completeSession,
    completeLinkedTask,
  } = useFocusTimerActions();

  const [inlineNotice, setInlineNotice] = useState<string | null>(null);
  const noticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showInlineNotice = useCallback((message: string) => {
    setInlineNotice(message);
    if (noticeTimerRef.current !== null) {
      clearTimeout(noticeTimerRef.current);
    }
    noticeTimerRef.current = setTimeout(() => {
      noticeTimerRef.current = null;
      setInlineNotice(null);
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current !== null) {
        clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const isBreak = phase === "SHORT_BREAK" || phase === "LONG_BREAK";
  const { taskId: linkedTaskId, taskName: linkedTaskTitle } =
    resolveLinkedTask(target);
  const capBadgeLabel = isGamified
    ? t("sessionCapBadge")
    : t("sessionCapBadgeProductivity");

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

  const handleComplete = async () => {
    if (!canComplete) {
      showInlineNotice(t("minDurationHint"));
      return;
    }
    const ok = await completeSession();
    if (!ok) {
      showInlineNotice(t("actionFailed"));
    }
  };

  const handleStartBreak = async () => {
    const ok = await startBreak();
    if (!ok) {
      showInlineNotice(t("actionFailed"));
    }
  };

  const handleCompleteLinkedTask = async () => {
    if (!linkedTaskId) return;
    const ok = await completeLinkedTask(linkedTaskId, linkedTaskTitle);
    if (!ok) {
      showInlineNotice(t("actionFailed"));
    }
  };

  return (
    <div className="w-full h-dvh min-h-0 overflow-hidden flex flex-col justify-between bg-background text-neutral-100 p-2.5 sm:p-3 gap-1.5 sm:gap-2 select-none">
      {/* Top Progress Strip (1Hz isolado) */}
      <FocusPipProgressStrip />

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
                    ? "bg-cyan-600 dark:bg-cyan-400 motion-safe:animate-pulse"
                    : isRunning
                      ? "bg-amber-600 dark:bg-gold motion-safe:animate-pulse"
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
            <FocusSessionCapBadgeView
              visible={isSessionRewardCapped}
              label={capBadgeLabel}
              title={capBadgeLabel}
              isGamified={isGamified}
              size="xs"
            />
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

      {/* Main Digital Timer (1Hz isolado) */}
      <div className="flex flex-col items-center justify-center my-auto min-h-0">
        <FocusPipClockDisplay />

        {inlineNotice && (
          <output
            aria-live="polite"
            className="block mt-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-[10px] font-semibold text-amber-800 dark:text-amber-200 text-center max-w-full truncate"
          >
            {inlineNotice}
          </output>
        )}

        {linkedTaskId && linkedTaskTitle && (
          <div className="mt-1.5 flex items-center gap-1.5 max-w-[min(100%,19rem)] px-2 py-0.5 rounded-lg bg-card dark:bg-surface/80 border border-neutral-700 dark:border-primary/25 shadow-2xs dark:shadow-none">
            <ListTodo
              size={11}
              className="text-amber-700 dark:text-gold shrink-0"
              aria-hidden="true"
            />
            <span className="text-[11px] font-medium text-neutral-100 truncate min-w-0 flex-1">
              {linkedTaskTitle}
            </span>
            <button
              type="button"
              disabled={isCompletingLinkedTask}
              aria-busy={isCompletingLinkedTask}
              onClick={() => void handleCompleteLinkedTask()}
              title={t("completeTask")}
              className="min-h-6 px-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline inline-flex items-center gap-0.5 shrink-0 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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

      {/* Primary Action Bar Unificada */}
      <FocusTimerActionButtons
        variant="pip"
        hasTarget={Boolean(target)}
        isActive={isActive}
        isPaused={isPaused}
        isRunning={isRunning}
        isBreak={isBreak}
        isOvertime={isOvertime}
        canComplete={canComplete}
        isPartialPomo={isPartialPomo}
        isSavingSession={isSavingSession}
        nextBreakMinutes={nextBreakMinutes}
        onToggleTimer={toggleTimer}
        onStartBreak={() => void handleStartBreak()}
        onComplete={() => void handleComplete()}
        onSkipBreak={skipBreak}
        onSelectTargetFallback={handleReturnToFocus}
      />
    </div>
  );
}
