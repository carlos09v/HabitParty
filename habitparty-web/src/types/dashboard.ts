import type { components } from "@/api/schema";
import type { Task, TaskFilterType } from "@/types/task";

export type ColumnSummaryDTO = components["schemas"]["BoardColumnSummaryDTO"];
export type TransactionHistoryDTO =
  components["schemas"]["TransactionHistoryResponseDTO"];

export interface EconomyBarData {
  label: string;
  periodLabel?: string;
  gold: number;
  spent?: number;
  heightPercent: number;
  spentHeightPercent?: number;
  isHighlight: boolean;
}

export interface EconomyWidgetProps {
  balance?: number;
  weeklyEarnings?: number;
  weeklySpent?: number;
  bars?: EconomyBarData[];
}

export interface DashboardAdvancedFilters {
  taskType: "all" | "HABIT" | "DAILY" | "TODO";
  columnId: string;
  difficulty: "all" | "TRIVIAL" | "EASY" | "MEDIUM" | "HARD";
  hideCompleted: boolean;
  sortBy: "default" | "dueDate" | "difficulty" | "priority" | "reward";
}

export interface TaskTableProps {
  tasks: Task[];
  itemsPerPage?: number;
  currentPage?: number;
  activeFilter?: TaskFilterType;
  onToggle?: (id: string, completed: boolean) => void;
  onHabitChange?: (id: string, delta: number) => void;
  onDelete?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDuplicate?: (task: Task) => void;
  onContextMenu?: (e: React.MouseEvent, task: Task) => void;
  onOpenDetails?: (task: Task, anchorRect?: DOMRect) => void;
  selectedDate?: string | null;
  onPageChange?: (page: number) => void;
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
  onPageChange?: (page: number) => void;
}
