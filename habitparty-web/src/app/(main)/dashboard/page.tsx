import { Suspense } from "react";
import { serverApi } from "@/api/server";
import { DashboardMain } from "@/components/dashboard/DashboardMain";
import { DashboardSidebarRight } from "@/components/dashboard/DashboardSidebarRight";
import { Loading } from "@/components/ui/Loading";
import type { components } from "@/api/schema";
import type { DashboardTaskDTO, Task } from "@/types/task";
import { getCompactMode } from "@/utils/cookies";
import { cookies } from "next/headers";

import { mapDashboardTaskToTask } from "@/utils/taskMapper";

type ColumnSummary = components["schemas"]["BoardColumnSummaryDTO"];

type PageProps = {
  searchParams: Promise<{ workspaceId?: string }>;
};

export default async function DashboardPage({ searchParams }: PageProps) {
  const isCompact = await getCompactMode();
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();

  // Buscar workspace principal para pegar as tarefas do dashboard
  const { data: workspaces } = await serverApi.GET("/workspaces", {
    next: { tags: ["workspaces"] },
  });

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="flex h-screen w-full overflow-hidden items-center justify-center">
        <p className="text-neutral-400">Nenhum workspace encontrado. Crie um para começar.</p>
      </div>
    );
  }

  const paramWorkspaceId = resolvedSearchParams.workspaceId;
  const cookieWorkspaceId = cookieStore.get("activeWorkspaceId")?.value;

  let activeWorkspaceId = paramWorkspaceId || cookieWorkspaceId;
  const isValidWorkspace = workspaces.some((w) => w.id === activeWorkspaceId);
  if (!activeWorkspaceId || !isValidWorkspace) {
    activeWorkspaceId = workspaces[0].id;
  }

  let initialTasks: Task[] = [];
  let initialColumns: ColumnSummary[] = [];

  if (activeWorkspaceId) {
    const [tasksRes, columnsRes] = await Promise.all([
      serverApi.GET("/tasks/workspace/{workspaceId}/dashboard", {
        params: { path: { workspaceId: activeWorkspaceId } },
        next: { tags: ["dashboard-tasks"] },
      }),
      serverApi.GET("/board_columns/workspace/{workspaceId}", {
        params: { path: { workspaceId: activeWorkspaceId } },
        next: { tags: ["dashboard-columns"] },
      }),
    ]);

    if (tasksRes.data?.content) {
      initialTasks = tasksRes.data.content.map(mapDashboardTaskToTask);
    }
    if (columnsRes.data) {
      initialColumns = columnsRes.data;
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center p-8">
            <Loading size="lg" label="Carregando painel..." />
          </div>
        }
      >
        <DashboardMain 
          isCompact={isCompact} 
          initialTasks={initialTasks}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          initialColumns={initialColumns}
        />
      </Suspense>

      <DashboardSidebarRight />
    </div>
  );
}
