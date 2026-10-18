import type { components } from "@/api/schema";

// 1. DTOs Base (Direto do backend)
export type DashboardTaskDTO = components["schemas"]["DashboardTaskDTO"];
export type CreateTaskDTO = components["schemas"]["CreateTaskDTO"] & {
  sendEmailReminder?: boolean;
};
export type UpdateTaskDTO = components["schemas"]["UpdateTaskDTO"] & {
  sendEmailReminder?: boolean;
};
export type UpdateTaskOrderDTO = components["schemas"]["UpdateTaskOrderDTO"];
export type TaskResponseDTO = components["schemas"]["TaskResponseDTO"] & {
  sendEmailReminder?: boolean;
  emailReminderSent?: boolean;
};
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
  isPenaltyApplied?: boolean;
  monthlyOption?: DailyRepeatMonthlyOption;
  sendEmailReminder?: boolean;
  emailReminderSent?: boolean;
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
  | "this_month"
  | "nodate"
  | "overdue";

// Estado dos filtros do Kanban
export interface BoardFilterState {
  taskType: "all" | TaskTypeOption;
  difficulty: "all" | TaskDifficultyOption;
  priority: "all" | TaskPriorityOption;
  status: "all" | "pending" | "completed";
  tag: string | null;
}

export type {
  DashboardAdvancedFilters,
  TaskFiltersProps,
  TaskPaginationProps,
  TaskTableProps,
} from "@/types/dashboard";

// 3. Tipos e Enums para Formulários de Tarefas
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
export type DailyRepeatMonthlyOption = NonNullable<
  CreateTaskDTO["monthlyOption"]
>;
