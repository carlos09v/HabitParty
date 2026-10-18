import { cookies } from "next/headers";
import { Suspense } from "react";
import { DashboardEmptyWorkspace } from "@/components/dashboard/DashboardEmptyWorkspace";
import { DashboardMain } from "@/components/dashboard/DashboardMain";
import { DashboardSidebarRight } from "@/components/dashboard/DashboardSidebarRight";
import { PaymentFeedbackListener } from "@/components/subscription/PaymentFeedbackListener";
import { Loading } from "@/components/ui/Loading";
import { getDashboardData } from "@/services/dashboardService";
import { getCompactMode } from "@/utils/cookies";

type PageProps = {
  searchParams: Promise<{ workspaceId?: string }>;
};

/**
 * Página Principal do Dashboard (Server Component).
 * Orquestra a renderização do painel principal e da sidebar direita,
 * consumindo os dados via dashboardService.
 */
export default async function DashboardPage({ searchParams }: PageProps) {
  const isCompact = await getCompactMode();
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();

  const paramWorkspaceId = resolvedSearchParams.workspaceId;
  const cookieWorkspaceId = cookieStore.get("activeWorkspaceId")?.value;

  const dashboardData = await getDashboardData(
    paramWorkspaceId || cookieWorkspaceId,
  );

  if (!dashboardData) {
    return <DashboardEmptyWorkspace />;
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

  return (
    <div className="flex h-full w-full overflow-hidden">
      <Suspense fallback={null}>
        <PaymentFeedbackListener />
      </Suspense>

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
          activeWorkspaceId={activeWorkspaceId}
          initialColumns={initialColumns}
          transactions={transactions}
          user={user}
        />
      </Suspense>

      <DashboardSidebarRight
        isCompact={isCompact}
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
  );
}
