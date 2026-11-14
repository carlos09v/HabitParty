"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { RouteLoading } from "@/components/layout/RouteLoading";
import { RoutineBoard } from "@/components/tasks/RoutineBoard";
import { RoutineColumn } from "@/components/tasks/RoutineColumn";
import { RoutineFilters } from "@/components/tasks/RoutineFilters";
import { RoutineTaskCard } from "@/components/tasks/RoutineTaskCard";
import { RoutineTaskList } from "@/components/tasks/RoutineTaskList";
import { WorkspaceReadOnlyBanner } from "@/components/tasks/WorkspaceReadOnlyBanner";
import { WorkspaceSearchHintBanner } from "@/components/tasks/WorkspaceSearchHintBanner";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { normalizeTaskType } from "@/constants/task";
import { WELCOME_CARD_DETAILS } from "@/constants/welcomeCards";
import { useBoardFilters } from "@/hooks/useBoardFilters";
import { useBoardModals } from "@/hooks/useBoardModals";
import { useBoardTaskActions } from "@/hooks/useBoardTaskActions";
import { useMidnightRollover } from "@/hooks/useMidnightRollover";
import { useRoutineBoardDnd } from "@/hooks/useRoutineBoardDnd";
import { useRoutineBoardLayout } from "@/hooks/useRoutineBoardLayout";
import { useRoutineColumns } from "@/hooks/useRoutineColumns";
import { useTaskDeleteFlow } from "@/hooks/useTaskDeleteFlow";
import { useViewMode } from "@/hooks/useViewMode";
import { useWorkspaceWriteGuard } from "@/hooks/useWorkspaceWriteGuard";
import type { AppLocale } from "@/i18n/config";
import { useProgressStore } from "@/store/progressStore";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { CreateTaskDTO, Task, TaskTypeOption } from "@/types/task";
import type {
  InitialTaskFormData,
  TasksBoardContainerProps,
} from "@/types/task-ui";
import { cn } from "@/utils";
import { calculateTasksWelcomeStats } from "@/utils/catalogMetrics";

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

/**
 * Container Orquestrador do Quadro Kanban de Rotinas.
 * Desacoplado: consome hooks especializados para estado de colunas,
 * filtros, modais/menus e ações assíncronas de tarefas.
 */
export function TasksBoardContainer({
  initialColumns,
  initialVisibleColumnIds,
  initialOpenCreateColumn = false,
  targetColumnId: targetColumnIdProp,
  isPremium: isPremiumProp,
  workspaceId: workspaceIdProp,
  isCompact: isCompactProp,
}: TasksBoardContainerProps) {
  const t = useTranslations("tasks.container");
  const locale = useLocale() as AppLocale;
  const searchParams = useSearchParams();
  const effectiveTargetColumnId =
    targetColumnIdProp || searchParams.get("columnId") || undefined;

  const userStorePremium = useUserStore((state) => state.is_Premium);
  const activeWorkspaceIdFromStore = useWorkspaceStore(
    (state) => state.activeWorkspaceId,
  );
  const isSwitchingWorkspace = useWorkspaceStore(
    (state) => state.isSwitchingWorkspace,
  );
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const is_Premium = isPremiumProp ?? userStorePremium;
  const activeWorkspaceId = workspaceIdProp ?? activeWorkspaceIdFromStore;
  const isCompact = isCompactProp ?? false;

  useEffect(() => {
    if (
      isSwitchingWorkspace &&
      (!activeWorkspaceIdFromStore ||
        workspaceIdProp === activeWorkspaceIdFromStore)
    ) {
      useWorkspaceStore.setState({ isSwitchingWorkspace: false });
      useProgressStore.getState().done("workspace-switch");
    }
  }, [workspaceIdProp, activeWorkspaceIdFromStore, isSwitchingWorkspace]);
  const [viewMode, setViewMode] = useViewMode("tasks", "card");
  const [isColumnsDrawerOpen, setIsColumnsDrawerOpen] = useState(false);

  // 1. Hook de Colunas, Visibilidade e Mutações de Coluna
  const {
    columns,
    setColumns,
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
  );

  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const userTimezone = useUserStore((state) => state.user?.timezone);
  useMidnightRollover(userTimezone, () => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.map((task) => {
          const type = normalizeTaskType(task);
          if (type === "daily" || type === "habit") {
            return { ...task, completed: false, hasClaimedReward: false };
          }
          return task;
        }),
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

  const localMatchCount = useMemo(
    () => filteredColumns.reduce((sum, col) => sum + col.tasks.length, 0),
    [filteredColumns],
  );

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

  const handleOpenColumnsDrawer = useCallback(() => {
    setIsColumnsDrawerOpen(true);
  }, []);

  // 4. Hook de Ações e Mutações de Tarefas
  const {
    handleDuplicateTask,
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

  // Instância única de Drag-and-Drop compartilhada entre modo Card e modo Lista
  const boardDnd = useRoutineBoardDnd({
    columns: filteredColumns,
    setColumns,
    onTaskMove: handleTaskMove,
    onColumnReorder: handleColumnReorder,
    onHideColumn: handleHideColumn,
  });

  const { stats: tasksStats } = useMemo(
    () => calculateTasksWelcomeStats(columns, undefined, locale),
    [columns, locale],
  );

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
    onOpenColumnsDrawer: handleOpenColumnsDrawer,
    onOpenCreateColumn: handleOpenCreateColumn,
    onOpenCreateTask: handleOpenCreateTask,
    isCompact,
  };

  const welcomeDetails = WELCOME_CARD_DETAILS.tasks;

  if (isSwitchingWorkspace) {
    return <RouteLoading route="tasks" />;
  }

  return (
    <>
      {/* Banner de Boas-vindas */}
      <WelcomeCard
        compact={isCompact}
        title={welcomeDetails.title}
        subtitle={welcomeDetails.subtitle}
        bullets={welcomeDetails.bullets}
        imageSrc={welcomeDetails.imageSrc}
        stats={tasksStats}
        imageWidth={
          isCompact ? welcomeDetails.compactWidth : welcomeDetails.normalWidth
        }
        imageHeight={
          isCompact ? welcomeDetails.compactHeight : welcomeDetails.normalHeight
        }
        storageKey="tasks"
      />

      {/* Aviso de Ambiente Preservado em Modo Somente Leitura */}
      {isWorkspaceReadOnly && (
        <WorkspaceReadOnlyBanner
          onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
        />
      )}

      {/* Quadro Kanban ou Visualização em Lista */}
      {viewMode === "card" ? (
        <DndContext
          id="routine-board-dnd"
          sensors={boardDnd.sensors}
          collisionDetection={boardDnd.collisionDetection}
          modifiers={[restrictToWindowEdges]}
          {...boardDnd.handlers}
        >
          {/* Barra de Filtros com Popover, Busca e Seletor de Visualização (Cards / Lista) */}
          <div className="shrink-0 flex flex-col gap-2">
            <RoutineFilters
              {...sharedFilterProps}
              isDraggingColumn={Boolean(boardDnd.activeColumn)}
              enableDroppable={true}
            />
            <WorkspaceSearchHintBanner
              searchQuery={searchQuery}
              localMatchCount={localMatchCount}
            />
          </div>

          <section
            className="flex-1 min-h-0 min-w-0 flex flex-col"
            aria-label={t("boardAria")}
          >
            <RoutineBoard
              columns={filteredColumns}
              visibleColumnIds={visibleColumnIds}
              selectedColumnId={selectedColumnId}
              selectedTaskId={selectedTaskDetails?.task.id}
              deletingTaskIds={checkingDeleteTaskIds}
              isCompact={isCompact}
              alignment={alignment}
              columnWidths={columnWidths}
              getColumnWidthClass={getColumnWidthClass}
              onAddColumn={handleOpenCreateColumn}
              onAddTaskToColumn={handleAddTaskToColumnSafe}
              onQuickCreateTask={handleQuickCreateTaskSafe}
              onOpenDetails={handleOpenDetails}
              onEditTask={handleEditTask}
              onContextMenu={handleOpenTaskContextMenu}
              onOpenColumnMenu={handleOpenColumnContextMenu}
              onToggleComplete={handleToggleComplete}
              onHabitChange={handleHabitChange}
            />
          </section>

          {/* Overlay suave durante o arrasto */}
          <DragOverlay>
            {boardDnd.activeColumn && (
              <div
                className={cn(
                  "h-[500px]",
                  getColumnWidthClass(boardDnd.activeColumn.id),
                )}
              >
                <RoutineColumn
                  column={boardDnd.activeColumn}
                  columnIndex={0}
                  widthPreset={
                    columnWidths[boardDnd.activeColumn.id] || "normal"
                  }
                  isOverlay
                />
              </div>
            )}
            {boardDnd.activeTask && (
              <RoutineTaskCard
                task={boardDnd.activeTask}
                columnId={boardDnd.activeTask.columnId || ""}
                isOverlay
              />
            )}
          </DragOverlay>
        </DndContext>
      ) : (
        <>
          {/* Barra de Filtros no modo Lista */}
          <div className="shrink-0 flex flex-col gap-2">
            <RoutineFilters
              {...sharedFilterProps}
              isDraggingColumn={false}
              enableDroppable={false}
            />
            <WorkspaceSearchHintBanner
              searchQuery={searchQuery}
              localMatchCount={localMatchCount}
            />
          </div>

          <section
            className="flex-1 min-h-0 min-w-0 flex flex-col"
            aria-label={t("boardAria")}
          >
            <RoutineTaskList
              columns={filteredColumns}
              visibleColumnIds={visibleColumnIds}
              selectedColumnId={selectedColumnId}
              selectedTaskId={selectedTaskDetails?.task.id}
              deletingTaskIds={checkingDeleteTaskIds}
              isCompact={isCompact}
              onAddTaskToColumn={handleAddTaskToColumnSafe}
              onOpenDetails={handleOpenDetails}
              onEditTask={handleEditTask}
              onContextMenu={handleOpenTaskContextMenu}
              onToggleComplete={handleToggleComplete}
              onHabitChange={handleHabitChange}
              dndState={boardDnd}
            />
          </section>
        </>
      )}

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
      />

      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}
    </>
  );
}
