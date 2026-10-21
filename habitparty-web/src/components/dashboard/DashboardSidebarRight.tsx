import {
  DashboardMobileDrawer,
  DashboardWidgetsList,
} from "@/components/dashboard/sidebar-right";
import type { DashboardSidebarRightProps } from "@/types/dashboard";
import { cn } from "@/utils";

/**
 * Painel Lateral Direito do Dashboard com widgets de resumo e histórico.
 * React Server Component:
 * Em telas xl+ (desktop grande), exibe a sidebar estática fixa no servidor.
 * Em telas < xl (tablets e mobile), passa a árvore de widgets como `children` para o
 * leaf client component DashboardMobileDrawer, evitando duplicar props na hidratação.
 */
export function DashboardSidebarRight({
  isCompact = false,
  balance = 0,
  weeklyEarnings = 0,
  weeklySpent = 0,
  bars,
  transactions = [],
  tasks = [],
  activities = [],
  records = [],
}: DashboardSidebarRightProps) {
  const widgets = (
    <DashboardWidgetsList
      isCompact={isCompact}
      balance={balance}
      weeklyEarnings={weeklyEarnings}
      weeklySpent={weeklySpent}
      bars={bars}
      transactions={transactions}
      tasks={tasks}
      activities={activities}
      records={records}
    />
  );

  return (
    <>
      {/* 1. SIDEBAR ESTÁTICA PARA TELAS DESKTOP (xl+) */}
      <aside
        className={cn(
          "hidden xl:flex shrink-0 bg-primary-dark/20 border-l border-primary/30 backdrop-blur-md h-full flex-col overflow-y-auto custom-scrollbar transition-[width,padding,gap] duration-200 z-20",
          isCompact ? "w-[300px] px-4 py-4 gap-3" : "w-[345px] px-5 py-5 gap-4",
        )}
        aria-label="Painel de Resumo e Calendário"
      >
        {widgets}
      </aside>

      {/* 2. BOTÃO FLUTUANTE (FAB) E GAVETA LATERAL MOBILE (< xl) */}
      <DashboardMobileDrawer isCompact={isCompact} balance={balance}>
        {widgets}
      </DashboardMobileDrawer>
    </>
  );
}
