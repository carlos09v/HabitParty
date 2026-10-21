import { serverApi } from "@/api/server";
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
 * Busca todas as colunas (visíveis no Kanban e ocultas) de um workspace com suas respectivas tarefas,
 * além do resumo de colunas retornado pelo backend.
 */
export async function fetchWorkspaceBoardColumns(workspaceId: string): Promise<{
  columns: BoardColumn[];
  summaries: ColumnSummaryDTO[];
}> {
  const [{ data: kanbanBoard }, { data: allColumnsSummary }] =
    await Promise.all([
      serverApi.GET("/workspaces/{workspaceId}/kanban", {
        params: { path: { workspaceId } },
        next: {
          tags: [
            "kanban",
            "board_columns",
            "tasks",
            "dashboard-tasks",
            `workspace-${workspaceId}`,
          ],
        },
      }),
      serverApi.GET("/board_columns/workspace/{workspaceId}", {
        params: { path: { workspaceId } },
        next: {
          tags: [
            "kanban",
            "board_columns",
            "dashboard-columns",
            `workspace-${workspaceId}`,
          ],
        },
      }),
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
          next: { tags: ["tasks", "dashboard-tasks", `column-${columnId}`] },
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
 * Encapsula a busca de workspaces, resolução do workspace ativo,
 * colunas do Kanban e busca de colunas adicionais com suas tarefas.
 */
export async function getTasksBoardData(
  requestedWorkspaceId?: string,
): Promise<TasksBoardData> {
  const { data: workspaces, error } = await serverApi.GET("/workspaces", {
    next: { tags: ["workspaces"] },
  });

  if (error || !workspaces || workspaces.length === 0) {
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

  const { columns: initialColumns } = await fetchWorkspaceBoardColumns(
    activeWorkspace.id,
  );

  return {
    workspaces,
    activeWorkspace,
    initialColumns,
  };
}
