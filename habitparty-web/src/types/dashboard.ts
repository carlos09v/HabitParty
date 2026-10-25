import type { ReactNode } from "react";
import type { components } from "@/api/schema";
import type { FocusActivity, FocusRecord } from "@/types/focus";
import type { Task, TaskFilterType } from "@/types/task";
import type { UserResponseDTO } from "@/types/user";

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
  isCompact?: boolean;
}

export interface DashboardAdvancedFilters {
  taskType: "all" | "HABIT" | "DAILY" | "TODO";
  columnId: string;
  difficulty: "all" | "TRIVIAL" | "EASY" | "MEDIUM" | "HARD";
  hideCompleted: boolean;
  sortBy: "default" | "dueDate" | "difficulty" | "priority" | "reward";
}

export interface DashboardMainProps {
  isCompact?: boolean;
  initialTasks?: Task[];
  activeWorkspaceId?: string;
  initialColumns?: ColumnSummaryDTO[];
  transactions?: TransactionHistoryDTO[];
  user?: UserResponseDTO | null;
}

export interface DashboardDailyBriefingProps {
  firstName: string;
  streak: number;
  tasks: Task[];
  transactions: TransactionHistoryDTO[];
}

export interface DashboardListSummaryProps {
  initialColumns: ColumnSummaryDTO[];
  maxColumns: number;
  isCompact?: boolean;
  isPremium?: boolean;
  tasks?: Task[];
}

export interface DashboardTasksPanelProps {
  initialTasks: Task[];
  columns: ColumnSummaryDTO[];
  isCompact?: boolean;
  tasks?: Task[];
  onTasksChange?: React.Dispatch<React.SetStateAction<Task[]>>;
}

export interface DashboardWidgetsDataProps {
  isCompact?: boolean;
  balance?: number;
  weeklyEarnings?: number;
  weeklySpent?: number;
  bars?: EconomyBarData[];
  transactions?: TransactionHistoryDTO[];
  tasks?: Task[];
  activities?: FocusActivity[];
  records?: FocusRecord[];
}

export type DashboardSidebarRightProps = DashboardWidgetsDataProps;

export interface DashboardWidgetsListProps extends DashboardWidgetsDataProps {
  onSelectDay?: (isoString: string) => void;
}

export interface DashboardMobileDrawerProps {
  isCompact?: boolean;
  balance?: number;
  children: ReactNode;
}

export interface WeeklyCalendarProps {
  isCompact?: boolean;
  transactions?: TransactionHistoryDTO[];
  tasks?: Task[];
  onSelectDay?: (isoString: string) => void;
}

export interface ActivitiesWidgetProps {
  activities?: FocusActivity[];
  records?: FocusRecord[];
  isCompact?: boolean;
}

export interface PartyWidgetProps {
  isCompact?: boolean;
}

export interface TaskTableProps {
  tasks: Task[];
  itemsPerPage?: number;
  currentPage?: number;
  activeFilter?: TaskFilterType;
  isCompact?: boolean;
  onToggle?: (id: string, completed: boolean) => void;
  onHabitChange?: (id: string, delta: number) => void;
  onContextMenu?: (e: React.MouseEvent, task: Task) => void;
  onOpenDetails?: (task: Task, anchorRect?: DOMRect) => void;
  selectedDate?: string | null;
  onPageChange?: (page: number) => void;
}

export interface TaskFiltersProps {
  activeFilter?: TaskFilterType;
  onFilterChange?: (filter: TaskFilterType) => void;
  selectedDate?: string | null;
  onClearDate?: () => void;
  columns?: ColumnSummaryDTO[];
  advancedFilters?: DashboardAdvancedFilters;
  onAdvancedFiltersChange?: (filters: DashboardAdvancedFilters) => void;
  isCompact?: boolean;
}

export interface TaskPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  itemLabel?: string;
  isCompact?: boolean;
  onPageChange?: (page: number) => void;
}
