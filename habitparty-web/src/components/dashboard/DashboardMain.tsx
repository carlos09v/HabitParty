"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { DashboardDailyBriefing } from "@/components/dashboard/DashboardDailyBriefing";
import { DashboardListSummary } from "@/components/dashboard/DashboardListSummary";
import { DashboardTasksPanel } from "@/components/dashboard/DashboardTasksPanel";
import { RouteLoading } from "@/components/layout/RouteLoading";
import { MAX_COLUMNS_PREMIUM, MAX_VISIBLE_COLUMNS } from "@/constants/routine";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { DashboardMainProps } from "@/types/dashboard";
import type { Task } from "@/types/task";
import { cn, getTodayDateString } from "@/utils";
import {
  getFirstName,
  hasCompletedTaskInTransactionsToday,
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
  const t = useTranslations("dashboard.dailyBriefing");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [columns, setColumns] = useState(initialColumns);
  const [optimisticCompletedTodayIds, setOptimisticCompletedTodayIds] =
    useState<Set<string>>(() => new Set());
  const isSwitchingWorkspace = useWorkspaceStore((s) => s.isSwitchingWorkspace);
  const storeActiveWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const storeUser = useUserStore((s) => s.user);
  const setLastStreakSecuredDate = useUserStore(
    (s) => s.setLastStreakSecuredDate,
  );

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  useEffect(() => {
    if (hasCompletedTaskInTransactionsToday(transactions)) {
      setLastStreakSecuredDate(getTodayDateString());
    }
  }, [transactions, setLastStreakSecuredDate]);

  useEffect(() => {
    const handleFocusTaskCompleted = (event: Event) => {
      const detail = (event as CustomEvent<{ taskId?: string }>).detail;
      if (detail?.taskId) {
        const taskId = detail.taskId;
        setOptimisticCompletedTodayIds((prev) => {
          const next = new Set(prev);
          next.add(taskId);
          return next;
        });
      }
    };

    window.addEventListener(
      "habitparty:task-completed-from-focus",
      handleFocusTaskCompleted,
    );
    return () => {
      window.removeEventListener(
        "habitparty:task-completed-from-focus",
        handleFocusTaskCompleted,
      );
    };
  }, []);

  const handleTaskCompletedTodayChange = (
    taskId: string,
    completedToday: boolean,
  ) => {
    setOptimisticCompletedTodayIds((prev) => {
      const next = new Set(prev);
      if (completedToday) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  };

  useEffect(() => {
    if (
      isSwitchingWorkspace &&
      (!storeActiveWorkspaceId || activeWorkspaceId === storeActiveWorkspaceId)
    ) {
      useWorkspaceStore.setState({ isSwitchingWorkspace: false });
      useProgressStore.getState().done("workspace-switch");
    }
  }, [activeWorkspaceId, storeActiveWorkspaceId, isSwitchingWorkspace]);

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
  const streak =
    storeUser?.id && user?.id && storeUser.id === user.id
      ? (storeUser.currentStreak ?? 0)
      : (user?.currentStreak ?? 0);

  if (isSwitchingWorkspace) {
    return <RouteLoading route="dashboard" />;
  }

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
        hasOptimisticCompletionToday={optimisticCompletedTodayIds.size > 0}
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
        onTaskCompletedTodayChange={handleTaskCompletedTodayChange}
        columns={columns}
        isCompact={isCompact}
      />
    </div>
  );
}
