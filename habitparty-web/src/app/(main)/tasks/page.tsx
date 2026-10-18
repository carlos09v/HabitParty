import { cookies } from "next/headers";
import { Suspense } from "react";
import { serverApi } from "@/api/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TasksBoardContainer } from "@/components/tasks/TasksBoardContainer";
import { MAX_COLUMNS_PREMIUM, MAX_VISIBLE_COLUMNS } from "@/constants/routine";
import { getTasksBoardData } from "@/services/taskService";
import { getCompactMode } from "@/utils/cookies";

interface TasksPageProps {
  searchParams?: Promise<{
    workspaceId?: string;
    createColumn?: string;
    columnId?: string;
  }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const isCompact = await getCompactMode();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const paramWorkspaceId = resolvedSearchParams.workspaceId;
  const cookieWorkspaceId = cookieStore.get("activeWorkspaceId")?.value;
  const shouldOpenCreateColumn = resolvedSearchParams.createColumn === "true";
  const targetColumnId = resolvedSearchParams.columnId;

  const [{ activeWorkspace, initialColumns }, { data: user }] =
    await Promise.all([
      getTasksBoardData(paramWorkspaceId || cookieWorkspaceId),
      serverApi.GET("/users/me", { next: { tags: ["user"] } }),
    ]);

  const isPremium = user?.isPremium ?? false;
  const maxAllowed = isPremium ? MAX_COLUMNS_PREMIUM : MAX_VISIBLE_COLUMNS;
  const workspaceId = activeWorkspace?.id || null;

  const cookieKey = workspaceId ? `hp_visible_cols_${workspaceId}` : null;
  const cookieVal = cookieKey ? cookieStore.get(cookieKey)?.value : null;
  let initialVisibleColumnIds: string[] | undefined;
  if (cookieVal) {
    try {
      initialVisibleColumnIds = JSON.parse(decodeURIComponent(cookieVal));
    } catch {
      // ignore
    }
  }

  // Se o usuário selecionou uma coluna específica (ex: vindo do Dashboard), garante que ela esteja visível
  if (targetColumnId && initialColumns.some((c) => c.id === targetColumnId)) {
    if (
      Array.isArray(initialVisibleColumnIds) &&
      initialVisibleColumnIds.length > 0
    ) {
      if (!initialVisibleColumnIds.includes(targetColumnId)) {
        initialVisibleColumnIds =
          initialVisibleColumnIds.length < maxAllowed
            ? [...initialVisibleColumnIds, targetColumnId]
            : [
                ...initialVisibleColumnIds.slice(0, maxAllowed - 1),
                targetColumnId,
              ];
      }
    } else {
      const defaultCols = initialColumns.slice(0, maxAllowed).map((c) => c.id);
      initialVisibleColumnIds = defaultCols.includes(targetColumnId)
        ? defaultCols
        : [...defaultCols.slice(0, maxAllowed - 1), targetColumnId];
    }
  }

  return (
    <PageWrapper noScroll isCompact={isCompact}>
      <Suspense fallback={null}>
        <TasksBoardContainer
          key={workspaceId || "empty"}
          initialColumns={initialColumns}
          initialVisibleColumnIds={initialVisibleColumnIds}
          initialOpenCreateColumn={shouldOpenCreateColumn}
          targetColumnId={targetColumnId}
          isPremium={isPremium}
          workspaceId={workspaceId}
          isCompact={isCompact}
        />
      </Suspense>
    </PageWrapper>
  );
}
