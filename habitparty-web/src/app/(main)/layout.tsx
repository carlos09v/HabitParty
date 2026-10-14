import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { serverApi } from "@/api/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { StoreInitializer } from "@/components/layout/StoreInitializer";
import { getCompactMode } from "@/utils/cookies";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const isCompact = await getCompactMode();
  const cookieStore = await cookies();

  const [{ data: workspaces }, { data: user }] = await Promise.all([
    serverApi.GET("/workspaces", {
      next: { tags: ["workspaces"] },
    }),
    serverApi.GET("/users/me", {
      next: { tags: ["user"] },
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

  return (
    // Container principal: h-screen overflow-hidden impede rolagem na janela toda
    <div className="relative h-screen flex overflow-hidden">
      <StoreInitializer
        compactMode={isCompact}
        workspaces={workspaces || []}
        activeWorkspaceId={activeWorkspaceId}
        user={user || null}
      />
      {/* 
        =========================================
        ORBES DE LUZ (Fundo Desfocado - Fiel ao Figma)
        ========================================= 
      */}
      {/* Bola Superior (Magenta) */}
      <div className="absolute top-[5%] left-[30%] w-[500px] h-[500px] rounded-full bg-magenta opacity-15 blur-[300px] pointer-events-none z-0" />

      {/* Bola Inferior Esquerda (Azul) */}
      <div className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] rounded-full bg-blue opacity-15 blur-[300px] pointer-events-none z-0" />

      {/* Bola Inferior Direita (Magenta) */}
      <div className="absolute bottom-[5%] right-[5%] w-[600px] h-[600px] rounded-full bg-magenta opacity-15 blur-[300px] pointer-events-none z-0" />

      <Sidebar user={user || null} />

      {/* 
        =========================================
        ÁREA PRINCIPAL
        ========================================= 
      */}
      <main className="relative z-10 flex-1 h-screen overflow-hidden flex">
        {/* Todo o conteúdo das telas /dashboard, /inventory, etc., aparecerá aqui */}
        {children}
      </main>
    </div>
  );
}
