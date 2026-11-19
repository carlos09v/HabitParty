import { getTranslations } from "next-intl/server";
import {
  DashboardMobileDrawer,
  DashboardWidgetsList,
} from "@/components/dashboard/sidebar-right";
import type { DashboardSidebarRightProps } from "@/types/dashboard";

/**
 * Painel Lateral Direito do Dashboard com widgets de resumo e histórico.
 * React Server Component:
 * Em telas xl+ (desktop grande), exibe a sidebar estática fixa no servidor.
 * Em telas < xl (tablets e mobile), passa a árvore de widgets como `children` para o
 * leaf client component DashboardMobileDrawer, evitando duplicar props na hidratação.
 */
export async function DashboardSidebarRight({
  experienceMode = "PRODUCTIVITY",
  balance = 0,
  weeklyEarnings = 0,
  weeklySpent = 0,
  bars,
  transactions = [],
  tasks = [],
  activities = [],
  records = [],
}: DashboardSidebarRightProps) {
  const t = await getTranslations("dashboard.sidebarRight");
  const widgets = (
    <DashboardWidgetsList
      experienceMode={experienceMode}
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
        data-panel="sidebar-right"
        className="hidden xl:flex shrink-0 bg-background dark:bg-primary-dark/25 border-l border-neutral-700 dark:border-primary/30 h-full flex-col overflow-y-auto custom-scrollbar z-20 w-[345px] px-5 py-5 gap-4"
        aria-label={t("asideAriaLabel")}
      >
        {widgets}
      </aside>

      {/* 2. BOTÃO FLUTUANTE (FAB) E GAVETA LATERAL MOBILE (< xl) */}
      <DashboardMobileDrawer balance={balance}>{widgets}</DashboardMobileDrawer>
    </>
  );
}
