import type { Dispatch, SetStateAction } from "react";
import type { components } from "@/api/schema";

// 1. DTOs Base (Direto do backend)
export type DashboardTaskDTO = components["schemas"]["DashboardTaskDTO"];
export type CreateTaskDTO = components["schemas"]["CreateTaskDTO"];
export type UpdateTaskDTO = components["schemas"]["UpdateTaskDTO"];
export type UpdateTaskOrderDTO = components["schemas"]["UpdateTaskOrderDTO"];
export type TaskResponseDTO = components["schemas"]["TaskResponseDTO"];
export type TaskDifficulty =
  | NonNullable<UpdateTaskDTO["difficulty"]>
  | "trivial"
  | "low"
  | "normal"
  | "high";
export type TaskType =
  | "habit"
  | "daily"
  | "todo"
  | NonNullable<CreateTaskDTO["taskType"]>;
export type BoardColumnResponseDTO =
  components["schemas"]["BoardColumnResponseDTO"];
export type ChecklistItem = components["schemas"]["ChecklistItemResponseDTO"];

// 2. Model UI (Entidade estendida com os estados locais do Componente)
export interface DashboardTask extends DashboardTaskDTO {
  isDragging?: boolean;
  isLoading?: boolean;
}

export interface Task extends Omit<TaskResponseDTO, "id" | "difficulty"> {
  id: string; // Ensure ID is required
  isDragging?: boolean;
  isLoading?: boolean;
  type: TaskType;
  title: string;
  category?: string;
  dueDate?: string;
  completed?: boolean;
  rewardXp?: number;
  rewardGold?: number;
  streak?: number;
  positiveCount?: number;
  negativeCount?: number;
  importance?: HabitImportance;
  difficulty?: TaskDifficultyOption | string;
  columnId?: string;
  order?: number;
}

export type HabitImportance = "low" | "normal" | "high";

export interface BoardColumn {
  id: string;
  title: string;
  order: number;
  icon?: string;
  tasks: Task[];
}

export type TaskFilterType =
  | "today"
  | "all"
  | "active"
  | "completed"
  | "habit"
  | "daily"
  | "todo"
  | "next7days"
  | "nodate"
  | "overdue";

// Estado dos filtros do Kanban
export interface BoardFilterState {
  taskType: "all" | TaskTypeOption;
  difficulty: "all" | TaskDifficultyOption;
  status: "all" | "pending" | "completed";
  tag: string | null;
}

// 3. Props de Componentes
export interface TaskRowProps {
  task: Task;
  onToggleComplete?: (taskId: string) => Promise<void>;
  onDelete?: (taskId: string) => void;
  isCompactMode?: boolean;
  onToggle?: (id: string, completed: boolean) => void;
  onHabitChange?: (id: string, delta: number) => void;
}

export interface DashboardAdvancedFilters {
  taskType: "all" | "HABIT" | "DAILY" | "TODO";
  columnId: string;
  difficulty: "all" | "TRIVIAL" | "EASY" | "MEDIUM" | "HARD";
  hideCompleted: boolean;
  sortBy: "default" | "dueDate" | "difficulty" | "priority" | "reward";
}

export const DEFAULT_DASHBOARD_ADVANCED_FILTERS: DashboardAdvancedFilters = {
  taskType: "all",
  columnId: "all",
  difficulty: "all",
  hideCompleted: false,
  sortBy: "default",
};

export interface TaskTableProps {
  tasks: Task[];
  itemsPerPage?: number;
  currentPage?: number;
  activeFilter?: TaskFilterType;
  onToggle?: (id: string, completed: boolean) => void;
  onHabitChange?: (id: string, delta: number) => void;
  selectedDate?: string | null;
}

export interface TaskFiltersProps {
  activeFilter?: TaskFilterType;
  onFilterChange?: (filter: TaskFilterType) => void;
  showCompleted?: boolean;
  onToggleShowCompleted?: () => void;
  selectedDate?: string | null;
  onClearDate?: () => void;
  columns?: components["schemas"]["BoardColumnSummaryDTO"][];
  advancedFilters?: DashboardAdvancedFilters;
  onAdvancedFiltersChange?: (filters: DashboardAdvancedFilters) => void;
}

export interface TaskPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemLabel?: string;
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
}

export interface RoutineFilterPopoverProps {
  filters?: BoardFilterState;
  onFilterChange?: (filters: BoardFilterState) => void;
  availableTags?: string[];
  isCompact?: boolean;
}

export interface RoutineListsMenuProps {
  columnsCount?: number;
  maxColumns?: number;
  columnsList?: ColumnSummary[];
  visibleColumnIds?: string[];
  onToggleColumnVisibility?: (columnId: string) => void;
  isCompact?: boolean;
}

export interface FocusModeToggleProps {
  focusMode: boolean;
  onToggleFocusMode?: () => void;
  isCompact?: boolean;
}

export interface RoutineBoardProps {
  columns: BoardColumn[];
  setColumns: Dispatch<SetStateAction<BoardColumn[]>>;
  visibleColumnIds: string[];
  maxColumns?: number;
  selectedColumnId?: string | null;
  onAddColumn?: () => void;
  onAddTaskToColumn?: (columnId: string) => void;
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
}

export interface RoutineColumnProps {
  column: BoardColumn;
  columnIndex: number;
  isSelected?: boolean;
  onAddTaskToColumn?: (columnId: string) => void;
  onOpenDetails?: (task: Task, columnId: string, anchorRect?: DOMRect) => void;
  onContextMenu?: (e: React.MouseEvent, task: Task, columnId: string) => void;
  onOpenColumnMenu?: (e: React.MouseEvent, column: BoardColumn) => void;
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  onHabitChange?: (taskId: string, delta: number) => void;
  isOverlay?: boolean;
}

export interface ColumnSummary {
  id: string;
  title: string;
  tasksCount: number;
}

export interface RoutineFiltersProps {
  search?: string;
  onSearch?: (query: string) => void;
  filters?: BoardFilterState;
  onFilterChange?: (filters: BoardFilterState) => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  availableTags?: string[];
  onOpenCreateColumn?: () => void;
  onOpenCreateTask?: () => void;
  columnsCount?: number;
  maxColumns?: number;
  isPremium?: boolean;
  canCreateColumn?: boolean;
  columnsList?: ColumnSummary[];
  visibleColumnIds?: string[];
  onToggleColumnVisibility?: (columnId: string) => void;
}

export interface RoutineTaskCardProps {
  task: Task;
  columnId: string;
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

// 4. Tipos e Enums para Formulários de Tarefas
export type TaskTypeOption = NonNullable<CreateTaskDTO["taskType"]>;
export type HabitTypeOption = NonNullable<CreateTaskDTO["habitType"]>;
export type ResetCounterOption = NonNullable<CreateTaskDTO["resetCounter"]>;
export type HabitImportanceOption = NonNullable<
  CreateTaskDTO["importanceType"]
>;
export type TaskDifficultyOption = NonNullable<CreateTaskDTO["difficulty"]>;
export type TaskPriorityOption = NonNullable<CreateTaskDTO["priority"]>;
export type ReminderTypeOption = NonNullable<CreateTaskDTO["reminderType"]>;
export type DailyRepeatTypeOption = NonNullable<CreateTaskDTO["repeatType"]>;
export type DailyDaysOfWeek = NonNullable<CreateTaskDTO["daysOfWeek"]>[number];
