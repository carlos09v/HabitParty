import {
  DashboardMobileDrawer,
  DashboardWidgetsList,
} from "@/components/dashboard/sidebar-right";
import type { EconomyBarData } from "@/types/dashboard";
import type { FocusActivity, FocusRecord } from "@/types/focus";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import type { Task } from "@/types/task";
import { cn } from "@/utils";

export interface DashboardSidebarRightProps {
  isCompact?: boolean;
  balance?: number;
  weeklyEarnings?: number;
  weeklySpent?: number;
  bars?: EconomyBarData[];
  transactions?: TransactionHistoryResponseDTO[];
  tasks?: Task[];
  activities?: FocusActivity[];
  records?: FocusRecord[];
}

/**
 * Painel Lateral Direito do Dashboard com widgets de resumo e histórico.
 * React Server Component:
 * Em telas xl+ (desktop grande), exibe a sidebar estática fixa no servidor.
 * Em telas < xl (tablets e mobile), delega o botão flutuante e a gaveta para o
 * leaf client component DashboardMobileDrawer.
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
  const widgetProps = {
    isCompact,
    balance,
    weeklyEarnings,
    weeklySpent,
    bars,
    transactions,
    tasks,
    activities,
    records,
  };

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
        <DashboardWidgetsList {...widgetProps} />
      </aside>

      {/* 2. BOTÃO FLUTUANTE (FAB) E GAVETA LATERAL MOBILE (< xl) */}
      <DashboardMobileDrawer {...widgetProps} />
    </>
  );
}
