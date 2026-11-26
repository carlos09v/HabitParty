import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { DashboardEmptyWorkspace } from "@/components/dashboard/DashboardEmptyWorkspace";
import { DashboardMain } from "@/components/dashboard/DashboardMain";
import { DashboardSidebarRight } from "@/components/dashboard/DashboardSidebarRight";
import {
  MAX_COLUMNS_PREMIUM,
  MAX_VISIBLE_COLUMNS,
  resolveDashboardVisibleColumnIds,
} from "@/constants/routine";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getDashboardData } from "@/services/dashboardService";
import { readVisibleColumnsFromCookieStore } from "@/utils/columnVisibility";

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
 * consumindo os dados paralelizados via dashboardService (zero waterfall).
 */
export default async function DashboardPage({ searchParams }: PageProps) {
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
    calendarTasks,
    initialColumns,
    initialAllColumns,
    transactions,
    userBalance,
    weeklyEarnings,
    weeklySpent,
    bars,
    rewardsBridge,
    focusActivities,
    focusRecords,
    friendsOverview,
    user,
  } = dashboardData;

  const isPremium = user?.isPremium ?? false;
  const maxAllowed = isPremium ? MAX_COLUMNS_PREMIUM : MAX_VISIBLE_COLUMNS;

  const savedActiveIds = readVisibleColumnsFromCookieStore(
    cookieStore,
    activeWorkspaceId,
  );
  const initialVisibleColumnIds = resolveDashboardVisibleColumnIds(
    initialColumns,
    savedActiveIds,
    maxAllowed,
  );

  return (
    <ScopedIntlProvider scope="dashboard">
      <div className="flex h-full w-full overflow-hidden">
        <DashboardMain
          initialTasks={initialTasks}
          workspaces={workspaces}
          activeWorkspaceId={activeWorkspaceId}
          initialAllColumns={initialAllColumns}
          initialVisibleColumnIds={initialVisibleColumnIds}
          transactions={transactions}
          focusRecords={focusRecords}
          user={user}
        />

        <DashboardSidebarRight
          experienceMode={user?.experienceMode}
          isPremium={isPremium}
          timeZone={user?.timezone}
          balance={userBalance}
          weeklyEarnings={weeklyEarnings}
          weeklySpent={weeklySpent}
          bars={bars}
          rewardsBridge={rewardsBridge}
          transactions={transactions}
          tasks={calendarTasks}
          activities={focusActivities}
          records={focusRecords}
          friendsOverview={friendsOverview}
        />
      </div>
    </ScopedIntlProvider>
  );
}
