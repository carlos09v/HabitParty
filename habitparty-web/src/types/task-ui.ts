import type { Dispatch, SetStateAction } from "react";
import type {
  BoardColumn,
  BoardFilterState,
  CreateTaskDTO,
  Task,
  TaskTypeOption,
} from "./task";

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
  onDelete?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
  onContextMenu?: (e: React.MouseEvent, task: Task, columnId?: string) => void;
  onOpenDetails?: (task: Task, anchorRect?: DOMRect) => void;
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

export interface RoutineFilterPopoverProps {
  filters?: BoardFilterState;
  onFilterChange?: (filters: BoardFilterState) => void;
  availableTags?: string[];
  isCompact?: boolean;
}

export interface FocusModeToggleProps {
  focusMode: boolean;
  onToggleFocusMode?: () => void;
  isCompact?: boolean;
}

export type BoardAlignment = "left" | "center" | "right";
export type ColumnWidthPreset = "compact" | "normal" | "wide";

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

export interface RoutineFiltersProps {
  search?: string;
  onSearch?: (query: string) => void;
  viewMode?: {
    value: "card" | "list" | "grid";
    onChange: (mode: "card" | "list" | "grid") => void;
  };
  filters?: BoardFilterState;
  onFilterChange?: (filters: BoardFilterState) => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
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
