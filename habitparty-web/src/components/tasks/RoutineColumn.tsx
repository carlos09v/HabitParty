"use client";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreVertical, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { getColumnIcon } from "@/constants/routine";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { RoutineColumnProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { scrollColumnIntoKanbanView } from "@/utils/dom";
import { RoutineQuickAddForm } from "./RoutineQuickAddForm";
import { RoutineTaskCard } from "./RoutineTaskCard";

export const RoutineColumn = memo(function RoutineColumn({
  column,
  isSelected = false,
  isCompact: propIsCompact,
  widthPreset = "normal",
  onAddTaskToColumn,
  onQuickCreateTask,
  onOpenDetails,
  onContextMenu,
  onOpenColumnMenu,
  onToggleComplete,
  onHabitChange,
  isOverlay = false,
}: RoutineColumnProps) {
  const t = useTranslations("tasks.column");
  const { isCompact } = useCompactMode(propIsCompact);
  const ColumnIcon = getColumnIcon(column.icon);
  const columnRef = useRef<HTMLDivElement | null>(null);

  const [isQuickAdding, setIsQuickAdding] = useState(false);

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

  const taskIds = useMemo(() => column.tasks.map((t) => t.id), [column.tasks]);

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
        "flex flex-col w-full h-full min-h-0 flex-1 min-w-0 transition-[background-color,border-color,box-shadow,opacity] duration-150 select-none rounded-2xl border bg-surface/65 dark:bg-surface/35 border-neutral-700/70 dark:border-white/8 shadow-2xs",
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
              className="text-neutral-500/70 group-hover/header:text-gold transition-colors shrink-0 -mr-0.5"
            />
            <div
              className={cn(
                "rounded-lg border transition-all shrink-0 flex items-center justify-center",
                isCompact ? "p-1" : "p-1.5",
                isAllDone
                  ? "bg-success-500/15 border-success-500/40 text-success-500"
                  : "bg-primary/20 border-primary/35 text-gold group-hover/header:border-gold/50 group-hover/header:bg-gold/15",
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
                "h-full rounded-full transition-[width,background-color] duration-300",
                isAllDone
                  ? "bg-success-500"
                  : "bg-gradient-to-r from-primary-light via-gold to-gold",
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* ÁREA DE TAREFAS (Sortable vertical com dnd-kit) */}
      <div
        className={cn(
          "flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar",
          isCompact ? "gap-2 p-2" : "gap-2.5 p-3",
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.length === 0 && !isQuickAdding ? (
            <button
              type="button"
              onClick={handleTriggerAdd}
              className={cn(
                "group/empty w-full flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-primary/35 bg-card/30 hover:bg-card/60 hover:border-gold/50 transition-all cursor-pointer",
                isCompact ? "py-5 px-3 gap-1.5" : "py-7 px-4 gap-2",
              )}
            >
              <div
                className={cn(
                  "rounded-xl bg-primary/15 border border-primary/30 text-neutral-300 group-hover/empty:bg-gold/15 group-hover/empty:border-gold/40 group-hover/empty:text-gold group-hover/empty:scale-105 transition-all flex items-center justify-center",
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
                <span className="text-tiny text-neutral-400 group-hover/empty:text-gold transition-colors">
                  {t("emptyStateCta")}
                </span>
              </div>
            </button>
          ) : (
            column.tasks.map((task) => (
              <RoutineTaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                isCompact={isCompact || widthPreset === "compact"}
                onOpenDetails={onOpenDetails}
                onContextMenu={onContextMenu}
                onToggleCompleted={onToggleComplete}
                onHabitChange={onHabitChange}
              />
            ))
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
      <div className={cn("shrink-0", isCompact ? "p-2 pt-0" : "p-3 pt-0")}>
        {!isQuickAdding && (
          <button
            type="button"
            onClick={handleTriggerAdd}
            className={cn(
              "w-full flex items-center justify-center border border-dashed transition-all cursor-pointer",
              "border-primary/40 bg-card/50 font-semibold text-neutral-200",
              "hover:border-gold hover:text-gold hover:bg-card hover:shadow-glow-gold-sm active:scale-98",
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
