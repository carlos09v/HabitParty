"use client";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CheckCircle2, GripVertical, MoreVertical, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import {
  ColumnCompletedSection,
  useRoutineColumnTasks,
} from "@/components/tasks/shared";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getColumnIcon } from "@/constants/routine";
import { useScrollSelectedColumn } from "@/hooks/useScrollSelectedColumn";
import type { RoutineColumnProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { STOP_DRAG_PROPAGATION_PROPS } from "@/utils/dom";
import { RoutineQuickAddForm } from "./RoutineQuickAddForm";
import { RoutineTaskCard } from "./RoutineTaskCard";

export const RoutineColumn = memo(function RoutineColumn({
  column,
  isSelected = false,
  isReadOnly = false,
  selectedTaskId,
  deletingTaskIds,
  widthPreset = "normal",
  onAddTaskToColumn,
  onQuickCreateTask,
  onOpenDetails,
  onEditTask,
  onContextMenu,
  onOpenColumnMenu,
  onToggleComplete,
  onHabitChange,
  onStartFocus,
  onLoadArchivedCompleted,
  forceExpandCompleted = false,
  activeDraggedTaskId = null,
  isOverlay = false,
}: RoutineColumnProps) {
  const t = useTranslations("tasks.column");
  const tDnd = useTranslations("tasks.dnd");
  const ColumnIcon = getColumnIcon(column.icon);
  const columnRef = useRef<HTMLDivElement | null>(null);

  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const {
    isCompletedExpanded,
    toggleCompletedExpanded,
    archivedCompletedCount,
    activeTasks,
    completedTodoTasks,
    draggedCompletedTask,
    activeTaskIds,
    completedTaskIds,
    totalTasks,
    completedTasks,
    progressPercent,
    isAllDone,
    hasCompletedSection,
    isCompletelyEmpty,
  } = useRoutineColumnTasks(column, forceExpandCompleted, activeDraggedTaskId);

  const sortableData = useMemo(
    () => ({
      type: "Column" as const,
      column,
    }),
    [column],
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: sortableData,
    disabled: isOverlay || isReadOnly,
  });

  const setCombinedRef = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      columnRef.current = node;
    },
    [setNodeRef],
  );

  useScrollSelectedColumn(columnRef, isSelected, "kanban");

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const handleTriggerAdd = () => {
    if (isReadOnly) {
      onAddTaskToColumn?.(column.id);
      return;
    }
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
          "transition-none! opacity-30 border-dashed border-primary-light scale-98",
        isOverlay &&
          "transition-none! shadow-card-deep border-gold/70 bg-primary-dark/60 scale-102 rotate-1 z-50",
      )}
    >
      {/* HEADER DA COLUNA (alça de arrasto isolada dos botões de ação para semântica acessível) */}
      <div className="flex flex-col group/header shrink-0 border-b border-neutral-700/60 dark:border-white/6 px-3.5 pt-3.5 pb-2.5">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div
            {...(isReadOnly ? {} : listeners)}
            className={cn(
              "flex items-center gap-1.5 min-w-0 flex-1 touch-manipulation rounded-lg",
              isReadOnly
                ? "cursor-default"
                : "cursor-grab active:cursor-grabbing",
              isDragging && "touch-none",
            )}
          >
            {!isReadOnly && (
              <button
                type="button"
                {...(() => {
                  const { role: _dndRole, ...rest } = attributes;
                  return rest;
                })()}
                {...listeners}
                aria-label={tDnd("dragColumnHandleAria", {
                  title: column.title,
                })}
                className="flex items-center justify-center p-0.5 rounded text-neutral-500/70 group-hover/header:text-primary dark:group-hover/header:text-gold hover:bg-white/10 transition-colors shrink-0 -mr-0.5 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
              >
                <GripVertical size={15} aria-hidden="true" />
              </button>
            )}
            <div
              className={cn(
                "rounded-lg border transition-colors shrink-0 flex items-center justify-center p-1.5",
                isAllDone
                  ? "bg-success-500/15 border-success-500/40 text-success-500"
                  : "bg-primary/10 dark:bg-primary/20 border-primary/25 dark:border-primary/35 text-primary dark:text-gold group-hover/header:border-primary/40 dark:group-hover/header:border-gold/50 group-hover/header:bg-primary/15 dark:group-hover/header:bg-gold/15",
              )}
            >
              <ColumnIcon size={16} />
            </div>

            <h3 className="font-bold text-neutral-50 truncate text-sm sm:text-base">
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
                "font-bold rounded-full border shrink-0 transition-colors text-xs px-2 py-0.5",
                isAllDone
                  ? "bg-success-500/15 border-success-500/40 text-success-500"
                  : completedTasks > 0
                    ? "bg-gold/15 border-gold/35 text-gold"
                    : "bg-surface dark:bg-white/8 border-neutral-700 dark:border-white/10 text-neutral-300",
              )}
            >
              {completedTasks > 0
                ? `${completedTasks}/${totalTasks}`
                : totalTasks}
            </span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            {!isReadOnly && (
              <button
                type="button"
                aria-label={t("addTaskHeaderTitle")}
                title={t("addTaskHeaderTitle")}
                {...STOP_DRAG_PROPAGATION_PROPS}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTriggerAdd();
                }}
                className="text-neutral-400 hover:text-gold p-1.5 sm:p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              aria-label={t("optionsAria", { title: column.title })}
              {...STOP_DRAG_PROPAGATION_PROPS}
              onClick={(e) => {
                e.stopPropagation();
                onOpenColumnMenu?.(e, column);
              }}
              className="text-neutral-400 hover:text-gold p-1.5 sm:p-1 rounded-md hover:bg-white/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              title={t("optionsTitle")}
            >
              <MoreVertical size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Barra de Progresso Fina da Coluna */}
        {totalTasks > 0 && (
          <ProgressBar
            decorative
            percent={progressPercent}
            className="h-1 bg-neutral-700/30 dark:bg-white/8 mt-2"
            fillClassName={cn(
              "transition-[transform,background-color] duration-300",
              isAllDone
                ? "bg-success-500"
                : "bg-linear-to-r from-primary-light via-gold to-gold",
            )}
          />
        )}
      </div>

      {/* ÁREA DE TAREFAS (Sortable vertical separado entre Ativas e Concluídas) */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar gap-2.5 p-3 pb-3.5">
        <SortableContext
          items={activeTaskIds}
          strategy={verticalListSortingStrategy}
        >
          {isCompletelyEmpty && !isQuickAdding ? (
            isReadOnly ? (
              <div className="w-full flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-neutral-700/60 dark:border-white/10 bg-card/20 py-7 px-4 gap-1">
                <span className="font-semibold text-neutral-400 text-body-s">
                  {t("emptyState")}
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleTriggerAdd}
                className="group/empty w-full flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-primary/35 bg-card/30 hover:bg-card/60 hover:border-primary/45 dark:hover:border-gold/50 transition-colors cursor-pointer py-7 px-4 gap-2"
              >
                <div className="rounded-xl bg-primary/15 border border-primary/30 text-neutral-300 group-hover/empty:bg-primary/15 dark:group-hover/empty:bg-gold/15 group-hover/empty:border-primary/40 dark:group-hover/empty:border-gold/40 group-hover/empty:text-primary dark:group-hover/empty:text-gold group-hover/empty:scale-105 transition-[transform,background-color,border-color,color] duration-150 flex items-center justify-center w-8 h-8">
                  <Plus size={16} />
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-semibold text-neutral-300 group-hover/empty:text-neutral-100 transition-colors text-body-s">
                    {t("emptyState")}
                  </span>
                  <span className="text-tiny text-neutral-400 group-hover/empty:text-primary dark:group-hover/empty:text-gold transition-colors">
                    {t("emptyStateCta")}
                  </span>
                </div>
              </button>
            )
          ) : activeTasks.length === 0 &&
            hasCompletedSection &&
            !isQuickAdding ? (
            <div className="w-full flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-success-500/35 bg-success-500/[0.04] py-5 px-4 gap-1.5">
              <CheckCircle2
                size={20}
                className="text-success-500 shrink-0"
                aria-hidden="true"
              />
              <span className="font-semibold text-neutral-200 text-xs">
                {t("allDoneEmptyTitle")}
              </span>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleTriggerAdd}
                  className="text-tiny font-semibold text-primary dark:text-gold hover:underline cursor-pointer"
                >
                  {t("allDoneEmptyCta")}
                </button>
              )}
            </div>
          ) : (
            activeTasks.map((task) => (
              <RoutineTaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                isSelected={selectedTaskId === task.id}
                isReadOnly={isReadOnly}
                isDeleteChecking={Boolean(deletingTaskIds?.has(task.id))}
                isCompact={widthPreset === "compact"}
                onOpenDetails={onOpenDetails}
                onEditTask={onEditTask}
                onContextMenu={onContextMenu}
                onToggleCompleted={onToggleComplete}
                onHabitChange={onHabitChange}
                onStartFocus={onStartFocus}
              />
            ))
          )}
        </SortableContext>

        <SortableContext
          items={completedTaskIds}
          strategy={verticalListSortingStrategy}
        >
          {/* Seção colapsável de ToDos concluídos na base da coluna */}
          {hasCompletedSection && (
            <ColumnCompletedSection
              columnId={column.id}
              variant="card"
              isExpanded={isCompletedExpanded}
              onToggleExpanded={toggleCompletedExpanded}
              totalCompletedCount={
                completedTodoTasks.length + archivedCompletedCount
              }
              archivedCompletedCount={archivedCompletedCount}
              onLoadArchivedCompleted={onLoadArchivedCompleted}
            >
              {completedTodoTasks.map((task) => (
                <RoutineTaskCard
                  key={task.id}
                  task={task}
                  columnId={column.id}
                  isSelected={selectedTaskId === task.id}
                  isReadOnly={isReadOnly}
                  isDeleteChecking={Boolean(deletingTaskIds?.has(task.id))}
                  isCompact={widthPreset === "compact"}
                  onOpenDetails={onOpenDetails}
                  onEditTask={onEditTask}
                  onContextMenu={onContextMenu}
                  onToggleCompleted={onToggleComplete}
                  onHabitChange={onHabitChange}
                  onStartFocus={onStartFocus}
                />
              ))}
            </ColumnCompletedSection>
          )}

          {/* Mantém o card concluído arrastado montado caso o usuário passe por cima de uma coluna com Concluídos recolhido */}
          {!isCompletedExpanded && draggedCompletedTask && (
            <div
              aria-hidden="true"
              className="h-0 overflow-hidden pointer-events-none opacity-0"
            >
              <RoutineTaskCard
                task={draggedCompletedTask}
                columnId={column.id}
                isReadOnly={isReadOnly}
                isCompact={widthPreset === "compact"}
              />
            </div>
          )}
        </SortableContext>

        {/* Campo de Criação Rápida Inline */}
        {isQuickAdding && !isReadOnly && (
          <RoutineQuickAddForm
            columnId={column.id}
            isColumnCompact={widthPreset === "compact"}
            onClose={() => setIsQuickAdding(false)}
            onQuickCreateTask={onQuickCreateTask}
            onOpenDetailedForm={onAddTaskToColumn}
          />
        )}
      </div>

      {/* BOTÃO INFERIOR DE ADICIONAR TAREFA RÁPIDA */}
      {!isReadOnly && !isQuickAdding && (
        <div className="shrink-0 border-t border-neutral-700/60 dark:border-white/5 bg-surface/95 dark:bg-transparent p-3 pt-2">
          <button
            type="button"
            onClick={handleTriggerAdd}
            className={cn(
              "w-full flex items-center justify-center border border-dashed transition-[transform,background-color,border-color,color] duration-150 cursor-pointer",
              "border-neutral-600 dark:border-primary/40 bg-card/80 dark:bg-card/50 font-semibold text-neutral-200",
              "hover:border-primary dark:hover:border-gold hover:text-primary dark:hover:text-gold hover:bg-card hover:shadow-glow-gold-sm active:scale-98",
              "gap-2 py-2 rounded-xl text-body-s",
            )}
          >
            <Plus size={15} />
            <span>{t("addTaskFooterButton")}</span>
          </button>
        </div>
      )}
    </div>
  );
});
