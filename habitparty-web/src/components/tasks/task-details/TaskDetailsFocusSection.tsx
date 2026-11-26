"use client";

import {
  ArrowRightLeft,
  CheckCircle2,
  ExternalLink,
  History,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useFocusTimerActions } from "@/hooks/useFocusTimer";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import type { Task } from "@/types/task";
import { cn } from "@/utils";
import { formatFocusMinutes, resolveLinkedTask } from "@/utils/focusFormatters";

interface TaskDetailsFocusSectionProps {
  task: Task;
  currentTitle?: string;
  completed?: boolean;
  isReadOnly?: boolean;
  onOpenFocusHistory?: () => void;
}

export function TaskDetailsFocusSection({
  task,
  currentTitle,
  completed = false,
  isReadOnly = false,
  onOpenFocusHistory,
}: TaskDetailsFocusSectionProps) {
  const t = useTranslations("tasks.detailsPopover.focusSection");
  const pathname = usePathname();
  const focusHref =
    pathname === "/dashboard" ? "/focus?from=dashboard" : "/focus?from=tasks";

  const {
    startFocusTask,
    toggleTimer,
    resumeTimer,
    selectTaskTarget,
    completeSession,
  } = useFocusTimerActions();

  // Seletores booleanos/estáveis: evitam re-render a cada tick do timer
  const isTargetTask = useFocusTimerStore(
    (s) => resolveLinkedTask(s.target).taskId === task.id,
  );
  const isTimerActive = useFocusTimerStore((s) => s.isActive);
  const isTimerPaused = useFocusTimerStore((s) => s.isPaused);
  const isWorkPhase = useFocusTimerStore((s) => s.phase === "WORK");
  const currentTargetType = useFocusTimerStore((s) => s.target?.type);
  const currentTargetName = useFocusTimerStore((s) => s.target?.name);
  const hasOtherSessionInProgress = useFocusTimerStore(
    (s) =>
      Boolean(s.target) &&
      resolveLinkedTask(s.target).taskId !== task.id &&
      s.phase === "WORK" &&
      s.elapsedSeconds > 0,
  );
  const canSaveCurrentSession = useFocusTimerStore(
    (s) => s.elapsedSeconds >= 60,
  );

  const [isConflictOpen, setIsConflictOpen] = useState(false);
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);

  // Limpa o painel de conflito inline caso a outra sessão encerre externamente
  useEffect(() => {
    if (isConflictOpen && (!hasOtherSessionInProgress || isTargetTask)) {
      setIsConflictOpen(false);
    }
  }, [isConflictOpen, hasOtherSessionInProgress, isTargetTask]);

  // Lê diretamente do task vivo (DashboardTasksPanel e TasksBoardContainer já escutam useFocusTaskSync)
  const localMinutes = task.totalFocusMinutes ?? 0;
  const localCycles = task.focusCyclesCount ?? 0;

  const isTimerRunning = isTimerActive && !isTimerPaused;
  const isFocusingThisTask = isTargetTask && isTimerRunning && isWorkPhase;

  const taskPayload = {
    id: task.id,
    title: currentTitle?.trim() || task.title,
  };
  // Cupom da mochila não pode ter o tempo transferido para tarefas
  const canAttachToCurrent = currentTargetType !== "inventory";

  const handleToggleTimer = () => {
    if (isReadOnly) return;
    toggleTimer();
  };

  const handleStartFocus = () => {
    if (isReadOnly) return;
    if (hasOtherSessionInProgress) {
      setIsConflictOpen(true);
      return;
    }
    startFocusTask(taskPayload);
  };

  const handleAttachToCurrent = () => {
    if (isReadOnly) return;
    selectTaskTarget(taskPayload);
    const nextStore = useFocusTimerStore.getState();
    if (nextStore.isPaused || !nextStore.isActive) {
      resumeTimer();
    }
    setIsConflictOpen(false);
  };

  const handleSaveAndStart = async () => {
    if (isReadOnly || !canSaveCurrentSession || isSavingCurrent) return;
    setIsSavingCurrent(true);
    try {
      const saved = await completeSession();
      if (saved) {
        startFocusTask(taskPayload);
        setIsConflictOpen(false);
      }
    } finally {
      setIsSavingCurrent(false);
    }
  };

  const handleDiscardAndStart = () => {
    if (isReadOnly) return;
    startFocusTask(taskPayload);
    setIsConflictOpen(false);
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-700/80 dark:border-primary/25 bg-surface/60 dark:bg-surface/40 p-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border",
              isFocusingThisTask
                ? "bg-gold/20 border-gold/50 text-gold-ink dark:text-gold motion-safe:animate-pulse"
                : "bg-primary/10 dark:bg-primary-dark/40 border-primary/30 text-primary dark:text-primary-light",
            )}
          >
            <Timer size={14} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-neutral-100 leading-tight">
              {t("title")}
            </span>
            <span className="text-tiny text-neutral-400 truncate">
              {localMinutes > 0
                ? localCycles > 0
                  ? t("accumulatedSummary", {
                      time: formatFocusMinutes(localMinutes),
                      cycles: localCycles,
                    })
                  : t("accumulatedSummaryNoCycles", {
                      time: formatFocusMinutes(localMinutes),
                    })
                : t("noFocusYet")}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isTargetTask && isTimerActive ? (
            <>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleToggleTimer}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                    isTimerRunning
                      ? "bg-amber-500/20 hover:bg-amber-500/30 text-gold border border-gold/40"
                      : "bg-gold hover:bg-gold-hover text-on-gold shadow-glow-gold-xs",
                  )}
                >
                  {isTimerRunning ? (
                    <>
                      <Pause size={12} className="fill-current" />
                      <span>{t("pauseButton")}</span>
                    </>
                  ) : (
                    <>
                      <Play size={12} className="fill-current" />
                      <span>{t("resumeButton")}</span>
                    </>
                  )}
                </button>
              )}
              <Link
                href={focusHref}
                title={t("openStageTooltip")}
                className="w-7 h-7 rounded-lg border border-neutral-700 dark:border-primary/30 bg-card hover:border-gold/40 text-neutral-300 hover:text-gold flex items-center justify-center transition-colors"
              >
                <ExternalLink size={12} />
              </Link>
            </>
          ) : !completed && !isReadOnly ? (
            <button
              type="button"
              onClick={handleStartFocus}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gold/15 hover:bg-gold text-gold hover:text-on-gold border border-gold/40 text-xs font-bold transition-colors cursor-pointer shadow-glow-gold-xs"
            >
              <Play size={11} className="fill-current" />
              <span>{t("startFocusButton")}</span>
            </button>
          ) : null}

          {(localCycles > 0 || localMinutes > 0) && onOpenFocusHistory && (
            <button
              type="button"
              onClick={onOpenFocusHistory}
              title={t("openHistoryTooltip")}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-700 dark:border-primary/30 bg-card/70 hover:bg-surface text-neutral-300 hover:text-neutral-100 text-tiny font-semibold transition-colors cursor-pointer"
            >
              <History size={12} className="text-gold" />
              <span>{t("openHistoryButton")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmação inline quando já existe outra sessão de foco com tempo decorrido */}
      {!isReadOnly &&
        isConflictOpen &&
        hasOtherSessionInProgress &&
        !isTargetTask && (
          <div className="flex flex-col gap-2 pt-2 border-t border-neutral-700/60 dark:border-white/10">
            <p className="text-tiny text-neutral-300 leading-relaxed">
              {t.rich("conflictDescription", {
                name: currentTargetName || t("conflictFallbackName"),
                strong: (chunks) => (
                  <strong className="text-neutral-100 font-semibold">
                    {chunks}
                  </strong>
                ),
              })}
            </p>
            <div className="flex flex-col gap-1.5">
              {canAttachToCurrent && (
                <button
                  type="button"
                  onClick={handleAttachToCurrent}
                  className="w-full inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gold/15 hover:bg-gold/25 text-gold border border-gold/40 text-xs font-bold transition-colors cursor-pointer"
                >
                  <ArrowRightLeft size={12} />
                  <span>
                    {currentTargetType === "activity"
                      ? t("conflictAttachToActivity")
                      : t("conflictTransferTime")}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={handleSaveAndStart}
                disabled={!canSaveCurrentSession || isSavingCurrent}
                title={
                  canSaveCurrentSession ? undefined : t("conflictSaveMinHint")
                }
                className="w-full inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/35 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingCurrent ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={12} />
                )}
                <span>{t("conflictSaveAndStart")}</span>
              </button>
              <button
                type="button"
                onClick={handleDiscardAndStart}
                disabled={isSavingCurrent}
                className="w-full inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-card/70 hover:bg-red-500/15 text-neutral-300 hover:text-red-400 border border-neutral-700 dark:border-primary/30 hover:border-red-500/40 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={12} />
                <span>{t("conflictDiscardAndStart")}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsConflictOpen(false)}
                disabled={isSavingCurrent}
                className="self-end px-2 py-1 text-tiny font-semibold text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
              >
                {t("conflictKeepCurrent")}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}
