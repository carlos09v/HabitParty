"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DashboardDailyBriefing } from "@/components/dashboard/DashboardDailyBriefing";
import { DashboardListSummary } from "@/components/dashboard/DashboardListSummary";
import { DashboardTasksPanel } from "@/components/dashboard/DashboardTasksPanel";
import { MAX_COLUMNS_PREMIUM, MAX_VISIBLE_COLUMNS } from "@/constants/routine";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useMergedOptimisticTransactions } from "@/hooks/useMergedOptimisticTransactions";
import { useMidnightRollover } from "@/hooks/useMidnightRollover";
import { useSyncWorkspaceSwitchReset } from "@/hooks/useSyncWorkspaceSwitchReset";
import { useDashboardFilterStore } from "@/store/dashboardFilterStore";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { useOptimisticDashboardStore } from "@/store/optimisticDashboardStore";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type {
  DashboardColumnOption,
  DashboardFocusRecordSummary,
  DashboardMainProps,
  DashboardTransactionSummary,
  DashboardWorkspaceOption,
} from "@/types/dashboard";
import type { Task } from "@/types/task";
import { getTodayDateString } from "@/utils";
import {
  getFirstName,
  hasCompletedTaskInTransactionsToday,
} from "@/utils/dashboardMetrics";
import { scrollToDashboardTasksPanel } from "@/utils/dashboardScroll";
import {
  buildReadOnlySets,
  isTaskInReadOnlyScope,
  resetTaskOnMidnightRollover,
} from "@/utils/taskMapper";
import { setActiveWorkspaceCookie } from "@/utils/urlParams";

const EMPTY_TASKS: Task[] = [];
const EMPTY_WORKSPACES: DashboardWorkspaceOption[] = [];
const EMPTY_COLUMNS: DashboardColumnOption[] = [];
const EMPTY_TRANSACTIONS: DashboardTransactionSummary[] = [];
const EMPTY_FOCUS_RECORDS: DashboardFocusRecordSummary[] = [];

/**
 * Painel Principal do Dashboard (Escopo Global Multi-Ambiente).
 * - Trocar workspace no WorkspaceSwitcher atualiza instantaneamente `DashboardListSummary`
 *   em 0ms a partir de `allColumnsState` em memória (sem RouteLoading em tela cheia).
 * - Computa `readOnlySets` uma única vez e compartilha com Briefing, TasksPanel e TaskTable.
 */
export function DashboardMain({
  initialTasks = EMPTY_TASKS,
  workspaces = EMPTY_WORKSPACES,
  activeWorkspaceId,
  initialAllColumns = EMPTY_COLUMNS,
  initialVisibleColumnIds,
  transactions = EMPTY_TRANSACTIONS,
  focusRecords = EMPTY_FOCUS_RECORDS,
  user = null,
}: DashboardMainProps) {
  const t = useTranslations("dashboard.dailyBriefing");
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [allColumnsState, setAllColumnsState] =
    useState<DashboardColumnOption[]>(initialAllColumns);

  const searchParams = useSearchParams();
  const urlWorkspaceId = searchParams.get("workspaceId") || undefined;
  const storeActiveWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const [syncedUrlWorkspaceId, setSyncedUrlWorkspaceId] = useState<
    string | undefined
  >(undefined);

  const validUrlWorkspaceId = useMemo(
    () =>
      urlWorkspaceId && workspaces.some((w) => w.id === urlWorkspaceId)
        ? urlWorkspaceId
        : undefined,
    [urlWorkspaceId, workspaces],
  );

  const validServerWorkspaceId = useMemo(
    () =>
      activeWorkspaceId && workspaces.some((w) => w.id === activeWorkspaceId)
        ? activeWorkspaceId
        : undefined,
    [activeWorkspaceId, workspaces],
  );

  const validStoreWorkspaceId = useMemo(
    () =>
      storeActiveWorkspaceId &&
      workspaces.some((w) => w.id === storeActiveWorkspaceId)
        ? storeActiveWorkspaceId
        : undefined,
    [storeActiveWorkspaceId, workspaces],
  );

  const effectiveWorkspaceId = useMemo(() => {
    if (validUrlWorkspaceId && syncedUrlWorkspaceId !== validUrlWorkspaceId) {
      return validUrlWorkspaceId;
    }
    if (validStoreWorkspaceId) {
      return validStoreWorkspaceId;
    }
    return validUrlWorkspaceId ?? validServerWorkspaceId ?? activeWorkspaceId;
  }, [
    validUrlWorkspaceId,
    syncedUrlWorkspaceId,
    validStoreWorkspaceId,
    validServerWorkspaceId,
    activeWorkspaceId,
  ]);

  // Mantém limpeza de isSwitchingWorkspace usando o workspace efetivo (evita spinner travado ao trocar no Dashboard)
  useSyncWorkspaceSwitchReset(effectiveWorkspaceId);

  useEffect(() => {
    // Somente `?workspaceId=` explícito na URL pode sobrescrever um ambiente já válido na store;
    // impede que um payload RSC cacheado antigo (sem query param) reverta a escolha do usuário.
    if (validUrlWorkspaceId && syncedUrlWorkspaceId !== validUrlWorkspaceId) {
      setSyncedUrlWorkspaceId(validUrlWorkspaceId);
      if (
        useWorkspaceStore.getState().activeWorkspaceId !== validUrlWorkspaceId
      ) {
        useWorkspaceStore.getState().setActiveWorkspaceId(validUrlWorkspaceId);
      }
      setActiveWorkspaceCookie(validUrlWorkspaceId);
      return;
    }

    if (!validStoreWorkspaceId && validServerWorkspaceId) {
      if (
        useWorkspaceStore.getState().activeWorkspaceId !==
        validServerWorkspaceId
      ) {
        useWorkspaceStore
          .getState()
          .setActiveWorkspaceId(validServerWorkspaceId);
      }
    }
  }, [
    validUrlWorkspaceId,
    syncedUrlWorkspaceId,
    validStoreWorkspaceId,
    validServerWorkspaceId,
  ]);

  const storeUserId = useUserStore((s) => s.user?.id);
  const storeUserTimezone = useUserStore((s) => s.user?.timezone);
  const syncTodayStreakMetrics = useUserStore((s) => s.syncTodayStreakMetrics);
  const userTimezone =
    storeUserId && user?.id && storeUserId === user.id
      ? (storeUserTimezone ?? user?.timezone)
      : (user?.timezone ?? storeUserTimezone);

  useMidnightRollover(userTimezone, () => {
    setTasks((prev) =>
      prev.map((task) => resetTaskOnMidnightRollover(task, userTimezone)),
    );
  });

  useEffect(() => {
    setTasks((prev) => {
      const optState = useOptimisticDashboardStore.getState();
      if (optState.inFlightTaskIds.length === 0) {
        return initialTasks;
      }
      const inFlightSet = new Set(optState.inFlightTaskIds);
      const deletedSet = new Set(optState.deletedTaskIds);
      const prevById = new Map(prev.map((item) => [item.id, item]));
      return initialTasks
        .filter(
          (item) => !(inFlightSet.has(item.id) && deletedSet.has(item.id)),
        )
        .map((item) =>
          inFlightSet.has(item.id) ? (prevById.get(item.id) ?? item) : item,
        );
    });
  }, [initialTasks]);

  useEffect(() => {
    setAllColumnsState(initialAllColumns);
  }, [initialAllColumns]);

  const streakRevertedDate = useOptimisticDashboardStore(
    (s) => s.streakRevertedDate,
  );
  const clearOptimisticDashboard = useOptimisticDashboardStore((s) => s.clear);

  // Limpa transações/deltas otimistas já sincronizados sem apagar mutações ainda em voo ou estorno recente
  useIsomorphicLayoutEffect(() => {
    const optState = useOptimisticDashboardStore.getState();
    const todayIso = getTodayDateString(new Date(), userTimezone);
    const serverStillShowsTodayCompletion =
      optState.streakRevertedDate === todayIso &&
      hasCompletedTaskInTransactionsToday(
        transactions,
        new Date(),
        userTimezone,
      );
    clearOptimisticDashboard({
      preserveInFlight: true,
      preserveStreakReverted: serverStillShowsTodayCompletion,
    });
  }, [transactions, userTimezone, clearOptimisticDashboard]);

  useEffect(() => {
    return () => {
      clearOptimisticDashboard();
    };
  }, [clearOptimisticDashboard]);

  const mergedTransactions = useMergedOptimisticTransactions(transactions);

  useEffect(() => {
    const todayIso = getTodayDateString(new Date(), userTimezone);
    if (streakRevertedDate === todayIso) return;
    if (
      hasCompletedTaskInTransactionsToday(
        mergedTransactions,
        new Date(),
        userTimezone,
      )
    ) {
      const userState = useUserStore.getState();
      const todayFocusMinutes =
        userState.todayMetricsDate === todayIso
          ? userState.todayFocusMinutes
          : 0;
      syncTodayStreakMetrics(todayIso, true, todayFocusMinutes);
    }
  }, [
    mergedTransactions,
    syncTodayStreakMetrics,
    streakRevertedDate,
    userTimezone,
  ]);

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === effectiveWorkspaceId),
    [workspaces, effectiveWorkspaceId],
  );
  const activeWorkspaceName = activeWorkspace?.name ?? "";
  const isActiveWorkspaceReadOnly = Boolean(activeWorkspace?.isReadOnly);

  const activeWorkspaceColumns = useMemo(
    () =>
      allColumnsState.filter((col) => col.workspaceId === effectiveWorkspaceId),
    [allColumnsState, effectiveWorkspaceId],
  );

  const setActiveWorkspaceColumns: React.Dispatch<
    React.SetStateAction<DashboardColumnOption[]>
  > = useCallback(
    (updater) => {
      setAllColumnsState((prevAll) => {
        const currentActive = prevAll.filter(
          (col) => col.workspaceId === effectiveWorkspaceId,
        );
        const nextActive =
          typeof updater === "function" ? updater(currentActive) : updater;
        const normalizedActive = nextActive.map((col) => ({
          ...col,
          workspaceId: col.workspaceId ?? effectiveWorkspaceId,
          workspaceName: col.workspaceName ?? activeWorkspaceName,
          isReadOnly: col.isReadOnly ?? isActiveWorkspaceReadOnly,
        }));
        const others = prevAll.filter(
          (col) => col.workspaceId !== effectiveWorkspaceId,
        );
        return [...normalizedActive, ...others];
      });
    },
    [effectiveWorkspaceId, activeWorkspaceName, isActiveWorkspaceReadOnly],
  );

  const activeFilteredColumnId = useDashboardFilterStore(
    (s) => s.advancedFilters.columnId,
  );
  const setAdvancedFilters = useDashboardFilterStore(
    (s) => s.setAdvancedFilters,
  );

  const handleColumnDeleted = useCallback(
    (deletedColumnId: string) => {
      setTasks((prev) => {
        const focusStore = useFocusTimerStore.getState();
        for (const task of prev) {
          if (task.columnId === deletedColumnId) {
            focusStore.handleExternalTaskRemovedOrCompleted(task.id);
          }
        }
        return prev.filter((task) => task.columnId !== deletedColumnId);
      });
      setAdvancedFilters((prev) =>
        prev.columnId === deletedColumnId ? { ...prev, columnId: "all" } : prev,
      );
    },
    [setAdvancedFilters],
  );

  const [createColumnTrigger, setCreateColumnTrigger] = useState(0);
  const [createTaskTrigger, setCreateTaskTrigger] = useState(0);

  const handleColumnMoved = useCallback(
    (
      columnId: string,
      targetWorkspaceId: string,
      targetWorkspaceName: string,
    ) => {
      const targetIsReadOnly = Boolean(
        workspaces.find((ws) => ws.id === targetWorkspaceId)?.isReadOnly,
      );

      setAllColumnsState((prev) =>
        prev.map((col) =>
          col.id === columnId
            ? {
                ...col,
                workspaceId: targetWorkspaceId,
                workspaceName: targetWorkspaceName,
                isReadOnly: targetIsReadOnly,
              }
            : col,
        ),
      );

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
    },
    [workspaces],
  );

  const columnFilterOriginWorkspaceRef = useRef<{
    columnId: string;
    previousWorkspaceId: string;
    appliedWorkspaceId: string;
  } | null>(null);

  const handleFilterByColumn = useCallback(
    (columnId: string, workspaceId?: string) => {
      setAdvancedFilters((prev) => {
        const isSame = prev.columnId === columnId;
        if (isSame) {
          const origin = columnFilterOriginWorkspaceRef.current;
          const shouldRestoreWorkspace =
            origin !== null &&
            origin.columnId === columnId &&
            prev.workspaceId === origin.appliedWorkspaceId;
          columnFilterOriginWorkspaceRef.current = null;
          return {
            ...prev,
            workspaceId: shouldRestoreWorkspace
              ? origin.previousWorkspaceId
              : prev.workspaceId,
            columnId: "all",
          };
        }

        const nextWorkspaceId = workspaceId || prev.workspaceId;
        if (workspaceId && workspaceId !== prev.workspaceId) {
          columnFilterOriginWorkspaceRef.current = {
            columnId,
            previousWorkspaceId: prev.workspaceId,
            appliedWorkspaceId: nextWorkspaceId,
          };
        } else {
          columnFilterOriginWorkspaceRef.current = null;
        }
        return {
          ...prev,
          workspaceId: nextWorkspaceId,
          columnId,
        };
      });
      scrollToDashboardTasksPanel();
    },
    [setAdvancedFilters],
  );

  const isPremium = user?.isPremium ?? false;
  const maxColumns = isPremium ? MAX_COLUMNS_PREMIUM : MAX_VISIBLE_COLUMNS;
  const { isGamified } = useExperienceMode();

  // Computa conjuntos read-only UMA ÚNICA VEZ e propaga para Briefing, TasksPanel e TaskTable
  const { readOnlyWorkspaceIds, readOnlyColumnIds } = useMemo(
    () => buildReadOnlySets(workspaces, allColumnsState),
    [workspaces, allColumnsState],
  );

  const defaultWritableColumnId = useMemo(
    () =>
      activeWorkspaceColumns.find((col) => !col.isReadOnly && col.id)?.id ||
      allColumnsState.find((col) => !col.isReadOnly && col.id)?.id ||
      activeWorkspaceColumns[0]?.id,
    [activeWorkspaceColumns, allColumnsState],
  );

  const hasWritableColumns = useMemo(
    () =>
      allColumnsState.some((col) => col.id && !readOnlyColumnIds.has(col.id)),
    [allColumnsState, readOnlyColumnIds],
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

  return (
    <div className="@container flex-1 min-w-0 flex flex-col overflow-y-auto custom-scrollbar transition-[padding,gap] duration-200 p-3.5 sm:p-4 md:p-5 pb-24 xl:pb-5 gap-4 sm:gap-5">
      {/* Resumo Diário do Jogador (HUD com Metas, Foco Hoje e Ações Rápidas) */}
      <DashboardDailyBriefing
        userId={user?.id}
        firstName={firstName}
        streak={user?.currentStreak ?? 0}
        tasks={briefingTasks}
        transactions={mergedTransactions}
        focusRecords={focusRecords}
        timezone={userTimezone}
        dailyFocusGoalMinutes={user?.dailyFocusGoalMinutes ?? null}
        userXp={user?.totalXp ?? 0}
        userCoins={user?.currentCoins ?? 0}
        onQuickCreateTask={() => setCreateTaskTrigger((n) => n + 1)}
        canQuickCreateTask={hasWritableColumns}
      />

      {/* Seção: Resumo de Listas (atualiza instantaneamente ao trocar workspace) */}
      <DashboardListSummary
        initialVisibleColumnIds={
          effectiveWorkspaceId === activeWorkspaceId
            ? initialVisibleColumnIds
            : undefined
        }
        columns={activeWorkspaceColumns}
        onColumnsChange={setActiveWorkspaceColumns}
        onColumnDeleted={handleColumnDeleted}
        workspaces={workspaces}
        onColumnMoved={handleColumnMoved}
        onFilterByColumn={handleFilterByColumn}
        activeFilteredColumnId={
          activeFilteredColumnId !== "all" ? activeFilteredColumnId : undefined
        }
        createColumnTrigger={createColumnTrigger}
        maxColumns={maxColumns}
        activeWorkspaceId={effectiveWorkspaceId}
        activeWorkspaceName={
          workspaces.length > 1 ? activeWorkspaceName : undefined
        }
        isReadOnly={isActiveWorkspaceReadOnly}
        isPremium={isPremium}
        tasks={tasks}
      />

      {/* Seção: Filtros de Tarefas e Tabela com Paginação */}
      <DashboardTasksPanel
        tasks={tasks}
        onTasksChange={setTasks}
        columns={allColumnsState}
        workspaces={workspaces}
        activeWorkspaceId={effectiveWorkspaceId}
        hasColumns={allColumnsState.length > 0}
        onCreateFirstColumn={() => setCreateColumnTrigger((n) => n + 1)}
        createTaskTrigger={createTaskTrigger}
        defaultColumnId={defaultWritableColumnId}
        isReadOnly={isActiveWorkspaceReadOnly}
        readOnlyWorkspaceIds={readOnlyWorkspaceIds}
        readOnlyColumnIds={readOnlyColumnIds}
        timeZone={userTimezone}
      />
    </div>
  );
}
