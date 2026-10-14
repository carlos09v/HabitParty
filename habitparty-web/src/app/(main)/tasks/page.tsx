import { cookies } from "next/headers";
import { Suspense } from "react";
import { serverApi } from "@/api/server";
import { TasksBoardContainer } from "@/components/tasks/TasksBoardContainer";
import { mapWorkspaceToBoardColumns } from "@/utils/taskMapper";

interface TasksPageProps {
  searchParams?: Promise<{ workspaceId?: string; createColumn?: string }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const paramWorkspaceId = resolvedSearchParams.workspaceId;
  const cookieWorkspaceId = cookieStore.get("activeWorkspaceId")?.value;
  const shouldOpenCreateColumn = resolvedSearchParams.createColumn === "true";

  const { data: workspaces, error } = await serverApi.GET("/workspaces", {
    next: { tags: ["workspaces"] },
  });

  if (error || !workspaces || workspaces.length === 0) {
    return <TasksBoardContainer initialColumns={[]} />;
  }

  const requestedWorkspaceId = paramWorkspaceId || cookieWorkspaceId;
  const activeWorkspace =
    workspaces.find((w) => w.id === requestedWorkspaceId) || workspaces[0];

  if (!activeWorkspace?.id) {
    return <TasksBoardContainer initialColumns={[]} />;
  }

  // Busca o quadro Kanban completo com colunas e tarefas aninhadas
  const { data: kanbanBoard } = await serverApi.GET(
    "/workspaces/{workspaceId}/kanban",
    {
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
    },
  );

  const initialColumns = kanbanBoard
    ? mapWorkspaceToBoardColumns(kanbanBoard)
    : [];

  return (
    <Suspense fallback={null}>
      <TasksBoardContainer
        key={activeWorkspace.id}
        initialColumns={initialColumns}
        initialOpenCreateColumn={shouldOpenCreateColumn}
      />
    </Suspense>
  );
}
