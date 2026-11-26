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
import { RoutineQuickAddForm } from "@/components/tasks/RoutineQuickAddForm";
import {
  BoardEmptyState,
  ColumnCompletedSection,
  useRoutineColumnTasks,
} from "@/components/tasks/shared";
import { TaskRow } from "@/components/tasks/shared/TaskRow";
import { getColumnIcon } from "@/constants/routine";
import { TASK_TABLE_GRID_COLS } from "@/constants/task";
import { useScrollSelectedColumn } from "@/hooks/useScrollSelectedColumn";
import type { Task } from "@/types/task";
import type {
  RoutineTaskListProps,
  RoutineTaskListSectionProps,
} from "@/types/task-ui";
import { cn } from "@/utils";
import { STOP_DRAG_PROPAGATION_PROPS } from "@/utils/dom";

const DEFERRED_ROW_START_INDEX = 12;

interface RoutineTaskListSectionInternalProps
  extends RoutineTaskListSectionProps {
  activeDraggedTaskId?: string | null;
}

const RoutineTaskListSection = memo(function RoutineTaskListSection({
  column,
  selectedColumnId,
  selectedTaskId,
  deletingTaskIds,
  isReadOnly = false,
  forceExpandCompleted = false,
  activeDraggedTaskId = null,
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
}: RoutineTaskListSectionInternalProps) {
  const t = useTranslations("tasks.taskList");
  const tColumn = useTranslations("tasks.column");
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
    disabled: isReadOnly,
  });

  const sectionRef = useRef<HTMLElement | null>(null);
  const setCombinedRef = useCallback(
    (node: HTMLElement | null) => {
      setNodeRef(node);
      sectionRef.current = node;
    },
    [setNodeRef],
  );
  const isSelected = selectedColumnId === column.id;
  useScrollSelectedColumn(sectionRef, isSelected, "list");

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const ColumnIcon = getColumnIcon(column.icon);

  const handleOpenRowDetails = useCallback(
    (task: Task, anchorRect?: DOMRect, colId?: string) => {
      onOpenDetails(task, colId || column.id, anchorRect);
    },
    [onOpenDetails, column.id],
  );

  const handleRowContextMenu = useCallback(
    (e: React.MouseEvent, task: Task, colId?: string) => {
      onContextMenu(e, task, colId || column.id);
    },
    [onContextMenu, column.id],
  );

  const handleEditRowTask = useCallback(
    (task: Task, colId?: string) => {
      onEditTask?.(task, colId || column.id);
    },
    [onEditTask, column.id],
  );

  const handleTriggerAdd = () => {
    if (isReadOnly) {
      onAddTaskToColumn(column.id);
      return;
    }
    if (onQuickCreateTask) {
      setIsQuickAdding(true);
    } else {
      onAddTaskToColumn(column.id);
    }
  };

  return (
    <section
      ref={setCombinedRef}
      style={style}
      data-column-id={column.id}
      className={cn(
        "flex flex-col gap-2.5 w-full transition-[background-color,border-color,opacity] duration-150 rounded-xl",
        isSelected &&
          "ring-2 ring-inset ring-gold/90 shadow-glow-gold bg-gold/[0.03] p-2",
        isDragging &&
          "transition-none! opacity-30 border border-dashed border-primary-light p-2",
      )}
      aria-label={t("sectionAria", { title: column.title })}
    >
      {/* Header da Seção da Coluna */}
      <div className="flex items-center justify-between gap-2 border-b border-neutral-700/60 dark:border-white/8 pb-2">
        <div
          {...(isReadOnly ? {} : listeners)}
          className={cn(
            "flex items-center gap-2 touch-manipulation select-none py-0.5 px-1 rounded-lg hover:bg-white/5 transition-colors group/col-header min-w-0 flex-1",
            isReadOnly
              ? "cursor-default"
              : "cursor-grab active:cursor-grabbing",
            isDragging && "touch-none",
          )}
          title={
            isReadOnly
              ? column.title
              : t("dragListTitle", { title: column.title })
          }
        >
          {!isReadOnly && (
            <button
              type="button"
              {...(() => {
                const { role: _dndRole, ...rest } = attributes;
                return rest;
              })()}
              {...listeners}
              aria-label={t("dragListTitle", { title: column.title })}
              className="flex items-center justify-center p-0.5 rounded text-neutral-500 group-hover/col-header:text-primary dark:group-hover/col-header:text-gold hover:bg-white/10 transition-colors shrink-0 cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
            >
              <GripVertical size={15} aria-hidden="true" />
            </button>
          )}

          <div
            className={cn(
              "rounded-lg border flex items-center justify-center shrink-0 w-7 h-7 transition-colors",
              isAllDone
                ? "bg-success-500/15 border-success-500/40 text-success-500"
                : "bg-primary/10 dark:bg-primary-dark/40 border-primary/25 dark:border-white/10 text-primary dark:text-gold",
            )}
          >
            <ColumnIcon size={15} />
          </div>
          <h3 className="font-bold text-neutral-100 group-hover/col-header:text-primary dark:group-hover/col-header:text-gold transition-colors truncate min-w-0 text-sm">
            {column.title}
          </h3>
          <span
            title={
              totalTasks > 0
                ? tColumn("completedProgressTitle", {
                    completed: completedTasks,
                    total: totalTasks,
                  })
                : undefined
            }
            className={cn(
              "text-tiny font-bold px-1.5 py-0.5 rounded-full border shrink-0 transition-colors",
              isAllDone
                ? "bg-success-500/15 border-success-500/40 text-success-500"
                : completedTasks > 0
                  ? "bg-gold/15 border-gold/35 text-gold"
                  : "bg-surface dark:bg-white/10 border-neutral-700 dark:border-white/15 text-neutral-300",
            )}
          >
            {completedTasks > 0
              ? `${completedTasks}/${totalTasks}`
              : totalTasks}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isReadOnly && (
            <button
              type="button"
              {...STOP_DRAG_PROPAGATION_PROPS}
              onClick={handleTriggerAdd}
              title={t("addTaskInColumnTitle", { title: column.title })}
              className="flex items-center gap-1 text-neutral-400 hover:text-primary dark:hover:text-gold hover:bg-white/5 rounded-md transition-colors cursor-pointer shrink-0 px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              <Plus size={14} aria-hidden="true" />
              <span className="hidden sm:inline">{t("addTaskButton")}</span>
            </button>
          )}

          {onOpenColumnMenu && (
            <button
              type="button"
              {...STOP_DRAG_PROPAGATION_PROPS}
              onClick={(e) => {
                e.stopPropagation();
                onOpenColumnMenu(e, column);
              }}
              aria-label={tColumn("optionsAria", { title: column.title })}
              title={tColumn("optionsTitle")}
              className="p-1.5 rounded-md text-neutral-400 hover:text-gold hover:bg-white/10 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              <MoreVertical size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Criação Rápida Inline */}
      {isQuickAdding && !isReadOnly && (
        <RoutineQuickAddForm
          columnId={column.id}
          onClose={() => setIsQuickAdding(false)}
          onQuickCreateTask={onQuickCreateTask}
          onOpenDetailedForm={onAddTaskToColumn}
        />
      )}

      {/* Lista de Linhas de Tarefa Sortable (Ativas separadas de Concluídas) */}
      <SortableContext
        items={activeTaskIds}
        strategy={verticalListSortingStrategy}
      >
        {isCompletelyEmpty && !isQuickAdding ? (
          isReadOnly ? (
            <div className="py-6 px-4 text-center rounded-lg border border-dashed border-neutral-700/70 dark:border-white/10 text-neutral-500 text-tiny bg-primary-dark/5">
              {t("emptyColumnState")}
            </div>
          ) : (
            <button
              type="button"
              onClick={handleTriggerAdd}
              className="w-full py-5 px-4 text-center rounded-lg border border-dashed border-neutral-700/70 dark:border-white/10 hover:border-primary/45 dark:hover:border-gold/50 text-neutral-400 hover:text-primary dark:hover:text-gold text-xs font-medium bg-primary-dark/5 hover:bg-card/50 transition-colors cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
            >
              <Plus size={14} aria-hidden="true" />
              <span>{t("emptyColumnState")}</span>
            </button>
          )
        ) : activeTasks.length === 0 &&
          hasCompletedSection &&
          !isQuickAdding ? (
          <div className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-dashed border-success-500/35 bg-success-500/[0.04] text-xs">
            <CheckCircle2
              size={16}
              className="text-success-500 shrink-0"
              aria-hidden="true"
            />
            <span className="font-semibold text-neutral-200">
              {tColumn("allDoneEmptyTitle")}
            </span>
            {!isReadOnly && (
              <button
                type="button"
                onClick={handleTriggerAdd}
                className="text-primary dark:text-gold font-semibold hover:underline cursor-pointer ml-1"
              >
                {tColumn("allDoneEmptyCta")}
              </button>
            )}
          </div>
        ) : activeTasks.length > 0 ? (
          <ul className="flex flex-col gap-2 w-full p-0 m-0 list-none min-h-6">
            {activeTasks.map((task, idx) => (
              <TaskRow
                key={task.id}
                task={task}
                className={
                  idx >= DEFERRED_ROW_START_INDEX
                    ? "deferred-list-row"
                    : undefined
                }
                isSelected={selectedTaskId === task.id}
                isReadOnly={isReadOnly}
                isDeleteChecking={Boolean(deletingTaskIds?.has(task.id))}
                columnId={column.id}
                columnTitle={column.title}
                isSortable={true}
                onOpenDetails={handleOpenRowDetails}
                onEditTask={onEditTask ? handleEditRowTask : undefined}
                onContextMenu={handleRowContextMenu}
                onToggleCompleted={onToggleComplete}
                onHabitChange={onHabitChange}
                onStartFocus={onStartFocus}
              />
            ))}
          </ul>
        ) : null}
      </SortableContext>

      <SortableContext
        items={completedTaskIds}
        strategy={verticalListSortingStrategy}
      >
        {/* Seção colapsável de ToDos concluídos */}
        {hasCompletedSection && (
          <ColumnCompletedSection
            columnId={column.id}
            variant="list"
            isExpanded={isCompletedExpanded}
            onToggleExpanded={toggleCompletedExpanded}
            totalCompletedCount={
              completedTodoTasks.length + archivedCompletedCount
            }
            archivedCompletedCount={archivedCompletedCount}
            onLoadArchivedCompleted={onLoadArchivedCompleted}
          >
            {completedTodoTasks.length > 0 && (
              <ul className="flex flex-col gap-2 w-full p-0 m-0 list-none">
                {completedTodoTasks.map((task, idx) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    className={
                      idx >= DEFERRED_ROW_START_INDEX
                        ? "deferred-list-row"
                        : undefined
                    }
                    isSelected={selectedTaskId === task.id}
                    isReadOnly={isReadOnly}
                    isDeleteChecking={Boolean(deletingTaskIds?.has(task.id))}
                    columnId={column.id}
                    columnTitle={column.title}
                    isSortable={true}
                    onOpenDetails={handleOpenRowDetails}
                    onEditTask={onEditTask ? handleEditRowTask : undefined}
                    onContextMenu={handleRowContextMenu}
                    onToggleCompleted={onToggleComplete}
                    onHabitChange={onHabitChange}
                    onStartFocus={onStartFocus}
                  />
                ))}
              </ul>
            )}
          </ColumnCompletedSection>
        )}

        {/* Mantém a linha concluída arrastada montada caso o usuário passe por cima de uma seção recolhida */}
        {!isCompletedExpanded && draggedCompletedTask && (
          <ul
            aria-hidden="true"
            className="h-0 overflow-hidden pointer-events-none opacity-0 p-0 m-0 list-none"
          >
            <TaskRow
              task={draggedCompletedTask}
              columnId={column.id}
              columnTitle={column.title}
              isReadOnly={isReadOnly}
              isSortable={true}
            />
          </ul>
        )}
      </SortableContext>
    </section>
  );
});

export function RoutineTaskList({
  columns,
  visibleColumnIds,
  selectedColumnId,
  selectedTaskId,
  deletingTaskIds,
  isReadOnly = false,
  forceExpandCompleted = false,
  hasActiveFilters = false,
  onClearFilters,
  onManageColumns,
  onAddColumn,
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
  activeDraggedTaskId: activeDraggedTaskIdProp = null,
  dndState,
}: RoutineTaskListProps) {
  const t = useTranslations("tasks.taskList");
  const resolvedDraggedTaskId =
    activeDraggedTaskIdProp ?? dndState?.activeTask?.id ?? null;

  const visibleColumns = useMemo(
    () => columns.filter((col) => visibleColumnIds.includes(col.id)),
    [columns, visibleColumnIds],
  );

  const visibleColumnIdsOrdered = useMemo(
    () => visibleColumns.map((col) => col.id),
    [visibleColumns],
  );

  const totalTasksCount = useMemo(
    () =>
      visibleColumns.reduce(
        (acc, col) => acc + col.tasks.length + (col.archivedTotalCount ?? 0),
        0,
      ),
    [visibleColumns],
  );

  const listContent = (
    <div className="@container flex-1 min-h-0 w-full flex flex-col gap-6 overflow-y-auto overflow-x-hidden pr-1 pb-10">
      {/* Cabeçalho tabular global */}
      <div
        className={cn(
          "hidden @lg:grid items-center text-xs font-semibold text-neutral-400 border-b border-b-neutral-700 dark:border-b-white/10 border-l-4 border-l-transparent border-r border-r-transparent select-none gap-2.5 @lg:gap-3 px-3 @lg:px-4 py-2",
          TASK_TABLE_GRID_COLS,
        )}
        aria-hidden="true"
      >
        <span className="min-w-0 truncate pl-16 sm:pl-15">
          {t("headerTaskName")}
        </span>
        <span className="min-w-0">{t("headerList")}</span>
        <span className="min-w-0">{t("headerType")}</span>
        <span className="text-center min-w-0">{t("headerPriority")}</span>
        <span className="hidden @2xl:block min-w-0 truncate">
          {t("headerFrequencyDue")}
        </span>
        <span className="text-right pr-1 min-w-0">{t("headerActions")}</span>
      </div>

      {columns.length === 0 ? (
        <BoardEmptyState
          variant="no_columns"
          isReadOnly={isReadOnly}
          onAddColumn={onAddColumn}
        />
      ) : visibleColumns.length === 0 ? (
        <BoardEmptyState
          variant="all_hidden"
          onManageColumns={onManageColumns}
        />
      ) : totalTasksCount === 0 && hasActiveFilters ? (
        <BoardEmptyState
          variant="no_filter_matches"
          onClearFilters={onClearFilters}
        />
      ) : (
        <SortableContext
          items={visibleColumnIdsOrdered}
          strategy={verticalListSortingStrategy}
        >
          {visibleColumns.map((col) => {
            const colHasSelected = Boolean(
              selectedTaskId &&
                col.tasks.some((task) => task.id === selectedTaskId),
            );
            const colHasDragged = Boolean(
              resolvedDraggedTaskId &&
                col.tasks.some((task) => task.id === resolvedDraggedTaskId),
            );

            return (
              <RoutineTaskListSection
                key={col.id}
                column={col}
                selectedColumnId={selectedColumnId}
                selectedTaskId={colHasSelected ? selectedTaskId : undefined}
                deletingTaskIds={deletingTaskIds}
                isReadOnly={isReadOnly}
                forceExpandCompleted={forceExpandCompleted}
                activeDraggedTaskId={
                  colHasDragged ? resolvedDraggedTaskId : null
                }
                onAddTaskToColumn={onAddTaskToColumn}
                onQuickCreateTask={onQuickCreateTask}
                onOpenDetails={onOpenDetails}
                onEditTask={onEditTask}
                onContextMenu={onContextMenu}
                onOpenColumnMenu={onOpenColumnMenu}
                onToggleComplete={onToggleComplete}
                onHabitChange={onHabitChange}
                onStartFocus={onStartFocus}
                onLoadArchivedCompleted={onLoadArchivedCompleted}
              />
            );
          })}
        </SortableContext>
      )}
    </div>
  );

  return listContent;
}
