"use client";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, MoreVertical, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { getColumnIcon } from "@/constants/routine";
import { normalizeTaskType } from "@/constants/task";
import type { RoutineColumnProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { scrollColumnIntoKanbanView } from "@/utils/dom";
import { RoutineQuickAddForm } from "./RoutineQuickAddForm";
import { RoutineTaskCard } from "./RoutineTaskCard";

export const RoutineColumn = memo(function RoutineColumn({
  column,
  isSelected = false,
  selectedTaskId,
  deletingTaskIds,
  isCompact: propIsCompact,
  widthPreset = "normal",
  onAddTaskToColumn,
  onQuickCreateTask,
  onOpenDetails,
  onEditTask,
  onContextMenu,
  onOpenColumnMenu,
  onToggleComplete,
  onHabitChange,
  isOverlay = false,
}: RoutineColumnProps) {
  const t = useTranslations("tasks.column");
  const isCompact = propIsCompact ?? false;
  const ColumnIcon = getColumnIcon(column.icon);
  const columnRef = useRef<HTMLDivElement | null>(null);

  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
    disabled: isOverlay,
  });

  const setCombinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    columnRef.current = node;
  };

  useEffect(() => {
    if (isSelected && columnRef.current) {
      const timer = setTimeout(() => {
        if (columnRef.current) {
          scrollColumnIntoKanbanView(columnRef.current);
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isSelected]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const { activeTasks, completedTodoTasks } = useMemo(() => {
    const active: typeof column.tasks = [];
    const completedTodos: typeof column.tasks = [];
    for (const taskItem of column.tasks) {
      if (normalizeTaskType(taskItem) === "todo" && taskItem.completed) {
        completedTodos.push(taskItem);
      } else {
        active.push(taskItem);
      }
    }
    return { activeTasks: active, completedTodoTasks: completedTodos };
  }, [column.tasks]);

  const taskIds = useMemo(
    () =>
      isCompletedExpanded
        ? [...activeTasks, ...completedTodoTasks].map((t) => t.id)
        : activeTasks.map((t) => t.id),
    [activeTasks, completedTodoTasks, isCompletedExpanded],
  );

  const { totalTasks, completedTasks, progressPercent, isAllDone } =
    useMemo(() => {
      const total = column.tasks.length;
      if (total === 0) {
        return {
          totalTasks: 0,
          completedTasks: 0,
          progressPercent: 0,
          isAllDone: false,
        };
      }
      const done = column.tasks.filter((taskItem) => {
        const isHabitTask = (taskItem.type || "").toLowerCase() === "habit";
        if (isHabitTask) {
          return (
            (taskItem.positiveCount ?? 0) > 0 || Boolean(taskItem.completed)
          );
        }
        return Boolean(taskItem.completed);
      }).length;
      return {
        totalTasks: total,
        completedTasks: done,
        progressPercent: Math.round((done / total) * 100),
        isAllDone: done === total,
      };
    }, [column.tasks]);

  const handleTriggerAdd = () => {
    if (onQuickCreateTask) {
      setIsQuickAdding(true);
    } else {
      onAddTaskToColumn?.(column.id);
    }
  };

  return (
    <div
      ref={setCombinedRef}
      data-column-id={column.id}
      style={style}
      className={cn(
        "flex flex-col w-full h-full min-h-0 flex-1 min-w-0 transition-[background-color,border-color,opacity] duration-150 select-none rounded-2xl border bg-surface/65 dark:bg-surface/35 border-neutral-700/70 dark:border-white/8 shadow-2xs",
        !isDragging && !isOverlay && "kanban-column-contain",
        isSelected &&
          "ring-2 ring-inset ring-gold/90 shadow-glow-gold bg-gold/[0.04]",
        isDragging &&
          "!transition-none opacity-30 border-dashed border-primary-light scale-98",
        isOverlay &&
          "!transition-none shadow-card-deep border-gold/70 bg-primary-dark/60 scale-102 rotate-1 z-50",
      )}
    >
      {/* HEADER DA COLUNA (Arrastável com dnd-kit) */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "flex flex-col cursor-grab active:cursor-grabbing group/header touch-none shrink-0 border-b border-white/6",
          isCompact ? "px-2.5 pt-2.5 pb-2" : "px-3.5 pt-3.5 pb-2.5",
        )}
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <GripVertical
              size={isCompact ? 13 : 15}
              className="text-neutral-500/70 group-hover/header:text-primary dark:group-hover/header:text-gold transition-colors shrink-0 -mr-0.5"
            />
            <div
              className={cn(
                "rounded-lg border transition-colors shrink-0 flex items-center justify-center",
                isCompact ? "p-1" : "p-1.5",
                isAllDone
                  ? "bg-success-500/15 border-success-500/40 text-success-500"
                  : "bg-primary/10 dark:bg-primary/20 border-primary/25 dark:border-primary/35 text-primary dark:text-gold group-hover/header:border-primary/40 dark:group-hover/header:border-gold/50 group-hover/header:bg-primary/15 dark:group-hover/header:bg-gold/15",
              )}
            >
              <ColumnIcon size={isCompact ? 14 : 16} />
            </div>

            <h3
              className={cn(
                "font-bold text-neutral-50 truncate",
                isCompact ? "text-xs sm:text-sm" : "text-sm sm:text-base",
              )}
            >
              {column.title}
            </h3>

            <span
              title={
                totalTasks > 0
                  ? t("completedProgressTitle", {
                      completed: completedTasks,
                      total: totalTasks,
                    })
                  : undefined
              }
              className={cn(
                "font-bold rounded-full border shrink-0 transition-colors",
                isCompact ? "text-tiny px-1.5 py-0.5" : "text-xs px-2 py-0.5",
                isAllDone
                  ? "bg-success-500/15 border-success-500/40 text-success-500"
                  : completedTasks > 0
                    ? "bg-gold/15 border-gold/35 text-gold"
                    : "bg-white/8 border-white/10 text-neutral-300",
              )}
            >
              {completedTasks > 0
                ? `${completedTasks}/${totalTasks}`
                : totalTasks}
            </span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              aria-label={t("addTaskHeaderTitle")}
              title={t("addTaskHeaderTitle")}
              onClick={(e) => {
                e.stopPropagation();
                handleTriggerAdd();
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              className="text-neutral-400 hover:text-gold p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Plus size={isCompact ? 14 : 16} />
            </button>

            <button
              type="button"
              aria-label={t("optionsAria", { title: column.title })}
              onClick={(e) => {
                e.stopPropagation();
                onOpenColumnMenu?.(e, column);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
              }}
              className="text-neutral-400 hover:text-gold p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer"
              title={t("optionsTitle")}
            >
              <MoreVertical size={isCompact ? 14 : 16} />
            </button>
          </div>
        </div>

        {/* Barra de Progresso Fina da Coluna */}
        {totalTasks > 0 && (
          <div
            aria-hidden="true"
            className={cn(
              "w-full h-1 rounded-full bg-white/8 overflow-hidden",
              isCompact ? "mt-1.5" : "mt-2",
            )}
          >
            <div
              className={cn(
                "h-full w-full origin-left transition-[transform,background-color] duration-300",
                isAllDone
                  ? "bg-success-500"
                  : "bg-gradient-to-r from-primary-light via-gold to-gold",
              )}
              style={{ transform: `scaleX(${progressPercent / 100})` }}
            />
          </div>
        )}
      </div>

      {/* ÁREA DE TAREFAS (Sortable vertical com dnd-kit) */}
      <div
        className={cn(
          "flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar",
          isCompact ? "gap-2 p-2 pb-2.5" : "gap-2.5 p-3 pb-3.5",
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.length === 0 && !isQuickAdding ? (
            <button
              type="button"
              onClick={handleTriggerAdd}
              className={cn(
                "group/empty w-full flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-primary/35 bg-card/30 hover:bg-card/60 hover:border-primary/45 dark:hover:border-gold/50 transition-colors cursor-pointer",
                isCompact ? "py-5 px-3 gap-1.5" : "py-7 px-4 gap-2",
              )}
            >
              <div
                className={cn(
                  "rounded-xl bg-primary/15 border border-primary/30 text-neutral-300 group-hover/empty:bg-primary/15 dark:group-hover/empty:bg-gold/15 group-hover/empty:border-primary/40 dark:group-hover/empty:border-gold/40 group-hover/empty:text-primary dark:group-hover/empty:text-gold group-hover/empty:scale-105 transition-[transform,background-color,border-color,color] duration-150 flex items-center justify-center",
                  isCompact ? "w-7 h-7" : "w-8 h-8",
                )}
              >
                <Plus size={isCompact ? 14 : 16} />
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className={cn(
                    "font-semibold text-neutral-300 group-hover/empty:text-neutral-100 transition-colors",
                    isCompact ? "text-xs" : "text-body-s",
                  )}
                >
                  {t("emptyState")}
                </span>
                <span className="text-tiny text-neutral-400 group-hover/empty:text-primary dark:group-hover/empty:text-gold transition-colors">
                  {t("emptyStateCta")}
                </span>
              </div>
            </button>
          ) : (
            activeTasks.map((task) => (
              <RoutineTaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                isSelected={selectedTaskId === task.id}
                isDeleteChecking={Boolean(deletingTaskIds?.has(task.id))}
                isCompact={isCompact || widthPreset === "compact"}
                onOpenDetails={onOpenDetails}
                onEditTask={onEditTask}
                onContextMenu={onContextMenu}
                onToggleCompleted={onToggleComplete}
                onHabitChange={onHabitChange}
              />
            ))
          )}

          {/* Seção colapsável de ToDos concluídos na base da coluna */}
          {completedTodoTasks.length > 0 && (
            <div className="flex flex-col gap-2 pt-1.5 mt-0.5 border-t border-white/8">
              <button
                type="button"
                onClick={() => setIsCompletedExpanded((prev) => !prev)}
                aria-expanded={isCompletedExpanded}
                className={cn(
                  "flex items-center gap-1.5 w-full rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-white/5 transition-colors cursor-pointer select-none",
                  isCompact ? "px-2 py-1 text-tiny" : "px-2.5 py-1.5 text-xs",
                )}
              >
                <ChevronDown
                  size={isCompact ? 13 : 14}
                  className={cn(
                    "shrink-0 transition-transform duration-200",
                    !isCompletedExpanded && "-rotate-90",
                  )}
                />
                <span className="font-semibold">
                  {t("completedSectionLabel")}
                </span>
                <span className="ml-auto px-1.5 py-0.5 rounded-full bg-white/8 text-neutral-300 font-bold text-tiny leading-none">
                  {completedTodoTasks.length}
                </span>
              </button>

              {isCompletedExpanded && (
                <div
                  className={cn(
                    "flex flex-col",
                    isCompact ? "gap-2" : "gap-2.5",
                  )}
                >
                  {completedTodoTasks.map((task) => (
                    <RoutineTaskCard
                      key={task.id}
                      task={task}
                      columnId={column.id}
                      isSelected={selectedTaskId === task.id}
                      isDeleteChecking={Boolean(deletingTaskIds?.has(task.id))}
                      isCompact={isCompact || widthPreset === "compact"}
                      onOpenDetails={onOpenDetails}
                      onEditTask={onEditTask}
                      onContextMenu={onContextMenu}
                      onToggleCompleted={onToggleComplete}
                      onHabitChange={onHabitChange}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </SortableContext>

        {/* Campo de Criação Rápida Inline */}
        {isQuickAdding && (
          <RoutineQuickAddForm
            columnId={column.id}
            isCompact={isCompact}
            isColumnCompact={widthPreset === "compact"}
            onClose={() => setIsQuickAdding(false)}
            onQuickCreateTask={onQuickCreateTask}
            onOpenDetailedForm={onAddTaskToColumn}
          />
        )}
      </div>

      {/* BOTÃO INFERIOR DE ADICIONAR TAREFA RÁPIDA */}
      <div
        className={cn(
          "shrink-0 border-t border-neutral-700/60 dark:border-white/5 bg-surface/95 dark:bg-transparent",
          isCompact ? "p-2 pt-1.5" : "p-3 pt-2",
        )}
      >
        {!isQuickAdding && (
          <button
            type="button"
            onClick={handleTriggerAdd}
            className={cn(
              "w-full flex items-center justify-center border border-dashed transition-[transform,background-color,border-color,color] duration-150 cursor-pointer",
              "border-neutral-600 dark:border-primary/40 bg-card/80 dark:bg-card/50 font-semibold text-neutral-200",
              "hover:border-primary dark:hover:border-gold hover:text-primary dark:hover:text-gold hover:bg-card hover:shadow-glow-gold-sm active:scale-98",
              isCompact
                ? "gap-1.5 py-1.5 rounded-lg text-xs"
                : "gap-2 py-2 rounded-xl text-body-s",
            )}
          >
            <Plus size={isCompact ? 14 : 15} />
            <span>{t("addTaskFooterButton")}</span>
          </button>
        )}
      </div>
    </div>
  );
});
