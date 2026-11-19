import { create } from "zustand";
import type {
  TransactionHistoryDTO,
  WeeklyCalendarTaskSummary,
} from "@/types/dashboard";
import type { Task } from "@/types/task";

interface OptimisticDashboardState {
  transactions: TransactionHistoryDTO[];
  upsertedTasks: Record<string, WeeklyCalendarTaskSummary>;
  deletedTaskIds: string[];
  addTransaction: (tx: {
    xpAmount?: number;
    goldAmount?: number;
    transactionType: TransactionHistoryDTO["transactionType"];
  }) => void;
  upsertTask: (task: Task | WeeklyCalendarTaskSummary) => void;
  markTaskDeleted: (taskId: string) => void;
  unmarkTaskDeleted: (taskId: string) => void;
  clear: () => void;
}

export function toWeeklyCalendarSummary(
  task: Task | WeeklyCalendarTaskSummary,
): WeeklyCalendarTaskSummary {
  return {
    id: task.id,
    type: task.type,
    taskType: task.taskType,
    habitType: task.habitType,
    resetCounter: task.resetCounter,
    completed: task.completed,
    dueDate: task.dueDate,
    startDate: task.startDate,
    repeatType: task.repeatType,
    repeatEvery: task.repeatEvery,
    daysOfWeek: task.daysOfWeek,
    monthlyOption: task.monthlyOption,
    lastCompletedAt: task.lastCompletedAt,
  };
}

export const useOptimisticDashboardStore = create<OptimisticDashboardState>(
  (set) => ({
    transactions: [],
    upsertedTasks: {},
    deletedTaskIds: [],
    addTransaction: (tx) =>
      set((state) => ({
        transactions: [
          ...state.transactions,
          {
            id: `opt-${Date.now()}-${state.transactions.length}`,
            createdAt: new Date().toISOString(),
            xpAmount: tx.xpAmount ?? 0,
            goldAmount: tx.goldAmount ?? 0,
            transactionType: tx.transactionType,
          },
        ],
      })),
    upsertTask: (task) =>
      set((state) => ({
        upsertedTasks: {
          ...state.upsertedTasks,
          [task.id]: toWeeklyCalendarSummary(task),
        },
        deletedTaskIds: state.deletedTaskIds.filter((id) => id !== task.id),
      })),
    markTaskDeleted: (taskId) =>
      set((state) => ({
        deletedTaskIds: state.deletedTaskIds.includes(taskId)
          ? state.deletedTaskIds
          : [...state.deletedTaskIds, taskId],
      })),
    unmarkTaskDeleted: (taskId) =>
      set((state) => ({
        deletedTaskIds: state.deletedTaskIds.filter((id) => id !== taskId),
      })),
    clear: () =>
      set({
        transactions: [],
        upsertedTasks: {},
        deletedTaskIds: [],
      }),
  }),
);
