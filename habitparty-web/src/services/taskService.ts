import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/api/server";
import {
  getWorkspaces,
  resolveActiveWorkspace,
} from "@/services/workspaceService";
import type {
  ColumnSummaryDTO,
  DashboardColumnOption,
} from "@/types/dashboard";
import type { BoardColumn } from "@/types/task";
import type { WorkspaceResponseDTO } from "@/types/workspace";
import { getUserTimezoneCookie } from "@/utils/cookies";
import {
  mapTaskResponseToTask,
  mapWorkspaceToBoardColumns,
} from "@/utils/taskMapper";

export interface TasksBoardData {
  workspaces: WorkspaceResponseDTO[];
  activeWorkspace: WorkspaceResponseDTO | null;
  initialColumns: BoardColumn[];
}

export interface WorkspaceBoardWithSummaries {
  workspaceId: string;
  workspaceName: string;
  columns: BoardColumn[];
  summaries: DashboardColumnOption[];
}

/**
 * Busca o catálogo/resumo de colunas de um workspace.
 * Cacheado de forma privada no Router Cache do navegador por 5 minutos (`catalog`).
 */
export async function getWorkspaceColumnsSummary(
  workspaceId: string,
): Promise<ColumnSummaryDTO[]> {
  "use cache: private";
  cacheLife("catalog");
  cacheTag("board_columns", "dashboard-columns");

  const { data } = await serverApi.GET(
    "/board_columns/workspace/{workspaceId}",
    {
      params: { path: { workspaceId } },
    },
  );

  return data || [];
}

/**
 * Busca todas as colunas (visíveis no Kanban e ocultas) de um workspace com suas respectivas tarefas,
 * além do resumo de colunas retornado pelo backend.
 * Cacheado de forma privada no cliente (`private30`).
 */
export async function fetchWorkspaceBoardColumns(workspaceId: string): Promise<{
  columns: BoardColumn[];
  summaries: ColumnSummaryDTO[];
}> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("kanban", "tasks", "dashboard-tasks");

  const [{ data: kanbanBoard }, allColumnsSummary, userTimeZone] =
    await Promise.all([
      serverApi.GET("/workspaces/{workspaceId}/kanban", {
        params: { path: { workspaceId } },
      }),
      getWorkspaceColumnsSummary(workspaceId),
      getUserTimezoneCookie(),
    ]);

  const kanbanColumns = kanbanBoard
    ? mapWorkspaceToBoardColumns(kanbanBoard, userTimeZone)
    : [];

  const summaries: ColumnSummaryDTO[] = allColumnsSummary || [];
  const kanbanColIds = new Set(kanbanColumns.map((c) => c.id));
  const missingSummaries = summaries.filter(
    (col) => col.id && !kanbanColIds.has(col.id),
  );

  const missingColumnsWithTasks = await Promise.all(
    missingSummaries.map(async (col) => {
      const columnId = col.id || "";
      const { data: tasksDto } = await serverApi.GET(
        "/tasks/column/{boardColumnId}",
        {
          params: { path: { boardColumnId: columnId } },
        },
      );
      const tasks = (tasksDto || []).map((t) =>
        mapTaskResponseToTask(t, columnId, userTimeZone),
      );
      return {
        id: columnId,
        title: col.name || "Lista",
        icon: col.icon || "sun",
        order: col.orderIndex ?? kanbanColumns.length,
        tasks,
      };
    }),
  );

  const columns = [...kanbanColumns, ...missingColumnsWithTasks].sort(
    (a, b) => a.order - b.order,
  );

  return { columns, summaries };
}

/**
 * Busca todos os workspaces do usuário com suas respectivas colunas (visíveis e ocultas)
 * e tarefas em uma única consulta em lote para o Dashboard multi-ambiente.
 * Cacheado de forma privada (`private30`).
 */
export async function fetchAllWorkspacesBoards(): Promise<
  WorkspaceBoardWithSummaries[]
> {
  "use cache: private";
  cacheLife("private30");
  cacheTag(
    "workspaces",
    "kanban",
    "board_columns",
    "dashboard-columns",
    "tasks",
    "dashboard-tasks",
  );

  const [{ data: workspacesDto }, userTimeZone] = await Promise.all([
    serverApi.GET("/workspaces/boards", {
      params: {
        query: { excludeArchivedCompleted: true },
      },
    }),
    getUserTimezoneCookie(),
  ]);

  return (workspacesDto || [])
    .filter((ws) => Boolean(ws.id))
    .map((ws) => {
      const workspaceId = ws.id || "";
      const workspaceName = ws.name || "";
      const columns = mapWorkspaceToBoardColumns(ws, userTimeZone);
      const summaries: DashboardColumnOption[] = (ws.columns || []).map(
        (col) => {
          const loadedTasks = col.tasks || [];
          const loadedTotal = loadedTasks.length;
          const loadedCompleted = loadedTasks.filter(
            (t) => t.status === "COMPLETED",
          ).length;
          const totalTasks = col.totalTasks ?? loadedTotal;
          const completedTasks = col.completedTasks ?? loadedCompleted;
          return {
            id: col.id,
            name: col.name,
            icon: col.icon,
            orderIndex: col.orderIndex,
            isVisible: col.isVisible,
            totalTasks,
            completedTasks,
            archivedTotalCount: Math.max(0, totalTasks - loadedTotal),
            archivedCompletedCount: Math.max(
              0,
              completedTasks - loadedCompleted,
            ),
            workspaceId,
            workspaceName,
          };
        },
      );

      return {
        workspaceId,
        workspaceName,
        columns,
        summaries,
      };
    });
}

/**
 * Busca a contagem de tarefas pendentes programadas para hoje no workspace ativo.
 * Cacheada de forma privada (`private30`) para uso nos badges da Sidebar e MobileHeader.
 */
export async function fetchPendingTasksCount(
  workspaceId: string,
): Promise<number> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("tasks", "dashboard-tasks");

  try {
    const { data: tasksData } = await serverApi.GET(
      "/tasks/workspace/{workspaceId}/dashboard",
      {
        params: {
          path: { workspaceId },
          query: { filter: "TODAY", size: 1 },
        },
      },
    );
    if (tasksData?.totalElements !== undefined) {
      return tasksData.totalElements;
    }
    if (tasksData?.content) {
      return tasksData.content.length;
    }
  } catch {
    // ignore
  }
  return 0;
}

/**
 * Obtém todos os dados necessários para renderizar o quadro Kanban de tarefas.
 * Paraleliza a busca de workspaces e das colunas do workspace solicitado logo na 1ª onda.
 */
export async function getTasksBoardData(
  requestedWorkspaceId?: string,
): Promise<TasksBoardData> {
  const [workspaces, speculativeBoard] = await Promise.all([
    getWorkspaces(),
    requestedWorkspaceId
      ? fetchWorkspaceBoardColumns(requestedWorkspaceId)
      : Promise.resolve(null),
  ]);

  const { activeWorkspace, activeWorkspaceId } = resolveActiveWorkspace(
    workspaces,
    requestedWorkspaceId,
  );

  if (!activeWorkspace || !activeWorkspaceId) {
    return {
      workspaces,
      activeWorkspace: null,
      initialColumns: [],
    };
  }

  const { columns: initialColumns } =
    activeWorkspaceId === requestedWorkspaceId && speculativeBoard
      ? speculativeBoard
      : await fetchWorkspaceBoardColumns(activeWorkspaceId);

  return {
    workspaces,
    activeWorkspace,
    initialColumns,
  };
}
