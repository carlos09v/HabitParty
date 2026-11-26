"use client";

import {
  type Announcements,
  DndContext,
  DragOverlay,
  defaultDropAnimation,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers";
import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useMemo } from "react";
import { RoutineBoard } from "@/components/tasks/RoutineBoard";
import { RoutineTaskCard } from "@/components/tasks/RoutineTaskCard";
import { RoutineTaskList } from "@/components/tasks/RoutineTaskList";
import { TaskRow } from "@/components/tasks/shared/TaskRow";
import { TasksBoardFilterBar } from "@/components/tasks/TasksBoardFilterBar";
import { getColumnIcon } from "@/constants/routine";
import type {
  BoardColumn,
  CreateTaskDTO,
  Task,
  TaskTypeOption,
} from "@/types/task";
import type {
  BoardAlignment,
  ColumnWidthPreset,
  InitialTaskFormData,
  RoutineFiltersProps,
  RoutineTaskListProps,
} from "@/types/task-ui";
import { cn } from "@/utils";

const CARD_DND_MODIFIERS = [restrictToWindowEdges];
const LIST_DND_MODIFIERS = [restrictToVerticalAxis, restrictToWindowEdges];

function RoutineColumnDragOverlay({
  column,
  widthClass,
}: {
  column: BoardColumn;
  widthClass: string;
}) {
  const ColumnIcon = getColumnIcon(column.icon);
  const totalCount = column.tasks.length + (column.archivedTotalCount ?? 0);
  const previewTasks = column.tasks.slice(0, 3);
  const remainingCount = Math.max(0, totalCount - previewTasks.length);

  return (
    <div
      className={cn(
        "rounded-2xl border border-gold/70 bg-surface/95 dark:bg-primary-dark/90 shadow-card-deep scale-102 rotate-1 p-3.5 flex flex-col gap-2.5 select-none pointer-events-none",
        widthClass,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <GripVertical
          size={15}
          className="text-gold shrink-0"
          aria-hidden="true"
        />
        <div className="rounded-lg border border-gold/40 bg-gold/15 text-gold p-1.5 flex items-center justify-center shrink-0">
          <ColumnIcon size={16} aria-hidden="true" />
        </div>
        <span className="font-bold text-neutral-50 truncate text-sm sm:text-base flex-1">
          {column.title}
        </span>
        <span className="font-bold rounded-full border border-gold/35 bg-gold/15 text-gold text-xs px-2 py-0.5 shrink-0 tabular-nums">
          {totalCount}
        </span>
      </div>

      {previewTasks.length > 0 && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-neutral-700/50 dark:border-white/10">
          {previewTasks.map((task) => (
            <div
              key={task.id}
              className="px-2.5 py-2 rounded-lg bg-card/85 dark:bg-surface/65 border border-neutral-700/60 dark:border-white/10 text-xs font-medium text-neutral-200 truncate"
            >
              {task.title}
            </div>
          ))}
          {remainingCount > 0 && (
            <span className="text-tiny text-neutral-400 font-semibold text-center pt-0.5 tabular-nums">
              +{remainingCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface TasksBoardViewportProps {
  viewMode: "card" | "list" | "grid";
  isReadOnly?: boolean;
  sharedFilterProps: Omit<
    RoutineFiltersProps,
    "isDraggingColumn" | "enableDroppable"
  >;
  searchQuery: string;
  localMatchCount: number;
  filteredColumns: BoardColumn[];
  visibleColumnIds: string[];
  selectedColumnId: string | null;
  selectedTaskId?: string;
  deletingTaskIds: ReadonlySet<string>;
  alignment: BoardAlignment;
  columnWidths: Record<string, ColumnWidthPreset>;
  getColumnWidthClass: (colId: string) => string;
  forceExpandCompleted: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onManageColumns?: () => void;
  boardDnd: NonNullable<RoutineTaskListProps["dndState"]>;
  onOpenCreateColumn: () => void;
  onAddTaskToColumn: (
    colId: string,
    initialType?: TaskTypeOption,
    initialTitle?: string,
    initialValues?: InitialTaskFormData,
  ) => void;
  onQuickCreateTask: (
    title: string,
    columnId: string,
    taskType?: TaskTypeOption,
    extraPayload?: Partial<CreateTaskDTO>,
  ) => Promise<boolean | undefined> | Promise<void>;
  onOpenDetails: (task: Task, columnId: string, anchorRect?: DOMRect) => void;
  onEditTask: (task: Task, columnId: string) => void;
  onContextMenu: (e: React.MouseEvent, task: Task, columnId: string) => void;
  onOpenColumnMenu: (e: React.MouseEvent, column: BoardColumn) => void;
  onToggleComplete: (taskId: string, completed: boolean) => boolean | undefined;
  onHabitChange: (taskId: string, delta: number) => boolean | undefined;
  onStartFocusTask: (task: Task) => void;
  onLoadArchivedCompleted: (columnId: string) => Promise<void>;
}

export function TasksBoardViewport({
  viewMode,
  isReadOnly = false,
  sharedFilterProps,
  searchQuery,
  localMatchCount,
  filteredColumns,
  visibleColumnIds,
  selectedColumnId,
  selectedTaskId,
  deletingTaskIds,
  alignment,
  columnWidths,
  getColumnWidthClass,
  forceExpandCompleted,
  hasActiveFilters = false,
  onClearFilters,
  onManageColumns,
  boardDnd,
  onOpenCreateColumn,
  onAddTaskToColumn,
  onQuickCreateTask,
  onOpenDetails,
  onEditTask,
  onContextMenu,
  onOpenColumnMenu,
  onToggleComplete,
  onHabitChange,
  onStartFocusTask,
  onLoadArchivedCompleted,
}: TasksBoardViewportProps) {
  const t = useTranslations("tasks.container");
  const tList = useTranslations("tasks.taskList");
  const tDnd = useTranslations("tasks.dnd");
  const isCardView = viewMode === "card";
  const activeTaskColumn = boardDnd.activeTask?.columnId
    ? filteredColumns.find((c) => c.id === boardDnd.activeTask?.columnId)
    : undefined;

  const resolveDndLabel = useCallback(
    (id: UniqueIdentifier): string => {
      const strId = String(id);
      if (strId === "store-column-button") {
        return tDnd("storeColumnTarget");
      }
      for (const col of filteredColumns) {
        if (col.id === strId) return col.title;
        const foundTask = col.tasks.find((item) => item.id === strId);
        if (foundTask) return foundTask.title;
      }
      return strId;
    },
    [filteredColumns, tDnd],
  );

  const dndAccessibility = useMemo(() => {
    const announcements: Announcements = {
      onDragStart({ active }) {
        return tDnd("dragStart", { item: resolveDndLabel(active.id) });
      },
      onDragOver({ active, over }) {
        const item = resolveDndLabel(active.id);
        if (over) {
          return tDnd("dragOver", { item, target: resolveDndLabel(over.id) });
        }
        return tDnd("dragOverNone", { item });
      },
      onDragEnd({ active, over }) {
        const item = resolveDndLabel(active.id);
        if (over) {
          return tDnd("dragEnd", { item, target: resolveDndLabel(over.id) });
        }
        return tDnd("dragEndUnchanged", { item });
      },
      onDragCancel({ active }) {
        return tDnd("dragCancel", { item: resolveDndLabel(active.id) });
      },
    };

    return {
      announcements,
      screenReaderInstructions: {
        draggable: tDnd("instructions"),
      },
    };
  }, [resolveDndLabel, tDnd]);

  return (
    <DndContext
      id="routine-board-dnd"
      sensors={boardDnd.sensors}
      collisionDetection={boardDnd.collisionDetection}
      modifiers={isCardView ? CARD_DND_MODIFIERS : LIST_DND_MODIFIERS}
      accessibility={dndAccessibility}
      {...boardDnd.handlers}
    >
      {/* Barra de Filtros com Popover, Busca e Seletor de Visualização (Cards / Lista) */}
      <TasksBoardFilterBar
        sharedFilterProps={sharedFilterProps}
        searchQuery={searchQuery}
        localMatchCount={localMatchCount}
        isDraggingColumn={Boolean(boardDnd.activeColumn)}
        enableDroppable={!isReadOnly}
      />

      <section
        className="flex-1 min-h-[440px] sm:min-h-[500px] lg:min-h-0 min-w-0 flex flex-col"
        aria-label={t("boardAria")}
      >
        {isCardView ? (
          <RoutineBoard
            columns={filteredColumns}
            visibleColumnIds={visibleColumnIds}
            selectedColumnId={selectedColumnId}
            selectedTaskId={selectedTaskId}
            deletingTaskIds={deletingTaskIds}
            isReadOnly={isReadOnly}
            alignment={alignment}
            columnWidths={columnWidths}
            getColumnWidthClass={getColumnWidthClass}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
            onManageColumns={onManageColumns}
            onAddColumn={onOpenCreateColumn}
            onAddTaskToColumn={onAddTaskToColumn}
            onQuickCreateTask={onQuickCreateTask}
            onOpenDetails={onOpenDetails}
            onEditTask={onEditTask}
            onContextMenu={onContextMenu}
            onOpenColumnMenu={onOpenColumnMenu}
            onToggleComplete={onToggleComplete}
            onHabitChange={onHabitChange}
            onStartFocus={onStartFocusTask}
            onLoadArchivedCompleted={onLoadArchivedCompleted}
            forceExpandCompleted={forceExpandCompleted}
            activeDraggedTaskId={boardDnd.activeTask?.id}
          />
        ) : (
          <RoutineTaskList
            columns={filteredColumns}
            visibleColumnIds={visibleColumnIds}
            selectedColumnId={selectedColumnId}
            selectedTaskId={selectedTaskId}
            deletingTaskIds={deletingTaskIds}
            isReadOnly={isReadOnly}
            forceExpandCompleted={forceExpandCompleted}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={onClearFilters}
            onManageColumns={onManageColumns}
            onAddColumn={onOpenCreateColumn}
            onAddTaskToColumn={onAddTaskToColumn}
            onQuickCreateTask={onQuickCreateTask}
            onOpenDetails={onOpenDetails}
            onEditTask={onEditTask}
            onContextMenu={onContextMenu}
            onOpenColumnMenu={onOpenColumnMenu}
            onToggleComplete={onToggleComplete}
            onHabitChange={onHabitChange}
            onStartFocus={onStartFocusTask}
            onLoadArchivedCompleted={onLoadArchivedCompleted}
            activeDraggedTaskId={boardDnd.activeTask?.id}
          />
        )}
      </section>

      {/* Overlay único leve durante o arrasto (Card e Lista) */}
      <DragOverlay
        dropAnimation={isCardView ? undefined : defaultDropAnimation}
      >
        {boardDnd.activeColumn &&
          (isCardView ? (
            <RoutineColumnDragOverlay
              column={boardDnd.activeColumn}
              widthClass={getColumnWidthClass(boardDnd.activeColumn.id)}
            />
          ) : (
            <div className="opacity-95 shadow-2xl p-3 rounded-xl bg-surface border border-gold/70 flex items-center gap-2.5">
              <GripVertical
                size={14}
                className="text-gold"
                aria-hidden="true"
              />
              <span className="font-bold text-neutral-100 text-sm">
                {boardDnd.activeColumn.title}
              </span>
              <span className="text-tiny font-bold px-1.5 py-0.5 rounded-full bg-surface dark:bg-white/10 text-neutral-300">
                {tList("overlayTasksCount", {
                  count:
                    boardDnd.activeColumn.tasks.length +
                    (boardDnd.activeColumn.archivedTotalCount ?? 0),
                })}
              </span>
            </div>
          ))}
        {boardDnd.activeTask &&
          (isCardView ? (
            <RoutineTaskCard
              task={boardDnd.activeTask}
              columnId={boardDnd.activeTask.columnId || ""}
              isCompact={
                columnWidths[boardDnd.activeTask.columnId || ""] === "compact"
              }
              isOverlay
            />
          ) : (
            <ul className="opacity-95 shadow-2xl scale-102 list-none m-0 p-0">
              <TaskRow
                task={boardDnd.activeTask}
                columnId={boardDnd.activeTask.columnId || ""}
                columnTitle={activeTaskColumn?.title}
                onStartFocus={onStartFocusTask}
                isSortable
                isOverlay
              />
            </ul>
          ))}
      </DragOverlay>
    </DndContext>
  );
}
