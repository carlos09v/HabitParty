"use client";

import { arrayMove } from "@dnd-kit/sortable";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getArchivedCompletedColumnTasks } from "@/actions/taskActions";
import { RouteLoading } from "@/components/layout/RouteLoading";
import { TasksBoardModals } from "@/components/tasks/TasksBoardModals";
import { TasksBoardViewport } from "@/components/tasks/TasksBoardViewport";
import { WorkspaceReadOnlyBanner } from "@/components/tasks/WorkspaceReadOnlyBanner";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { WELCOME_CARD_DETAILS } from "@/constants/welcomeCards";
import { useBoardFilters } from "@/hooks/useBoardFilters";
import { useBoardModals } from "@/hooks/useBoardModals";
import { useBoardTaskActions } from "@/hooks/useBoardTaskActions";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
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
import type {
  BoardColumn,
  CreateTaskDTO,
  Task,
  TaskTypeOption,
} from "@/types/task";
import type {
  InitialTaskFormData,
  TasksBoardContainerProps,
} from "@/types/task-ui";
import { reindexTasksOrder } from "@/utils/boardDnd";
import {
  mapTaskResponseToTask,
  resetTaskOnMidnightRollover,
} from "@/utils/taskMapper";
import { setActiveWorkspaceCookie } from "@/utils/urlParams";

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
  initialWorkspaces,
}: TasksBoardContainerProps) {
  const t = useTranslations("tasks.container");
  const tColumn = useTranslations("tasks.column");
  const tFilters = useTranslations("tasks.filters");
  const tMutations = useTranslations("dashboard.taskShared.mutations");
  const locale = useLocale() as AppLocale;
  const searchParams = useSearchParams();
  const urlWorkspaceId = searchParams.get("workspaceId") || undefined;
  const effectiveTargetColumnId =
    targetColumnIdProp || searchParams.get("columnId") || undefined;

  const userStorePremium = useUserStore((state) => state.is_Premium);
  const activeWorkspaceIdFromStore = useWorkspaceStore(
    (state) => state.activeWorkspaceId,
  );
  const isSwitchingWorkspace = useSyncWorkspaceSwitchReset(workspaceIdProp);
  const storeWorkspaces = useWorkspaceStore((state) => state.workspaces);
  const workspaces = useMemo(
    () =>
      storeWorkspaces.length > 0 ? storeWorkspaces : (initialWorkspaces ?? []),
    [storeWorkspaces, initialWorkspaces],
  );
  const is_Premium = isPremiumProp ?? userStorePremium;
  const activeWorkspaceId = workspaceIdProp ?? activeWorkspaceIdFromStore;

  // Mantém useWorkspaceStore e cookie sincronizados quando /tasks é aberto via ?workspaceId=...
  useEffect(() => {
    if (!workspaceIdProp) return;
    if (useWorkspaceStore.getState().activeWorkspaceId !== workspaceIdProp) {
      useWorkspaceStore.getState().setActiveWorkspaceId(workspaceIdProp);
    }
    if (urlWorkspaceId && urlWorkspaceId === workspaceIdProp) {
      setActiveWorkspaceCookie(workspaceIdProp);
    }
  }, [workspaceIdProp, urlWorkspaceId]);

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
    unregisterLoadedArchivedTask,
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
  const createColumnParamHandlerRef = useRef<(() => void) | null>(null);

  const userTimezone = useUserStore((state) => state.user?.timezone);
  useMidnightRollover(userTimezone, () => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.map((task) =>
          resetTaskOnMidnightRollover(task, userTimezone),
        ),
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

  const handleCreateColumnParamRequest = useCallback(() => {
    createColumnParamHandlerRef.current?.();
  }, []);

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
    closeColumnContextMenu,
    columnToDelete,
    setColumnToDelete,
    selectedColumnId,
    setSelectedColumnId,
    handleOpenTaskContextMenu,
    handleOpenColumnContextMenu,
  } = useBoardModals({
    initialOpenCreateColumn,
    ensureColumnVisible,
    onCreateColumnParamRequest: handleCreateColumnParamRequest,
  });

  // 3. Hook de Filtros e Busca em Memória
  const initialSearchFromUrl = searchParams.get("q") || "";
  const {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    hasActiveFilters,
    clearAllFilters,
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
        prev && prev.task.id === updated.id ? { ...prev, task: updated } : prev,
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

  const quickFocus = useQuickFocusTask();
  const handleStartFocusTaskFromHook = quickFocus.handleStartFocusTask;

  useIsomorphicLayoutEffect(() => {
    columnsRef.current = columns;
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
  }, [columns, setSelectedTaskDetails]);

  const handleOpenColumnsDrawer = useCallback(() => {
    setIsColumnsDrawerOpen(true);
  }, []);

  const handleTempTaskReconciled = useCallback(
    (tempId: string, realTask: Task) => {
      setSelectedTaskDetails((prev) =>
        prev && prev.task.id === tempId
          ? {
              ...prev,
              task: realTask,
              columnId: realTask.columnId ?? prev.columnId,
            }
          : prev,
      );
    },
    [setSelectedTaskDetails],
  );

  // Deriva selectedTaskDetails ao vivo a partir de columns (reflete rollover, reconciliação e exclusões)
  const resolvedSelectedTaskDetails = useMemo(() => {
    if (!selectedTaskDetails) return null;
    for (const col of columns) {
      const liveTask = col.tasks.find(
        (item) => item.id === selectedTaskDetails.task.id,
      );
      if (liveTask) {
        return {
          ...selectedTaskDetails,
          task: liveTask,
          columnId: col.id,
        };
      }
    }
    return null;
  }, [selectedTaskDetails, columns]);

  useEffect(() => {
    if (selectedTaskDetails && !resolvedSelectedTaskDetails) {
      setSelectedTaskDetails(null);
    }
  }, [
    selectedTaskDetails,
    resolvedSelectedTaskDetails,
    setSelectedTaskDetails,
  ]);

  const loadingArchivedColumnsRef = useRef<Set<string>>(new Set());

  // 4. Hook de Ações e Mutações de Tarefas
  const {
    handleDuplicateTask,
    duplicatingTaskIds,
    handleTaskSaved,
    handleQuickCreateTask,
    handleDeleteTask,
    scheduleUndoDeleteTask,
    handleTaskMove,
    handleTaskDetailsUpdate,
    handleToggleComplete,
    handleHabitChange,
  } = useBoardTaskActions({
    columns,
    setColumns,
    workspaceId: activeWorkspaceId,
    workspaces,
    onTaskUpdatedInDetails: handleTaskUpdatedInDetails,
    onTempTaskReconciled: handleTempTaskReconciled,
    onTaskDeleted: unregisterLoadedArchivedTask,
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
    onSimpleDelete: scheduleUndoDeleteTask,
  });

  const handleHideColumn = useCallback(
    (colId: string) => {
      toggleColumnVisibility(colId);
    },
    [toggleColumnVisibility],
  );

  const handleLoadArchivedCompleted = useCallback(
    async (columnId: string) => {
      if (loadingArchivedColumnsRef.current.has(columnId)) return;
      loadingArchivedColumnsRef.current.add(columnId);
      try {
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
      } finally {
        loadingArchivedColumnsRef.current.delete(columnId);
      }
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

  // 5. Guardas de escrita do Workspace (somente-leitura para ambientes excedentes sem VIP)
  const {
    isWorkspaceReadOnly,
    openUpgradeModal,
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

  // Instância única de Drag-and-Drop compartilhada entre modo Card e modo Lista
  // Opera sobre `allColumns: columns` para jamais descartar tarefas ocultadas por filtro (B1)
  const boardDnd = useRoutineBoardDnd({
    columns: filteredColumns,
    allColumns: columns,
    setColumns,
    disabled: isWorkspaceReadOnly,
    onDisabledInteraction: useCallback(() => {
      ensureWriteAccess(t("readOnlyReorderToast"));
    }, [ensureWriteAccess, t]),
    onTaskMove: handleTaskMove,
    onColumnReorder: handleColumnReorder,
    onHideColumn: handleHideColumn,
  });

  const formColumns = useMemo(
    () => columns.map((c) => ({ id: c.id, title: c.title })),
    [columns],
  );

  const handleOpenCreateColumn = useCallback(() => {
    if (!ensureWriteAccess(t("readOnlyCreateColumnToast"))) {
      return;
    }
    if (!canCreateColumn) {
      if (!is_Premium) {
        openUpgradeModal();
      } else {
        toast.info(tFilters("newColumnMaxReachedTitle", { max: maxColumns }));
      }
      return;
    }
    setColumnModalState({
      isOpen: true,
      columnToEdit: null,
      insertTarget: null,
    });
  }, [
    canCreateColumn,
    ensureWriteAccess,
    is_Premium,
    maxColumns,
    openUpgradeModal,
    setColumnModalState,
    t,
    tFilters,
  ]);

  useIsomorphicLayoutEffect(() => {
    createColumnParamHandlerRef.current = handleOpenCreateColumn;
  }, [handleOpenCreateColumn]);

  const handleOpenCreateTask = useCallback(() => {
    if (!ensureWriteAccess(t("readOnlyCreateTaskToast"))) {
      return;
    }
    if (columnsRef.current.length === 0) {
      toast.info(tFilters("newTaskNoColumnsTitle"));
      return;
    }
    setTaskModalState({
      isOpen: true,
      columnId: columnsRef.current[0]?.id,
      taskToEdit: null,
    });
  }, [ensureWriteAccess, setTaskModalState, t, tFilters]);

  const handleEditTask = useCallback(
    (task: Task, columnId?: string) => {
      if (!ensureWriteAccess(t("readOnlyModifyTaskToast"))) {
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
        return false;
      }
      return handleQuickCreateTask(title, columnId, taskType, extraPayload);
    },
    [ensureWriteAccess, handleQuickCreateTask, t],
  );

  const guardedToggleComplete = useCallback(
    (taskId: string, completed: boolean) => {
      if (!ensureWriteAccess(t("readOnlyModifyTaskToast"))) {
        return false;
      }
      return handleToggleComplete(taskId, completed);
    },
    [ensureWriteAccess, handleToggleComplete, t],
  );

  const guardedHabitChange = useCallback(
    (taskId: string, delta: number) => {
      if (!ensureWriteAccess(t("readOnlyModifyTaskToast"))) {
        return false;
      }
      return handleHabitChange(taskId, delta);
    },
    [ensureWriteAccess, handleHabitChange, t],
  );

  const guardedDuplicateTask = useCallback(
    (task: Task, columnId: string) => {
      if (!ensureWriteAccess(t("readOnlyModifyTaskToast"))) {
        return;
      }
      handleDuplicateTask(task, columnId);
    },
    [ensureWriteAccess, handleDuplicateTask, t],
  );

  const guardedRequestDeleteTask = useCallback(
    (task: Task, columnId?: string) => {
      if (!ensureWriteAccess(t("readOnlyModifyTaskToast"))) {
        return;
      }
      requestDeleteTask(task, columnId);
    },
    [ensureWriteAccess, requestDeleteTask, t],
  );

  const guardedTaskDetailsUpdate = useCallback(
    (updated: Task) => {
      if (!ensureWriteAccess(t("readOnlyModifyTaskToast"))) {
        return;
      }
      handleTaskDetailsUpdate(updated);
    },
    [ensureWriteAccess, handleTaskDetailsUpdate, t],
  );

  const guardedDeleteColumn = useCallback(
    async (col: BoardColumn) => {
      if (!ensureWriteAccess(t("readOnlyColumnActionToast"))) {
        return false;
      }
      const deleted = await handleDeleteColumn(col);
      if (deleted) {
        setSelectedTaskDetails((prev) =>
          prev?.columnId === col.id ? null : prev,
        );
        setSelectedColumnId((prev) => (prev === col.id ? null : prev));
      }
      return deleted;
    },
    [
      ensureWriteAccess,
      handleDeleteColumn,
      setSelectedColumnId,
      setSelectedTaskDetails,
      t,
    ],
  );

  const guardedStartFocusTask = useCallback(
    (task: Task) => {
      if (!ensureWriteAccess(t("readOnlyModifyTaskToast"))) {
        return;
      }
      handleStartFocusTaskFromHook(task);
    },
    [ensureWriteAccess, handleStartFocusTaskFromHook, t],
  );

  // Alternativa acessível sem drag-and-drop: mover tarefa entre colunas via menu de contexto
  const handleMoveTaskToColumn = useCallback(
    (task: Task, targetColumnId: string) => {
      if (!ensureWriteAccess(t("readOnlyReorderToast"))) return;
      const previousColumns = columnsRef.current;
      const sourceCol = previousColumns.find((c) =>
        c.tasks.some((item) => item.id === task.id),
      );
      const targetCol = previousColumns.find((c) => c.id === targetColumnId);
      if (!targetCol || sourceCol?.id === targetColumnId) return;

      const movedTask: Task = { ...task, columnId: targetColumnId };
      const nextTargetTasks = reindexTasksOrder([
        movedTask,
        ...targetCol.tasks.filter((item) => item.id !== task.id),
      ]);

      const nextColumns = previousColumns.map((col) => {
        if (col.id === targetColumnId) {
          return { ...col, tasks: nextTargetTasks };
        }
        if (col.id === sourceCol?.id) {
          return {
            ...col,
            tasks: reindexTasksOrder(
              col.tasks.filter((item) => item.id !== task.id),
            ),
          };
        }
        return col;
      });

      columnsRef.current = nextColumns;
      setColumns(nextColumns);
      ensureColumnVisible(targetColumnId);
      handleTaskMove(
        task.id,
        targetColumnId,
        0,
        nextTargetTasks,
        previousColumns,
      );
      toast.success(
        tMutations("moveTaskSuccess", {
          column: targetCol.title || t("defaultColumnTitle"),
        }),
      );
    },
    [
      ensureColumnVisible,
      ensureWriteAccess,
      handleTaskMove,
      setColumns,
      t,
      tMutations,
    ],
  );

  // Alternativa acessível sem drag-and-drop: reordenar coluna à esquerda ou direita via menu de contexto
  const handleMoveColumnDirection = useCallback(
    (column: BoardColumn, direction: "left" | "right") => {
      if (!ensureWriteAccess(t("readOnlyReorderToast"))) return;
      const previousColumns = columnsRef.current;
      const currentIdx = previousColumns.findIndex((c) => c.id === column.id);
      if (currentIdx < 0) return;
      const nextIdx = direction === "left" ? currentIdx - 1 : currentIdx + 1;
      if (nextIdx < 0 || nextIdx >= previousColumns.length) return;

      const reordered = arrayMove(previousColumns, currentIdx, nextIdx).map(
        (col, idx) => ({ ...col, order: idx }),
      );
      columnsRef.current = reordered;
      setColumns(reordered);
      handleColumnReorder(reordered, previousColumns);
    },
    [ensureWriteAccess, handleColumnReorder, setColumns, t],
  );

  const sharedFilterProps = useMemo(
    () => ({
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
      isReadOnly: isWorkspaceReadOnly,
      canCreateColumn: isWorkspaceReadOnly ? false : canCreateColumn,
      canCreateTask: !isWorkspaceReadOnly && columns.length > 0,
      visibleColumnIds,
      totalColumnsCount: columns.length,
      onOpenColumnsDrawer: handleOpenColumnsDrawer,
      onOpenCreateColumn: handleOpenCreateColumn,
      onOpenCreateTask: handleOpenCreateTask,
    }),
    [
      alignment,
      availableTags,
      canCreateColumn,
      columns.length,
      filters,
      handleOpenColumnsDrawer,
      handleOpenCreateColumn,
      handleOpenCreateTask,
      isWorkspaceReadOnly,
      is_Premium,
      maxColumns,
      searchQuery,
      setAlignment,
      setFilters,
      setSearchQuery,
      setViewMode,
      tagCounts,
      viewMode,
      visibleColumnIds,
    ],
  );

  const welcomeDetails = WELCOME_CARD_DETAILS.tasks;

  if (isSwitchingWorkspace) {
    return <RouteLoading route="tasks" />;
  }

  return (
    <>
      {/* Banner de Boas-vindas */}
      <WelcomeCard
        imageSrc={welcomeDetails.imageSrc}
        stats={tasksStats}
        imageWidth={welcomeDetails.normalWidth}
        imageHeight={welcomeDetails.normalHeight}
        storageKey="tasks"
      />

      {/* Aviso de Ambiente Preservado em Modo Somente Leitura */}
      {isWorkspaceReadOnly && (
        <WorkspaceReadOnlyBanner onOpenUpgrade={openUpgradeModal} />
      )}

      {/* Quadro Kanban ou Visualização em Lista */}
      <TasksBoardViewport
        viewMode={viewMode}
        isReadOnly={isWorkspaceReadOnly}
        sharedFilterProps={sharedFilterProps}
        searchQuery={searchQuery}
        localMatchCount={localMatchCount}
        filteredColumns={filteredColumns}
        visibleColumnIds={visibleColumnIds}
        selectedColumnId={selectedColumnId}
        selectedTaskId={resolvedSelectedTaskDetails?.task.id}
        deletingTaskIds={checkingDeleteTaskIds}
        alignment={alignment}
        columnWidths={columnWidths}
        getColumnWidthClass={getColumnWidthClass}
        forceExpandCompleted={filters.status === "completed"}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearAllFilters}
        onManageColumns={() => setIsColumnsDrawerOpen(true)}
        boardDnd={boardDnd}
        onOpenCreateColumn={handleOpenCreateColumn}
        onAddTaskToColumn={handleAddTaskToColumnSafe}
        onQuickCreateTask={handleQuickCreateTaskSafe}
        onOpenDetails={handleOpenDetails}
        onEditTask={handleEditTask}
        onContextMenu={handleOpenTaskContextMenu}
        onOpenColumnMenu={handleOpenColumnContextMenu}
        onToggleComplete={guardedToggleComplete}
        onHabitChange={guardedHabitChange}
        onStartFocusTask={guardedStartFocusTask}
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
        workspaceId={activeWorkspaceId}
        columnModalState={columnModalState}
        closeColumnModal={closeColumnModal}
        setColumnModalState={setColumnModalState}
        handleColumnSaved={handleColumnSaved}
        taskModalState={taskModalState}
        setTaskModalState={setTaskModalState}
        handleTaskSaved={handleTaskSaved}
        selectedTaskDetails={resolvedSelectedTaskDetails}
        setSelectedTaskDetails={setSelectedTaskDetails}
        contextMenu={contextMenu}
        setContextMenu={setContextMenu}
        columnContextMenu={columnContextMenu}
        onCloseColumnContextMenu={closeColumnContextMenu}
        columnToDelete={columnToDelete}
        setColumnToDelete={setColumnToDelete}
        isDeletingColumn={isDeletingColumn}
        handleDeleteColumn={guardedDeleteColumn}
        handleDuplicateTask={guardedDuplicateTask}
        duplicatingTaskIds={duplicatingTaskIds}
        taskToDelete={taskToDelete}
        deleteHistory={deleteHistory}
        onDeleteHistoryChange={setDeleteHistory}
        requestDeleteTask={guardedRequestDeleteTask}
        onConfirmDeleteTask={confirmDeleteTask}
        onCancelDeleteTask={cancelDeleteTask}
        handleTaskDetailsUpdate={guardedTaskDetailsUpdate}
        handleToggleComplete={guardedToggleComplete}
        handleHabitChange={guardedHabitChange}
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
        onMoveTaskToColumn={handleMoveTaskToColumn}
        onMoveColumnDirection={handleMoveColumnDirection}
        onStartFocus={guardedStartFocusTask}
        quickFocus={quickFocus}
        onOpenEditTask={handleEditTask}
        onOpenCreateColumn={handleOpenCreateColumn}
        ensureWriteAccess={ensureWriteAccess}
      />
    </>
  );
}
