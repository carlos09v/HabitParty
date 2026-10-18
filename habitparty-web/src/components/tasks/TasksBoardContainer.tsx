"use client";

import { DndContext, DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { Crown, Lock } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { RoutineBoard } from "@/components/tasks/RoutineBoard";
import { RoutineColumn } from "@/components/tasks/RoutineColumn";
import { RoutineFilters } from "@/components/tasks/RoutineFilters";
import { RoutineTaskCard } from "@/components/tasks/RoutineTaskCard";
import { RoutineTaskList } from "@/components/tasks/RoutineTaskList";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { WELCOME_CARD_DETAILS } from "@/constants/welcomeCards";
import { useBoardFilters } from "@/hooks/useBoardFilters";
import { useBoardModals } from "@/hooks/useBoardModals";
import { useBoardTaskActions } from "@/hooks/useBoardTaskActions";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useRoutineBoardDnd } from "@/hooks/useRoutineBoardDnd";
import { useRoutineBoardLayout } from "@/hooks/useRoutineBoardLayout";
import { useRoutineColumns } from "@/hooks/useRoutineColumns";
import { useViewMode } from "@/hooks/useViewMode";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type {
  BoardColumn,
  CreateTaskDTO,
  Task,
  TaskTypeOption,
} from "@/types/task";
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

interface TasksBoardContainerProps {
  initialColumns: BoardColumn[];
  initialVisibleColumnIds?: string[];
  initialOpenCreateColumn?: boolean;
  targetColumnId?: string;
  isPremium?: boolean;
  workspaceId?: string | null;
  isCompact?: boolean;
}

/**
 * Container Orquestrador do Quadro Kanban de Rotinas.
 * Refatorado e desacoplado: consome hooks especializados para estado de colunas,
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
  const searchParams = useSearchParams();
  const effectiveTargetColumnId =
    targetColumnIdProp || searchParams.get("columnId") || undefined;

  const userStorePremium = useUserStore((state) => state.is_Premium);
  const activeWorkspaceIdFromStore = useWorkspaceStore(
    (state) => state.activeWorkspaceId,
  );
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const is_Premium = isPremiumProp ?? userStorePremium;
  const activeWorkspaceId = workspaceIdProp ?? activeWorkspaceIdFromStore;
  const { isCompact: hookIsCompact } = useCompactMode();
  const isCompact = isCompactProp ?? hookIsCompact;
  const [viewMode, setViewMode] = useViewMode("tasks", "card");
  const [isColumnsDrawerOpen, setIsColumnsDrawerOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const activeWorkspaceIndex = useMemo(() => {
    if (!activeWorkspaceId) return 0;
    const idx = workspaces.findIndex((w) => w.id === activeWorkspaceId);
    return idx >= 0 ? idx : 0;
  }, [workspaces, activeWorkspaceId]);

  const isWorkspaceReadOnly = !is_Premium && activeWorkspaceIndex >= 2;

  // 1. Hook de Colunas e Visibilidade
  const {
    columns,
    setColumns,
    visibleColumnIds,
    toggleColumnVisibility,
    showAllColumns,
    ensureColumnVisible,
    canCreateColumn,
    maxColumns,
  } = useRoutineColumns(
    initialColumns,
    is_Premium,
    activeWorkspaceId,
    initialVisibleColumnIds,
    effectiveTargetColumnId,
  );

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
  const {
    searchQuery,
    setSearchQuery,
    focusMode,
    setFocusMode,
    filters,
    setFilters,
    availableTags,
    filteredColumns,
  } = useBoardFilters(columns);

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

  // 4. Hook de Ações e Mutações de Tarefas/Colunas
  const {
    handleColumnSaved,
    handleDeleteColumn,
    isDeletingColumn,
    handleDuplicateTask,
    handleTaskSaved,
    handleQuickCreateTask,
    handleDeleteTask,
    handleTaskMove,
    handleColumnReorder,
    handleTaskDetailsUpdate,
    handleToggleComplete,
    handleHabitChange,
  } = useBoardTaskActions({
    columns,
    setColumns,
    activeWorkspaceId,
    visibleColumnIds,
    toggleColumnVisibility,
    onTaskUpdatedInDetails: handleTaskUpdatedInDetails,
  });

  const handleHideColumn = useCallback(
    (colId: string) => {
      const col = columns.find((c) => c.id === colId);
      toggleColumnVisibility(colId);
      toast.success(
        `Lista "${col?.title || "Coluna"}" guardada! Reexiba a qualquer momento no botão de colunas.`,
      );
    },
    [columns, toggleColumnVisibility],
  );

  const boardDnd = useRoutineBoardDnd({
    columns: filteredColumns,
    setColumns,
    onTaskMove: handleTaskMove,
    onColumnReorder: handleColumnReorder,
    onHideColumn: handleHideColumn,
  });

  const { stats: tasksStats } = useMemo(
    () => calculateTasksWelcomeStats(columns),
    [columns],
  );

  const columnStructureKey = columns.map((c) => `${c.id}:${c.title}`).join("|");
  // biome-ignore lint/correctness/useExhaustiveDependencies: Atualiza apenas quando colunas sao adicionadas ou renomeadas
  const formColumns = useMemo(
    () => columns.map((c) => ({ id: c.id, title: c.title })),
    [columnStructureKey, columns],
  );

  const handleOpenCreateColumn = useCallback(() => {
    if (isWorkspaceReadOnly) {
      setIsUpgradeModalOpen(true);
      toast.error(
        "Este ambiente está no modo somente leitura (Bloqueado). Reative o plano Premium para criar novas listas!",
      );
      return;
    }
    setColumnModalState({ isOpen: true, columnToEdit: null });
  }, [isWorkspaceReadOnly, setColumnModalState]);

  const handleOpenCreateTask = useCallback(() => {
    if (isWorkspaceReadOnly) {
      setIsUpgradeModalOpen(true);
      toast.error(
        "Este ambiente está no modo somente leitura (Bloqueado). Reative o plano Premium para criar novas tarefas!",
      );
      return;
    }
    setTaskModalState({
      isOpen: true,
      columnId: columns[0]?.id,
      taskToEdit: null,
    });
  }, [isWorkspaceReadOnly, columns, setTaskModalState]);

  const handleAddTaskToColumnSafe = useCallback(
    (colId: string, initialType?: TaskTypeOption, initialTitle?: string) => {
      if (isWorkspaceReadOnly) {
        setIsUpgradeModalOpen(true);
        toast.error(
          "Este ambiente está no modo somente leitura (Bloqueado). Reative o plano Premium para criar novas tarefas!",
        );
        return;
      }
      setTaskModalState({
        isOpen: true,
        columnId: colId,
        defaultTaskType: initialType,
        initialTitle: initialTitle,
        taskToEdit: null,
      });
    },
    [isWorkspaceReadOnly, setTaskModalState],
  );

  const handleQuickCreateTaskSafe = useCallback(
    async (
      title: string,
      columnId: string,
      taskType: TaskTypeOption = "TODO",
      extraPayload?: Partial<CreateTaskDTO>,
    ) => {
      if (isWorkspaceReadOnly) {
        setIsUpgradeModalOpen(true);
        toast.error(
          "Este ambiente está no modo somente leitura (Bloqueado). Reative o plano Premium para criar novas tarefas!",
        );
        return;
      }
      await handleQuickCreateTask(title, columnId, taskType, extraPayload);
    },
    [isWorkspaceReadOnly, handleQuickCreateTask],
  );

  const welcomeDetails = WELCOME_CARD_DETAILS.tasks;

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
        <div className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3 rounded-xl bg-gold/10 border border-gold/40 shadow-glow-gold-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center text-gold shrink-0">
              <Lock size={16} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-body-s font-bold text-neutral-100">
                  Ambiente em Modo Somente Leitura (Bloqueado 👑)
                </span>
                <span className="text-tiny uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">
                  VIP
                </span>
              </div>
              <p className="text-xs text-neutral-300">
                Suas tarefas e listas estão 100% preservadas. Para criar novas
                tarefas ou listas neste ambiente, reative o plano Premium.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold hover:bg-gold-hover text-neutral-900 font-bold text-xs shadow-glow-gold-xs transition-all cursor-pointer shrink-0"
          >
            <Crown size={14} className="fill-neutral-900" />
            <span>Reativar Premium</span>
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
          {/* Barra de Filtros com Popover, Busca, Modo Foco e Seletor de Visualização (Cards / Lista) */}
          <div className="shrink-0">
            <RoutineFilters
              search={searchQuery}
              onSearch={setSearchQuery}
              viewMode={{
                value: viewMode,
                onChange: setViewMode,
              }}
              filters={filters}
              onFilterChange={setFilters}
              focusMode={focusMode}
              onToggleFocusMode={() => setFocusMode((prev) => !prev)}
              alignment={alignment}
              onAlignmentChange={setAlignment}
              availableTags={availableTags}
              maxColumns={maxColumns}
              isPremium={is_Premium}
              canCreateColumn={isWorkspaceReadOnly ? false : canCreateColumn}
              visibleColumnIds={visibleColumnIds}
              onOpenColumnsDrawer={() => setIsColumnsDrawerOpen(true)}
              onOpenCreateColumn={handleOpenCreateColumn}
              onOpenCreateTask={handleOpenCreateTask}
              isDraggingColumn={Boolean(boardDnd.activeColumn)}
              enableDroppable={true}
            />
          </div>

          <section
            className="flex-1 min-h-0 min-w-0 flex flex-col"
            aria-label="Quadro de rotinas"
          >
            <RoutineBoard
              columns={filteredColumns}
              setColumns={setColumns}
              visibleColumnIds={visibleColumnIds}
              maxColumns={maxColumns}
              selectedColumnId={selectedColumnId}
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
          <div className="shrink-0">
            <RoutineFilters
              search={searchQuery}
              onSearch={setSearchQuery}
              viewMode={{
                value: viewMode,
                onChange: setViewMode,
              }}
              filters={filters}
              onFilterChange={setFilters}
              focusMode={focusMode}
              onToggleFocusMode={() => setFocusMode((prev) => !prev)}
              alignment={alignment}
              onAlignmentChange={setAlignment}
              availableTags={availableTags}
              maxColumns={maxColumns}
              isPremium={is_Premium}
              canCreateColumn={isWorkspaceReadOnly ? false : canCreateColumn}
              visibleColumnIds={visibleColumnIds}
              onOpenColumnsDrawer={() => setIsColumnsDrawerOpen(true)}
              onOpenCreateColumn={handleOpenCreateColumn}
              onOpenCreateTask={handleOpenCreateTask}
              isDraggingColumn={false}
              enableDroppable={false}
            />
          </div>

          <section
            className="flex-1 min-h-0 min-w-0 flex flex-col"
            aria-label="Quadro de rotinas"
          >
            <RoutineTaskList
              columns={filteredColumns}
              setColumns={setColumns}
              visibleColumnIds={visibleColumnIds}
              selectedColumnId={selectedColumnId}
              isCompact={isCompact}
              onAddTaskToColumn={handleAddTaskToColumnSafe}
              onOpenDetails={handleOpenDetails}
              onContextMenu={handleOpenTaskContextMenu}
              onTaskMove={handleTaskMove}
              onColumnReorder={handleColumnReorder}
              onToggleComplete={handleToggleComplete}
              onHabitChange={handleHabitChange}
            />
          </section>
        </>
      )}

      {/* Modais, Popovers e Menus de Contexto desacoplados */}
      <TasksBoardModals
        columns={columns}
        formColumns={formColumns}
        visibleColumnIds={visibleColumnIds}
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
        handleDeleteTask={handleDeleteTask}
        handleTaskDetailsUpdate={handleTaskDetailsUpdate}
        handleToggleComplete={handleToggleComplete}
        isColumnsDrawerOpen={isColumnsDrawerOpen}
        setIsColumnsDrawerOpen={setIsColumnsDrawerOpen}
        toggleColumnVisibility={toggleColumnVisibility}
        showAllColumns={showAllColumns}
        columnWidths={columnWidths}
        onColumnWidthChange={setColumnWidth}
      />

      <UpgradePremiumModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
}
