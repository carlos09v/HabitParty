import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/api/server";
import { getRequestLocale } from "@/i18n/request";
import {
  getFocusInitialRecords,
  getRawFocusActivities,
} from "@/services/focusService";
import { fetchWorkspaceBoardColumns } from "@/services/taskService";
import { getCurrentUser } from "@/services/userService";
import { getWorkspaces } from "@/services/workspaceService";
import type {
  ColumnSummaryDTO,
  TransactionHistoryDTO,
} from "@/types/dashboard";
import type { FocusActivity, FocusRecord } from "@/types/focus";
import type { Task } from "@/types/task";
import type { UserResponseDTO } from "@/types/user";
import type { WorkspaceResponseDTO } from "@/types/workspace";
import { calculateWeeklyTaskEarnings } from "@/utils/economy";
import { mapFocusActivities } from "@/utils/focusMapper";

export interface DashboardData {
  workspaces: WorkspaceResponseDTO[];
  activeWorkspaceId: string;
  initialTasks: Task[];
  initialColumns: ColumnSummaryDTO[];
  transactions: TransactionHistoryDTO[];
  userBalance: number;
  weeklyEarnings: number;
  weeklySpent: number;
  bars: ReturnType<typeof calculateWeeklyTaskEarnings>["bars"];
  focusActivities: FocusActivity[];
  focusRecords: FocusRecord[];
  user: UserResponseDTO | null;
}

export async function getDashboardTransactions(): Promise<
  TransactionHistoryDTO[]
> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("transactions");

  const { data } = await serverApi.GET("/transactions", {
    params: {
      query: {
        tab: "ALL",
        size: 100,
      },
    },
  });

  return data?.content || [];
}

/**
 * Busca todos os dados necessários para renderizar a página do Dashboard e sua Sidebar.
 * Paraleliza chamadas independentes (incluindo busca especulativa do quadro Kanban pelo cookie)
 * logo na primeira onda para reduzir latência (RTT).
 */
export async function getDashboardData(
  requestedWorkspaceId?: string,
): Promise<DashboardData | null> {
  const [
    workspaces,
    user,
    transactions,
    rawFocusActivities,
    locale,
    speculativeBoardData,
  ] = await Promise.all([
    getWorkspaces(),
    getCurrentUser(),
    getDashboardTransactions(),
    getRawFocusActivities(),
    getRequestLocale(),
    requestedWorkspaceId
      ? fetchWorkspaceBoardColumns(requestedWorkspaceId)
      : Promise.resolve(null),
  ]);

  if (!workspaces || workspaces.length === 0) {
    return null;
  }

  const isValidWorkspace = workspaces.some(
    (w) => w.id === requestedWorkspaceId,
  );
  const activeWorkspaceId =
    requestedWorkspaceId && isValidWorkspace
      ? requestedWorkspaceId
      : workspaces[0].id || "";

  const focusActivities: FocusActivity[] = mapFocusActivities(
    rawFocusActivities,
    locale,
  );

  const [boardData, focusRecords] = await Promise.all([
    activeWorkspaceId &&
    activeWorkspaceId === requestedWorkspaceId &&
    speculativeBoardData
      ? Promise.resolve(speculativeBoardData)
      : activeWorkspaceId
        ? fetchWorkspaceBoardColumns(activeWorkspaceId)
        : Promise.resolve({ columns: [], summaries: [] }),
    getFocusInitialRecords(focusActivities),
  ]);

  const initialColumns: ColumnSummaryDTO[] = boardData.summaries;
  const initialTasks: Task[] = [];

  for (const col of boardData.columns) {
    for (const task of col.tasks) {
      initialTasks.push({
        ...task,
        category: col.title || task.category,
      });
    }
  }

  const userBalance = user?.currentCoins ?? 0;
  const { bars, currentWeekEarnings, currentWeekSpent } =
    calculateWeeklyTaskEarnings(transactions, new Date(), locale);

  return {
    workspaces,
    activeWorkspaceId,
    initialTasks,
    initialColumns,
    transactions,
    userBalance,
    weeklyEarnings: currentWeekEarnings,
    weeklySpent: currentWeekSpent,
    bars,
    focusActivities,
    focusRecords,
    user,
  };
}
