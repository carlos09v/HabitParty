import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/api/server";
import { FREE_ACTIVE_WORKSPACE_LIMIT } from "@/constants/routine";
import { getRequestLocale } from "@/i18n/request";
import {
  fetchRawUserFocusRecords,
  getFocusInitialRecords,
  getRawFocusActivities,
} from "@/services/focusService";
import { fetchAllWorkspacesBoards } from "@/services/taskService";
import { getCurrentUser } from "@/services/userService";
import { resolveActiveWorkspace } from "@/services/workspaceService";
import type {
  DashboardColumnOption,
  DashboardWorkspaceOption,
  TransactionHistoryDTO,
} from "@/types/dashboard";
import type { FocusActivity, FocusRecord } from "@/types/focus";
import type { Task } from "@/types/task";
import type { UserResponseDTO } from "@/types/user";
import { getUserTimezoneCookie } from "@/utils/cookies";
import { calculateWeeklyTaskEarnings } from "@/utils/economy";
import { mapFocusActivities } from "@/utils/focusMapper";

export interface DashboardData {
  workspaces: DashboardWorkspaceOption[];
  activeWorkspaceId: string;
  initialTasks: Task[];
  initialColumns: DashboardColumnOption[];
  initialAllColumns: DashboardColumnOption[];
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
 * Carrega tarefas e colunas de todos os workspaces do usuário em uma única consulta em lote,
 * mantendo o resumo superior de listas focado no workspace ativo.
 */
export async function getDashboardData(
  requestedWorkspaceId?: string,
): Promise<DashboardData | null> {
  const [
    allBoards,
    user,
    transactions,
    rawFocusActivities,
    rawFocusRecords,
    locale,
  ] = await Promise.all([
    fetchAllWorkspacesBoards(),
    getCurrentUser(),
    getDashboardTransactions(),
    getRawFocusActivities(),
    fetchRawUserFocusRecords(),
    getRequestLocale(),
  ]);

  const isPremium = user?.isPremium ?? false;
  const workspacesFromBoards = allBoards.map((board) => ({
    id: board.workspaceId,
    name: board.workspaceName,
  }));

  const { activeWorkspaceId } = resolveActiveWorkspace(
    workspacesFromBoards,
    requestedWorkspaceId,
  );

  if (!activeWorkspaceId) {
    return null;
  }

  const focusActivities: FocusActivity[] = mapFocusActivities(
    rawFocusActivities,
    locale,
  );

  const focusRecords = await getFocusInitialRecords(
    focusActivities,
    rawFocusRecords,
  );

  const readOnlyWorkspaceIds = new Set<string>();
  const workspaceOptions: DashboardWorkspaceOption[] = allBoards.map(
    (board, index) => {
      const isReadOnly = !isPremium && index >= FREE_ACTIVE_WORKSPACE_LIMIT;
      if (isReadOnly) {
        readOnlyWorkspaceIds.add(board.workspaceId);
      }
      return {
        id: board.workspaceId,
        name: board.workspaceName,
        isReadOnly,
      };
    },
  );

  const allColumnsWithReadOnly: DashboardColumnOption[] = allBoards.flatMap(
    (board) => {
      const wsReadOnly = readOnlyWorkspaceIds.has(board.workspaceId);
      return board.summaries.map((summary) => ({
        ...summary,
        isReadOnly: wsReadOnly,
      }));
    },
  );

  const initialColumns: DashboardColumnOption[] = allColumnsWithReadOnly.filter(
    (col) => col.workspaceId === activeWorkspaceId,
  );
  const initialAllColumns: DashboardColumnOption[] = allColumnsWithReadOnly;
  const initialTasks: Task[] = allBoards.flatMap((b) =>
    b.columns.flatMap((c) => c.tasks),
  );

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
    workspaces: workspaceOptions,
    activeWorkspaceId,
    initialTasks,
    initialColumns,
    initialAllColumns,
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
