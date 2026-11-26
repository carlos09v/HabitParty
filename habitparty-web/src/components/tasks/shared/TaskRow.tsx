"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarClock,
  GripVertical,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { type CSSProperties, memo, useMemo } from "react";
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
  TaskWorkspaceBadge,
  WeekDaysIndicator,
} from "@/components/tasks/shared";
import { TASK_TABLE_GRID_COLS } from "@/constants/task";
import { useTaskItemMeta } from "@/hooks/useTaskCardItem";
import type { TaskRowProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { getClickAnchorRect, STOP_DRAG_PROPAGATION_PROPS } from "@/utils/dom";

interface TaskRowContentProps extends TaskRowProps {
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: CSSProperties;
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap;
  isDragging?: boolean;
}

interface TaskRowScheduleLabelProps {
  label: string;
  isTodoEvent: boolean;
  isOverdue: boolean;
  isInProgress: boolean;
  isToday: boolean;
  hasDueDate: boolean;
  isDone: boolean;
  inProgressTitle?: string;
  variant: "mobile" | "desktop";
}

function TaskRowScheduleLabel({
  label,
  isTodoEvent,
  isOverdue,
  isInProgress,
  isToday,
  hasDueDate,
  isDone,
  inProgressTitle,
  variant,
}: TaskRowScheduleLabelProps) {
  const isActiveOverdue = isOverdue && !isDone;
  const isActiveInProgress = isInProgress && !isDone;

  return (
    <span
      title={isActiveInProgress ? inProgressTitle : undefined}
      className={cn(
        "truncate inline-flex items-center gap-1",
        variant === "mobile"
          ? "text-tiny font-medium"
          : "text-body-s font-medium",
        isActiveOverdue
          ? variant === "mobile"
            ? "text-danger-400 dark:text-danger-300 font-semibold"
            : "text-danger-400 dark:text-danger-300 font-medium"
          : isActiveInProgress
            ? "text-emerald-800 dark:text-emerald-400 font-semibold"
            : isToday
              ? "text-gold font-semibold"
              : hasDueDate
                ? "text-neutral-300"
                : "text-neutral-400 font-normal",
      )}
    >
      {isActiveInProgress ? (
        <span
          aria-hidden="true"
          className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0"
        />
      ) : (
        isTodoEvent && (
          <CalendarClock
            size={variant === "mobile" ? 11 : 12}
            className="shrink-0 text-sky-700 dark:text-info"
          />
        )
      )}
      <span className="truncate">{label}</span>
    </span>
  );
}

const TaskRowContent = memo(function TaskRowContent({
  task,
  className,
  isSelected = false,
  columnId = task.columnId,
  columnTitle = task.category,
  workspaceName,
  isReadOnly = false,
  activeFilter,
  selectedDate,
  isSortable = false,
  isOverlay = false,
  isDeleteChecking = false,
  onToggle,
  onToggleCompleted,
  onHabitChange,
  onContextMenu,
  onOpenDetails,
  onStartFocus,
  setNodeRef,
  style,
  attributes,
  listeners,
  isDragging = false,
}: TaskRowContentProps) {
  const t = useTranslations("dashboard.taskShared");
  const effectiveToggle = onToggleCompleted || onToggle;

  const {
    completed,
    habitScore,
    toggleCompleted,
    changeHabit,
    isDone,
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
    priorityMeta,
    hasChecklist,
    checklistTotal,
    checklistCompleted,
    checklistRewarded,
    isChecklistAllDone,
    isHardcoreOverdue,
  } = useTaskItemMeta({
    task,
    onToggleCompleted: effectiveToggle,
    onHabitChange,
    activeFilter,
    selectedDate,
  });

  const inProgressTitle =
    dueDateInfo.isInProgress && !isDone
      ? dueDateInfo.endTime
        ? t("badges.eventInProgressTitle", { end: dueDateInfo.endTime })
        : t("badges.eventInProgressAllDayTitle")
      : undefined;

  const canDragRow = isSortable && !isReadOnly;

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (isDragging || isDeleteChecking) return;
    e.stopPropagation();
    if (onOpenDetails) {
      onOpenDetails(task, getClickAnchorRect(e), columnId);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu(e, task, columnId);
    }
  };

  const { role: _dndRole, ...sortableButtonAttrs } = attributes ?? {};
  const pointerDragListeners = useMemo(() => {
    if (!canDragRow || !listeners) return undefined;
    const { onKeyDown: _omitKeyDown, ...pointerOnly } = listeners;
    return pointerOnly;
  }, [canDragRow, listeners]);

  const handleTitleButtonKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    if (e.key === "Enter") {
      if (onOpenDetails && !isDragging && !isOverlay && !isDeleteChecking) {
        e.preventDefault();
        e.stopPropagation();
        const rowEl = e.currentTarget.closest<HTMLElement>("[data-task-row]");
        onOpenDetails(
          task,
          (rowEl ?? e.currentTarget).getBoundingClientRect(),
          columnId,
        );
      }
      return;
    }
    if (canDragRow && !isOverlay && !isDeleteChecking) {
      listeners?.onKeyDown?.(e);
    }
  };

  const ElementTag = isSortable ? "li" : "div";

  return (
    <ElementTag
      ref={setNodeRef as React.Ref<never>}
      data-task-row={task.id}
      style={style}
      aria-busy={isDeleteChecking || undefined}
      {...pointerDragListeners}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={cn(
        "relative grid items-center rounded-xl border transition-[background-color,border-color,opacity] duration-150 select-none group overflow-hidden",
        TASK_TABLE_GRID_COLS,
        canDragRow
          ? cn(
              "cursor-grab active:cursor-grabbing touch-manipulation",
              isDragging && "touch-none",
            )
          : "cursor-pointer touch-manipulation",
        "gap-2.5 @lg:gap-3 px-3 @lg:px-4 py-2 text-body-s",
        isTodo && dueDateInfo.isOverdue && !isDone
          ? "bg-danger-500/[0.03] border-y-danger-500/40 border-r-danger-500/40 hover:border-y-danger-500/60 hover:border-r-danger-500/60 hover:bg-danger-500/[0.06] hover:shadow-card-deep focus:outline-none focus-visible:ring-1 focus-visible:ring-danger-500/60"
          : isSelected
            ? "bg-primary/[0.07] dark:bg-surface-hover ring-1 ring-primary/50 dark:ring-gold/65 border-y-primary/65 border-r-primary/65 dark:border-y-gold/70 dark:border-r-gold/70 shadow-sm dark:shadow-glow-gold-sm"
            : "bg-card dark:bg-primary-dark/20 border-y-neutral-700 border-r-neutral-700 dark:border-y-primary/30 dark:border-r-primary/30 hover:border-y-primary/40 hover:border-r-primary/40 dark:hover:border-y-gold/50 dark:hover:border-r-gold/50 hover:bg-card-hover dark:hover:bg-primary-dark/35 shadow-2xs dark:shadow-none hover:shadow-card-deep focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 dark:focus-visible:ring-gold/60",
        borderClass,
        "border-l-4",
        isHardcoreOverdue &&
          "border-y-danger-500/70 border-r-danger-500/70 hover:border-y-danger-500/80 hover:border-r-danger-500/80 shadow-[0_0_10px_rgba(239,68,68,0.25)]",
        isDone && "dark:opacity-60 bg-card/80 dark:bg-primary-dark/15",
        isDeleteChecking && "opacity-75 pointer-events-none cursor-wait",
        isDragging &&
          "transition-none! opacity-30 border-dashed border-y-primary-light border-r-primary-light scale-95",
        isOverlay &&
          "transition-none! shadow-card-active border-y-gold/70 border-r-gold/70 bg-surface/90 scale-102 cursor-grabbing z-50",
        !isDragging && !isOverlay && className,
      )}
    >
      {/* Coluna 1: [Grip opcional] + Ação + Título + Metadados (Streak, Recompensas e Saldo) */}
      <div className="flex items-center gap-2.5 min-w-0">
        {canDragRow && (
          <div
            className="w-5 h-5 flex items-center justify-center shrink-0 text-neutral-400 group-hover:text-primary dark:group-hover:text-gold transition-colors p-0.5 pointer-events-none"
            aria-hidden="true"
          >
            <GripVertical size={15} />
          </div>
        )}

        {/* biome-ignore lint/a11y/noStaticElementInteractions: Evita propagação de clique para o pai */}
        <div
          className="shrink-0"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <TaskActionControl
            task={task}
            isHabit={isHabit}
            isDaily={isDaily}
            completed={completed}
            disabled={isReadOnly}
            onToggle={toggleCompleted}
            onDelta={changeHabit}
          />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            {isOverlay || !onOpenDetails ? (
              <span
                className={cn(
                  "font-medium text-neutral-100 truncate group-hover:text-primary dark:group-hover:text-gold transition-colors text-sm",
                  isDone && "line-through text-neutral-400",
                )}
                title={task.title}
              >
                {task.title}
              </span>
            ) : (
              <button
                type="button"
                {...(canDragRow ? sortableButtonAttrs : {})}
                onKeyDown={handleTitleButtonKeyDown}
                onClick={(e) => {
                  if (isDragging || isDeleteChecking) return;
                  e.stopPropagation();
                  const rowEl =
                    e.currentTarget.closest<HTMLElement>("[data-task-row]");
                  onOpenDetails(
                    task,
                    (rowEl ?? e.currentTarget).getBoundingClientRect(),
                    columnId,
                  );
                }}
                className={cn(
                  "text-left font-medium text-neutral-100 truncate group-hover:text-primary dark:group-hover:text-gold transition-colors text-sm cursor-pointer bg-transparent border-0 p-0 rounded max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 dark:focus-visible:ring-gold/75",
                  isDone && "line-through text-neutral-400",
                )}
                title={task.title}
              >
                {task.title}
              </button>
            )}

            {!isHabit && (
              <TaskFocusTimeBadge
                taskId={task.id}
                totalFocusMinutes={task.totalFocusMinutes}
                focusCyclesCount={task.focusCyclesCount}
              />
            )}

            {hasChecklist && (
              <TaskChecklistBadge
                checklistCompleted={checklistCompleted}
                checklistTotal={checklistTotal}
                checklistRewarded={checklistRewarded}
                isChecklistAllDone={isChecklistAllDone}
              />
            )}

            {task.isHardcoreModeEnabled && (
              <TaskHardcoreBadge isHardcoreOverdue={isHardcoreOverdue} />
            )}

            {task.description && <TaskDescriptionBadge />}

            {isTodo && (
              <TaskReminderBadge
                reminderType={task.reminderType}
                sendEmailReminder={task.sendEmailReminder}
                emailReminderSent={task.emailReminderSent}
              />
            )}
          </div>

          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-label-g text-neutral-400 mt-0.5">
            {isHabit && (
              <TaskHabitScoreBadge habitScore={habitScore} variant="row" />
            )}
            <TaskRewardBadges
              task={task}
              showStreak={true}
              showRewards={!isHabit}
            />
            <span className="@2xl:hidden inline-flex items-center gap-1 min-w-0 empty:hidden">
              {isDaily ? (
                <WeekDaysIndicator
                  daysOfWeek={task.daysOfWeek}
                  isCompact={true}
                />
              ) : isTodo && dueDateInfo.hasDueDate ? (
                <TaskRowScheduleLabel
                  label={dueDateInfo.label}
                  isTodoEvent={isTodoEvent}
                  isOverdue={dueDateInfo.isOverdue}
                  isInProgress={Boolean(dueDateInfo.isInProgress)}
                  isToday={dueDateInfo.isToday}
                  hasDueDate={dueDateInfo.hasDueDate}
                  isDone={isDone}
                  inProgressTitle={inProgressTitle}
                  variant="mobile"
                />
              ) : isHabit ? (
                <span className="text-tiny px-1.5 py-0.5 rounded bg-surface/80 dark:bg-white/5 border border-neutral-700/60 dark:border-white/10 text-neutral-400 font-medium">
                  {task.resetCounter === "DAILY"
                    ? t("resetCounters.DAILY")
                    : task.resetCounter === "WEEKLY"
                      ? t("resetCounters.WEEKLY")
                      : task.resetCounter === "MONTHLY"
                        ? t("resetCounters.MONTHLY")
                        : t("resetCounters.CONTINUOUS")}
                </span>
              ) : null}
            </span>
            {(priorityMeta || workspaceName || columnTitle || displayTag) && (
              <span className="@lg:hidden inline-flex items-center gap-1 min-w-0 flex-wrap">
                {priorityMeta && (
                  <TaskPriorityBadge
                    priority={task.priority}
                    isCompact={true}
                    sizeVariant="card"
                  />
                )}
                <TaskWorkspaceBadge
                  workspaceName={workspaceName}
                  size="xs"
                  isReadOnly={isReadOnly}
                />
                {(columnTitle || displayTag) && (
                  <span className="text-tiny px-1.5 py-0.5 rounded bg-surface/80 dark:bg-white/5 border border-neutral-700/60 dark:border-white/10 text-neutral-300 truncate max-w-[110px]">
                    {columnTitle || displayTag}
                  </span>
                )}
                {columnTitle && task.tags && task.tags.length > 0 && (
                  <span
                    className="text-tiny px-1 py-0.5 rounded bg-surface/80 dark:bg-white/5 border border-neutral-700/60 dark:border-white/10 text-neutral-400 shrink-0"
                    title={task.tags.join(", ")}
                  >
                    +{task.tags.length}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Coluna 2: Ambiente (multi-workspace) + Categoria / Coluna */}
      <div className="hidden @lg:flex items-center gap-1 min-w-0 flex-wrap">
        <TaskWorkspaceBadge
          workspaceName={workspaceName}
          size="row"
          isReadOnly={isReadOnly}
        />
        <TaskTagBadges
          primaryLabel={columnTitle || displayTag}
          primaryTitle={columnTitle || displayTagTitle}
          fallbackLabel={workspaceName ? undefined : "-"}
          hasExtraTags={
            columnTitle
              ? Boolean(task.tags && task.tags.length > 0)
              : hasExtraTags
          }
          extraTagsCount={
            columnTitle ? (task.tags?.length ?? 0) : extraTagsCount
          }
          extraTagsTitle={
            columnTitle ? task.tags?.join(", ") : task.tags?.slice(1).join(", ")
          }
          variant="row"
        />
      </div>

      {/* Coluna 3: Badge do Tipo + Badge de Evento */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-start min-w-0">
        <TaskTypeBadge task={task} />
        {isTodoEvent && (
          <TaskEventBadge
            isInProgress={Boolean(dueDateInfo.isInProgress && !isDone)}
            endTime={dueDateInfo.endTime}
          />
        )}
      </div>

      {/* Coluna 4: Prioridade */}
      <div className="hidden @lg:flex items-center justify-center min-w-0">
        {priorityMeta ? (
          <TaskPriorityBadge priority={task.priority} sizeVariant="row" />
        ) : (
          <span className="text-neutral-400 text-tiny font-normal italic">
            -
          </span>
        )}
      </div>

      {/* Coluna 5: Frequência / Prazo */}
      <div className="hidden @2xl:flex items-center min-w-0">
        {isDaily ? (
          <WeekDaysIndicator daysOfWeek={task.daysOfWeek} />
        ) : isTodo ? (
          <TaskRowScheduleLabel
            label={dueDateInfo.label}
            isTodoEvent={isTodoEvent}
            isOverdue={dueDateInfo.isOverdue}
            isInProgress={Boolean(dueDateInfo.isInProgress)}
            isToday={dueDateInfo.isToday}
            hasDueDate={dueDateInfo.hasDueDate}
            isDone={isDone}
            inProgressTitle={inProgressTitle}
            variant="desktop"
          />
        ) : (
          <span className="text-body-s text-neutral-400 font-medium truncate">
            {task.resetCounter === "DAILY"
              ? t("resetCounters.DAILY")
              : task.resetCounter === "WEEKLY"
                ? t("resetCounters.WEEKLY")
                : task.resetCounter === "MONTHLY"
                  ? t("resetCounters.MONTHLY")
                  : t("resetCounters.CONTINUOUS")}
          </span>
        )}
      </div>

      {/* Coluna 6: Ações (Foco rápido, Spinner durante checagem de exclusão ou Menu de Opções) */}
      <div className="flex items-center justify-end gap-1 min-w-0">
        {isDeleteChecking ? (
          <output
            className="p-1 text-gold inline-flex items-center justify-center"
            title={t("actions.checkingDeleteAria")}
            aria-label={t("actions.checkingDeleteAria")}
          >
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          </output>
        ) : (
          <>
            {onStartFocus && !isReadOnly && (
              <TaskFocusActionButton
                task={task}
                isHabit={isHabit}
                isDone={isDone}
                variant="row"
                onStartFocus={onStartFocus}
              />
            )}
            <button
              type="button"
              {...STOP_DRAG_PROPAGATION_PROPS}
              onClick={(e) => {
                e.stopPropagation();
                if (onContextMenu) {
                  onContextMenu(e, task, columnId);
                }
              }}
              aria-label={t("actions.taskOptionsAria", { title: task.title })}
              title={t("actions.taskOptionsTitle")}
              className="p-1.5 sm:p-1 pointer-coarse:min-w-9 pointer-coarse:min-h-9 inline-flex items-center justify-center rounded text-neutral-400 group-hover:text-neutral-200 hover:text-gold-ink! dark:hover:text-gold! hover:bg-surface-hover! dark:hover:bg-white/10! focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 transition-colors cursor-pointer"
            >
              <MoreHorizontal size={16} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </ElementTag>
  );
});

function SortableTaskRow(props: TaskRowProps) {
  const {
    task,
    columnId = task.columnId,
    isOverlay = false,
    isReadOnly = false,
  } = props;
  const sortableData = useMemo(
    () => ({
      type: "Task" as const,
      task,
      columnId,
    }),
    [task, columnId],
  );
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: sortableData,
    disabled: isOverlay || isReadOnly,
  });

  const transformStr = CSS.Translate.toString(transform);
  const resolvedTransition = isDragging ? undefined : transition;
  const style: CSSProperties = useMemo(
    () => ({
      transform: transformStr,
      transition: resolvedTransition,
    }),
    [transformStr, resolvedTransition],
  );

  return (
    <TaskRowContent
      {...props}
      setNodeRef={setNodeRef}
      style={style}
      attributes={attributes}
      listeners={listeners}
      isDragging={isDragging}
    />
  );
}

/**
 * Linha de Tarefa Unificada (Dashboard & Quadro Kanban em Lista).
 * Evita registrar hooks e sensores do `@dnd-kit/sortable` quando `isSortable = false` (Dashboard).
 */
export const TaskRow = memo(function TaskRow(props: TaskRowProps) {
  if (props.isSortable && !props.isOverlay) {
    return <SortableTaskRow {...props} />;
  }
  return <TaskRowContent {...props} />;
});
