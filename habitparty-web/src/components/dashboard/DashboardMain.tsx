"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DashboardDailyBriefing } from "@/components/dashboard/DashboardDailyBriefing";
import { DashboardListSummary } from "@/components/dashboard/DashboardListSummary";
import { DashboardTasksPanel } from "@/components/dashboard/DashboardTasksPanel";
import { MAX_COLUMNS_PREMIUM, MAX_VISIBLE_COLUMNS } from "@/constants/routine";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { DashboardMainProps } from "@/types/dashboard";
import type { Task } from "@/types/task";
import { cn } from "@/utils";
import { getFirstName } from "@/utils/dashboardMetrics";

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
  const t = useTranslations("dashboard.dailyBriefing");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [columns, setColumns] = useState(initialColumns);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  const handleColumnDeleted = (deletedColumnId: string) => {
    setTasks((prev) =>
      prev.filter((task) => task.columnId !== deletedColumnId),
    );
  };

  const isPremium = user?.isPremium ?? false;
  const maxColumns = isPremium ? MAX_COLUMNS_PREMIUM : MAX_VISIBLE_COLUMNS;
  const { isGamified } = useExperienceMode();

  const defaultName = isGamified
    ? t("defaultNameGamified")
    : t("defaultNameProductivity");
  const firstName = getFirstName(user?.fullName, user?.username, defaultName);
  const streak = user?.currentStreak ?? 0;

  return (
    <div
      className={cn(
        "flex-1 min-w-0 flex flex-col overflow-y-auto custom-scrollbar transition-[padding,gap] duration-200",
        isCompact ? "p-4 sm:p-5 gap-5" : "p-6 gap-8",
      )}
    >
      {/* Resumo Diário do Jogador (HUD com Metas e Indicadores Chave) */}
      <DashboardDailyBriefing
        firstName={firstName}
        streak={streak}
        tasks={tasks}
        transactions={transactions}
      />

      {/* Seção: Resumo de Listas (Interativo com Menu de Contexto e contadores sincronizados) */}
      <DashboardListSummary
        initialColumns={initialColumns}
        columns={columns}
        onColumnsChange={setColumns}
        onColumnDeleted={handleColumnDeleted}
        maxColumns={maxColumns}
        activeWorkspaceId={activeWorkspaceId}
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
        columns={columns}
        isCompact={isCompact}
      />
    </div>
  );
}
