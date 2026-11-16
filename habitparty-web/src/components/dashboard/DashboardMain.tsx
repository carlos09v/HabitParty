"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { DashboardDailyBriefing } from "@/components/dashboard/DashboardDailyBriefing";
import { DashboardListSummary } from "@/components/dashboard/DashboardListSummary";
import { DashboardTasksPanel } from "@/components/dashboard/DashboardTasksPanel";
import { RouteLoading } from "@/components/layout/RouteLoading";
import { MAX_COLUMNS_PREMIUM, MAX_VISIBLE_COLUMNS } from "@/constants/routine";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import {
  applyFocusCompletionToTask,
  applyFocusRecordedToTask,
  useFocusTaskSync,
} from "@/hooks/useFocusTaskSync";
import { useMidnightRollover } from "@/hooks/useMidnightRollover";
import { useSyncWorkspaceSwitchReset } from "@/hooks/useSyncWorkspaceSwitchReset";
import { useUserStore } from "@/store/userStore";
import type {
  DashboardColumnOption,
  DashboardMainProps,
} from "@/types/dashboard";
import type { Task } from "@/types/task";
import { cn, getTodayDateString } from "@/utils";
import {
  getFirstName,
  hasCompletedTaskInTransactionsToday,
} from "@/utils/dashboardMetrics";
import {
  buildReadOnlySets,
  isTaskInReadOnlyScope,
  resetTaskOnMidnightRollover,
} from "@/utils/taskMapper";

/**
 * Painel Principal do Dashboard.
 * Orquestra o estado otimista compartilhado de `tasks` entre o resumo diário (HUD),
 * os cartões de resumo de listas e a tabela interativa de tarefas.
 */
export function DashboardMain({
  isCompact = false,
  initialTasks = [],
  workspaces = [],
  activeWorkspaceId,
  initialColumns = [],
  initialAllColumns = [],
  initialVisibleColumnIds,
  transactions = [],
  user = null,
}: DashboardMainProps) {
  const t = useTranslations("dashboard.dailyBriefing");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [columns, setColumns] = useState(initialColumns);
  const isSwitchingWorkspace = useSyncWorkspaceSwitchReset(activeWorkspaceId);
  const storeUser = useUserStore((s) => s.user);
  const setLastStreakSecuredDate = useUserStore(
    (s) => s.setLastStreakSecuredDate,
  );
  const userTimezone =
    storeUser?.id && user?.id && storeUser.id === user.id
      ? (storeUser.timezone ?? user?.timezone)
      : (user?.timezone ?? storeUser?.timezone);

  useMidnightRollover(userTimezone, () => {
    setTasks((prev) => prev.map(resetTaskOnMidnightRollover));
  });

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  useEffect(() => {
    if (
      hasCompletedTaskInTransactionsToday(
        transactions,
        new Date(),
        userTimezone,
      )
    ) {
      setLastStreakSecuredDate(getTodayDateString(new Date(), userTimezone));
    }
  }, [transactions, setLastStreakSecuredDate, userTimezone]);

  useFocusTaskSync({
    onFocusRecorded: (taskId, durationMinutes, cycles) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? applyFocusRecordedToTask(task, durationMinutes, cycles)
            : task,
        ),
      );
    },
    onTaskCompleted: (taskId) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? applyFocusCompletionToTask(task, userTimezone)
            : task,
        ),
      );
    },
  });

  const handleColumnDeleted = (deletedColumnId: string) => {
    setTasks((prev) =>
      prev.filter((task) => task.columnId !== deletedColumnId),
    );
  };

  const [createColumnTrigger, setCreateColumnTrigger] = useState(0);
  const [otherColumns, setOtherColumns] = useState<DashboardColumnOption[]>(
    () =>
      initialAllColumns.filter((col) => col.workspaceId !== activeWorkspaceId),
  );

  useEffect(() => {
    setOtherColumns(
      initialAllColumns.filter((col) => col.workspaceId !== activeWorkspaceId),
    );
  }, [initialAllColumns, activeWorkspaceId]);

  const handleColumnMoved = (
    columnId: string,
    targetWorkspaceId: string,
    targetWorkspaceName: string,
  ) => {
    const movedColumn = columns.find((col) => col.id === columnId);
    const targetIsReadOnly = Boolean(
      workspaces.find((ws) => ws.id === targetWorkspaceId)?.isReadOnly,
    );

    if (movedColumn) {
      setOtherColumns((prev) => [
        ...prev.filter((col) => col.id !== columnId),
        {
          ...movedColumn,
          workspaceId: targetWorkspaceId,
          workspaceName: targetWorkspaceName,
          isReadOnly: targetIsReadOnly,
        },
      ]);
    }

    setTasks((prev) =>
      prev.map((task) =>
        task.columnId === columnId
          ? {
              ...task,
              workspaceId: targetWorkspaceId,
              workspaceName: targetWorkspaceName,
            }
          : task,
      ),
    );
  };

  const isPremium = user?.isPremium ?? false;
  const maxColumns = isPremium ? MAX_COLUMNS_PREMIUM : MAX_VISIBLE_COLUMNS;
  const { isGamified } = useExperienceMode();

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId),
    [workspaces, activeWorkspaceId],
  );
  const activeWorkspaceName = activeWorkspace?.name ?? "";
  const isActiveWorkspaceReadOnly = Boolean(activeWorkspace?.isReadOnly);

  const allColumns = useMemo<DashboardColumnOption[]>(() => {
    const enrichedActive: DashboardColumnOption[] = columns.map((col) => ({
      ...col,
      workspaceId: activeWorkspaceId,
      workspaceName: activeWorkspaceName,
      isReadOnly: col.isReadOnly ?? isActiveWorkspaceReadOnly,
    }));
    return [...enrichedActive, ...otherColumns];
  }, [
    columns,
    otherColumns,
    activeWorkspaceId,
    activeWorkspaceName,
    isActiveWorkspaceReadOnly,
  ]);

  const defaultWritableColumnId = useMemo(
    () =>
      allColumns.find((col) => !col.isReadOnly && col.id)?.id || columns[0]?.id,
    [allColumns, columns],
  );

  // Exclui tarefas de workspaces excedentes (somente leitura no plano Free) da Meta de Hoje
  const { readOnlyWorkspaceIds, readOnlyColumnIds } = useMemo(
    () => buildReadOnlySets(workspaces, allColumns),
    [workspaces, allColumns],
  );

  const briefingTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          !isTaskInReadOnlyScope(task, readOnlyWorkspaceIds, readOnlyColumnIds),
      ),
    [tasks, readOnlyWorkspaceIds, readOnlyColumnIds],
  );

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
        "@container flex-1 min-w-0 flex flex-col overflow-y-auto custom-scrollbar transition-[padding,gap] duration-200",
        isCompact
          ? "p-3 sm:p-4 pb-24 xl:pb-4 gap-3.5 sm:gap-4"
          : "p-3.5 sm:p-4 md:p-5 pb-24 xl:pb-5 gap-4 sm:gap-5",
      )}
    >
      {/* Resumo Diário do Jogador (HUD com Metas e Indicadores Chave) */}
      <DashboardDailyBriefing
        firstName={firstName}
        streak={streak}
        tasks={briefingTasks}
        transactions={transactions}
        timezone={userTimezone}
      />

      {/* Seção: Resumo de Listas (Interativo com Menu de Contexto e contadores sincronizados) */}
      <DashboardListSummary
        initialColumns={initialColumns}
        initialVisibleColumnIds={initialVisibleColumnIds}
        columns={columns}
        onColumnsChange={setColumns}
        onColumnDeleted={handleColumnDeleted}
        workspaces={workspaces}
        onColumnMoved={handleColumnMoved}
        createColumnTrigger={createColumnTrigger}
        maxColumns={maxColumns}
        activeWorkspaceId={activeWorkspaceId}
        activeWorkspaceName={
          workspaces.length > 1 ? activeWorkspaceName : undefined
        }
        isReadOnly={isActiveWorkspaceReadOnly}
        isCompact={isCompact}
        isPremium={isPremium}
        tasks={tasks}
      />

      {/* Seção: Filtros de Tarefas e Tabela com Paginação */}
      <DashboardTasksPanel
        initialTasks={initialTasks}
        tasks={tasks}
        onTasksChange={setTasks}
        columns={allColumns}
        workspaces={workspaces}
        hasColumns={columns.length > 0}
        onCreateFirstColumn={() => setCreateColumnTrigger((n) => n + 1)}
        defaultColumnId={defaultWritableColumnId}
        isReadOnly={isActiveWorkspaceReadOnly}
        isCompact={isCompact}
      />
    </div>
  );
}
