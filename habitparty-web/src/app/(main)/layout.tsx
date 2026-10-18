import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { serverApi } from "@/api/server";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { StoreInitializer } from "@/components/layout/StoreInitializer";
import { getCompactMode, getThemeMode } from "@/utils/cookies";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const isCompact = await getCompactMode();
  const theme = await getThemeMode();
  const cookieStore = await cookies();

  const [{ data: workspaces }, { data: user }, { data: inventoryData }] =
    await Promise.all([
      serverApi.GET("/workspaces", {
        next: { tags: ["workspaces"] },
      }),
      serverApi.GET("/users/me", {
        next: { tags: ["user"] },
      }),
      serverApi.GET("/inventory", {
        next: { tags: ["inventory"] },
      }),
    ]);

  const cookieWorkspaceId = cookieStore.get("activeWorkspaceId")?.value;
  let activeWorkspaceId: string | null = null;

  if (workspaces && workspaces.length > 0) {
    const isValid = workspaces.some((w) => w.id === cookieWorkspaceId);
    activeWorkspaceId =
      isValid && cookieWorkspaceId
        ? cookieWorkspaceId
        : workspaces[0].id || null;
  }

  // Contagem de itens utilizáveis na mochila (AVAILABLE ou IN_FOCUS)
  const inventoryCount = inventoryData
    ? inventoryData.filter(
        (item) => item.status === "AVAILABLE" || item.status === "IN_FOCUS",
      ).length
    : 0;

  // Busca tarefas pendentes de hoje no workspace ativo
  let pendingTasksCount = 0;
  if (activeWorkspaceId) {
    try {
      const { data: tasksData } = await serverApi.GET(
        "/tasks/workspace/{workspaceId}/dashboard",
        {
          params: {
            path: { workspaceId: activeWorkspaceId },
            query: { filter: "TODAY", size: 50 },
          },
          next: { tags: ["dashboard-tasks"] },
        },
      );
      if (tasksData?.content) {
        pendingTasksCount = tasksData.content.length;
      }
    } catch {
      // ignore
    }
  }

  const badgeCounts = {
    inventory: inventoryCount,
    tasks: pendingTasksCount,
  };

  return (
    // Container principal: h-[100dvh] overflow-hidden impede rolagem na janela toda
    <div className="relative h-[100dvh] flex flex-col lg:flex-row overflow-hidden">
      <StoreInitializer
        compactMode={isCompact}
        theme={theme}
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
        {/* Todo o conteúdo das telas /dashboard, /inventory, etc., aparecerá aqui */}
        {children}
      </main>
    </div>
  );
}
