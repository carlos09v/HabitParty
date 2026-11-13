"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { Crown, Lock } from "lucide-react";
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
import { WorkspaceSearchHintBanner } from "@/components/tasks/WorkspaceSearchHintBanner";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { WELCOME_CARD_DETAILS } from "@/constants/welcomeCards";
import { useBoardFilters } from "@/hooks/useBoardFilters";
import { useBoardModals } from "@/hooks/useBoardModals";
import { useBoardTaskActions } from "@/hooks/useBoardTaskActions";
import { useRoutineBoardDnd } from "@/hooks/useRoutineBoardDnd";
import { useRoutineBoardLayout } from "@/hooks/useRoutineBoardLayout";
import { useRoutineColumns } from "@/hooks/useRoutineColumns";
import { useTaskDeleteFlow } from "@/hooks/useTaskDeleteFlow";
import { useViewMode } from "@/hooks/useViewMode";
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
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const activeWorkspaceIndex = useMemo(() => {
    if (!activeWorkspaceId) return 0;
    const idx = workspaces.findIndex((w) => w.id === activeWorkspaceId);
    return idx >= 0 ? idx : 0;
  }, [workspaces, activeWorkspaceId]);

  const isWorkspaceReadOnly = !is_Premium && activeWorkspaceIndex >= 2;

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

  const ensureWriteAccess = useCallback(
    (errorMessage: string): boolean => {
      if (isWorkspaceReadOnly) {
        setIsUpgradeModalOpen(true);
        toast.error(errorMessage);
        return false;
      }
      return true;
    },
    [isWorkspaceReadOnly],
  );

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
        <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3 rounded-xl bg-amber-500/10 border border-amber-500/35 shadow-xs dark:bg-gold/10 dark:border-gold/40 dark:shadow-glow-gold-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/35 flex items-center justify-center text-amber-700 dark:bg-gold/20 dark:border-gold/40 dark:text-gold shrink-0">
              <Lock size={16} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-body-s font-bold text-neutral-100">
                  {t("readOnlyTitle")}
                </span>
                <span className="text-tiny uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-800 border border-amber-500/30 dark:bg-gold/20 dark:text-gold dark:border-gold/30">
                  VIP
                </span>
              </div>
              <p className="text-xs text-neutral-300">
                {t("readOnlyDescription")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold hover:bg-gold-hover text-on-gold font-bold text-xs shadow-xs dark:shadow-glow-gold-xs transition-colors cursor-pointer shrink-0"
          >
            <Crown size={14} className="fill-on-gold" />
            <span>{t("reactivatePremium")}</span>
          </button>
        </div>
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
              setColumns={setColumns}
              visibleColumnIds={visibleColumnIds}
              maxColumns={maxColumns}
              selectedColumnId={selectedColumnId}
              selectedTaskId={selectedTaskDetails?.task.id}
              deletingTaskIds={checkingDeleteTaskIds}
              isCompact={isCompact}
              alignment={alignment}
              columnWidths={columnWidths}
              getColumnWidthClass={getColumnWidthClass}
              onAddColumn={handleOpenCreateColumn}
              onOpenColumnsDrawer={handleOpenColumnsDrawer}
              onViewModeChange={setViewMode}
              onAddTaskToColumn={handleAddTaskToColumnSafe}
              onQuickCreateTask={handleQuickCreateTaskSafe}
              onOpenDetails={handleOpenDetails}
              onEditTask={handleEditTask}
              onContextMenu={handleOpenTaskContextMenu}
              onOpenColumnMenu={handleOpenColumnContextMenu}
              onTaskMove={handleTaskMove}
              onColumnReorder={handleColumnReorder}
              onToggleComplete={handleToggleComplete}
              onHabitChange={handleHabitChange}
              dndState={boardDnd}
              onHideColumn={handleHideColumn}
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
              setColumns={setColumns}
              visibleColumnIds={visibleColumnIds}
              selectedColumnId={selectedColumnId}
              selectedTaskId={selectedTaskDetails?.task.id}
              deletingTaskIds={checkingDeleteTaskIds}
              isCompact={isCompact}
              onAddTaskToColumn={handleAddTaskToColumnSafe}
              onOpenDetails={handleOpenDetails}
              onEditTask={handleEditTask}
              onContextMenu={handleOpenTaskContextMenu}
              onTaskMove={handleTaskMove}
              onColumnReorder={handleColumnReorder}
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
