import type { ReactNode } from "react";
import type { components } from "@/api/schema";
import type { FocusActivity, FocusRecord } from "@/types/focus";
import type { Task, TaskFilterType } from "@/types/task";
import type { ExperienceMode } from "@/types/ui";
import type { UserResponseDTO } from "@/types/user";

export type ColumnSummaryDTO = components["schemas"]["BoardColumnSummaryDTO"];
export type TransactionHistoryDTO =
  components["schemas"]["TransactionHistoryResponseDTO"];

export interface DashboardWorkspaceOption {
  id: string;
  name: string;
  isReadOnly?: boolean;
}

export interface DashboardColumnOption extends ColumnSummaryDTO {
  workspaceId?: string;
  workspaceName?: string;
  isVisible?: boolean;
  isReadOnly?: boolean;
  totalTasks?: number;
  completedTasks?: number;
  archivedTotalCount?: number;
  archivedCompletedCount?: number;
}

export type WeeklyCalendarTaskSummary = Pick<
  Task,
  | "id"
  | "type"
  | "taskType"
  | "habitType"
  | "resetCounter"
  | "completed"
  | "dueDate"
  | "startDate"
  | "repeatType"
  | "repeatEvery"
  | "daysOfWeek"
  | "monthlyOption"
  | "lastCompletedAt"
>;

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
  workspaceId: string;
  taskType: "all" | "HABIT" | "DAILY" | "TODO";
  columnId: string;
  difficulty: "all" | "TRIVIAL" | "EASY" | "MEDIUM" | "HARD";
  hideCompleted: boolean;
  sortBy: "default" | "dueDate" | "difficulty" | "priority" | "reward";
}

export interface DashboardMainProps {
  initialTasks?: Task[];
  workspaces?: DashboardWorkspaceOption[];
  activeWorkspaceId?: string;
  initialColumns?: DashboardColumnOption[];
  initialAllColumns?: DashboardColumnOption[];
  initialVisibleColumnIds?: string[];
  transactions?: TransactionHistoryDTO[];
  focusRecords?: FocusRecord[];
  user?: UserResponseDTO | null;
}

export interface DashboardDailyBriefingProps {
  firstName: string;
  streak: number;
  tasks: Task[];
  transactions: TransactionHistoryDTO[];
  focusRecords?: FocusRecord[];
  timezone?: string | null;
}

export interface DashboardListSummaryProps {
  initialColumns: DashboardColumnOption[];
  initialVisibleColumnIds?: string[];
  columns?: DashboardColumnOption[];
  onColumnsChange?: React.Dispatch<
    React.SetStateAction<DashboardColumnOption[]>
  >;
  onColumnDeleted?: (columnId: string) => void;
  workspaces?: DashboardWorkspaceOption[];
  onColumnMoved?: (
    columnId: string,
    targetWorkspaceId: string,
    targetWorkspaceName: string,
  ) => void;
  createColumnTrigger?: number;
  maxColumns: number;
  activeWorkspaceId?: string;
  activeWorkspaceName?: string;
  isReadOnly?: boolean;
  isPremium?: boolean;
  tasks?: Task[];
}

export interface DashboardTasksPanelProps {
  initialTasks: Task[];
  columns: DashboardColumnOption[];
  workspaces?: DashboardWorkspaceOption[];
  defaultColumnId?: string;
  isReadOnly?: boolean;
  tasks?: Task[];
  onTasksChange?: React.Dispatch<React.SetStateAction<Task[]>>;
  hasColumns?: boolean;
  onCreateFirstColumn?: () => void;
}

export interface DashboardWidgetsDataProps {
  experienceMode?: ExperienceMode;
  balance?: number;
  weeklyEarnings?: number;
  weeklySpent?: number;
  bars?: EconomyBarData[];
  transactions?: TransactionHistoryDTO[];
  tasks?: WeeklyCalendarTaskSummary[];
  activities?: FocusActivity[];
  records?: FocusRecord[];
}

export type DashboardSidebarRightProps = DashboardWidgetsDataProps;

export interface DashboardWidgetsListProps extends DashboardWidgetsDataProps {
  onSelectDay?: (isoString: string) => void;
}

export interface DashboardMobileDrawerProps {
  balance?: number;
  children: ReactNode;
}

export interface WeeklyCalendarProps {
  transactions?: TransactionHistoryDTO[];
  tasks?: WeeklyCalendarTaskSummary[];
  records?: FocusRecord[];
  onSelectDay?: (isoString: string) => void;
}

export interface ActivitiesWidgetProps {
  activities?: FocusActivity[];
  records?: FocusRecord[];
}

export interface PartyWidgetProps {
  experienceMode?: ExperienceMode;
}

export interface TaskTableProps {
  tasks: Task[];
  columns?: DashboardColumnOption[];
  workspaces?: DashboardWorkspaceOption[];
  emptyVariant?: "default" | "no_columns" | "no_columns_readonly";
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  itemsPerPage?: number;
  currentPage?: number;
  activeFilter?: TaskFilterType;
  onToggle?: (id: string, completed: boolean) => boolean | undefined;
  onHabitChange?: (id: string, delta: number) => boolean | undefined;
  onContextMenu?: (e: React.MouseEvent, task: Task) => void;
  onOpenDetails?: (task: Task, anchorRect?: DOMRect) => void;
  onEditTask?: (task: Task) => void;
  selectedDate?: string | null;
  onPageChange?: (page: number) => void;
  deletingTaskIds?: ReadonlySet<string>;
  onStartFocus?: (task: Task) => void;
}

export interface TaskFiltersProps {
  activeFilter?: TaskFilterType;
  onFilterChange?: (filter: TaskFilterType) => void;
  selectedDate?: string | null;
  onClearDate?: () => void;
  columns?: DashboardColumnOption[];
  workspaces?: DashboardWorkspaceOption[];
  advancedFilters?: DashboardAdvancedFilters;
  onAdvancedFiltersChange?: (filters: DashboardAdvancedFilters) => void;
  onCreateTask?: () => void;
  canCreateTask?: boolean;
  createTaskDisabledReason?: string;
  overdueCount?: number;
}
