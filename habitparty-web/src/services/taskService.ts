import { serverApi } from "@/api/server";
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

  // Busca o quadro Kanban e o resumo de todas as colunas do Workspace
  const [{ data: kanbanBoard }, { data: allColumnsSummary }] =
    await Promise.all([
      serverApi.GET("/workspaces/{workspaceId}/kanban", {
        params: { path: { workspaceId: activeWorkspace.id } },
        next: {
          tags: [
            "kanban",
            "board_columns",
            "tasks",
            "workspaces",
            `workspace-${activeWorkspace.id}`,
          ],
        },
      }),
      serverApi.GET("/board_columns/workspace/{workspaceId}", {
        params: { path: { workspaceId: activeWorkspace.id } },
        next: {
          tags: [
            "kanban",
            "board_columns",
            "tasks",
            "workspaces",
            `workspace-${activeWorkspace.id}`,
          ],
        },
      }),
    ]);

  const kanbanColumns = kanbanBoard
    ? mapWorkspaceToBoardColumns(kanbanBoard)
    : [];

  const kanbanColIds = new Set(kanbanColumns.map((c) => c.id));
  const missingSummaries = (allColumnsSummary || []).filter(
    (col) => col.id && !kanbanColIds.has(col.id),
  );

  // Para colunas que o backend marcou com is_visible = false e não vieram no /kanban,
  // busca diretamente as tarefas daquela coluna para não ficarem com tasks vazias
  const missingColumnsWithTasks = await Promise.all(
    missingSummaries.map(async (col) => {
      const columnId = col.id || "";
      const { data: tasksDto } = await serverApi.GET(
        "/tasks/column/{boardColumnId}",
        {
          params: { path: { boardColumnId: columnId } },
          next: { tags: ["tasks", `column-${columnId}`] },
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

  const initialColumns = [...kanbanColumns, ...missingColumnsWithTasks].sort(
    (a, b) => a.order - b.order,
  );

  return {
    workspaces,
    activeWorkspace,
    initialColumns,
  };
}
