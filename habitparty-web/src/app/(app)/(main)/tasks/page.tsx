import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { TasksBoardContainer } from "@/components/tasks/TasksBoardContainer";
import {
  MAX_COLUMNS_PREMIUM,
  MAX_VISIBLE_COLUMNS,
  resolveVisibleColumnIds,
} from "@/constants/routine";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getTasksBoardData } from "@/services/taskService";
import { getCurrentUser } from "@/services/userService";

interface TasksPageProps {
  searchParams?: Promise<{
    workspaceId?: string;
    createColumn?: string;
    columnId?: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("tasks.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const paramWorkspaceId = resolvedSearchParams.workspaceId;
  const cookieWorkspaceId = cookieStore.get("activeWorkspaceId")?.value;
  const shouldOpenCreateColumn = resolvedSearchParams.createColumn === "true";
  const targetColumnId = resolvedSearchParams.columnId;

  const [{ activeWorkspace, initialColumns }, user] = await Promise.all([
    getTasksBoardData(paramWorkspaceId || cookieWorkspaceId),
    getCurrentUser(),
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
    <ScopedIntlProvider scope="tasks">
      <PageWrapper noScroll>
        <Suspense fallback={null}>
          <TasksBoardContainer
            key={workspaceId || "empty"}
            initialColumns={initialColumns}
            initialVisibleColumnIds={initialVisibleColumnIds}
            initialOpenCreateColumn={shouldOpenCreateColumn}
            targetColumnId={targetColumnId}
            isPremium={isPremium}
            workspaceId={workspaceId}
          />
        </Suspense>
      </PageWrapper>
    </ScopedIntlProvider>
  );
}
