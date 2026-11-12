"use client";

import { Calendar, CalendarClock, Clock, ClockAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useEffect, useRef } from "react";
import {
  TaskActionControl,
  TaskChecklistBadge,
  TaskDescriptionBadge,
  TaskEventBadge,
  TaskFocusTimeBadge,
  TaskHabitScoreBadge,
  TaskHardcoreBadge,
  TaskPriorityBadge,
  TaskReminderBadge,
  TaskRewardBadges,
  TaskTagBadges,
  TaskTypeBadge,
  WeekDaysIndicator,
} from "@/components/tasks/shared";
import { useTaskCardItem } from "@/hooks/useTaskCardItem";
import type { RoutineTaskCardProps } from "@/types/task-ui";
import { cn } from "@/utils";

/**
 * Card arrastável de Tarefa para as colunas do quadro Kanban de Rotina.
 * Desacoplado: consome useTaskCardItem e componentes compartilhados de badges.
 */
export const RoutineTaskCard = memo(function RoutineTaskCard({
  task,
  columnId,
  isSelected = false,
  isCompact: propIsCompact,
  onOpenDetails,
  onEditTask,
  onToggleCompleted,
  onHabitChange,
  onContextMenu,
  isOverlay = false,
}: RoutineTaskCardProps) {
  const tBadges = useTranslations("dashboard.taskShared.badges");
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);
  const {
    isCompact,
    completed,
    habitScore,
    toggleCompleted,
    changeHabit,
    isDone,
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    style,
    isHabit,
    isDaily,
    isTodo,
    isTodoEvent,
    borderClass,
    dueDateInfo,
    displayTag,
    hasExtraTags,
    extraTagsCount,
    hasChecklist,
    checklistTotal,
    checklistCompleted,
    isChecklistAllDone,
    isHardcoreOverdue,
  } = useTaskCardItem({
    task,
    columnId,
    isOverlay,
    isCompact: propIsCompact,
    onToggleCompleted,
    onHabitChange,
  });

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Dnd-kit sortable task card containing inner action buttons
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (isDragging) return;
        e.stopPropagation();
        if (e.detail >= 2) {
          if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = null;
          }
          return;
        }
        if (onOpenDetails) {
          const rect = e.currentTarget.getBoundingClientRect();
          if (onEditTask) {
            if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
            clickTimeoutRef.current = setTimeout(() => {
              clickTimeoutRef.current = null;
              onOpenDetails(task, columnId, rect);
            }, 180);
          } else {
            onOpenDetails(task, columnId, rect);
          }
        }
      }}
      onDoubleClick={(e) => {
        if (isDragging || !onEditTask) return;
        e.stopPropagation();
        if (clickTimeoutRef.current) {
          clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }
        onEditTask(task, columnId);
      }}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, task, columnId);
        }
      }}
      className={cn(
        "group/card flex flex-col transition-[background-color,border-color,opacity,transform] duration-150 select-none touch-none cursor-pointer",
        isCompact
          ? "gap-2 p-2.5 rounded-lg border border-l-4"
          : "gap-2.5 p-3 rounded-xl border border-l-4",
        isSelected
          ? "bg-primary/[0.07] dark:bg-surface-hover ring-1 ring-primary/50 dark:ring-gold/65 border-y-primary/65 border-r-primary/65 dark:border-y-gold/70 dark:border-r-gold/70 shadow-sm dark:shadow-glow-gold-sm hover:translate-y-0"
          : "bg-card hover:bg-surface/70 dark:bg-gradient-to-b dark:from-card dark:to-surface/95 dark:hover:bg-card-hover border-y-neutral-700/80 border-r-neutral-700/80 dark:border-y-white/12 dark:border-r-white/12 shadow-xs dark:shadow-sm hover:shadow-card-deep hover:-translate-y-0.5",
        !isSelected &&
          (isHabit
            ? "hover:border-y-info/45 hover:border-r-info/45"
            : isDaily
              ? "hover:border-y-magenta/45 hover:border-r-magenta/45"
              : isTodo && dueDateInfo.isOverdue && !isDone
                ? "hover:bg-danger-500/[0.06] hover:border-y-danger-500/60 hover:border-r-danger-500/60"
                : "hover:border-y-primary/40 hover:border-r-primary/40 dark:hover:border-y-gold/45 dark:hover:border-r-gold/45"),
        borderClass,
        isTodo &&
          dueDateInfo.isOverdue &&
          !isDone &&
          !isHardcoreOverdue &&
          "border-y-danger-500/40 border-r-danger-500/40 hover:border-y-danger-500/60 hover:border-r-danger-500/60 bg-danger-500/[0.04]",
        isHardcoreOverdue &&
          "border-y-danger-500/70 border-r-danger-500/70 hover:border-y-danger-500/80 hover:border-r-danger-500/80 shadow-sm dark:shadow-[0_0_12px_rgba(239,68,68,0.28)]",
        isDone && "dark:opacity-65 bg-card/85 dark:bg-card hover:translate-y-0",
        isDragging &&
          "!transition-none opacity-30 border-dashed border-y-primary-light border-r-primary-light scale-95",
        isOverlay &&
          "!transition-none shadow-card-active border-y-gold/70 border-r-gold/70 bg-card scale-102 rotate-1 cursor-grabbing z-50",
      )}
    >
      {/* 1. TOPO: Badge do Tipo + Badge de Evento (se aplicável) + Tag Opcional + Indicadores */}
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <TaskTypeBadge task={task} isCompact={isCompact} />
          {isTodoEvent && <TaskEventBadge isCompact={isCompact} />}

          <TaskTagBadges
            primaryLabel={displayTag}
            hasExtraTags={hasExtraTags}
            extraTagsCount={extraTagsCount}
            extraTagsTitle={task.tags?.slice(1).join(", ")}
            isCompact={isCompact}
            variant="card"
          />
        </div>

        {/* Indicadores complementares (Bandeira de Prioridade, Hardcore e Descrição) */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <TaskPriorityBadge
            priority={task.priority}
            isCompact={isCompact}
            sizeVariant="card"
          />

          {task.isHardcoreModeEnabled && (
            <TaskHardcoreBadge
              isHardcoreOverdue={isHardcoreOverdue}
              isCompact={isCompact}
            />
          )}

          {task.description && (
            <TaskDescriptionBadge
              isCompact={isCompact}
              className="hover:text-primary dark:hover:text-gold transition-colors p-0.5"
            />
          )}
        </div>
      </div>

      {/* 2. MEIO: Controle de Ação + Título da Tarefa */}
      <div className="flex items-start gap-2.5 min-w-0">
        <TaskActionControl
          task={task}
          isHabit={isHabit}
          isDaily={isDaily}
          completed={completed}
          onToggle={toggleCompleted}
          onDelta={changeHabit}
          isCompact={isCompact}
        />

        <span
          className={cn(
            "font-semibold text-neutral-50 leading-snug line-clamp-2 min-w-0 break-words transition-colors",
            isCompact ? "text-xs" : "text-sm",
            isDone
              ? "line-through text-neutral-400 font-medium"
              : "group-hover/card:text-primary dark:group-hover/card:text-gold",
          )}
        >
          {task.title}
        </span>
      </div>

      {/* 3. BASE: Frequência/Prazo/Saldo + Ofensiva (Streak) / Indicador de Esforço */}
      <div
        className={cn(
          "flex items-center justify-between gap-2 text-neutral-400 border-t border-neutral-700/60 dark:border-white/8",
          isCompact ? "pt-1.5 text-label-s" : "pt-2 text-tiny",
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          {isDaily && (
            <WeekDaysIndicator
              daysOfWeek={task.daysOfWeek}
              isCompact={isCompact}
            />
          )}

          {isTodo && (
            <>
              <div
                title={
                  dueDateInfo.isInProgress && !isDone
                    ? tBadges("eventInProgressTitle", {
                        end: dueDateInfo.endTime ?? "",
                      })
                    : undefined
                }
                className={cn(
                  "inline-flex items-center gap-1 font-semibold truncate px-1.5 py-0.5 rounded-md border transition-colors",
                  dueDateInfo.isOverdue && !isDone
                    ? "text-danger-500 bg-danger-500/10 border-danger-500/35"
                    : dueDateInfo.isInProgress && !isDone
                      ? "text-sky-700 bg-sky-500/12 border-sky-500/35 dark:text-info dark:bg-info/15 dark:border-info/35"
                      : dueDateInfo.isToday
                        ? "text-amber-700 bg-amber-500/12 border-amber-500/35 dark:text-gold dark:bg-gold/12 dark:border-gold/35"
                        : dueDateInfo.isTomorrow
                          ? "text-sky-700 bg-sky-500/10 border-sky-500/30 dark:text-info dark:bg-info/10 dark:border-info/30"
                          : dueDateInfo.hasDueDate
                            ? "text-neutral-100 bg-surface border-neutral-600/80 dark:bg-white/[0.06] dark:border-white/15"
                            : "text-neutral-300 font-medium bg-surface/60 border-neutral-700/70 dark:bg-white/[0.03] dark:border-white/10",
                )}
              >
                {dueDateInfo.isOverdue && !isDone ? (
                  <ClockAlert
                    size={isCompact ? 10 : 12}
                    className="shrink-0 text-danger-500"
                  />
                ) : dueDateInfo.isInProgress && !isDone ? (
                  <span
                    aria-hidden="true"
                    className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-info animate-pulse shrink-0"
                  />
                ) : isTodoEvent ? (
                  <CalendarClock
                    size={isCompact ? 10 : 12}
                    className="shrink-0 text-sky-600 dark:text-info"
                  />
                ) : dueDateInfo.isToday && task.dueTime ? (
                  <Clock
                    size={isCompact ? 10 : 12}
                    className="shrink-0 text-amber-600 dark:text-gold"
                  />
                ) : (
                  <Calendar
                    size={isCompact ? 10 : 12}
                    className={cn(
                      "shrink-0",
                      dueDateInfo.isToday
                        ? "text-amber-600 dark:text-gold"
                        : dueDateInfo.isTomorrow
                          ? "text-sky-600 dark:text-info"
                          : dueDateInfo.hasDueDate
                            ? "text-primary dark:text-gold"
                            : "text-neutral-400",
                    )}
                  />
                )}
                <span className="truncate">{dueDateInfo.label}</span>
              </div>

              <TaskReminderBadge
                reminderType={task.reminderType}
                sendEmailReminder={task.sendEmailReminder}
                emailReminderSent={task.emailReminderSent}
                isCompact={isCompact}
              />
            </>
          )}

          {isHabit && (
            <TaskHabitScoreBadge
              habitScore={habitScore}
              resetCounter={task.resetCounter}
              variant="card"
              isCompact={isCompact}
            />
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {!isHabit && (
            <TaskFocusTimeBadge
              taskId={task.id}
              totalFocusMinutes={task.totalFocusMinutes}
              focusCyclesCount={task.focusCyclesCount}
              isCompact={isCompact}
            />
          )}

          {hasChecklist && (
            <TaskChecklistBadge
              checklistCompleted={checklistCompleted}
              checklistTotal={checklistTotal}
              isChecklistAllDone={isChecklistAllDone}
              isCompact={isCompact}
            />
          )}

          <TaskRewardBadges
            task={task}
            isCompact={isCompact}
            showStreak={true}
            showRewards={false}
          />
        </div>
      </div>
    </article>
  );
});
