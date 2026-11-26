"use client";

import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { useTranslations } from "next-intl";
import { useCallback, useMemo, useRef } from "react";
import { BoardEmptyState } from "@/components/tasks/shared";
import { COLUMN_WIDTH_CLASSES, getColumnIcon } from "@/constants/routine";
import type { RoutineBoardProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { RoutineColumn } from "./RoutineColumn";

export function RoutineBoard({
  columns,
  visibleColumnIds,
  selectedColumnId,
  selectedTaskId,
  deletingTaskIds,
  isReadOnly = false,
  alignment = "left",
  columnWidths = {},
  getColumnWidthClass: customGetColumnWidthClass,
  hasActiveFilters = false,
  onClearFilters,
  onManageColumns,
  onAddColumn,
  onAddTaskToColumn,
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
  onQuickCreateTask,
}: RoutineBoardProps) {
  const t = useTranslations("tasks.board");
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const resolveColumnWidthClass = useCallback(
    (colId: string) => {
      if (customGetColumnWidthClass) {
        return customGetColumnWidthClass(colId);
      }
      const preset = columnWidths[colId] || "normal";
      return COLUMN_WIDTH_CLASSES[preset] || COLUMN_WIDTH_CLASSES.normal;
    },
    [customGetColumnWidthClass, columnWidths],
  );

  // Filtra as colunas que estão visíveis no quadro
  const visibleColumns = useMemo(
    () => columns.filter((col) => visibleColumnIds.includes(col.id)),
    [columns, visibleColumnIds],
  );

  // Garante que a ordem dos IDs no SortableContext seja rigorosamente a mesma dos nós renderizados
  const visibleColumnIdsOrdered = useMemo(
    () => visibleColumns.map((col) => col.id),
    [visibleColumns],
  );

  const totalVisibleTasksCount = useMemo(
    () =>
      visibleColumns.reduce(
        (acc, col) => acc + col.tasks.length + (col.archivedTotalCount ?? 0),
        0,
      ),
    [visibleColumns],
  );

  const handleJumpToColumn = useCallback((columnId: string) => {
    const scroller = scrollContainerRef.current;
    if (!scroller) return;
    const escapedId =
      typeof CSS !== "undefined" && typeof CSS.escape === "function"
        ? CSS.escape(columnId)
        : columnId.replace(/["\\]/g, "\\$&");
    const target = scroller.querySelector<HTMLElement>(
      `[data-column-id="${escapedId}"]`,
    );
    target?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, []);

  // 1. ESTADO VAZIO: WORKSPACE SEM COLUNAS
  if (columns.length === 0) {
    return (
      <BoardEmptyState
        variant="no_columns"
        isReadOnly={isReadOnly}
        onAddColumn={onAddColumn}
      />
    );
  }

  // 2. ESTADO VAZIO: TODAS AS COLUNAS ESTÃO OCULTAS
  if (visibleColumns.length === 0) {
    return (
      <BoardEmptyState variant="all_hidden" onManageColumns={onManageColumns} />
    );
  }

  // 3. ESTADO VAZIO: NENHUMA TAREFA CORRESPONDE AOS FILTROS ATIVOS
  if (totalVisibleTasksCount === 0 && hasActiveFilters) {
    return (
      <BoardEmptyState
        variant="no_filter_matches"
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <div className="w-full h-full min-h-0 flex-1 flex flex-col min-w-0">
      {/* Navegação rápida por colunas em telas mobile (< sm) */}
      {visibleColumns.length > 1 && (
        <nav
          aria-label={t("mobileColumnsNavAria")}
          className="sm:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 px-1 shrink-0"
        >
          {visibleColumns.map((column) => {
            const ColumnIcon = getColumnIcon(column.icon);
            const count =
              column.tasks.length + (column.archivedTotalCount ?? 0);
            const isActiveCol = selectedColumnId === column.id;
            return (
              <button
                key={column.id}
                type="button"
                onClick={() => handleJumpToColumn(column.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70",
                  isActiveCol
                    ? "bg-amber-500/15 border-amber-500/45 text-amber-800 dark:bg-gold/15 dark:border-gold/50 dark:text-gold"
                    : "bg-surface/80 border-neutral-700/70 text-neutral-300 hover:text-neutral-100 dark:border-white/10",
                )}
              >
                <ColumnIcon size={13} className="shrink-0" aria-hidden="true" />
                <span className="max-w-[120px] truncate">{column.title}</span>
                <span className="text-tiny font-bold opacity-75 tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Quadro Kanban: Colunas fluidas com rolagem horizontal suave quando necessário */}
      <div
        ref={scrollContainerRef}
        className="w-full h-full min-h-0 flex-1 overflow-x-auto custom-scrollbar min-w-0 snap-x snap-proximity sm:snap-none pb-4 pt-2 px-1.5"
      >
        <div
          className={cn(
            "min-w-full w-max h-full flex items-stretch gap-4",
            alignment === "center" && "justify-center",
            alignment === "right" && "justify-end",
            alignment === "left" && "justify-start",
          )}
        >
          <SortableContext
            items={visibleColumnIdsOrdered}
            strategy={horizontalListSortingStrategy}
          >
            {visibleColumns.map((column) => {
              const colHasSelected = Boolean(
                selectedTaskId &&
                  column.tasks.some((task) => task.id === selectedTaskId),
              );
              const colHasDragged = Boolean(
                activeDraggedTaskId &&
                  column.tasks.some((task) => task.id === activeDraggedTaskId),
              );

              return (
                <div
                  key={column.id}
                  className={cn(
                    "h-full shrink-0 flex flex-col snap-center sm:snap-align-none",
                    resolveColumnWidthClass(column.id),
                  )}
                >
                  <RoutineColumn
                    column={column}
                    isSelected={selectedColumnId === column.id}
                    isReadOnly={isReadOnly}
                    selectedTaskId={colHasSelected ? selectedTaskId : undefined}
                    deletingTaskIds={deletingTaskIds}
                    widthPreset={columnWidths[column.id] || "normal"}
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
                    forceExpandCompleted={forceExpandCompleted}
                    activeDraggedTaskId={
                      colHasDragged ? activeDraggedTaskId : null
                    }
                  />
                </div>
              );
            })}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
