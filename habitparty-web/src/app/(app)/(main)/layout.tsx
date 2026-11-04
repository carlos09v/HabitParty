import { cacheLife, cacheTag } from "next/cache";
import { cookies } from "next/headers";
import { type ReactNode, Suspense } from "react";
import { serverApi } from "@/api/server";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { StoreInitializer } from "@/components/layout/StoreInitializer";
import { PaymentFeedbackListener } from "@/components/subscription/PaymentFeedbackListener";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";
import { getRawInventoryItems } from "@/services/inventoryService";
import { getCurrentUser } from "@/services/userService";
import { getWorkspaces } from "@/services/workspaceService";
import { getCompactMode, getThemeMode } from "@/utils/cookies";

export const instant = false;

async function fetchPendingTasksCount(workspaceId: string): Promise<number> {
  "use cache: private";
  cacheLife("private30");
  cacheTag("tasks", "dashboard-tasks", `workspace-${workspaceId}`);

  try {
    const { data: tasksData } = await serverApi.GET(
      "/tasks/workspace/{workspaceId}/dashboard",
      {
        params: {
          path: { workspaceId },
          query: { filter: "TODAY", size: 1 },
        },
        next: { tags: ["dashboard-tasks"] },
      },
    );
    if (tasksData?.totalElements !== undefined) {
      return tasksData.totalElements;
    }
    if (tasksData?.content) {
      return tasksData.content.length;
    }
  } catch {
    // ignore
  }
  return 0;
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookieWorkspaceId = cookieStore.get("activeWorkspaceId")?.value;

  const [
    isCompact,
    theme,
    workspaces,
    user,
    inventoryData,
    speculativeTasksCount,
  ] = await Promise.all([
    getCompactMode(),
    getThemeMode(),
    getWorkspaces(),
    getCurrentUser(),
    getRawInventoryItems(),
    cookieWorkspaceId
      ? fetchPendingTasksCount(cookieWorkspaceId)
      : Promise.resolve(0),
  ]);

  let activeWorkspaceId: string | null = null;
  let isCookieWorkspaceValid = false;

  if (workspaces.length > 0) {
    isCookieWorkspaceValid = workspaces.some((w) => w.id === cookieWorkspaceId);
    activeWorkspaceId =
      isCookieWorkspaceValid && cookieWorkspaceId
        ? cookieWorkspaceId
        : workspaces[0].id || null;
  }

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
        </Suspense>

        <StoreInitializer
          compactMode={isCompact}
          theme={theme}
          experienceMode={user?.experienceMode || "PRODUCTIVITY"}
          workspaces={workspaces || []}
          activeWorkspaceId={activeWorkspaceId}
          user={user || null}
        />
        {/* 
        =========================================
        ORBES DE LUZ AMBIENTE (Periféricas e Ultra-difusas)
        Luzes sangrando nas bordas/cantos para criar profundidade cósmica
        sem gerar "bolas nítidas" e mantendo o miolo legível em todas as telas.
        ========================================= 
      */}
        {/* Luz Superior Direita (Magenta Suave) */}
        <div className="cosmic-orb absolute -top-[12%] -right-[8%] w-[650px] h-[650px] rounded-full bg-magenta/10 blur-[280px] transform-gpu will-change-transform pointer-events-none z-0" />

        {/* Luz Inferior Esquerda (Azul Cósmico) */}
        <div className="cosmic-orb absolute -bottom-[15%] -left-[5%] w-[700px] h-[700px] rounded-full bg-blue/12 blur-[280px] transform-gpu will-change-transform pointer-events-none z-0" />

        {/* Luz Superior Esquerda/Centro (Violeta da Marca - Atmosfera) */}
        <div className="cosmic-orb absolute -top-[15%] left-[15%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[260px] transform-gpu will-change-transform pointer-events-none z-0" />

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
          {/* Todo o conteúdo das telas /dashboard, /inventory, etc., aparecerá aqui */}
          {children}
        </main>
      </div>
    </ScopedIntlProvider>
  );
}
