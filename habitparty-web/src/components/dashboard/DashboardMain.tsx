"use client";

import { useEffect, useState } from "react";
import { DashboardDailyBriefing } from "@/components/dashboard/DashboardDailyBriefing";
import { DashboardListSummary } from "@/components/dashboard/DashboardListSummary";
import { DashboardTasksPanel } from "@/components/dashboard/DashboardTasksPanel";
import { MAX_COLUMNS_PREMIUM, MAX_VISIBLE_COLUMNS } from "@/constants/routine";
import type { DashboardMainProps } from "@/types/dashboard";
import type { Task } from "@/types/task";
import { cn } from "@/utils";
import {
  getFirstName,
  getGreeting,
  getTodayDateString,
  getTodayTasks,
  getTodayXp,
} from "@/utils/dashboardMetrics";

/**
 * Painel Principal do Dashboard.
 * Orquestra o estado otimista compartilhado de `tasks` entre o resumo diário (HUD),
 * os cartões de resumo de listas e a tabela interativa de tarefas.
 */
export function DashboardMain({
  isCompact = false,
  initialTasks = [],
  activeWorkspaceId,
  initialColumns = [],
  transactions = [],
  user = null,
}: DashboardMainProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const isPremium = user?.isPremium ?? false;
  const maxColumns = isPremium ? MAX_COLUMNS_PREMIUM : MAX_VISIBLE_COLUMNS;

  const greeting = getGreeting();
  const firstName = getFirstName(user?.fullName, user?.username);
  const streak = user?.currentStreak ?? 0;

  const todayDateStr = getTodayDateString();
  const todayTasks = getTodayTasks(tasks, todayDateStr);
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
        tasks={tasks}
        transactions={transactions}
      />

      {/* Seção: Resumo de Listas (Interativo com Menu de Contexto e contadores sincronizados) */}
      <DashboardListSummary
        initialColumns={initialColumns}
        maxColumns={maxColumns}
        isCompact={isCompact}
        isPremium={isPremium}
        tasks={tasks}
      />

      {/* Seção: Filtros de Tarefas e Tabela com Paginação */}
      <DashboardTasksPanel
        key={activeWorkspaceId}
        initialTasks={initialTasks}
        tasks={tasks}
        onTasksChange={setTasks}
        columns={initialColumns}
        isCompact={isCompact}
      />
    </main>
  );
}
