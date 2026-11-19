"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getArchivedCompletedColumnTasks } from "@/actions/taskActions";
import { RouteLoading } from "@/components/layout/RouteLoading";
import { TasksBoardViewport } from "@/components/tasks/TasksBoardViewport";
import { WorkspaceReadOnlyBanner } from "@/components/tasks/WorkspaceReadOnlyBanner";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { WELCOME_CARD_DETAILS } from "@/constants/welcomeCards";
import { useBoardFilters } from "@/hooks/useBoardFilters";
import { useBoardModals } from "@/hooks/useBoardModals";
import { useBoardTaskActions } from "@/hooks/useBoardTaskActions";
import { useMidnightRollover } from "@/hooks/useMidnightRollover";
import { useQuickFocusTask } from "@/hooks/useQuickFocusTask";
import { useRoutineBoardDnd } from "@/hooks/useRoutineBoardDnd";
import { useRoutineBoardLayout } from "@/hooks/useRoutineBoardLayout";
import { useRoutineColumns } from "@/hooks/useRoutineColumns";
import { useSyncWorkspaceSwitchReset } from "@/hooks/useSyncWorkspaceSwitchReset";
import { useTaskDeleteFlow } from "@/hooks/useTaskDeleteFlow";
import { useTasksWelcomeStats } from "@/hooks/useTasksWelcomeStats";
import { useViewMode } from "@/hooks/useViewMode";
import { useWorkspaceWriteGuard } from "@/hooks/useWorkspaceWriteGuard";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { CreateTaskDTO, Task, TaskTypeOption } from "@/types/task";
import type {
  InitialTaskFormData,
  TasksBoardContainerProps,
} from "@/types/task-ui";
import {
  mapTaskResponseToTask,
  resetTaskOnMidnightRollover,
} from "@/utils/taskMapper";

const TasksBoardModals = dynamic(
  () =>
    import("@/components/tasks/TasksBoardModals").then((mod) => ({
      default: mod.TasksBoardModals,
    })),
  { ssr: false },
);

const UpgradePremiumModal = dynamic(
  () =>
    import("@/components/subscription/UpgradePremiumModal").then((mod) => ({
      default: mod.UpgradePremiumModal,
    })),
  { ssr: false },
);

const SwitchFocusTargetModal = dynamic(
  () =>
    import("@/components/focus/modals/SwitchFocusTargetModal").then((mod) => ({
      default: mod.SwitchFocusTargetModal,
    })),
  { ssr: false },
);

/**
 * Container Orquestrador do Quadro Kanban de Rotinas.
 * Desacoplado: consome hooks especializados para estado de colunas,
 * filtros, modais/menus, estatísticas e ações assíncronas de tarefas.
 */
export function TasksBoardContainer({
  initialColumns,
  initialVisibleColumnIds,
  initialOpenCreateColumn = false,
  targetColumnId: targetColumnIdProp,
  isPremium: isPremiumProp,
  workspaceId: workspaceIdProp,
}: TasksBoardContainerProps) {
  const t = useTranslations("tasks.container");
  const tColumn = useTranslations("tasks.column");
  const locale = useLocale() as AppLocale;
  const searchParams = useSearchParams();
  const effectiveTargetColumnId =
    targetColumnIdProp || searchParams.get("columnId") || undefined;

  const userStorePremium = useUserStore((state) => state.is_Premium);
  const activeWorkspaceIdFromStore = useWorkspaceStore(
    (state) => state.activeWorkspaceId,
  );
  const isSwitchingWorkspace = useSyncWorkspaceSwitchReset(workspaceIdProp);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const is_Premium = isPremiumProp ?? userStorePremium;
  const activeWorkspaceId = workspaceIdProp ?? activeWorkspaceIdFromStore;

  const [viewMode, setViewMode] = useViewMode("tasks", "card");
  const [isColumnsDrawerOpen, setIsColumnsDrawerOpen] = useState(false);

  const syncSelectedTaskDetailsRef = useRef<
    ((taskId: string, updater: (task: Task) => Task) => void) | null
  >(null);

  // 1. Hook de Colunas, Visibilidade e Mutações de Coluna
  const {
    columns,
    setColumns,
    registerLoadedArchivedTasks,
    visibleColumnIds,
    toggleColumnVisibility,
    showAllColumns,
    ensureColumnVisible,
    canCreateColumn,
    maxColumns,
    handleColumnSaved,
    handleDeleteColumn,
    isDeletingColumn,
    handleMoveColumnToWorkspace,
    handleColumnReorder,
  } = useRoutineColumns(
    initialColumns,
    is_Premium,
    activeWorkspaceId,
    initialVisibleColumnIds,
    effectiveTargetColumnId,
    (taskId, updater) => syncSelectedTaskDetailsRef.current?.(taskId, updater),
  );

  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const userTimezone = useUserStore((state) => state.user?.timezone);
  useMidnightRollover(userTimezone, () => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.map(resetTaskOnMidnightRollover),
      })),
    );
  });

  // 1.1 Hook de Alinhamento e Largura das Colunas do Quadro
  const {
    alignment,
    setAlignment,
    columnWidths,
    setColumnWidth,
    getColumnWidthClass,
  } = useRoutineBoardLayout({ workspaceId: activeWorkspaceId });

  // 2. Hook de Modais e Menus de Contexto
  const {
    columnModalState,
    setColumnModalState,
    closeColumnModal,
    taskModalState,
    setTaskModalState,
    selectedTaskDetails,
    setSelectedTaskDetails,
    contextMenu,
    setContextMenu,
    columnContextMenu,
    setColumnContextMenu,
    columnToDelete,
    setColumnToDelete,
    selectedColumnId,
    handleOpenTaskContextMenu,
    handleOpenColumnContextMenu,
  } = useBoardModals({
    initialOpenCreateColumn,
    ensureColumnVisible,
  });

  // 3. Hook de Filtros e Busca em Memória
  const initialSearchFromUrl = searchParams.get("q") || "";
  const {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    availableTags,
    tagCounts,
    filteredColumns,
  } = useBoardFilters(columns, initialSearchFromUrl);

  const { localMatchCount, tasksStats } = useTasksWelcomeStats({
    columns,
    filteredColumns,
    filters,
    setFilters,
    searchQuery,
    setSearchQuery,
    locale,
  });

  const handleTaskUpdatedInDetails = useCallback(
    (updated: Task) => {
      setSelectedTaskDetails((prev) =>
        prev ? { ...prev, task: updated } : null,
      );
    },
    [setSelectedTaskDetails],
  );

  const handleOpenDetails = useCallback(
    (task: Task, columnId: string, anchorRect?: DOMRect) => {
      setSelectedTaskDetails({ task, columnId, anchorRect });
    },
    [setSelectedTaskDetails],
  );

  const {
    pendingFocusTask,
    currentFocusTarget,
    clearPendingFocusTask,
    handleStartFocusTask,
    handleTransferFocusTask,
    handleSaveAndStartFocusTask,
    handleDiscardAndStartFocusTask,
  } = useQuickFocusTask();

  syncSelectedTaskDetailsRef.current = (
    taskId: string,
    updater: (task: Task) => Task,
  ) => {
    setSelectedTaskDetails((prev) =>
      prev && prev.task.id === taskId
        ? { ...prev, task: updater(prev.task) }
        : prev,
    );
  };

  const handleOpenColumnsDrawer = useCallback(() => {
    setIsColumnsDrawerOpen(true);
  }, []);

  // 4. Hook de Ações e Mutações de Tarefas
  const {
    handleDuplicateTask,
    duplicatingTaskIds,
    handleTaskSaved,
    handleQuickCreateTask,
    handleDeleteTask,
    handleTaskMove,
    handleTaskDetailsUpdate,
    handleToggleComplete,
    handleHabitChange,
  } = useBoardTaskActions({
    columns,
    setColumns,
    onTaskUpdatedInDetails: handleTaskUpdatedInDetails,
  });

  const {
    taskToDelete,
    deleteHistory,
    setDeleteHistory,
    checkingDeleteTaskIds,
    requestDeleteTask,
    confirmDeleteTask,
    cancelDeleteTask,
  } = useTaskDeleteFlow({
    onConfirmDelete: handleDeleteTask,
  });

  const handleHideColumn = useCallback(
    (colId: string) => {
      const col = columnsRef.current.find((c) => c.id === colId);
      toggleColumnVisibility(colId);
      toast.success(
        t("toastColumnHidden", {
          title: col?.title || t("defaultColumnTitle"),
        }),
      );
    },
    [toggleColumnVisibility, t],
  );

  const handleLoadArchivedCompleted = useCallback(
    async (columnId: string) => {
      const res = await getArchivedCompletedColumnTasks(columnId);
      if (!res.success || !res.data) {
        toast.error(
          (!res.success ? res.error : undefined) ||
            tColumn("loadArchivedCompletedError"),
        );
        return;
      }

      const activeWorkspace = workspaces.find(
        (ws) => ws.id === activeWorkspaceId,
      );
      const workspaceMeta = activeWorkspace
        ? { id: activeWorkspace.id, name: activeWorkspace.name }
        : activeWorkspaceId
          ? { id: activeWorkspaceId }
          : undefined;

      const mappedArchivedTasks = res.data.map((taskDto) =>
        mapTaskResponseToTask(taskDto, columnId, userTimezone, workspaceMeta),
      );

      registerLoadedArchivedTasks(mappedArchivedTasks);

      setColumns((prev) =>
        prev.map((col) => {
          if (col.id !== columnId) return col;
          const existingIds = new Set(col.tasks.map((item) => item.id));
          const uniqueArchived = mappedArchivedTasks.filter(
            (item) => !existingIds.has(item.id),
          );
          return {
            ...col,
            tasks: [...col.tasks, ...uniqueArchived],
            archivedTotalCount: 0,
            archivedCompletedCount: 0,
          };
        }),
      );
    },
    [
      activeWorkspaceId,
      registerLoadedArchivedTasks,
      setColumns,
      tColumn,
      userTimezone,
      workspaces,
    ],
  );

  // Instância única de Drag-and-Drop compartilhada entre modo Card e modo Lista
  const boardDnd = useRoutineBoardDnd({
    columns: filteredColumns,
    setColumns,
    onTaskMove: handleTaskMove,
    onColumnReorder: handleColumnReorder,
    onHideColumn: handleHideColumn,
  });

  const columnStructureKey = columns.map((c) => `${c.id}:${c.title}`).join("|");
  // biome-ignore lint/correctness/useExhaustiveDependencies: Atualiza apenas quando colunas sao adicionadas ou renomeadas
  const formColumns = useMemo(
    () => columns.map((c) => ({ id: c.id, title: c.title })),
    [columnStructureKey, columns],
  );

  const {
    isWorkspaceReadOnly,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    ensureWriteAccess,
    availableTargetWorkspaces,
    handleMoveLockedWorkspace,
    handleMoveColumnToWorkspaceSafe,
  } = useWorkspaceWriteGuard({
    workspaces,
    activeWorkspaceId,
    isPremium: is_Premium,
    onMoveColumnToWorkspace: handleMoveColumnToWorkspace,
    onColumnMoved: useCallback(
      (columnId: string) => {
        setSelectedTaskDetails((prev) =>
          prev?.columnId === columnId ? null : prev,
        );
        setColumnModalState((prev) =>
          prev.columnToEdit?.id === columnId
            ? { isOpen: false, columnToEdit: null, insertTarget: null }
            : prev,
        );
      },
      [setSelectedTaskDetails, setColumnModalState],
    ),
  });

  const handleOpenCreateColumn = useCallback(() => {
    if (!ensureWriteAccess(t("readOnlyCreateColumnToast"))) {
      return;
    }
    setColumnModalState({ isOpen: true, columnToEdit: null });
  }, [ensureWriteAccess, setColumnModalState, t]);

  const handleOpenCreateTask = useCallback(() => {
    if (!ensureWriteAccess(t("readOnlyCreateTaskToast"))) {
      return;
    }
    setTaskModalState({
      isOpen: true,
      columnId: columnsRef.current[0]?.id,
      taskToEdit: null,
    });
  }, [ensureWriteAccess, setTaskModalState, t]);

  const handleEditTask = useCallback(
    (task: Task, columnId: string) => {
      if (!ensureWriteAccess(t("readOnlyCreateTaskToast"))) {
        return;
      }
      setSelectedTaskDetails(null);
      setTaskModalState({
        isOpen: true,
        columnId: columnId || task.columnId || columnsRef.current[0]?.id,
        taskToEdit: task,
      });
    },
    [ensureWriteAccess, setSelectedTaskDetails, setTaskModalState, t],
  );

  const handleAddTaskToColumnSafe = useCallback(
    (
      colId: string,
      initialType?: TaskTypeOption,
      initialTitle?: string,
      initialValues?: InitialTaskFormData,
    ) => {
      if (!ensureWriteAccess(t("readOnlyCreateTaskToast"))) {
        return;
      }
      setTaskModalState({
        isOpen: true,
        columnId: colId,
        defaultTaskType: initialType ?? initialValues?.taskType,
        initialTitle: initialTitle ?? initialValues?.title,
        initialValues,
        taskToEdit: null,
      });
    },
    [ensureWriteAccess, setTaskModalState, t],
  );

  const handleQuickCreateTaskSafe = useCallback(
    async (
      title: string,
      columnId: string,
      taskType: TaskTypeOption = "TODO",
      extraPayload?: Partial<CreateTaskDTO>,
    ) => {
      if (!ensureWriteAccess(t("readOnlyCreateTaskToast"))) {
        return;
      }
      await handleQuickCreateTask(title, columnId, taskType, extraPayload);
    },
    [ensureWriteAccess, handleQuickCreateTask, t],
  );

  const sharedFilterProps = {
    search: searchQuery,
    onSearch: setSearchQuery,
    viewMode: {
      value: viewMode,
      onChange: setViewMode,
    },
    filters,
    onFilterChange: setFilters,
    alignment,
    onAlignmentChange: setAlignment,
    availableTags,
    tagCounts,
    maxColumns,
    isPremium: is_Premium,
    canCreateColumn: isWorkspaceReadOnly ? false : canCreateColumn,
    visibleColumnIds,
    totalColumnsCount: columns.length,
    onOpenColumnsDrawer: handleOpenColumnsDrawer,
    onOpenCreateColumn: handleOpenCreateColumn,
    onOpenCreateTask: handleOpenCreateTask,
  };

  const welcomeDetails = WELCOME_CARD_DETAILS.tasks;

  if (isSwitchingWorkspace) {
    return <RouteLoading route="tasks" />;
  }

  return (
    <>
      {/* Banner de Boas-vindas */}
      <WelcomeCard
        title={welcomeDetails.title}
        subtitle={welcomeDetails.subtitle}
        bullets={welcomeDetails.bullets}
        imageSrc={welcomeDetails.imageSrc}
        stats={tasksStats}
        imageWidth={welcomeDetails.normalWidth}
        imageHeight={welcomeDetails.normalHeight}
        storageKey="tasks"
      />

      {/* Aviso de Ambiente Preservado em Modo Somente Leitura */}
      {isWorkspaceReadOnly && (
        <WorkspaceReadOnlyBanner
          onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
        />
      )}

      {/* Quadro Kanban ou Visualização em Lista */}
      <TasksBoardViewport
        viewMode={viewMode}
        sharedFilterProps={sharedFilterProps}
        searchQuery={searchQuery}
        localMatchCount={localMatchCount}
        filteredColumns={filteredColumns}
        visibleColumnIds={visibleColumnIds}
        selectedColumnId={selectedColumnId}
        selectedTaskId={selectedTaskDetails?.task.id}
        deletingTaskIds={checkingDeleteTaskIds}
        alignment={alignment}
        columnWidths={columnWidths}
        getColumnWidthClass={getColumnWidthClass}
        forceExpandCompleted={filters.status === "completed"}
        boardDnd={boardDnd}
        onOpenCreateColumn={handleOpenCreateColumn}
        onAddTaskToColumn={handleAddTaskToColumnSafe}
        onQuickCreateTask={handleQuickCreateTaskSafe}
        onOpenDetails={handleOpenDetails}
        onEditTask={handleEditTask}
        onContextMenu={handleOpenTaskContextMenu}
        onOpenColumnMenu={handleOpenColumnContextMenu}
        onToggleComplete={handleToggleComplete}
        onHabitChange={handleHabitChange}
        onStartFocusTask={handleStartFocusTask}
        onLoadArchivedCompleted={handleLoadArchivedCompleted}
      />

      {/* Modais, Popovers e Menus de Contexto desacoplados */}
      <TasksBoardModals
        columns={columns}
        formColumns={formColumns}
        visibleColumnIds={visibleColumnIds}
        availableTags={availableTags}
        maxColumns={maxColumns}
        isPremium={is_Premium}
        columnModalState={columnModalState}
        closeColumnModal={closeColumnModal}
        setColumnModalState={setColumnModalState}
        handleColumnSaved={handleColumnSaved}
        taskModalState={taskModalState}
        setTaskModalState={setTaskModalState}
        handleTaskSaved={handleTaskSaved}
        selectedTaskDetails={selectedTaskDetails}
        setSelectedTaskDetails={setSelectedTaskDetails}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        columnContextMenu={columnContextMenu}
        setColumnContextMenu={setColumnContextMenu}
        columnToDelete={columnToDelete}
        setColumnToDelete={setColumnToDelete}
        isDeletingColumn={isDeletingColumn}
        handleDeleteColumn={handleDeleteColumn}
        handleDuplicateTask={handleDuplicateTask}
        duplicatingTaskIds={duplicatingTaskIds}
        taskToDelete={taskToDelete}
        deleteHistory={deleteHistory}
        onDeleteHistoryChange={setDeleteHistory}
        requestDeleteTask={requestDeleteTask}
        onConfirmDeleteTask={confirmDeleteTask}
        onCancelDeleteTask={cancelDeleteTask}
        handleTaskDetailsUpdate={handleTaskDetailsUpdate}
        handleToggleComplete={handleToggleComplete}
        handleHabitChange={handleHabitChange}
        isColumnsDrawerOpen={isColumnsDrawerOpen}
        setIsColumnsDrawerOpen={setIsColumnsDrawerOpen}
        toggleColumnVisibility={toggleColumnVisibility}
        showAllColumns={showAllColumns}
        columnWidths={columnWidths}
        onColumnWidthChange={setColumnWidth}
        availableTargetWorkspaces={availableTargetWorkspaces}
        isWorkspaceReadOnly={isWorkspaceReadOnly}
        onMoveColumnToWorkspace={handleMoveColumnToWorkspaceSafe}
        onMoveLockedWorkspace={handleMoveLockedWorkspace}
        onStartFocus={handleStartFocusTask}
      />

      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}

      {pendingFocusTask && (
        <SwitchFocusTargetModal
          isOpen={pendingFocusTask !== null}
          onClose={clearPendingFocusTask}
          currentName={currentFocusTarget?.name || t("currentSessionFallback")}
          newTargetName={pendingFocusTask.title}
          isCurrentInventory={currentFocusTarget?.type === "inventory"}
          isCurrentTask={currentFocusTarget?.type === "task"}
          isNewTask={true}
          onTransfer={handleTransferFocusTask}
          onSaveAndStartNew={handleSaveAndStartFocusTask}
          onDiscardAndStartNew={handleDiscardAndStartFocusTask}
        />
      )}
    </>
  );
}
