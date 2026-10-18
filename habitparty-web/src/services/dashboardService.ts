import { serverApi } from "@/api/server";
import type {
  ColumnSummaryDTO,
  TransactionHistoryDTO,
} from "@/types/dashboard";
import type { FocusActivity, FocusRecord } from "@/types/focus";
import type { Task } from "@/types/task";
import type { UserResponseDTO } from "@/types/user";
import type { WorkspaceResponseDTO } from "@/types/workspace";
import { calculateWeeklyTaskEarnings } from "@/utils/economy";
import {
  mapFocusActivities,
  mapFocusRecordDtoToRecord,
} from "@/utils/focusMapper";
import { mapTaskResponseToTask } from "@/utils/taskMapper";

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
 * Orquestra as chamadas para workspaces, colunas, tarefas, usuário, transações e foco.
 */
export async function getDashboardData(
  requestedWorkspaceId?: string,
): Promise<DashboardData | null> {
  const { data: workspaces } = await serverApi.GET("/workspaces", {
    next: { tags: ["workspaces"] },
  });

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

  const initialTasks: Task[] = [];
  let initialColumns: ColumnSummaryDTO[] = [];

  const [kanbanRes, columnsRes, userRes, transactionsRes, focusActivitiesRes] =
    await Promise.all([
      activeWorkspaceId
        ? serverApi.GET("/workspaces/{workspaceId}/kanban", {
            params: {
              path: { workspaceId: activeWorkspaceId },
            },
            next: { tags: ["dashboard-tasks", "kanban", "tasks"] },
          })
        : Promise.resolve({ data: null }),
      activeWorkspaceId
        ? serverApi.GET("/board_columns/workspace/{workspaceId}", {
            params: { path: { workspaceId: activeWorkspaceId } },
            next: { tags: ["dashboard-columns", "board_columns"] },
          })
        : Promise.resolve({ data: null }),
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

  if (columnsRes.data) {
    initialColumns = columnsRes.data;
  }

  if (kanbanRes.data?.columns) {
    const kanbanColumns = kanbanRes.data.columns;
    for (const col of kanbanColumns) {
      const colId = col.id || "";
      const colTitle = col.name || "Lista";
      if (col.tasks && Array.isArray(col.tasks)) {
        for (const t of col.tasks) {
          const mapped = mapTaskResponseToTask(t, colId);
          initialTasks.push({
            ...mapped,
            category: colTitle,
          });
        }
      }
    }
  }

  const focusActivities: FocusActivity[] = mapFocusActivities(
    focusActivitiesRes.data,
  );

  const focusRecords: FocusRecord[] = [];
  if (focusActivities.length > 0) {
    const activityMap = new Map(focusActivities.map((a) => [a.id, a]));
    const recordsResponses = await Promise.all(
      focusActivities.map((act) =>
        serverApi
          .GET("/focus-records/activity/{activityId}", {
            params: {
              path: { activityId: act.id },
              query: { page: 0 },
            },
            next: { tags: ["focus-records"] },
          })
          .catch(() => ({ data: null })),
      ),
    );

    for (const res of recordsResponses) {
      if (res.data?.content) {
        for (const item of res.data.content) {
          const matchedActivity = item.focusActivityId
            ? activityMap.get(item.focusActivityId)
            : undefined;
          focusRecords.push(mapFocusRecordDtoToRecord(item, matchedActivity));
        }
      }
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
