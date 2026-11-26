"use client";

import { Pause, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTaskFocusStatus } from "@/hooks/useTaskFocusStatus";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import type { Task } from "@/types/task";
import { cn } from "@/utils";
import { STOP_DRAG_PROPAGATION_PROPS } from "@/utils/dom";

export interface TaskFocusActionButtonProps {
  task: Task;
  isHabit: boolean;
  isDone: boolean;
  onStartFocus: (task: Task) => void;
  variant: "card" | "row";
  isCompact?: boolean;
}

/**
 * Botão rápido de Play/Pause para iniciar ou controlar o timer de foco em uma tarefa,
 * compartilhado entre cards do Kanban (`RoutineTaskCard`) e linhas de tabela/lista (`TaskRow`).
 */
export function TaskFocusActionButton({
  task,
  isHabit,
  isDone,
  onStartFocus,
  variant,
  isCompact = false,
}: TaskFocusActionButtonProps) {
  const tActions = useTranslations("dashboard.taskShared.actions");
  const focusStatus = useTaskFocusStatus(task.id);

  const isActiveTarget = focusStatus !== "none";
  const isTimerRunning = focusStatus === "running";

  if (isHabit || (isDone && !isActiveTarget)) {
    return null;
  }

  const iconSize = variant === "row" ? 14 : isCompact ? 10 : 11;

  return (
    <button
      type="button"
      data-focus-active={isActiveTarget ? "true" : undefined}
      {...STOP_DRAG_PROPAGATION_PROPS}
      onClick={(e) => {
        e.stopPropagation();
        if (isActiveTarget) {
          useFocusTimerStore.getState().toggleTimer();
          return;
        }
        onStartFocus(task);
      }}
      aria-label={
        isActiveTarget
          ? isTimerRunning
            ? tActions("pauseFocusAria", { title: task.title })
            : tActions("resumeFocusAria", { title: task.title })
          : tActions("startFocusAria", { title: task.title })
      }
      title={
        isActiveTarget
          ? isTimerRunning
            ? tActions("pauseFocusTitle")
            : tActions("resumeFocusTitle")
          : tActions("startFocusTitle")
      }
      className={cn(
        variant === "row"
          ? cn(
              "flex items-center justify-center rounded-lg border transition-colors cursor-pointer shrink-0 w-8 h-8 pointer-coarse:w-9 pointer-coarse:h-9",
              isActiveTarget
                ? "bg-gold text-on-gold border-gold font-bold shadow-glow-gold-xs hover:bg-gold-hover"
                : "bg-primary/10 text-primary hover:bg-primary hover:text-white border-primary/20 hover:border-primary dark:bg-surface/80 dark:hover:bg-gold/20 dark:text-neutral-200 dark:hover:text-gold dark:border-primary/30 dark:hover:border-gold/50",
            )
          : cn(
              "flex items-center justify-center rounded-md border transition-[background-color,color,border-color] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold pointer-coarse:w-8 pointer-coarse:h-8",
              isCompact ? "w-5 h-5" : "w-6 h-6",
              isActiveTarget
                ? "bg-gold text-on-gold border-gold shadow-glow-gold-xs hover:bg-gold-hover"
                : "bg-primary/10 text-primary hover:bg-primary hover:text-white border-primary/20 dark:bg-white/5 dark:hover:bg-gold/20 dark:text-neutral-200 dark:hover:text-gold dark:border-white/10 dark:hover:border-gold/50",
            ),
      )}
    >
      {isActiveTarget && isTimerRunning ? (
        <Pause size={iconSize} className="fill-on-gold" />
      ) : (
        <Play
          size={iconSize}
          className={
            isActiveTarget ? "fill-on-gold ml-0.5" : "fill-current ml-0.5"
          }
        />
      )}
    </button>
  );
}
