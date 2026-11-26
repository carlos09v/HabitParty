import type { ReactNode } from "react";
import type { components } from "@/api/schema";
import type { FocusActivity, FocusRecord } from "@/types/focus";
import type { FriendsOverviewData } from "@/types/social";
import type { Task, TaskFilterType, TaskPriorityOption } from "@/types/task";
import type { ExperienceMode } from "@/types/ui";
import type { UserResponseDTO } from "@/types/user";

export type ColumnSummaryDTO = components["schemas"]["BoardColumnSummaryDTO"];
export type TransactionHistoryDTO =
  components["schemas"]["TransactionHistoryResponseDTO"];

export interface OptimisticTransactionDTO extends TransactionHistoryDTO {
  isReversal?: boolean;
}

export type DashboardTransactionSummary = Pick<
  TransactionHistoryDTO,
  "id" | "createdAt" | "transactionType" | "xpAmount"
> & {
  isReversal?: boolean;
};

export type DashboardFocusRecordSummary = Pick<
  FocusRecord,
  | "id"
  | "focusActivityId"
  | "inventoryItemId"
  | "startTime"
  | "endTime"
  | "durationMinutes"
>;

export type DashboardUserSummary = Pick<
  UserResponseDTO,
  | "id"
  | "fullName"
  | "username"
  | "isPremium"
  | "timezone"
  | "currentStreak"
  | "dailyFocusGoalMinutes"
  | "totalXp"
  | "currentCoins"
  | "experienceMode"
>;

export interface DashboardRewardsBridgeSummary {
  redeemableCount: number;
  totalRewardsCount: number;
  inventoryAvailableCount: number;
}

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
  rewardsBridge?: DashboardRewardsBridgeSummary;
  timeZone?: string | null;
}

export interface DashboardAdvancedFilters {
  workspaceId: string;
  taskType: "all" | "HABIT" | "DAILY" | "TODO";
  columnId: string;
  difficulty: "all" | "TRIVIAL" | "EASY" | "MEDIUM" | "HARD";
  priority: "all" | TaskPriorityOption;
  tag: string | null;
  hideCompleted: boolean;
  sortBy: "default" | "dueDate" | "difficulty" | "priority" | "reward";
}

export interface DashboardMainProps {
  initialTasks?: Task[];
  workspaces?: DashboardWorkspaceOption[];
  activeWorkspaceId?: string;
  initialAllColumns?: DashboardColumnOption[];
  initialVisibleColumnIds?: string[];
  transactions?: DashboardTransactionSummary[];
  focusRecords?: DashboardFocusRecordSummary[];
  user?: DashboardUserSummary | null;
}

export interface DashboardDailyBriefingProps {
  userId?: string | null;
  firstName: string;
  streak: number;
  tasks: Task[];
  transactions: DashboardTransactionSummary[];
  focusRecords?: DashboardFocusRecordSummary[];
  timezone?: string | null;
  dailyFocusGoalMinutes?: number | null;
  userXp?: number;
  userCoins?: number;
  onQuickCreateTask?: () => void;
  canQuickCreateTask?: boolean;
}

export interface DashboardListSummaryProps {
  initialVisibleColumnIds?: string[];
  columns: DashboardColumnOption[];
  onColumnsChange: React.Dispatch<
    React.SetStateAction<DashboardColumnOption[]>
  >;
  onColumnDeleted?: (columnId: string) => void;
  workspaces?: DashboardWorkspaceOption[];
  onColumnMoved?: (
    columnId: string,
    targetWorkspaceId: string,
    targetWorkspaceName: string,
  ) => void;
  onFilterByColumn?: (columnId: string, workspaceId?: string) => void;
  activeFilteredColumnId?: string;
  createColumnTrigger?: number;
  maxColumns: number;
  activeWorkspaceId?: string;
  activeWorkspaceName?: string;
  isReadOnly?: boolean;
  isPremium?: boolean;
  tasks?: Task[];
}

export interface DashboardTasksPanelProps {
  columns: DashboardColumnOption[];
  workspaces?: DashboardWorkspaceOption[];
  activeWorkspaceId?: string;
  defaultColumnId?: string;
  isReadOnly?: boolean;
  readOnlyWorkspaceIds?: ReadonlySet<string>;
  readOnlyColumnIds?: ReadonlySet<string>;
  tasks: Task[];
  onTasksChange: React.Dispatch<React.SetStateAction<Task[]>>;
  hasColumns?: boolean;
  createTaskTrigger?: number;
  onCreateFirstColumn?: () => void;
  timeZone?: string | null;
}

export interface DashboardWidgetsDataProps {
  experienceMode?: ExperienceMode;
  isPremium?: boolean;
  timeZone?: string | null;
  balance?: number;
  weeklyEarnings?: number;
  weeklySpent?: number;
  bars?: EconomyBarData[];
  rewardsBridge?: DashboardRewardsBridgeSummary;
  transactions?: DashboardTransactionSummary[];
  tasks?: WeeklyCalendarTaskSummary[];
  activities?: FocusActivity[];
  records?: DashboardFocusRecordSummary[];
  friendsOverview?: FriendsOverviewData | null;
}

export type DashboardSidebarRightProps = DashboardWidgetsDataProps;

export type DashboardWidgetsListProps = DashboardWidgetsDataProps;

export interface DashboardRightRailProps {
  balance?: number;
  asideAriaLabel?: string;
  children: ReactNode;
}

export interface WeeklyCalendarProps {
  transactions?: DashboardTransactionSummary[];
  tasks?: WeeklyCalendarTaskSummary[];
  records?: DashboardFocusRecordSummary[];
  timeZone?: string | null;
}

export interface ActivitiesWidgetProps {
  activities?: FocusActivity[];
  records?: DashboardFocusRecordSummary[];
  initialIsPremium?: boolean;
  timeZone?: string | null;
}

export interface PartyWidgetProps {
  experienceMode?: ExperienceMode;
  initialOverview?: FriendsOverviewData | null;
}

export interface TaskTableProps {
  tasks: Task[];
  columns?: DashboardColumnOption[];
  workspaces?: DashboardWorkspaceOption[];
  readOnlyWorkspaceIds?: ReadonlySet<string>;
  readOnlyColumnIds?: ReadonlySet<string>;
  emptyVariant?: "default" | "no_columns" | "no_columns_readonly";
  onEmptyAction?: () => void;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (size: number) => void;
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
  timeZone?: string | null;
}

export interface TaskFiltersProps {
  activeFilter?: TaskFilterType;
  onFilterChange?: (filter: TaskFilterType) => void;
  selectedDate?: string | null;
  onClearDate?: () => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  activeWorkspaceId?: string;
  columns?: DashboardColumnOption[];
  workspaces?: DashboardWorkspaceOption[];
  availableTags?: string[];
  tagCounts?: Record<string, number>;
  advancedFilters?: DashboardAdvancedFilters;
  onAdvancedFiltersChange?: (filters: DashboardAdvancedFilters) => void;
  onClearAllFilters?: () => void;
  onCreateTask?: () => void;
  canCreateTask?: boolean;
  createTaskDisabledReason?: string;
  overdueCount?: number;
  timeZone?: string | null;
}
