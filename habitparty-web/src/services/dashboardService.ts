import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/api/server";
import { getRequestLocale } from "@/i18n/request";
import {
  fetchRawUserFocusRecords,
  getFocusInitialRecords,
  getRawFocusActivities,
} from "@/services/focusService";
import { fetchWorkspaceBoardColumns } from "@/services/taskService";
import { getCurrentUser } from "@/services/userService";
import {
  getWorkspaces,
  resolveActiveWorkspace,
} from "@/services/workspaceService";
import type {
  ColumnSummaryDTO,
  TransactionHistoryDTO,
} from "@/types/dashboard";
import type { FocusActivity, FocusRecord } from "@/types/focus";
import type { Task } from "@/types/task";
import type { UserResponseDTO } from "@/types/user";
import type { WorkspaceResponseDTO } from "@/types/workspace";
import { getUserTimezoneCookie } from "@/utils/cookies";
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
    rawFocusRecords,
    locale,
    speculativeBoardData,
  ] = await Promise.all([
    getWorkspaces(),
    getCurrentUser(),
    getDashboardTransactions(),
    getRawFocusActivities(),
    fetchRawUserFocusRecords(),
    getRequestLocale(),
    requestedWorkspaceId
      ? fetchWorkspaceBoardColumns(requestedWorkspaceId)
      : Promise.resolve(null),
  ]);

  const { activeWorkspaceId } = resolveActiveWorkspace(
    workspaces,
    requestedWorkspaceId,
  );

  if (!activeWorkspaceId) {
    return null;
  }

  const focusActivities: FocusActivity[] = mapFocusActivities(
    rawFocusActivities,
    locale,
  );

  const [boardData, focusRecords] = await Promise.all([
    activeWorkspaceId === requestedWorkspaceId && speculativeBoardData
      ? Promise.resolve(speculativeBoardData)
      : fetchWorkspaceBoardColumns(activeWorkspaceId),
    getFocusInitialRecords(focusActivities, rawFocusRecords),
  ]);

  const initialColumns: ColumnSummaryDTO[] = boardData.summaries;
  const initialTasks: Task[] = [];

  for (const col of boardData.columns) {
    for (const task of col.tasks) {
      initialTasks.push(task);
    }
  }

  const userBalance = user?.currentCoins ?? 0;
  const resolvedTimeZone = user?.timezone ?? (await getUserTimezoneCookie());
  const { bars, currentWeekEarnings, currentWeekSpent } =
    calculateWeeklyTaskEarnings(
      transactions,
      new Date(),
      locale,
      resolvedTimeZone,
    );

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
