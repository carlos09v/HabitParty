import { cacheLife, cacheTag } from "next/cache";
import { getServerAuthToken, serverApi } from "@/api/server";
import { FREE_ACTIVE_WORKSPACE_LIMIT } from "@/constants/routine";
import { getRequestLocale } from "@/i18n/request";
import {
  fetchRawUserFocusRecords,
  getFocusInitialRecords,
  getRawFocusActivities,
} from "@/services/focusService";
import { getRawInventoryItems } from "@/services/inventoryService";
import { getRewardsData } from "@/services/rewardService";
import { getFriendsOverview } from "@/services/socialService";
import { fetchAllWorkspacesBoards } from "@/services/taskService";
import { getCurrentUser } from "@/services/userService";
import { resolveActiveWorkspace } from "@/services/workspaceService";
import type {
  DashboardColumnOption,
  DashboardFocusRecordSummary,
  DashboardRewardsBridgeSummary,
  DashboardTransactionSummary,
  DashboardUserSummary,
  DashboardWorkspaceOption,
  TransactionHistoryDTO,
  WeeklyCalendarTaskSummary,
} from "@/types/dashboard";
import type { FocusActivity } from "@/types/focus";
import type { FriendsOverviewData } from "@/types/social";
import type { Task } from "@/types/task";
import { getUserTimezoneCookie } from "@/utils/cookies";
import { calculateWeeklyTaskEarnings } from "@/utils/economy";
import { mapFocusActivities } from "@/utils/focusMapper";
import { isDebtReward } from "@/utils/rewardGrouping";
import { toWeeklyCalendarTaskSummary } from "@/utils/taskMapper";

export interface DashboardData {
  workspaces: DashboardWorkspaceOption[];
  activeWorkspaceId: string;
  initialTasks: Task[];
  calendarTasks: WeeklyCalendarTaskSummary[];
  initialColumns: DashboardColumnOption[];
  initialAllColumns: DashboardColumnOption[];
  transactions: DashboardTransactionSummary[];
  userBalance: number;
  weeklyEarnings: number;
  weeklySpent: number;
  bars: ReturnType<typeof calculateWeeklyTaskEarnings>["bars"];
  rewardsBridge: DashboardRewardsBridgeSummary;
  focusActivities: FocusActivity[];
  focusRecords: DashboardFocusRecordSummary[];
  friendsOverview: FriendsOverviewData | null;
  user: DashboardUserSummary | null;
}

async function fetchDashboardTransactionsCached(): Promise<
  TransactionHistoryDTO[]
> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("transactions");

  const { data, error } = await serverApi.GET("/transactions", {
    params: {
      query: {
        tab: "ALL",
        size: 100,
      },
    },
  });

  if (error || !data) {
    throw new Error("DASHBOARD_TRANSACTIONS_FETCH_FAILED");
  }

  return data.content || [];
}

export async function getDashboardTransactions(): Promise<
  TransactionHistoryDTO[]
> {
  const token = await getServerAuthToken();
  if (!token) {
    return [];
  }

  try {
    return await fetchDashboardTransactionsCached();
  } catch (err) {
    console.error("[DashboardService:getDashboardTransactions]", err);
    return [];
  }
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
    friendsOverview,
    rewardsData,
    inventoryItems,
  ] = await Promise.all([
    fetchAllWorkspacesBoards(),
    getCurrentUser(),
    getDashboardTransactions(),
    getRawFocusActivities(),
    fetchRawUserFocusRecords(),
    getRequestLocale(),
    getFriendsOverview(),
    getRewardsData(),
    getRawInventoryItems(),
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
  // Alinha WeeklyCalendar com DashboardDailyBriefing excluindo workspaces somente-leitura
  const calendarTasks: WeeklyCalendarTaskSummary[] = allBoards
    .filter((b) => !readOnlyWorkspaceIds.has(b.workspaceId))
    .flatMap((b) =>
      b.columns.flatMap((c) => c.tasks.map(toWeeklyCalendarTaskSummary)),
    );

  const userBalance = user?.currentCoins ?? 0;

  // Resumo compacto de Recompensas & Mochila (usando serviços já cacheados em paralelo)
  const regularRewards = (rewardsData?.rewards ?? []).filter(
    (r) => !isDebtReward(r),
  );
  let redeemableCount = 0;
  for (const reward of regularRewards) {
    if (reward.price <= userBalance) {
      redeemableCount += 1;
    }
  }
  let inventoryAvailableCount = 0;
  for (const item of inventoryItems) {
    if (item.status === "AVAILABLE" || item.status === "IN_FOCUS") {
      inventoryAvailableCount += 1;
    }
  }
  const rewardsBridge: DashboardRewardsBridgeSummary = {
    redeemableCount,
    totalRewardsCount: regularRewards.length,
    inventoryAvailableCount,
  };

  const resolvedTimeZone = user?.timezone ?? (await getUserTimezoneCookie());
  const { bars, currentWeekEarnings, currentWeekSpent } =
    calculateWeeklyTaskEarnings(
      transactions,
      new Date(),
      locale,
      resolvedTimeZone,
    );

  const transactionSummaries: DashboardTransactionSummary[] = transactions.map(
    (tx) => ({
      id: tx.id,
      createdAt: tx.createdAt,
      transactionType: tx.transactionType,
      xpAmount: tx.xpAmount,
    }),
  );

  const focusRecordSummaries: DashboardFocusRecordSummary[] = focusRecords.map(
    (rec) => ({
      id: rec.id,
      focusActivityId: rec.focusActivityId,
      inventoryItemId: rec.inventoryItemId,
      startTime: rec.startTime,
      endTime: rec.endTime,
      durationMinutes: rec.durationMinutes,
    }),
  );

  const userSummary: DashboardUserSummary | null = user
    ? {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        isPremium: user.isPremium,
        timezone: user.timezone,
        currentStreak: user.currentStreak,
        dailyFocusGoalMinutes: user.dailyFocusGoalMinutes,
        totalXp: user.totalXp,
        currentCoins: user.currentCoins,
        experienceMode: user.experienceMode,
      }
    : null;

  return {
    workspaces: workspaceOptions,
    activeWorkspaceId,
    initialTasks,
    calendarTasks,
    initialColumns,
    initialAllColumns,
    transactions: transactionSummaries,
    userBalance,
    weeklyEarnings: currentWeekEarnings,
    weeklySpent: currentWeekSpent,
    bars,
    rewardsBridge,
    focusActivities,
    focusRecords: focusRecordSummaries,
    friendsOverview,
    user: userSummary,
  };
}
