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
  TaskFocusTimeBadge,
  TaskHabitScoreBadge,
  TaskHardcoreBadge,
  TaskPriorityBadge,
  TaskRewardBadges,
  TaskTagBadges,
  TaskTypeBadge,
  WeekDaysIndicator,
} from "@/components/tasks/shared";
import { TASK_TABLE_GRID_COLS } from "@/constants/task";
import {
  useDeferredSingleClick,
  useTaskItemMeta,
} from "@/hooks/useTaskCardItem";
import type { TaskRowProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { getClickAnchorRect } from "@/utils/dom";

interface TaskRowContentProps extends TaskRowProps {
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: CSSProperties;
  attributes?: DraggableAttributes;
  listeners?: SyntheticListenerMap;
  isDragging?: boolean;
}

const TaskRowContent = memo(function TaskRowContent({
  task,
  isSelected = false,
  columnId = task.columnId,
  columnTitle = task.category,
  activeFilter,
  selectedDate,
  isSortable = false,
  isOverlay = false,
  isDeleteChecking = false,
  isCompact: propIsCompact,
  onToggle,
  onToggleCompleted,
  onHabitChange,
  onContextMenu,
  onOpenDetails,
  onEditTask,
  setNodeRef,
  style,
  attributes,
  listeners,
  isDragging = false,
}: TaskRowContentProps) {
  const t = useTranslations("dashboard.taskShared");
  const effectiveToggle = onToggleCompleted || onToggle;
  const { triggerSingleClick, clearPendingClick } = useDeferredSingleClick();

  const {
    isCompact,
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
    isChecklistAllDone,
    isHardcoreOverdue,
  } = useTaskItemMeta({
    task,
    isCompact: propIsCompact,
    onToggleCompleted: effectiveToggle,
    onHabitChange,
    activeFilter,
    selectedDate,
  });

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (isDragging) return;
    e.stopPropagation();
    if (onOpenDetails) {
      const anchor = getClickAnchorRect(e);
      triggerSingleClick(e.detail, Boolean(onEditTask), () => {
        onOpenDetails(task, anchor, columnId);
      });
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLElement>) => {
    if (isDragging || !onEditTask) return;
    e.stopPropagation();
    clearPendingClick();
    onEditTask(task, columnId);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu(e, task, columnId);
    }
  };

  const ElementTag = isSortable ? "li" : "div";

  return (
    <ElementTag
      ref={setNodeRef as React.Ref<never>}
      style={style}
      aria-busy={isDeleteChecking || undefined}
      {...(isSortable ? attributes : {})}
      {...(isSortable ? listeners : {})}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      className={cn(
        "relative grid items-center rounded-xl border transition-[background-color,border-color,opacity] duration-150 select-none group overflow-hidden",
        TASK_TABLE_GRID_COLS,
        isSortable
          ? "cursor-grab active:cursor-grabbing touch-none"
          : "cursor-pointer",
        isCompact
          ? "gap-2.5 px-3 py-2 text-xs"
          : "gap-4 px-4 py-2.5 text-body-s",
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
          "transition-none! opacity-30 border-dashed border-primary-light scale-95",
        isOverlay &&
          "transition-none! shadow-card-active border-gold/70 bg-surface/90 scale-102 cursor-grabbing z-50",
      )}
    >
      {/* Coluna 1: [Grip opcional] + Ação + Título + Metadados (Streak, Recompensas e Saldo) */}
      <div className="flex items-center gap-2.5 min-w-0">
        {isSortable && (
          <div
            className="w-5 h-5 flex items-center justify-center shrink-0 text-neutral-400 group-hover:text-primary dark:group-hover:text-gold transition-colors p-0.5 pointer-events-none"
            aria-hidden="true"
          >
            <GripVertical size={isCompact ? 13 : 15} />
          </div>
        )}

        {/* biome-ignore lint/a11y/noStaticElementInteractions: Evita propagação de clique para o pai */}
        <div
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <TaskActionControl
            task={task}
            isHabit={isHabit}
            isDaily={isDaily}
            completed={completed}
            onToggle={toggleCompleted}
            onDelta={changeHabit}
            isCompact={isCompact}
          />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span
              className={cn(
                "font-medium text-neutral-100 truncate group-hover:text-primary dark:group-hover:text-gold transition-colors",
                isCompact ? "text-xs" : "text-sm",
                isDone && "line-through text-neutral-400",
              )}
              title={task.title}
            >
              {task.title}
            </span>

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

            {task.isHardcoreModeEnabled && (
              <TaskHardcoreBadge
                isHardcoreOverdue={isHardcoreOverdue}
                isCompact={isCompact}
              />
            )}

            {task.description && <TaskDescriptionBadge isCompact={isCompact} />}
          </div>

          <div className="flex items-center gap-2 text-label-g text-neutral-400">
            {isHabit && (
              <TaskHabitScoreBadge
                habitScore={habitScore}
                variant="row"
                isCompact={isCompact}
              />
            )}
            <TaskRewardBadges
              task={task}
              isCompact={isCompact}
              showStreak={true}
              showRewards={!isHabit}
            />
          </div>
        </div>
      </div>

      {/* Coluna 2: Categoria / Coluna */}
      <div className="hidden sm:flex items-center gap-1 min-w-0">
        <TaskTagBadges
          primaryLabel={columnTitle || displayTag}
          primaryTitle={columnTitle || displayTagTitle}
          fallbackLabel="-"
          hasExtraTags={hasExtraTags}
          extraTagsCount={extraTagsCount}
          extraTagsTitle={task.tags?.slice(1).join(", ")}
          isCompact={isCompact}
          variant="row"
        />
      </div>

      {/* Coluna 3: Badge do Tipo + Badge de Evento */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <TaskTypeBadge task={task} isCompact={isCompact} />
        {isTodoEvent && <TaskEventBadge isCompact={isCompact} />}
      </div>

      {/* Coluna 4: Prioridade */}
      <div className="hidden sm:flex items-center min-w-0">
        {priorityMeta ? (
          <TaskPriorityBadge
            priority={task.priority}
            isCompact={isCompact}
            sizeVariant="row"
          />
        ) : (
          <span className="text-neutral-500 text-tiny font-normal italic">
            -
          </span>
        )}
      </div>

      {/* Coluna 5: Frequência / Prazo */}
      <div className="hidden md:flex items-center min-w-0">
        {isDaily ? (
          <WeekDaysIndicator
            daysOfWeek={task.daysOfWeek}
            isCompact={isCompact}
          />
        ) : isTodo ? (
          <span
            className={cn(
              "text-body-s font-medium truncate inline-flex items-center gap-1",
              dueDateInfo.isOverdue
                ? "text-danger-500 font-medium"
                : dueDateInfo.isToday
                  ? "text-gold font-semibold"
                  : dueDateInfo.hasDueDate
                    ? "text-neutral-300"
                    : "text-neutral-400 font-normal",
            )}
          >
            {isTodoEvent && (
              <CalendarClock
                size={12}
                className="shrink-0 text-sky-600 dark:text-info"
              />
            )}
            <span className="truncate">{dueDateInfo.label}</span>
          </span>
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

      {/* Coluna 6: Ações (Spinner durante checagem de exclusão ou Menu de Opções) */}
      <div className="flex items-center justify-end">
        {isDeleteChecking ? (
          <output
            className="p-1 text-gold inline-flex items-center justify-center"
            title={t("actions.checkingDeleteAria")}
            aria-label={t("actions.checkingDeleteAria")}
          >
            <Loader2
              size={isCompact ? 14 : 16}
              className="animate-spin"
              aria-hidden="true"
            />
          </output>
        ) : (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              if (onContextMenu) {
                onContextMenu(e, task, columnId);
              }
            }}
            aria-label={t("actions.taskOptionsAria", { title: task.title })}
            title={t("actions.taskOptionsTitle")}
            className="p-1 rounded text-neutral-400 group-hover:text-neutral-200 hover:text-gold-ink! dark:hover:text-gold! hover:bg-surface-hover! dark:hover:bg-white/10! focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold/60 transition-colors cursor-pointer"
          >
            <MoreHorizontal size={isCompact ? 14 : 16} />
          </button>
        )}
      </div>
    </ElementTag>
  );
});

function SortableTaskRow(props: TaskRowProps) {
  const { task, columnId = task.columnId, isOverlay = false } = props;
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
    disabled: isOverlay,
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

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
