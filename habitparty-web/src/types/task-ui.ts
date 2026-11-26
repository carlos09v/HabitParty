import type { Dispatch, SetStateAction } from "react";
import type { ColumnMoveWorkspaceOption } from "@/components/tasks/shared";
import type {
  BoardColumn,
  BoardFilterState,
  CreateTaskDTO,
  DailyDaysOfWeek,
  DailyRepeatTypeOption,
  HabitImportanceOption,
  HabitTypeOption,
  ResetCounterOption,
  Task,
  TaskDifficultyOption,
  TaskPriorityOption,
  TaskTypeOption,
} from "./task";
import type { WorkspaceResponseDTO } from "./workspace";

export type BoardAlignment = "left" | "center" | "right";
export type ColumnWidthPreset = "compact" | "normal" | "wide";
export type FormatSyntax = "bold" | "italic" | "highlight" | "bullet" | "code";

export interface ColumnInsertTarget {
  referenceColumnId: string;
  position: "left" | "right";
  orderIndex: number;
}

export interface InitialTaskFormData {
  title?: string;
  taskType?: TaskTypeOption;
  difficulty?: TaskDifficultyOption;
  priority?: TaskPriorityOption;
  dueDate?: string;
  dueTime?: string;
  habitType?: HabitTypeOption;
  importanceType?: HabitImportanceOption;
  resetCounter?: ResetCounterOption;
  repeatType?: DailyRepeatTypeOption;
  repeatEvery?: number;
  daysOfWeek?: DailyDaysOfWeek[];
  startDate?: string;
}

export interface TaskRowProps {
  task: Task;
  className?: string;
  isSelected?: boolean;
  isReadOnly?: boolean;
  activeFilter?: string;
  selectedDate?: string | null;
  columnId?: string;
  columnTitle?: string;
  workspaceName?: string;
  isSortable?: boolean;
  isOverlay?: boolean;
  isDeleteChecking?: boolean;
  onToggle?: (id: string, completed: boolean) => boolean | undefined;
  onToggleCompleted?: (id: string, completed: boolean) => boolean | undefined;
  onHabitChange?: (id: string, delta: number) => boolean | undefined;
  onContextMenu?: (e: React.MouseEvent, task: Task, columnId?: string) => void;
  onOpenDetails?: (task: Task, anchorRect?: DOMRect, columnId?: string) => void;
  onEditTask?: (task: Task, columnId?: string) => void;
  onStartFocus?: (task: Task) => void;
}

export interface TaskDetailsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  columnTitle?: string;
  workspaceName?: string;
  availableTags?: string[];
  anchorRect?: DOMRect | null;
  onTaskUpdate?: (updatedTask: Task) => void;
  onDelete?: (taskId: string) => void;
  onToggleComplete?: (
    taskId: string,
    completed: boolean,
  ) => boolean | undefined;
  onHabitChange?: (taskId: string, delta: number) => boolean | undefined;
  onEdit?: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
  isDuplicating?: boolean;
  isReadOnly?: boolean;
  onOpenFocusHistory?: (task: Task) => void;
}

export interface TaskDetailsFooterProps {
  task?: Task;
  columnTitle?: string;
  isReadOnly?: boolean;
  onDeleteTask: () => void;
  onDuplicateTask?: () => void;
  isDuplicating?: boolean;
  onOpenEdit?: () => void;
}

export interface RoutineFilterPopoverProps {
  filters?: BoardFilterState;
  onFilterChange?: (filters: BoardFilterState) => void;
  availableTags?: string[];
  tagCounts?: Record<string, number>;
}

export interface BoardAlignmentSelectorProps {
  value: BoardAlignment;
  onChange: (align: BoardAlignment) => void;
  className?: string;
}

export interface TasksBoardContainerProps {
  initialColumns: BoardColumn[];
  initialVisibleColumnIds?: string[];
  initialOpenCreateColumn?: boolean;
  targetColumnId?: string;
  isPremium?: boolean;
  workspaceId?: string | null;
  initialWorkspaces?: WorkspaceResponseDTO[];
}

export interface TasksBoardModalsProps {
  columns: BoardColumn[];
  formColumns: { id: string; title: string }[];
  visibleColumnIds: string[];
  availableTags?: string[];
  maxColumns: number;
  isPremium: boolean;
  workspaceId?: string | null;
  columnModalState: {
    isOpen: boolean;
    columnToEdit?: BoardColumn | null;
    insertTarget?: ColumnInsertTarget | null;
  };
  closeColumnModal: () => void;
  setColumnModalState: Dispatch<
    SetStateAction<{
      isOpen: boolean;
      columnToEdit?: BoardColumn | null;
      insertTarget?: ColumnInsertTarget | null;
    }>
  >;
  handleColumnSaved: (
    col: BoardColumn,
    isEdit?: boolean,
    insertTarget?: ColumnInsertTarget | null,
  ) => void;
  taskModalState: {
    isOpen: boolean;
    columnId?: string;
    defaultTaskType?: TaskTypeOption;
    initialTitle?: string;
    initialValues?: InitialTaskFormData;
    taskToEdit?: Task | null;
  };
  setTaskModalState: Dispatch<
    SetStateAction<{
      isOpen: boolean;
      columnId?: string;
      defaultTaskType?: TaskTypeOption;
      initialTitle?: string;
      initialValues?: InitialTaskFormData;
      taskToEdit?: Task | null;
    }>
  >;
  handleTaskSaved: (task: Task, columnId: string) => void;
  selectedTaskDetails: {
    task: Task;
    columnId?: string;
    anchorRect?: DOMRect | null;
  } | null;
  setSelectedTaskDetails: Dispatch<
    SetStateAction<{
      task: Task;
      columnId?: string;
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
  onCloseColumnContextMenu: () => void;
  columnToDelete: BoardColumn | null;
  setColumnToDelete: (col: BoardColumn | null) => void;
  isDeletingColumn: boolean;
  handleDeleteColumn: (col: BoardColumn) => Promise<boolean>;
  handleDuplicateTask: (task: Task, columnId: string) => void;
  duplicatingTaskIds?: Set<string>;
  taskToDelete: { task: Task; columnId?: string } | null;
  deleteHistory: boolean;
  onDeleteHistoryChange: (checked: boolean) => void;
  requestDeleteTask: (task: Task, columnId?: string) => void;
  onConfirmDeleteTask: () => void | Promise<void>;
  onCancelDeleteTask: () => void;
  handleTaskDetailsUpdate: (task: Task) => void;
  handleToggleComplete: (
    taskId: string,
    completed: boolean,
  ) => boolean | undefined;
  handleHabitChange?: (taskId: string, delta: number) => boolean | undefined;
  onStartFocus?: (task: Task) => void;
  quickFocus?: ReturnType<
    typeof import("@/hooks/useQuickFocusTask").useQuickFocusTask
  >;
  onOpenEditTask?: (task: Task, columnId?: string) => void;
  onOpenCreateColumn?: () => void;
  ensureWriteAccess?: (errorMessage: string) => boolean;
  isColumnsDrawerOpen: boolean;
  setIsColumnsDrawerOpen: (open: boolean) => void;
  toggleColumnVisibility: (id: string) => void;
  showAllColumns: () => void;
  columnWidths?: Record<string, ColumnWidthPreset>;
  onColumnWidthChange?: (columnId: string, width: ColumnWidthPreset) => void;
  availableTargetWorkspaces?: ColumnMoveWorkspaceOption[];
  isWorkspaceReadOnly?: boolean;
  onMoveColumnToWorkspace?: (
    column: BoardColumn,
    targetWorkspaceId: string,
    targetWorkspaceName: string,
  ) => Promise<boolean>;
  onMoveLockedWorkspace?: (reason: "source" | "target", name?: string) => void;
  onMoveTaskToColumn?: (task: Task, targetColumnId: string) => void;
  onMoveColumnDirection?: (
    column: BoardColumn,
    direction: "left" | "right",
  ) => void;
}

export interface RoutineBoardProps {
  columns: BoardColumn[];
  visibleColumnIds: string[];
  selectedTaskId?: string;
  deletingTaskIds?: ReadonlySet<string>;
  selectedColumnId?: string | null;
  alignment?: BoardAlignment;
  columnWidths?: Record<string, ColumnWidthPreset>;
  getColumnWidthClass?: (columnId: string) => string;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onManageColumns?: () => void;
  onAddColumn?: () => void;
  onAddTaskToColumn?: (
    columnId: string,
    initialType?: TaskTypeOption,
    initialTitle?: string,
    initialValues?: InitialTaskFormData,
  ) => void;
  onOpenDetails?: (task: Task, columnId: string, anchorRect?: DOMRect) => void;
  onEditTask?: (task: Task, columnId: string) => void;
  onContextMenu?: (e: React.MouseEvent, task: Task, columnId: string) => void;
  onOpenColumnMenu?: (e: React.MouseEvent, column: BoardColumn) => void;
  onToggleComplete?: (
    taskId: string,
    completed: boolean,
  ) => boolean | undefined;
  onHabitChange?: (taskId: string, delta: number) => boolean | undefined;
  onStartFocus?: (task: Task) => void;
  onLoadArchivedCompleted?: (columnId: string) => Promise<void>;
  forceExpandCompleted?: boolean;
  activeDraggedTaskId?: string | null;
  isReadOnly?: boolean;
  onQuickCreateTask?: (
    title: string,
    columnId: string,
    taskType?: TaskTypeOption,
    extraPayload?: Partial<CreateTaskDTO>,
  ) => Promise<boolean | undefined> | Promise<void>;
}

export interface RoutineColumnProps {
  column: BoardColumn;
  isSelected?: boolean;
  isReadOnly?: boolean;
  selectedTaskId?: string;
  deletingTaskIds?: ReadonlySet<string>;
  widthPreset?: ColumnWidthPreset;
  onAddTaskToColumn?: (
    columnId: string,
    initialType?: TaskTypeOption,
    initialTitle?: string,
    initialValues?: InitialTaskFormData,
  ) => void;
  onQuickCreateTask?: (
    title: string,
    columnId: string,
    taskType?: TaskTypeOption,
    extraPayload?: Partial<CreateTaskDTO>,
  ) => Promise<boolean | undefined> | Promise<void>;
  onOpenDetails?: (task: Task, columnId: string, anchorRect?: DOMRect) => void;
  onEditTask?: (task: Task, columnId: string) => void;
  onContextMenu?: (e: React.MouseEvent, task: Task, columnId: string) => void;
  onOpenColumnMenu?: (e: React.MouseEvent, column: BoardColumn) => void;
  onToggleComplete?: (
    taskId: string,
    completed: boolean,
  ) => boolean | undefined;
  onHabitChange?: (taskId: string, delta: number) => boolean | undefined;
  onStartFocus?: (task: Task) => void;
  onLoadArchivedCompleted?: (columnId: string) => Promise<void>;
  forceExpandCompleted?: boolean;
  activeDraggedTaskId?: string | null;
  isOverlay?: boolean;
}

export interface RoutineTaskListProps {
  columns: BoardColumn[];
  visibleColumnIds: string[];
  selectedColumnId?: string | null;
  selectedTaskId?: string;
  deletingTaskIds?: ReadonlySet<string>;
  isReadOnly?: boolean;
  forceExpandCompleted?: boolean;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  onManageColumns?: () => void;
  onAddColumn?: () => void;
  onAddTaskToColumn: (
    columnId: string,
    initialType?: TaskTypeOption,
    initialTitle?: string,
    initialValues?: InitialTaskFormData,
  ) => void;
  onQuickCreateTask?: (
    title: string,
    columnId: string,
    taskType?: TaskTypeOption,
    extraPayload?: Partial<CreateTaskDTO>,
  ) => Promise<boolean | undefined> | Promise<void>;
  onOpenDetails: (task: Task, columnId: string, anchorRect?: DOMRect) => void;
  onEditTask?: (task: Task, columnId: string) => void;
  onContextMenu: (e: React.MouseEvent, task: Task, columnId: string) => void;
  onOpenColumnMenu?: (e: React.MouseEvent, column: BoardColumn) => void;
  onToggleComplete: (taskId: string, completed: boolean) => boolean | undefined;
  onHabitChange: (taskId: string, delta: number) => boolean | undefined;
  onStartFocus?: (task: Task) => void;
  onLoadArchivedCompleted?: (columnId: string) => Promise<void>;
  activeDraggedTaskId?: string | null;
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
  selectedColumnId?: string | null;
  selectedTaskId?: string;
  deletingTaskIds?: ReadonlySet<string>;
  isReadOnly?: boolean;
  forceExpandCompleted?: boolean;
  onAddTaskToColumn: (
    columnId: string,
    initialType?: TaskTypeOption,
    initialTitle?: string,
    initialValues?: InitialTaskFormData,
  ) => void;
  onQuickCreateTask?: (
    title: string,
    columnId: string,
    taskType?: TaskTypeOption,
    extraPayload?: Partial<CreateTaskDTO>,
  ) => Promise<boolean | undefined> | Promise<void>;
  onOpenDetails: (task: Task, columnId: string, anchorRect?: DOMRect) => void;
  onEditTask?: (task: Task, columnId: string) => void;
  onContextMenu: (e: React.MouseEvent, task: Task, columnId: string) => void;
  onOpenColumnMenu?: (e: React.MouseEvent, column: BoardColumn) => void;
  onToggleComplete: (taskId: string, completed: boolean) => boolean | undefined;
  onHabitChange: (taskId: string, delta: number) => boolean | undefined;
  onStartFocus?: (task: Task) => void;
  onLoadArchivedCompleted?: (columnId: string) => Promise<void>;
}

export interface RoutineQuickAddFormProps {
  columnId: string;
  isColumnCompact?: boolean;
  onClose: () => void;
  onQuickCreateTask?: (
    title: string,
    columnId: string,
    type: TaskTypeOption,
    extraPayload?: Partial<CreateTaskDTO>,
  ) => Promise<boolean | undefined> | Promise<void> | void;
  onOpenDetailedForm?: (
    columnId: string,
    type: TaskTypeOption,
    title: string,
    initialValues?: InitialTaskFormData,
  ) => void;
}

export interface RoutineColumnsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  columns: BoardColumn[];
  visibleColumnIds: string[];
  maxColumns: number;
  isPremium: boolean;
  isReadOnly?: boolean;
  onToggleVisibility: (columnId: string) => void;
  onShowAll: () => void;
  onOpenCreateColumn: () => void;
  onEditColumn: (column: BoardColumn) => void;
  onDeleteColumn: (column: BoardColumn) => void;
}

export interface CreateBoardColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string | null;
  columnToEdit?: BoardColumn | null;
  insertTarget?: ColumnInsertTarget | null;
  onSuccess?: (
    column: BoardColumn,
    isEdit?: boolean,
    insertTarget?: ColumnInsertTarget | null,
  ) => void;
}

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: { id: string; title: string }[];
  availableTags?: string[];
  defaultColumnId?: string;
  defaultTaskType?: TaskTypeOption;
  initialTitle?: string;
  initialValues?: InitialTaskFormData;
  taskToEdit?: Task | null;
  onSuccess?: (task: Task, columnId: string) => void;
}

export interface UseCreateTaskFormOptions {
  isOpen: boolean;
  columns: { id: string; title: string }[];
  defaultColumnId?: string;
  defaultTaskType?: TaskTypeOption;
  initialTitle?: string;
  initialValues?: InitialTaskFormData;
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
  tagCounts?: Record<string, number>;
  onOpenCreateColumn?: () => void;
  onOpenCreateTask?: () => void;
  maxColumns?: number;
  isPremium?: boolean;
  isReadOnly?: boolean;
  canCreateColumn?: boolean;
  canCreateTask?: boolean;
  visibleColumnIds?: string[];
  totalColumnsCount?: number;
  onOpenColumnsDrawer?: () => void;
  isDraggingColumn?: boolean;
  enableDroppable?: boolean;
}

export interface RoutineTaskCardProps {
  task: Task;
  columnId: string;
  isSelected?: boolean;
  isReadOnly?: boolean;
  isDeleteChecking?: boolean;
  isCompact?: boolean;
  onOpenDetails?: (task: Task, columnId: string, anchorRect?: DOMRect) => void;
  onEditTask?: (task: Task, columnId: string) => void;
  onToggleCompleted?: (
    taskId: string,
    completed: boolean,
  ) => boolean | undefined;
  onHabitChange?: (taskId: string, delta: number) => boolean | undefined;
  onContextMenu?: (e: React.MouseEvent, task: Task, columnId: string) => void;
  onStartFocus?: (task: Task) => void;
  isOverlay?: boolean;
}

export interface UseTaskProgressOptions {
  onToggle?: (taskId: string, completed: boolean) => boolean | undefined;
  onHabitChange?: (taskId: string, delta: number) => boolean | undefined;
}
