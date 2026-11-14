import { cookies } from "next/headers";
import { type ReactNode, Suspense } from "react";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { StoreInitializer } from "@/components/layout/StoreInitializer";
import { StreakLostNotifier } from "@/components/layout/StreakLostNotifier";
import { TimezoneMismatchBanner } from "@/components/layout/TimezoneMismatchBanner";
import { AchievementUnlockListener } from "@/components/showcase/AchievementUnlockListener";
import { PaymentFeedbackListener } from "@/components/subscription/PaymentFeedbackListener";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getDashboardTransactions } from "@/services/dashboardService";
import { getRawInventoryItems } from "@/services/inventoryService";
import { fetchPendingTasksCount } from "@/services/taskService";
import { getCurrentUser } from "@/services/userService";
import {
  getWorkspaces,
  resolveActiveWorkspace,
} from "@/services/workspaceService";
import { getDateFormat, getThemeMode, getTimeFormat } from "@/utils/cookies";
import { getLatestTaskCompletionCreatedAt } from "@/utils/dashboardMetrics";

export const instant = false;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookieWorkspaceId = cookieStore.get("activeWorkspaceId")?.value;

  const [
    theme,
    dateFormat,
    timeFormat,
    workspaces,
    user,
    inventoryData,
    transactions,
    speculativeTasksCount,
  ] = await Promise.all([
    getThemeMode(),
    getDateFormat(),
    getTimeFormat(),
    getWorkspaces(),
    getCurrentUser(),
    getRawInventoryItems(),
    getDashboardTransactions(),
    cookieWorkspaceId
      ? fetchPendingTasksCount(cookieWorkspaceId)
      : Promise.resolve(0),
  ]);

  const lastTaskCompletionAt = getLatestTaskCompletionCreatedAt(transactions);
  const { activeWorkspaceId } = resolveActiveWorkspace(
    workspaces,
    cookieWorkspaceId,
  );

  // Contagem de itens utilizáveis na mochila (AVAILABLE ou IN_FOCUS)
  const inventoryCount = inventoryData.filter(
    (item) => item.status === "AVAILABLE" || item.status === "IN_FOCUS",
  ).length;

  // Se o cookie já era o workspace ativo válido, reaproveita a busca paralela;
  // caso contrário (1º acesso sem cookie ou cookie obsoleto), busca para o primeiro workspace.
  const pendingTasksCount =
    activeWorkspaceId && activeWorkspaceId === cookieWorkspaceId
      ? speculativeTasksCount
      : activeWorkspaceId
        ? await fetchPendingTasksCount(activeWorkspaceId)
        : 0;

  const badgeCounts = {
    inventory: inventoryCount,
    tasks: pendingTasksCount,
  };

  return (
    <ScopedIntlProvider scope="main">
      {/* Container principal: h-[100dvh] overflow-hidden impede rolagem na janela toda */}
      <div className="relative h-[100dvh] flex flex-col lg:flex-row overflow-hidden">
        <Suspense fallback={null}>
          <PaymentFeedbackListener />
          <AchievementUnlockListener />
          <StreakLostNotifier
            userId={user?.id}
            currentStreak={user?.currentStreak}
            timezone={user?.timezone}
          />
        </Suspense>

        <StoreInitializer
          theme={theme}
          dateFormat={dateFormat}
          timeFormat={timeFormat}
          experienceMode={user?.experienceMode || "PRODUCTIVITY"}
          workspaces={workspaces || []}
          activeWorkspaceId={activeWorkspaceId}
          user={user || null}
          lastTaskCompletionAt={lastTaskCompletionAt}
        />
        {/* 
        =========================================
        LUZ AMBIENTE CÓSMICA PRÉ-COMPOSTA (Zero Blur Filter GPU)
        Luzes periféricas suaves via radial-gradient nativo sem alocar
        superfícies gigantes de Gaussian blur na VRAM.
        ========================================= 
      */}
        <div
          aria-hidden="true"
          className="cosmic-ambient-main absolute inset-0 pointer-events-none z-0"
        />

        {/* Barra Lateral Padrão (Desktop: hidden lg:flex) */}
        <Sidebar user={user || null} badgeCounts={badgeCounts} />

        {/* Header Mobile com Drawer Deslizante (< lg) */}
        <MobileHeader user={user || null} badgeCounts={badgeCounts} />

        {/* 
        =========================================
        ÁREA PRINCIPAL
        ========================================= 
      */}
        <main className="relative z-10 flex-1 min-h-0 min-w-0 h-full overflow-hidden flex flex-col">
          <EmailVerificationBanner initialUser={user || null} />
          <TimezoneMismatchBanner initialUser={user || null} />
          {/* Todo o conteúdo das telas /dashboard, /inventory, etc., aparecerá aqui */}
          {children}
        </main>
      </div>
    </ScopedIntlProvider>
  );
}
