import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { DashboardEmptyWorkspace } from "@/components/dashboard/DashboardEmptyWorkspace";
import { DashboardMain } from "@/components/dashboard/DashboardMain";
import { DashboardSidebarRight } from "@/components/dashboard/DashboardSidebarRight";
import { Loading } from "@/components/ui/Loading";
import {
  MAX_COLUMNS_PREMIUM,
  MAX_VISIBLE_COLUMNS,
  resolveDashboardVisibleColumnIds,
} from "@/constants/routine";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getDashboardData } from "@/services/dashboardService";
import type { WeeklyCalendarTaskSummary } from "@/types/dashboard";
import {
  getVisibleColumnsCookieName,
  parseVisibleColumnsCookie,
} from "@/utils/columnVisibility";

function toWeeklyCalendarTaskSummary(
  task: import("@/types/task").Task,
): WeeklyCalendarTaskSummary {
  return {
    id: task.id,
    type: task.type,
    taskType: task.taskType,
    habitType: task.habitType,
    resetCounter: task.resetCounter,
    completed: task.completed,
    dueDate: task.dueDate,
    startDate: task.startDate,
    repeatType: task.repeatType,
    repeatEvery: task.repeatEvery,
    daysOfWeek: task.daysOfWeek,
    monthlyOption: task.monthlyOption,
    lastCompletedAt: task.lastCompletedAt,
  };
}

type PageProps = {
  searchParams: Promise<{ workspaceId?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.metadata");
  return {
    title: t("title"),
    description: t("description"),
  };
}

/**
 * Página Principal do Dashboard (Server Component).
 * Orquestra a renderização do painel principal e da sidebar direita,
 * consumindo os dados via dashboardService.
 */
export default async function DashboardPage({ searchParams }: PageProps) {
  const t = await getTranslations("dashboard");
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();

  const paramWorkspaceId = resolvedSearchParams.workspaceId;
  const cookieWorkspaceId = cookieStore.get("activeWorkspaceId")?.value;

  const dashboardData = await getDashboardData(
    paramWorkspaceId || cookieWorkspaceId,
  );

  if (!dashboardData) {
    return (
      <ScopedIntlProvider scope="dashboard">
        <DashboardEmptyWorkspace />
      </ScopedIntlProvider>
    );
  }

  const {
    workspaces,
    activeWorkspaceId,
    initialTasks,
    initialColumns,
    initialAllColumns,
    transactions,
    userBalance,
    weeklyEarnings,
    weeklySpent,
    bars,
    focusActivities,
    focusRecords,
    user,
  } = dashboardData;

  const isPremium = user?.isPremium ?? false;
  const maxAllowed = isPremium ? MAX_COLUMNS_PREMIUM : MAX_VISIBLE_COLUMNS;

  const activeCookieVal = activeWorkspaceId
    ? cookieStore.get(getVisibleColumnsCookieName(activeWorkspaceId))?.value
    : undefined;
  const savedActiveIds = parseVisibleColumnsCookie(activeCookieVal);
  const initialVisibleColumnIds = resolveDashboardVisibleColumnIds(
    initialColumns,
    savedActiveIds,
    maxAllowed,
  );

  // Colunas ocultas no drawer Kanban continuam compondo o Dashboard (tarefas, metas e calendário)
  const calendarTasks = initialTasks.map(toWeeklyCalendarTaskSummary);

  return (
    <ScopedIntlProvider scope="dashboard">
      <div className="flex h-full w-full overflow-hidden">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center p-8">
              <Loading size="lg" label={t("loading")} />
            </div>
          }
        >
          <DashboardMain
            initialTasks={initialTasks}
            workspaces={workspaces}
            activeWorkspaceId={activeWorkspaceId}
            initialColumns={initialColumns}
            initialAllColumns={initialAllColumns}
            initialVisibleColumnIds={initialVisibleColumnIds}
            transactions={transactions}
            focusRecords={focusRecords}
            user={user}
          />
        </Suspense>

        <DashboardSidebarRight
          experienceMode={user?.experienceMode}
          balance={userBalance}
          weeklyEarnings={weeklyEarnings}
          weeklySpent={weeklySpent}
          bars={bars}
          transactions={transactions}
          tasks={calendarTasks}
          activities={focusActivities}
          records={focusRecords}
        />
      </div>
    </ScopedIntlProvider>
  );
}
