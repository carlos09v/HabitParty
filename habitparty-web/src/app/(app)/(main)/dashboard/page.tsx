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
  resolveVisibleColumnIds,
} from "@/constants/routine";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getDashboardData } from "@/services/dashboardService";

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
    activeWorkspaceId,
    initialTasks,
    initialColumns,
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
  const cookieKey = activeWorkspaceId
    ? `hp_visible_cols_${activeWorkspaceId}`
    : null;
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
    initialColumns.map((c) => c.id || "").filter(Boolean),
    parsedCookieIds,
    maxAllowed,
  );

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
            activeWorkspaceId={activeWorkspaceId}
            initialColumns={initialColumns}
            initialVisibleColumnIds={initialVisibleColumnIds}
            transactions={transactions}
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
          tasks={initialTasks}
          activities={focusActivities}
          records={focusRecords}
        />
      </div>
    </ScopedIntlProvider>
  );
}
