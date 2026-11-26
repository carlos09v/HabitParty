import { create } from "zustand";
import type {
  OptimisticTransactionDTO,
  TransactionHistoryDTO,
  WeeklyCalendarTaskSummary,
} from "@/types/dashboard";
import type { Task } from "@/types/task";
import { TASK_COMPLETION_TRANSACTION_TYPES } from "@/utils/dashboardMetrics";
import { toWeeklyCalendarTaskSummary } from "@/utils/taskMapper";

interface OptimisticDashboardState {
  transactions: OptimisticTransactionDTO[];
  upsertedTasks: Record<string, WeeklyCalendarTaskSummary>;
  deletedTaskIds: string[];
  inFlightTaskIds: string[];
  streakRevertedDate: string | null;
  streakRevertedTaskId: string | null;
  addTransaction: (tx: {
    referenceId?: string;
    xpAmount?: number;
    goldAmount?: number;
    transactionType: TransactionHistoryDTO["transactionType"];
    isReversal?: boolean;
  }) => void;
  revertTaskTransaction: (params: {
    taskId: string;
    revertedXp: number;
    revertedCoins: number;
    streakRevertedDate?: string | null;
  }) => void;
  upsertTask: (task: Task | WeeklyCalendarTaskSummary) => void;
  markTaskDeleted: (taskId: string) => void;
  unmarkTaskDeleted: (taskId: string) => void;
  markTaskInFlight: (taskId: string) => void;
  unmarkTaskInFlight: (taskId: string) => void;
  clear: (options?: {
    preserveInFlight?: boolean;
    preserveStreakReverted?: boolean;
  }) => void;
}

export const useOptimisticDashboardStore = create<OptimisticDashboardState>(
  (set) => ({
    transactions: [],
    upsertedTasks: {},
    deletedTaskIds: [],
    inFlightTaskIds: [],
    streakRevertedDate: null,
    streakRevertedTaskId: null,
    addTransaction: (tx) =>
      set((state) => {
        const isCompletion = Boolean(
          !tx.isReversal &&
            tx.transactionType &&
            TASK_COMPLETION_TRANSACTION_TYPES.has(tx.transactionType),
        );
        return {
          transactions: [
            ...state.transactions,
            {
              id: `opt-${Date.now()}-${state.transactions.length}`,
              referenceId: tx.referenceId,
              createdAt: new Date().toISOString(),
              xpAmount: tx.xpAmount ?? 0,
              goldAmount: tx.goldAmount ?? 0,
              transactionType: tx.transactionType,
              ...(tx.isReversal ? { isReversal: true } : {}),
            },
          ],
          streakRevertedDate: isCompletion ? null : state.streakRevertedDate,
          streakRevertedTaskId: isCompletion
            ? null
            : state.streakRevertedTaskId,
        };
      }),
    revertTaskTransaction: ({
      taskId,
      revertedXp,
      revertedCoins,
      streakRevertedDate,
    }) =>
      set((state) => {
        // Se a conclusão original ainda estiver na fila otimista desta sessão,
        // remove-a diretamente para não deixar um evento de conclusão fantasma.
        let matchIndex = -1;
        for (let i = state.transactions.length - 1; i >= 0; i--) {
          const item = state.transactions[i];
          if (
            item.referenceId === taskId &&
            !item.isReversal &&
            item.transactionType &&
            TASK_COMPLETION_TRANSACTION_TYPES.has(item.transactionType)
          ) {
            matchIndex = i;
            break;
          }
        }

        const nextTransactions =
          matchIndex >= 0
            ? state.transactions.filter((_, index) => index !== matchIndex)
            : revertedXp > 0 || revertedCoins > 0
              ? [
                  ...state.transactions,
                  {
                    id: `opt-rev-${Date.now()}-${state.transactions.length}`,
                    referenceId: taskId,
                    createdAt: new Date().toISOString(),
                    xpAmount: -Math.abs(revertedXp),
                    goldAmount: -Math.abs(revertedCoins),
                    transactionType: "MANUAL_ADJUSTMENT" as const,
                    isReversal: true,
                  },
                ]
              : state.transactions;

        return {
          transactions: nextTransactions,
          streakRevertedDate:
            streakRevertedDate !== undefined
              ? streakRevertedDate
              : state.streakRevertedDate,
          streakRevertedTaskId:
            streakRevertedDate !== undefined
              ? streakRevertedDate
                ? taskId
                : null
              : state.streakRevertedTaskId,
        };
      }),
    upsertTask: (task) =>
      set((state) => ({
        upsertedTasks: {
          ...state.upsertedTasks,
          [task.id]: toWeeklyCalendarTaskSummary(task),
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
    markTaskInFlight: (taskId) =>
      set((state) => ({
        inFlightTaskIds: state.inFlightTaskIds.includes(taskId)
          ? state.inFlightTaskIds
          : [...state.inFlightTaskIds, taskId],
      })),
    unmarkTaskInFlight: (taskId) =>
      set((state) => ({
        inFlightTaskIds: state.inFlightTaskIds.filter((id) => id !== taskId),
      })),
    clear: (options) =>
      set((state) => {
        if (!options?.preserveInFlight && !options?.preserveStreakReverted) {
          return {
            transactions: [],
            upsertedTasks: {},
            deletedTaskIds: [],
            inFlightTaskIds: [],
            streakRevertedDate: null,
            streakRevertedTaskId: null,
          };
        }

        const inFlightSet = new Set(
          options.preserveInFlight ? state.inFlightTaskIds : [],
        );
        const keptUpserted: Record<string, WeeklyCalendarTaskSummary> = {};
        for (const [id, summary] of Object.entries(state.upsertedTasks)) {
          if (inFlightSet.has(id)) {
            keptUpserted[id] = summary;
          }
        }
        const keptDeleted = state.deletedTaskIds.filter((id) =>
          inFlightSet.has(id),
        );
        const keptTransactions = state.transactions.filter(
          (tx) => tx.referenceId && inFlightSet.has(tx.referenceId),
        );
        const keepStreakReverted = Boolean(
          options.preserveStreakReverted ||
            (state.streakRevertedTaskId &&
              inFlightSet.has(state.streakRevertedTaskId)),
        );

        return {
          transactions: keptTransactions,
          upsertedTasks: keptUpserted,
          deletedTaskIds: keptDeleted,
          inFlightTaskIds: options.preserveInFlight
            ? state.inFlightTaskIds
            : [],
          streakRevertedDate: keepStreakReverted
            ? state.streakRevertedDate
            : null,
          streakRevertedTaskId: keepStreakReverted
            ? state.streakRevertedTaskId
            : null,
        };
      }),
  }),
);
