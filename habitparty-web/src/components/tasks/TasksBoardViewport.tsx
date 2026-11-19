"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useTranslations } from "next-intl";
import { RoutineBoard } from "@/components/tasks/RoutineBoard";
import { RoutineColumn } from "@/components/tasks/RoutineColumn";
import { RoutineTaskCard } from "@/components/tasks/RoutineTaskCard";
import { RoutineTaskList } from "@/components/tasks/RoutineTaskList";
import { TasksBoardFilterBar } from "@/components/tasks/TasksBoardFilterBar";
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

interface TasksBoardViewportProps {
  viewMode: "card" | "list" | "grid";
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
  ) => Promise<void>;
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

  if (viewMode === "card") {
    return (
      <DndContext
        id="routine-board-dnd"
        sensors={boardDnd.sensors}
        collisionDetection={boardDnd.collisionDetection}
        modifiers={[restrictToWindowEdges]}
        {...boardDnd.handlers}
      >
        {/* Barra de Filtros com Popover, Busca e Seletor de Visualização (Cards / Lista) */}
        <TasksBoardFilterBar
          sharedFilterProps={sharedFilterProps}
          searchQuery={searchQuery}
          localMatchCount={localMatchCount}
          isDraggingColumn={Boolean(boardDnd.activeColumn)}
          enableDroppable={true}
        />

        <section
          className="flex-1 min-h-[440px] sm:min-h-[500px] lg:min-h-0 min-w-0 flex flex-col"
          aria-label={t("boardAria")}
        >
          <RoutineBoard
            columns={filteredColumns}
            visibleColumnIds={visibleColumnIds}
            selectedColumnId={selectedColumnId}
            selectedTaskId={selectedTaskId}
            deletingTaskIds={deletingTaskIds}
            alignment={alignment}
            columnWidths={columnWidths}
            getColumnWidthClass={getColumnWidthClass}
            onAddColumn={onOpenCreateColumn}
            onAddTaskToColumn={onAddTaskToColumn}
            onQuickCreateTask={onQuickCreateTask}
            onOpenDetails={onOpenDetails}
            onEditTask={onEditTask}
            onContextMenu={onContextMenu}
            onOpenColumnMenu={onOpenColumnMenu}
            onToggleComplete={onToggleComplete}
            onHabitChange={onHabitChange}
            onLoadArchivedCompleted={onLoadArchivedCompleted}
            forceExpandCompleted={forceExpandCompleted}
            activeDraggedTaskId={boardDnd.activeTask?.id}
          />
        </section>

        {/* Overlay suave durante o arrasto */}
        <DragOverlay>
          {boardDnd.activeColumn && (
            <div
              className={cn(
                "h-[500px]",
                getColumnWidthClass(boardDnd.activeColumn.id),
              )}
            >
              <RoutineColumn
                column={boardDnd.activeColumn}
                columnIndex={0}
                widthPreset={columnWidths[boardDnd.activeColumn.id] || "normal"}
                isOverlay
              />
            </div>
          )}
          {boardDnd.activeTask && (
            <RoutineTaskCard
              task={boardDnd.activeTask}
              columnId={boardDnd.activeTask.columnId || ""}
              isOverlay
            />
          )}
        </DragOverlay>
      </DndContext>
    );
  }

  return (
    <>
      {/* Barra de Filtros no modo Lista */}
      <TasksBoardFilterBar
        sharedFilterProps={sharedFilterProps}
        searchQuery={searchQuery}
        localMatchCount={localMatchCount}
        isDraggingColumn={false}
        enableDroppable={false}
      />

      <section
        className="flex-1 min-h-[440px] sm:min-h-[500px] lg:min-h-0 min-w-0 flex flex-col"
        aria-label={t("boardAria")}
      >
        <RoutineTaskList
          columns={filteredColumns}
          visibleColumnIds={visibleColumnIds}
          selectedColumnId={selectedColumnId}
          selectedTaskId={selectedTaskId}
          deletingTaskIds={deletingTaskIds}
          onAddTaskToColumn={onAddTaskToColumn}
          onOpenDetails={onOpenDetails}
          onEditTask={onEditTask}
          onContextMenu={onContextMenu}
          onToggleComplete={onToggleComplete}
          onHabitChange={onHabitChange}
          onStartFocus={onStartFocusTask}
          onLoadArchivedCompleted={onLoadArchivedCompleted}
          dndState={boardDnd}
        />
      </section>
    </>
  );
}
