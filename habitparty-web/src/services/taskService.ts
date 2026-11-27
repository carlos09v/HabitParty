import { cacheLife, cacheTag } from "next/cache";
import { redirect } from "next/navigation";
import {
  getServerAuthToken,
  isUnauthorizedApiError,
  serverApi,
  UnauthorizedApiError,
} from "@/api/server";
import { getCurrentUser } from "@/services/userService";
import {
  getWorkspacesStrict,
  resolveActiveWorkspace,
} from "@/services/workspaceService";
import type {
  ColumnSummaryDTO,
  DashboardColumnOption,
} from "@/types/dashboard";
import type { BoardColumn, BoardColumnResponseDTO } from "@/types/task";
import type { WorkspaceResponseDTO } from "@/types/workspace";
import { getUserTimezoneCookie } from "@/utils/cookies";
import {
  computeArchivedColumnCountsFromTotals,
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

function mapColumnToDashboardSummary(
  col: BoardColumnResponseDTO,
  workspaceId: string,
  workspaceName?: string,
): DashboardColumnOption {
  const loadedTasks = col.tasks || [];
  const loadedTotal = loadedTasks.length;
  const loadedCompleted = loadedTasks.filter(
    (t) => t.status === "COMPLETED",
  ).length;
  const totalTasks = col.totalTasks ?? loadedTotal;
  const completedTasks = col.completedTasks ?? loadedCompleted;
  const { archivedTotalCount, archivedCompletedCount } =
    computeArchivedColumnCountsFromTotals(
      loadedTotal,
      loadedCompleted,
      totalTasks,
      completedTasks,
    );

  return {
    id: col.id,
    name: col.name,
    icon: col.icon,
    orderIndex: col.orderIndex,
    isVisible: col.isVisible,
    totalTasks,
    completedTasks,
    archivedTotalCount,
    archivedCompletedCount,
    workspaceId,
    ...(workspaceName !== undefined ? { workspaceName } : {}),
  };
}

async function fetchWorkspaceBoardColumnsCached(workspaceId: string): Promise<{
  columns: BoardColumn[];
  summaries: ColumnSummaryDTO[];
}> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("workspaces", "board_columns", "kanban", "tasks", "dashboard-tasks");

  const [{ data: kanbanBoard, error, response }, user, cookieTimeZone] =
    await Promise.all([
      serverApi.GET("/workspaces/{workspaceId}/kanban", {
        params: {
          path: { workspaceId },
          query: { excludeArchivedCompleted: true, includeHidden: true },
        },
      }),
      getCurrentUser(),
      getUserTimezoneCookie(),
    ]);

  const httpStatus = response?.status;
  if (httpStatus === 401) {
    throw new UnauthorizedApiError("WORKSPACE_BOARD_UNAUTHORIZED");
  }

  if (error || !kanbanBoard) {
    console.error(
      `[TaskService:fetchWorkspaceBoardColumns] Falha HTTP ${httpStatus ?? "unknown"} para workspace ${workspaceId}`,
      error,
    );
    throw new Error("WORKSPACE_BOARD_FETCH_FAILED");
  }

  const userTimeZone = user?.timezone ?? cookieTimeZone;
  const columns = mapWorkspaceToBoardColumns(kanbanBoard, userTimeZone);

  const summaries: DashboardColumnOption[] = [...(kanbanBoard.columns || [])]
    .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
    .map((col) => mapColumnToDashboardSummary(col, workspaceId));

  return { columns, summaries };
}

/**
 * Busca todas as colunas (visíveis no Kanban e ocultas) de um workspace com suas respectivas tarefas,
 * além do resumo de colunas retornado pelo backend.
 * Nunca armazena falhas transitórias ou respostas 401 no cache privado.
 */
export async function fetchWorkspaceBoardColumns(workspaceId: string): Promise<{
  columns: BoardColumn[];
  summaries: ColumnSummaryDTO[];
}> {
  const token = await getServerAuthToken();
  if (!token) {
    throw new UnauthorizedApiError("WORKSPACE_BOARD_MISSING_TOKEN");
  }

  return fetchWorkspaceBoardColumnsCached(workspaceId);
}

async function fetchAllWorkspacesBoardsCached(): Promise<
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

  const [{ data: workspacesDto, error, response }, user, cookieTimeZone] =
    await Promise.all([
      serverApi.GET("/workspaces/boards", {
        params: {
          query: { excludeArchivedCompleted: true },
        },
      }),
      getCurrentUser(),
      getUserTimezoneCookie(),
    ]);

  const httpStatus = response?.status;
  if (httpStatus === 401) {
    throw new UnauthorizedApiError("WORKSPACES_BOARDS_UNAUTHORIZED");
  }

  if (error || !Array.isArray(workspacesDto)) {
    console.error(
      `[TaskService:fetchAllWorkspacesBoards] Falha HTTP ${httpStatus ?? "unknown"}`,
      error,
    );
    throw new Error("WORKSPACES_BOARDS_FETCH_FAILED");
  }

  const userTimeZone = user?.timezone ?? cookieTimeZone;

  return workspacesDto
    .filter((ws) => Boolean(ws.id))
    .map((ws) => {
      const workspaceId = ws.id || "";
      const workspaceName = ws.name || "";
      const columns = mapWorkspaceToBoardColumns(ws, userTimeZone);
      const summaries: DashboardColumnOption[] = [...(ws.columns || [])]
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        .map((col) =>
          mapColumnToDashboardSummary(col, workspaceId, workspaceName),
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
 * Busca todos os workspaces do usuário com suas respectivas colunas (visíveis e ocultas)
 * e tarefas em uma única consulta em lote para o Dashboard multi-ambiente.
 * Nunca armazena erros no cache privado: redireciona em 401 e propaga falhas para o Error Boundary,
 * evitando falso estado vazio (`DashboardEmptyWorkspace`).
 */
export async function fetchAllWorkspacesBoards(): Promise<
  WorkspaceBoardWithSummaries[]
> {
  const token = await getServerAuthToken();
  if (!token) {
    redirect("/signIn?sessionExpired=1");
  }

  try {
    return await fetchAllWorkspacesBoardsCached();
  } catch (err) {
    if (isUnauthorizedApiError(err)) {
      redirect("/signIn?sessionExpired=1");
    }
    throw err;
  }
}

async function fetchPendingTasksCountCached(
  workspaceId: string,
): Promise<number> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("tasks", "dashboard-tasks");

  const { data: tasksData, error } = await serverApi.GET(
    "/tasks/workspace/{workspaceId}/dashboard",
    {
      params: {
        path: { workspaceId },
        query: { filter: "TODAY", size: 1 },
      },
    },
  );
  if (error || !tasksData) {
    throw new Error("PENDING_TASKS_COUNT_FETCH_FAILED");
  }
  if (tasksData.totalElements !== undefined) {
    return tasksData.totalElements;
  }
  return tasksData.content ? tasksData.content.length : 0;
}

/**
 * Busca a contagem de tarefas pendentes programadas para hoje no workspace ativo.
 * Nunca armazena falhas transitórias como `0` no cache privado.
 */
export async function fetchPendingTasksCount(
  workspaceId: string,
): Promise<number> {
  const token = await getServerAuthToken();
  if (!token) {
    return 0;
  }

  try {
    return await fetchPendingTasksCountCached(workspaceId);
  } catch {
    return 0;
  }
}

/**
 * Obtém todos os dados necessários para renderizar o quadro Kanban de tarefas.
 * Paraleliza a busca de workspaces e das colunas do workspace solicitado logo na 1ª onda.
 */
export async function getTasksBoardData(
  requestedWorkspaceId?: string,
): Promise<TasksBoardData> {
  try {
    const [workspaces, speculativeBoard] = await Promise.all([
      getWorkspacesStrict(),
      requestedWorkspaceId
        ? fetchWorkspaceBoardColumns(requestedWorkspaceId).catch((err) => {
            if (isUnauthorizedApiError(err)) {
              throw err;
            }
            return null;
          })
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
  } catch (err) {
    if (isUnauthorizedApiError(err)) {
      redirect("/signIn?sessionExpired=1");
    }
    throw err;
  }
}
