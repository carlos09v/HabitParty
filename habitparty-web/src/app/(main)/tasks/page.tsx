import { cookies } from "next/headers";
import { Suspense } from "react";
import { serverApi } from "@/api/server";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TasksBoardContainer } from "@/components/tasks/TasksBoardContainer";
import {
  MAX_COLUMNS_PREMIUM,
  MAX_VISIBLE_COLUMNS,
  resolveVisibleColumnIds,
} from "@/constants/routine";
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
  let parsedCookieIds: string[] | undefined;
  if (cookieVal) {
    try {
      parsedCookieIds = JSON.parse(decodeURIComponent(cookieVal));
    } catch {
      // ignore
    }
  }

  const initialVisibleColumnIds = resolveVisibleColumnIds(
    initialColumns.map((c) => c.id),
    parsedCookieIds,
    maxAllowed,
    targetColumnId,
  );

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
