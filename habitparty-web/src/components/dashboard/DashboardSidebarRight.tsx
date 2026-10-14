import {
  ActivitiesWidget,
  EconomyWidget,
  PartyWidget,
  WeeklyCalendar,
} from "@/components/dashboard/sidebar-right";
import type { EconomyBarData } from "@/types/dashboard";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import type { Task } from "@/types/task";
import { cn } from "@/utils";

interface DashboardSidebarRightProps {
  isCompact?: boolean;
  balance?: number;
  weeklyEarnings?: number;
  bars?: EconomyBarData[];
  transactions?: TransactionHistoryResponseDTO[];
  tasks?: Task[];
}

/**
 * Painel Lateral Direito do Dashboard com widgets de resumo e histórico.
 * Server Component: orquestra os widgets no servidor e empurra interatividade apenas para os widgets necessários.
 */
export function DashboardSidebarRight({
  isCompact = false,
  balance = 0,
  weeklyEarnings = 0,
  bars,
  transactions = [],
  tasks = [],
}: DashboardSidebarRightProps) {
  return (
    <aside
      className={cn(
        "shrink-0 bg-primary-dark/20 border-l border-primary/30 backdrop-blur-md h-screen flex flex-col overflow-hidden transition-all duration-200",
        isCompact ? "w-[300px] px-4 py-4 gap-3" : "w-[345px] px-5 py-5 gap-4",
      )}
    >
      <WeeklyCalendar
        isCompact={isCompact}
        transactions={transactions}
        tasks={tasks}
      />
      <div className="h-px w-full bg-white/10" />
      <ActivitiesWidget isCompact={isCompact} />
      <div className="h-px w-full bg-white/10" />
      <EconomyWidget
        balance={balance}
        weeklyEarnings={weeklyEarnings}
        bars={bars}
        isCompact={isCompact}
      />
      <div className="h-px w-full bg-white/10" />
      <PartyWidget isCompact={isCompact} />
    </aside>
  );
}
