import { serverApi } from "@/api/server";
import { getFocusInitialRecords } from "@/services/focusService";
import { fetchWorkspaceBoardColumns } from "@/services/taskService";
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

/**
 * Busca todos os dados necessários para renderizar a página do Dashboard e sua Sidebar.
 * Paraleliza chamadas independentes logo na primeira onda para reduzir latência (RTT)
 * e inclui tarefas de todas as colunas do workspace (mesmo ocultas no Kanban).
 */
export async function getDashboardData(
  requestedWorkspaceId?: string,
): Promise<DashboardData | null> {
  const [workspacesRes, userRes, transactionsRes, focusActivitiesRes] =
    await Promise.all([
      serverApi.GET("/workspaces", {
        next: { tags: ["workspaces"] },
      }),
      serverApi.GET("/users/me", {
        next: { tags: ["user"] },
      }),
      serverApi.GET("/transactions", {
        params: {
          query: {
            tab: "ALL",
            size: 100,
          },
        },
        next: { tags: ["transactions"] },
      }),
      serverApi.GET("/focus-activities", {
        next: { tags: ["focus-activities"] },
      }),
    ]);

  const workspaces = workspacesRes.data;
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
    focusActivitiesRes.data,
  );

  const [boardData, focusRecords] = await Promise.all([
    activeWorkspaceId
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

  const userBalance = userRes.data?.currentCoins ?? 0;
  const transactions = transactionsRes.data?.content || [];
  const { bars, currentWeekEarnings, currentWeekSpent } =
    calculateWeeklyTaskEarnings(transactions);

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
    user: userRes.data ?? null,
  };
}
