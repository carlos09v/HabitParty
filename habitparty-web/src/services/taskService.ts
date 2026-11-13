import { cacheLife, cacheTag } from "next/cache";
import { serverApi } from "@/api/server";
import { getWorkspaces } from "@/services/workspaceService";
import type { ColumnSummaryDTO } from "@/types/dashboard";
import type { BoardColumn } from "@/types/task";
import type { WorkspaceResponseDTO } from "@/types/workspace";
import {
  mapTaskResponseToTask,
  mapWorkspaceToBoardColumns,
} from "@/utils/taskMapper";

export interface TasksBoardData {
  workspaces: WorkspaceResponseDTO[];
  activeWorkspace: WorkspaceResponseDTO | null;
  initialColumns: BoardColumn[];
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

  const [{ data: kanbanBoard }, allColumnsSummary] = await Promise.all([
    serverApi.GET("/workspaces/{workspaceId}/kanban", {
      params: { path: { workspaceId } },
    }),
    getWorkspaceColumnsSummary(workspaceId),
  ]);

  const kanbanColumns = kanbanBoard
    ? mapWorkspaceToBoardColumns(kanbanBoard)
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
        mapTaskResponseToTask(t, columnId),
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

  if (workspaces.length === 0) {
    return {
      workspaces: [],
      activeWorkspace: null,
      initialColumns: [],
    };
  }

  const activeWorkspace =
    workspaces.find((w) => w.id === requestedWorkspaceId) || workspaces[0];

  if (!activeWorkspace?.id) {
    return {
      workspaces,
      activeWorkspace: null,
      initialColumns: [],
    };
  }

  const { columns: initialColumns } =
    activeWorkspace.id === requestedWorkspaceId && speculativeBoard
      ? speculativeBoard
      : await fetchWorkspaceBoardColumns(activeWorkspace.id);

  return {
    workspaces,
    activeWorkspace,
    initialColumns,
  };
}
