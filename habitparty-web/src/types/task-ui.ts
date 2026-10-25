import type { Dispatch, SetStateAction } from "react";
import type {
  BoardColumn,
  BoardFilterState,
  CreateTaskDTO,
  Task,
  TaskTypeOption,
} from "./task";

export type BoardAlignment = "left" | "center" | "right";
export type ColumnWidthPreset = "compact" | "normal" | "wide";
export type FormatSyntax = "bold" | "italic" | "highlight" | "bullet" | "code";

export interface TaskRowProps {
  task: Task;
  isCompact?: boolean;
  activeFilter?: string;
  selectedDate?: string | null;
  columnId?: string;
  columnTitle?: string;
  isSortable?: boolean;
  isOverlay?: boolean;
  onToggle?: (id: string, completed: boolean) => void;
  onToggleCompleted?: (id: string, completed: boolean) => void;
  onHabitChange?: (id: string, delta: number) => void;
  onContextMenu?: (e: React.MouseEvent, task: Task, columnId?: string) => void;
  onOpenDetails?: (task: Task, anchorRect?: DOMRect, columnId?: string) => void;
}

export interface TaskDetailsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  columnTitle?: string;
  anchorRect?: DOMRect | null;
  onTaskUpdate?: (updatedTask: Task) => void;
  onDelete?: (taskId: string) => void;
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  onEdit?: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
}

export interface TaskDetailsFooterProps {
  task?: Task;
  columnTitle?: string;
  onApplyFormat?: (syntax: FormatSyntax) => void;
  onDeleteTask: () => void;
  onDuplicateTask?: () => void;
  onOpenEdit?: () => void;
}

export interface RoutineFilterPopoverProps {
  filters?: BoardFilterState;
  onFilterChange?: (filters: BoardFilterState) => void;
  availableTags?: string[];
  isCompact?: boolean;
}

export interface BoardAlignmentSelectorProps {
  value: BoardAlignment;
  onChange: (align: BoardAlignment) => void;
  isCompact?: boolean;
  className?: string;
}

export interface TasksBoardContainerProps {
  initialColumns: BoardColumn[];
  initialVisibleColumnIds?: string[];
  initialOpenCreateColumn?: boolean;
  targetColumnId?: string;
  isPremium?: boolean;
  workspaceId?: string | null;
  isCompact?: boolean;
}

export interface TasksBoardModalsProps {
  columns: BoardColumn[];
  formColumns: { id: string; title: string }[];
  visibleColumnIds: string[];
  maxColumns: number;
  isPremium: boolean;
  columnModalState: { isOpen: boolean; columnToEdit?: BoardColumn | null };
  closeColumnModal: () => void;
  setColumnModalState: Dispatch<
    SetStateAction<{ isOpen: boolean; columnToEdit?: BoardColumn | null }>
  >;
  handleColumnSaved: (col: BoardColumn, isEdit?: boolean) => void;
  taskModalState: {
    isOpen: boolean;
    columnId?: string;
    defaultTaskType?: TaskTypeOption;
    initialTitle?: string;
    taskToEdit?: Task | null;
  };
  setTaskModalState: Dispatch<
    SetStateAction<{
      isOpen: boolean;
      columnId?: string;
      defaultTaskType?: TaskTypeOption;
      initialTitle?: string;
      taskToEdit?: Task | null;
    }>
  >;
  handleTaskSaved: (task: Task, columnId: string) => void;
  selectedTaskDetails: {
    task: Task;
    columnId: string;
    anchorRect?: DOMRect | null;
  } | null;
  setSelectedTaskDetails: Dispatch<
    SetStateAction<{
      task: Task;
      columnId: string;
      anchorRect?: DOMRect | null;
    } | null>
  >;
  contextMenu: {
    isOpen: boolean;
    position: { x: number; y: number };
    task: Task | null;
    columnId: string | null;
  };
  setContextMenu: Dispatch<
    SetStateAction<{
      isOpen: boolean;
      position: { x: number; y: number };
      task: Task | null;
      columnId: string | null;
    }>
  >;
  columnContextMenu: {
    isOpen: boolean;
    position: { x: number; y: number };
    column: BoardColumn | null;
  };
  setColumnContextMenu: Dispatch<
    SetStateAction<{
      isOpen: boolean;
      position: { x: number; y: number };
      column: BoardColumn | null;
    }>
  >;
  columnToDelete: BoardColumn | null;
  setColumnToDelete: (col: BoardColumn | null) => void;
  isDeletingColumn: boolean;
  handleDeleteColumn: (col: BoardColumn) => Promise<boolean>;
  handleDuplicateTask: (task: Task, columnId: string) => void;
  handleDeleteTask: (task: Task, columnId: string) => void;
  handleTaskDetailsUpdate: (task: Task) => void;
  handleToggleComplete: (taskId: string, completed: boolean) => void;
  isColumnsDrawerOpen: boolean;
  setIsColumnsDrawerOpen: (open: boolean) => void;
  toggleColumnVisibility: (id: string) => void;
  showAllColumns: () => void;
  columnWidths?: Record<string, ColumnWidthPreset>;
  onColumnWidthChange?: (columnId: string, width: ColumnWidthPreset) => void;
}

export interface RoutineBoardProps {
  columns: BoardColumn[];
  setColumns: Dispatch<SetStateAction<BoardColumn[]>>;
  visibleColumnIds: string[];
  isCompact?: boolean;
  maxColumns?: number;
  selectedColumnId?: string | null;
  alignment?: BoardAlignment;
  columnWidths?: Record<string, ColumnWidthPreset>;
  getColumnWidthClass?: (columnId: string) => string;
  onAddColumn?: () => void;
  onOpenColumnsDrawer?: () => void;
  onViewModeChange?: (mode: "card" | "list") => void;
  onAddTaskToColumn?: (
    columnId: string,
    initialType?: TaskTypeOption,
    initialTitle?: string,
  ) => void;
  onOpenDetails?: (task: Task, columnId: string, anchorRect?: DOMRect) => void;
  onContextMenu?: (e: React.MouseEvent, task: Task, columnId: string) => void;
  onTaskMove?: (
    taskId: string,
    targetColumnId: string,
    newIndex: number,
  ) => void;
  onColumnReorder?: (reorderedColumns: BoardColumn[]) => void;
  onOpenColumnMenu?: (e: React.MouseEvent, column: BoardColumn) => void;
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  onHabitChange?: (taskId: string, delta: number) => void;
  onQuickCreateTask?: (
    title: string,
    columnId: string,
    taskType?: TaskTypeOption,
    extraPayload?: Partial<CreateTaskDTO>,
  ) => Promise<void>;
  dndState?: unknown;
  onHideColumn?: (columnId: string) => void;
}

export interface RoutineColumnProps {
  column: BoardColumn;
  columnIndex: number;
  isSelected?: boolean;
  isCompact?: boolean;
  widthPreset?: ColumnWidthPreset;
  onAddTaskToColumn?: (
    columnId: string,
    initialType?: TaskTypeOption,
    initialTitle?: string,
  ) => void;
  onQuickCreateTask?: (
    title: string,
    columnId: string,
    taskType?: TaskTypeOption,
    extraPayload?: Partial<CreateTaskDTO>,
  ) => Promise<void>;
  onOpenDetails?: (task: Task, columnId: string, anchorRect?: DOMRect) => void;
  onContextMenu?: (e: React.MouseEvent, task: Task, columnId: string) => void;
  onOpenColumnMenu?: (e: React.MouseEvent, column: BoardColumn) => void;
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  onHabitChange?: (taskId: string, delta: number) => void;
  isOverlay?: boolean;
}

export interface RoutineTaskListProps {
  columns: BoardColumn[];
  setColumns: Dispatch<SetStateAction<BoardColumn[]>>;
  visibleColumnIds: string[];
  selectedColumnId?: string | null;
  isCompact?: boolean;
  onAddTaskToColumn: (
    columnId: string,
    initialType?: TaskTypeOption,
    initialTitle?: string,
  ) => void;
  onOpenDetails: (task: Task, columnId: string, anchorRect?: DOMRect) => void;
  onContextMenu: (e: React.MouseEvent, task: Task, columnId: string) => void;
  onTaskMove?: (
    taskId: string,
    targetColumnId: string,
    newOrderIndex: number,
    allTargetTasks?: Task[],
  ) => void;
  onColumnReorder?: (reorderedColumns: BoardColumn[]) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onHabitChange: (taskId: string, delta: number) => void;
  dndState?: {
    sensors: ReturnType<typeof import("@dnd-kit/core").useSensors>;
    activeColumn: BoardColumn | null;
    activeTask: Task | null;
    collisionDetection: import("@dnd-kit/core").CollisionDetection;
    handlers: {
      onDragStart: (event: import("@dnd-kit/core").DragStartEvent) => void;
      onDragOver: (event: import("@dnd-kit/core").DragOverEvent) => void;
      onDragEnd: (event: import("@dnd-kit/core").DragEndEvent) => void;
      onDragCancel: () => void;
    };
  };
}

export interface RoutineTaskListSectionProps {
  column: BoardColumn;
  isCompact: boolean;
  selectedColumnId?: string | null;
  onAddTaskToColumn: (
    columnId: string,
    initialType?: TaskTypeOption,
    initialTitle?: string,
  ) => void;
  onOpenDetails: (task: Task, columnId: string, anchorRect?: DOMRect) => void;
  onContextMenu: (e: React.MouseEvent, task: Task, columnId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onHabitChange: (taskId: string, delta: number) => void;
}

export interface RoutineQuickAddFormProps {
  columnId: string;
  isCompact?: boolean;
  isColumnCompact?: boolean;
  onClose: () => void;
  onQuickCreateTask?: (
    title: string,
    columnId: string,
    type: TaskTypeOption,
    extraPayload?: Partial<CreateTaskDTO>,
  ) => Promise<void> | void;
  onOpenDetailedForm?: (
    columnId: string,
    type: TaskTypeOption,
    title: string,
  ) => void;
}

export interface RoutineColumnsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  columns: BoardColumn[];
  visibleColumnIds: string[];
  maxColumns: number;
  isPremium: boolean;
  onToggleVisibility: (columnId: string) => void;
  onShowAll: () => void;
  onOpenCreateColumn: () => void;
  onEditColumn: (column: BoardColumn) => void;
  onDeleteColumn: (column: BoardColumn) => void;
}

export interface CreateBoardColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  columnToEdit?: BoardColumn | null;
  onSuccess?: (column: BoardColumn, isEdit?: boolean) => void;
}

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: { id: string; title: string }[];
  defaultColumnId?: string;
  defaultTaskType?: TaskTypeOption;
  initialTitle?: string;
  taskToEdit?: Task | null;
  onSuccess?: (task: Task, columnId: string) => void;
}

export interface UseCreateTaskFormOptions {
  isOpen: boolean;
  columns: { id: string; title: string }[];
  defaultColumnId?: string;
  defaultTaskType?: TaskTypeOption;
  initialTitle?: string;
  taskToEdit?: Task | null;
  onSuccess?: (task: Task, columnId: string) => void;
  onClose: () => void;
}

export interface RoutineFiltersProps {
  search?: string;
  onSearch?: (query: string) => void;
  viewMode?: {
    value: "card" | "list" | "grid";
    onChange: (mode: "card" | "list" | "grid") => void;
  };
  filters?: BoardFilterState;
  onFilterChange?: (filters: BoardFilterState) => void;
  alignment?: BoardAlignment;
  onAlignmentChange?: (alignment: BoardAlignment) => void;
  availableTags?: string[];
  onOpenCreateColumn?: () => void;
  onOpenCreateTask?: () => void;
  maxColumns?: number;
  isPremium?: boolean;
  canCreateColumn?: boolean;
  visibleColumnIds?: string[];
  onOpenColumnsDrawer?: () => void;
  isDraggingColumn?: boolean;
  enableDroppable?: boolean;
  isCompact?: boolean;
}

export interface RoutineTaskCardProps {
  task: Task;
  columnId: string;
  isCompact?: boolean;
  onOpenDetails?: (task: Task, columnId: string, anchorRect?: DOMRect) => void;
  onToggleCompleted?: (taskId: string, completed: boolean) => void;
  onHabitChange?: (taskId: string, delta: number) => void;
  onContextMenu?: (e: React.MouseEvent, task: Task, columnId: string) => void;
  isOverlay?: boolean;
}

export interface UseTaskProgressOptions {
  onToggle?: (taskId: string, completed: boolean) => void;
  onHabitChange?: (taskId: string, delta: number) => void;
}
