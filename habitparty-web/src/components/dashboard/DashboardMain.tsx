import type { components } from "@/api/schema";
import { DashboardDailyBriefing } from "@/components/dashboard/DashboardDailyBriefing";
import { DashboardListSummary } from "@/components/dashboard/DashboardListSummary";
import { DashboardTasksPanel } from "@/components/dashboard/DashboardTasksPanel";
import { MAX_COLUMNS_PREMIUM, MAX_VISIBLE_COLUMNS } from "@/constants/routine";
import type { TransactionHistoryResponseDTO } from "@/types/history";
import type { Task } from "@/types/task";
import type { UserResponseDTO } from "@/types/user";
import { cn } from "@/utils";
import {
  getFirstName,
  getGreeting,
  getTodayDateString,
  getTodayTasks,
  getTodayXp,
} from "@/utils/dashboardMetrics";

type Column = components["schemas"]["BoardColumnSummaryDTO"];

interface DashboardMainProps {
  isCompact?: boolean;
  initialTasks?: Task[];
  activeWorkspaceId?: string;
  initialColumns?: Column[];
  transactions?: TransactionHistoryResponseDTO[];
  user?: UserResponseDTO | null;
}

/**
 * Painel Principal do Dashboard (React Server Component).
 * Renderiza o cabeçalho com briefing diário, métricas de resumo e carrossel de listas no servidor.
 * Mantém o DashboardTasksPanel como folha interativa (Client Component).
 */
export function DashboardMain({
  isCompact = false,
  initialTasks = [],
  activeWorkspaceId,
  initialColumns = [],
  transactions = [],
  user = null,
}: DashboardMainProps) {
  const isPremium = user?.isPremium ?? false;
  const maxColumns = isPremium ? MAX_COLUMNS_PREMIUM : MAX_VISIBLE_COLUMNS;

  // Métricas do Dashboard calculadas via utilitário puro no servidor
  const greeting = getGreeting();
  const firstName = getFirstName(user?.fullName, user?.username);
  const streak = user?.currentStreak ?? 0;

  const todayDateStr = getTodayDateString();
  const todayTasks = getTodayTasks(initialTasks, todayDateStr);
  const completedTodayTasks = todayTasks.filter((t) => t.completed).length;
  const totalTodayTasks = todayTasks.length;
  const todayXp = getTodayXp(transactions);

  return (
    <main
      className={cn(
        "flex-1 min-w-0 flex flex-col overflow-y-auto custom-scrollbar transition-[padding,gap] duration-200",
        isCompact ? "p-4 sm:p-5 gap-5" : "p-6 gap-8",
      )}
    >
      {/* Resumo Diário do Jogador (HUD com Metas e Indicadores Chave) */}
      <DashboardDailyBriefing
        greeting={greeting}
        firstName={firstName}
        streak={streak}
        completedTodayTasks={completedTodayTasks}
        totalTodayTasks={totalTodayTasks}
        todayXp={todayXp}
      />

      {/* Seção: Resumo de Listas (Client Component Interativo com Menu de Contexto) */}
      <DashboardListSummary
        initialColumns={initialColumns}
        maxColumns={maxColumns}
        isCompact={isCompact}
        isPremium={isPremium}
      />

      {/* Seção: Filtros de Tarefas e Tabela com Paginação (Client Component) */}
      <DashboardTasksPanel
        key={activeWorkspaceId}
        initialTasks={initialTasks}
        columns={initialColumns}
        isCompact={isCompact}
      />
    </main>
  );
}
