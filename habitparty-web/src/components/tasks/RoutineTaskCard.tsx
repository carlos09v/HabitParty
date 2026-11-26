"use client";

import {
  Calendar,
  CalendarClock,
  Clock,
  ClockAlert,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useMemo } from "react";
import {
  TaskActionControl,
  TaskChecklistBadge,
  TaskDescriptionBadge,
  TaskEventBadge,
  TaskFocusActionButton,
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
  isReadOnly = false,
  isDeleteChecking = false,
  isCompact: propIsCompact,
  onOpenDetails,
  onToggleCompleted,
  onHabitChange,
  onContextMenu,
  onStartFocus,
  isOverlay = false,
}: RoutineTaskCardProps) {
  const tBadges = useTranslations("dashboard.taskShared.badges");
  const tActions = useTranslations("dashboard.taskShared.actions");
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
    displayTagTitle,
    hasExtraTags,
    extraTagsCount,
    hasChecklist,
    checklistTotal,
    checklistCompleted,
    checklistRewarded,
    isChecklistAllDone,
    isHardcoreOverdue,
  } = useTaskCardItem({
    task,
    columnId,
    isOverlay,
    isSortable: !isReadOnly,
    isCompact: propIsCompact,
    onToggleCompleted,
    onHabitChange,
  });

  const canSortCard = !isReadOnly && !isOverlay;
  const hasContextMenu = !isOverlay && Boolean(onContextMenu);
  const hasFocusControl =
    !isOverlay && !isReadOnly && Boolean(onStartFocus) && !isHabit;
  const hasQuickActions = hasContextMenu || hasFocusControl;
  const hasHoverActions = hasContextMenu || (hasFocusControl && !isDone);
  const hasBodyMetaRow = Boolean(displayTag || (isDaily && hasChecklist));
  const { role: _dndRole, ...sortableButtonAttrs } = attributes ?? {};
  const pointerDragListeners = useMemo(() => {
    if (!canSortCard || !listeners) return undefined;
    const { onKeyDown: _omitKeyDown, ...pointerOnly } = listeners;
    return pointerOnly;
  }, [canSortCard, listeners]);

  const handleTitleButtonKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (e.key === "Enter") {
      if (onOpenDetails && !isDragging && !isOverlay && !isDeleteChecking) {
        e.preventDefault();
        e.stopPropagation();
        const cardEl = e.currentTarget.closest<HTMLElement>("[data-task-card]");
        onOpenDetails(
          task,
          columnId,
          (cardEl ?? e.currentTarget).getBoundingClientRect(),
        );
      }
      return;
    }
    if (canSortCard && !isDeleteChecking) {
      listeners?.onKeyDown?.(e);
    }
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Pointer convenience click on card; keyboard activation & DnD live on the semantic title button
    <article
      ref={setNodeRef}
      data-task-card={task.id}
      style={style}
      aria-busy={isDeleteChecking || undefined}
      {...pointerDragListeners}
      onClick={(e) => {
        if (isDragging || isDeleteChecking) return;
        e.stopPropagation();
        if (onOpenDetails) {
          onOpenDetails(
            task,
            columnId,
            e.currentTarget.getBoundingClientRect(),
          );
        }
      }}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, task, columnId);
        }
      }}
      className={cn(
        "relative @container/card group/card flex flex-col transition-[background-color,border-color,opacity,transform] duration-150 select-none touch-manipulation cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 dark:focus-visible:ring-gold/65",
        isDragging && "touch-none",
        isCompact
          ? "gap-2 p-2.5 rounded-lg border border-l-4"
          : "gap-2.5 p-3 rounded-xl border border-l-4",
        isSelected
          ? "bg-primary/[0.07] dark:bg-surface-hover ring-1 ring-primary/50 dark:ring-gold/65 border-y-primary/65 border-r-primary/65 dark:border-y-gold/70 dark:border-r-gold/70 shadow-sm dark:shadow-glow-gold-sm hover:translate-y-0"
          : "bg-card hover:bg-surface/70 dark:bg-linear-to-b dark:from-card dark:to-surface/95 dark:hover:bg-card-hover border-y-neutral-700/80 border-r-neutral-700/80 dark:border-y-white/12 dark:border-r-white/12 shadow-xs dark:shadow-sm hover:shadow-card-deep hover:-translate-y-0.5",
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
        isDeleteChecking && "opacity-75 pointer-events-none cursor-wait",
        isDragging &&
          "transition-none! opacity-30 border-dashed border-y-primary-light border-r-primary-light scale-95",
        isOverlay &&
          "transition-none! shadow-card-active border-y-gold/70 border-r-gold/70 bg-card scale-102 rotate-1 cursor-grabbing z-50",
      )}
    >
      {/* 1. TOPO: Badge do Tipo + Badge de Evento | Indicadores flush à direita + Pill flutuante de Ações Rápidas */}
      <div className="flex items-center justify-between gap-1.5 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-nowrap overflow-hidden">
          <TaskTypeBadge task={task} isCompact={isCompact} />
          {isTodoEvent && (
            <TaskEventBadge
              isCompact={isCompact}
              isInProgress={Boolean(dueDateInfo.isInProgress && !isDone)}
              endTime={dueDateInfo.endTime}
              className="min-w-0 shrink"
            />
          )}
        </div>

        {/* Indicadores de estado flush à direita; ocultam suavemente no desktop quando o pill de ações aparece */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <div
            className={cn(
              "flex items-center gap-1 shrink-0 transition-opacity duration-150",
              hasHoverActions &&
                "group-hover/card:opacity-0 group-has-[[data-card-actions]:focus-within]/card:opacity-0 pointer-coarse:opacity-100!",
              hasFocusControl &&
                "group-has-[[data-focus-active='true']]/card:opacity-0 pointer-coarse:opacity-100!",
            )}
          >
            {isDeleteChecking && (
              <Loader2
                size={isCompact ? 13 : 14}
                className="animate-spin text-gold shrink-0"
                aria-label={tActions("checkingDeleteAria")}
              />
            )}

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

            <TaskPriorityBadge
              priority={task.priority}
              isCompact={isCompact}
              sizeVariant="card"
            />
          </div>

          {hasQuickActions && (
            <div
              data-card-actions
              className={cn(
                "hidden has-[button]:flex items-center gap-0.5 shrink-0",
                "absolute z-10 rounded-lg border border-neutral-700/80 dark:border-white/15 bg-card/95 dark:bg-surface/95 backdrop-blur-xs shadow-sm p-0.5 transition-opacity duration-150",
                "opacity-0 pointer-events-none group-hover/card:opacity-100 group-hover/card:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto has-[[data-focus-active='true']]:opacity-100 has-[[data-focus-active='true']]:pointer-events-auto",
                "pointer-coarse:static pointer-coarse:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:bg-transparent pointer-coarse:dark:bg-transparent pointer-coarse:border-0 pointer-coarse:shadow-none pointer-coarse:p-0 pointer-coarse:backdrop-blur-none",
                isCompact ? "top-1.5 right-1.5" : "top-2 right-2",
              )}
            >
              {hasFocusControl && onStartFocus && (
                <TaskFocusActionButton
                  task={task}
                  isHabit={isHabit}
                  isDone={isDone}
                  isCompact={isCompact}
                  variant="card"
                  onStartFocus={onStartFocus}
                />
              )}

              {hasContextMenu && onContextMenu && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  onDoubleClick={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onContextMenu(e, task, columnId);
                  }}
                  aria-label={tActions("taskOptionsAria", {
                    title: task.title,
                  })}
                  title={tActions("taskOptionsTitle")}
                  className={cn(
                    "flex items-center justify-center rounded-md text-neutral-400 hover:text-gold-ink dark:hover:text-gold hover:bg-surface-hover dark:hover:bg-white/10 transition-[background-color,color] cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold pointer-coarse:w-8 pointer-coarse:h-8",
                    isCompact ? "w-5 h-5" : "w-6 h-6",
                  )}
                >
                  <MoreHorizontal
                    size={isCompact ? 13 : 14}
                    aria-hidden="true"
                  />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. MEIO: Controle de Ação + Título da Tarefa + Micro-linha opcional (Tags / Checklist de Diária) */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-start gap-2.5 min-w-0">
          <TaskActionControl
            task={task}
            isHabit={isHabit}
            isDaily={isDaily}
            completed={completed}
            disabled={isReadOnly}
            onToggle={toggleCompleted}
            onDelta={changeHabit}
            isCompact={isCompact}
          />

          {isOverlay ? (
            <span
              className={cn(
                "flex-1 font-semibold text-neutral-50 leading-snug line-clamp-2 min-w-0 break-words transition-colors",
                isCompact ? "text-xs" : "text-sm",
                isDone && "line-through text-neutral-400 font-medium",
              )}
            >
              {task.title}
            </span>
          ) : (
            <button
              type="button"
              {...(canSortCard ? sortableButtonAttrs : {})}
              onKeyDown={handleTitleButtonKeyDown}
              onClick={(e) => {
                if (isDragging || isDeleteChecking) return;
                e.stopPropagation();
                const cardEl =
                  e.currentTarget.closest<HTMLElement>("[data-task-card]");
                onOpenDetails?.(
                  task,
                  columnId,
                  (cardEl ?? e.currentTarget).getBoundingClientRect(),
                );
              }}
              className={cn(
                "flex-1 text-left font-semibold text-neutral-50 leading-snug line-clamp-2 min-w-0 break-words transition-colors cursor-pointer bg-transparent border-0 p-0 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:focus-visible:ring-gold/75",
                isCompact ? "text-xs" : "text-sm",
                isDone
                  ? "line-through text-neutral-400 font-medium"
                  : "group-hover/card:text-primary dark:group-hover/card:text-gold",
              )}
            >
              {task.title}
            </button>
          )}
        </div>

        {hasBodyMetaRow && (
          <div className="flex items-center gap-1.5 min-w-0 flex-nowrap">
            <TaskTagBadges
              primaryLabel={displayTag}
              primaryTitle={displayTagTitle}
              hasExtraTags={hasExtraTags}
              extraTagsCount={extraTagsCount}
              extraTagsTitle={task.tags?.slice(1).join(", ")}
              isCompact={isCompact}
              variant="card"
            />
            {isDaily && hasChecklist && (
              <TaskChecklistBadge
                checklistCompleted={checklistCompleted}
                checklistTotal={checklistTotal}
                checklistRewarded={checklistRewarded}
                isChecklistAllDone={isChecklistAllDone}
                isCompact={isCompact}
                variant="card"
              />
            )}
          </div>
        )}
      </div>

      {/* 3. BASE: Frequência/Prazo/Saldo + Tempo de Foco / Checklist (To-Do) / Ofensiva e Esforço */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-y-1 min-w-0 text-neutral-400 border-t border-neutral-700/60 dark:border-white/8",
          isCompact
            ? "gap-x-1 pt-1.5 text-label-s"
            : "gap-x-1.5 pt-2 text-tiny",
        )}
      >
        <div className="flex items-center gap-1 min-w-0">
          {isDaily && (
            <WeekDaysIndicator
              daysOfWeek={task.daysOfWeek}
              isCompact={isCompact}
              variant="card"
            />
          )}

          {isTodo && (
            <>
              {dueDateInfo.hasDueDate && (
                <div
                  title={
                    dueDateInfo.isInProgress && !isDone
                      ? dueDateInfo.endTime
                        ? tBadges("eventInProgressTitle", {
                            end: dueDateInfo.endTime,
                          })
                        : tBadges("eventInProgressAllDayTitle")
                      : undefined
                  }
                  className={cn(
                    "inline-flex items-center gap-1 min-w-0 font-semibold px-1.5 rounded-md border leading-none transition-colors",
                    isCompact ? "h-[17px]" : "h-[19px]",
                    dueDateInfo.isOverdue && !isDone
                      ? "text-danger-500 bg-danger-500/10 border-danger-500/35"
                      : dueDateInfo.isInProgress && !isDone
                        ? "text-emerald-700 bg-emerald-500/12 border-emerald-500/35 dark:text-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-400/35"
                        : dueDateInfo.isToday
                          ? "text-amber-700 bg-amber-500/12 border-amber-500/35 dark:text-gold dark:bg-gold/12 dark:border-gold/35"
                          : dueDateInfo.isTomorrow
                            ? "text-sky-700 bg-sky-500/10 border-sky-500/30 dark:text-info dark:bg-info/10 dark:border-info/30"
                            : "text-neutral-100 bg-surface border-neutral-600/80 dark:bg-white/[0.06] dark:border-white/15",
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
                      className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0"
                    />
                  ) : isTodoEvent ? (
                    <CalendarClock
                      size={isCompact ? 10 : 12}
                      className="shrink-0 text-sky-700 dark:text-info"
                    />
                  ) : dueDateInfo.isToday && task.dueTime ? (
                    <Clock
                      size={isCompact ? 10 : 12}
                      className="shrink-0 text-amber-800 dark:text-gold"
                    />
                  ) : (
                    <Calendar
                      size={isCompact ? 10 : 12}
                      className={cn(
                        "shrink-0",
                        dueDateInfo.isToday
                          ? "text-amber-800 dark:text-gold"
                          : dueDateInfo.isTomorrow
                            ? "text-sky-700 dark:text-info"
                            : "text-primary dark:text-gold",
                      )}
                    />
                  )}
                  <span className="truncate">{dueDateInfo.label}</span>
                </div>
              )}

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

        <div className="flex items-center gap-1 shrink-0 ml-auto justify-end">
          {!isHabit && (
            <TaskFocusTimeBadge
              taskId={task.id}
              totalFocusMinutes={task.totalFocusMinutes}
              focusCyclesCount={task.focusCyclesCount}
              isCompact={isCompact}
              variant="card"
            />
          )}

          {!isDaily && hasChecklist && (
            <TaskChecklistBadge
              checklistCompleted={checklistCompleted}
              checklistTotal={checklistTotal}
              checklistRewarded={checklistRewarded}
              isChecklistAllDone={isChecklistAllDone}
              isCompact={isCompact}
              variant="card"
            />
          )}

          <TaskRewardBadges
            task={task}
            isCompact={isCompact}
            showStreak={true}
            showRewards={false}
            className="gap-1"
          />
        </div>
      </div>
    </article>
  );
});
