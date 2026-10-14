"use client";

import { Copy, Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CreateBoardColumnModal } from "@/components/tasks/CreateBoardColumnModal";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { DeleteBoardColumnModal } from "@/components/tasks/DeleteBoardColumnModal";
import { RoutineBoard } from "@/components/tasks/RoutineBoard";
import { RoutineFilters } from "@/components/tasks/RoutineFilters";
import { TaskDetailsPopover } from "@/components/tasks/TaskDetailsPopover";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import { useBoardFilters } from "@/hooks/useBoardFilters";
import { useBoardModals } from "@/hooks/useBoardModals";
import { useBoardTaskActions } from "@/hooks/useBoardTaskActions";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useRoutineColumns } from "@/hooks/useRoutineColumns";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { BoardColumn, ColumnSummary } from "@/types/task";
import { cn } from "@/utils";

interface TasksBoardContainerProps {
  initialColumns: BoardColumn[];
  initialOpenCreateColumn?: boolean;
}

/**
 * Container Orquestrador do Quadro Kanban de Rotinas.
 * Refatorado e desacoplado: consome hooks especializados para estado de colunas,
 * filtros, modais/menus e ações assíncronas de tarefas.
 */
export function TasksBoardContainer({
  initialColumns,
  initialOpenCreateColumn = false,
}: TasksBoardContainerProps) {
  const is_Premium = useUserStore((state) => state.is_Premium);
  const activeWorkspaceId = useWorkspaceStore(
    (state) => state.activeWorkspaceId,
  );
  const { isCompact } = useCompactMode();

  // 1. Hook de Colunas e Visibilidade
  const {
    columns,
    setColumns,
    visibleColumnIds,
    toggleColumnVisibility,
    ensureColumnVisible,
    canCreateColumn,
    maxColumns,
  } = useRoutineColumns(initialColumns, is_Premium);

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

  // 4. Hook de Ações e Mutações de Tarefas/Colunas
  const {
    handleColumnSaved,
    handleDeleteColumn,
    isDeletingColumn,
    handleDuplicateTask,
    handleTaskSaved,
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
    onTaskUpdatedInDetails: (updated) => {
      setSelectedTaskDetails((prev) =>
        prev ? { ...prev, task: updated } : null,
      );
    },
  });

  const columnsList: ColumnSummary[] = useMemo(
    () =>
      columns.map((col) => ({
        id: col.id,
        title: col.title,
        tasksCount: col.tasks.length,
      })),
    [columns],
  );

  return (
    <PageWrapper noScroll isCompact={isCompact}>
      {/* Banner de Boas-vindas */}
      <WelcomeCard
        compact
        title="Gerencie suas Tarefas!"
        subtitle="Organize seu Layout e mantenha o ritmo."
        bullets={[
          "Organize seu Layout e arraste colunas para a melhor ordem.",
          "Crie colunas apropriadas para cada contexto de tarefa.",
          "Classifique entre Diário, Hábito e Afazer (ToDo).",
        ]}
        imageSrc="/assets/undraw/task/undraw_next-task_jtbr 1.svg"
        imageWidth={isCompact ? 115 : 136}
        imageHeight={isCompact ? 75 : 93}
        className={cn(
          "rounded-xl border border-primary/30 bg-primary-dark/20 shrink-0 transition-all",
          isCompact ? "p-3 max-w-xl" : "p-4 sm:p-5 max-w-2xl",
        )}
      />

      {/* Barra de Filtros com Popover, Busca e Modo Foco */}
      <div className="shrink-0">
        <RoutineFilters
          search={searchQuery}
          onSearch={setSearchQuery}
          filters={filters}
          onFilterChange={setFilters}
          focusMode={focusMode}
          onToggleFocusMode={() => setFocusMode((prev) => !prev)}
          availableTags={availableTags}
          columnsCount={columns.length}
          maxColumns={maxColumns}
          isPremium={is_Premium}
          canCreateColumn={canCreateColumn}
          columnsList={columnsList}
          visibleColumnIds={visibleColumnIds}
          onToggleColumnVisibility={toggleColumnVisibility}
          onOpenCreateColumn={() =>
            setColumnModalState({ isOpen: true, columnToEdit: null })
          }
          onOpenCreateTask={() =>
            setTaskModalState({
              isOpen: true,
              columnId: columns[0]?.id,
              taskToEdit: null,
            })
          }
        />
      </div>

      {/* Quadro Kanban */}
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
          onAddColumn={() =>
            setColumnModalState({ isOpen: true, columnToEdit: null })
          }
          onAddTaskToColumn={(colId) =>
            setTaskModalState({
              isOpen: true,
              columnId: colId,
              taskToEdit: null,
            })
          }
          onOpenDetails={(task, columnId, anchorRect) =>
            setSelectedTaskDetails({ task, columnId, anchorRect })
          }
          onContextMenu={handleOpenTaskContextMenu}
          onOpenColumnMenu={handleOpenColumnContextMenu}
          onTaskMove={handleTaskMove}
          onColumnReorder={handleColumnReorder}
          onToggleComplete={handleToggleComplete}
          onHabitChange={handleHabitChange}
        />
      </section>

      {/* Menu de Contexto da Tarefa (botão direito) */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        items={[
          {
            label: "Editar",
            icon: <Pencil size={14} />,
            onClick: () => {
              if (contextMenu.task && contextMenu.columnId) {
                setTaskModalState({
                  isOpen: true,
                  columnId: contextMenu.columnId,
                  taskToEdit: contextMenu.task,
                });
              }
            },
          },
          {
            label: "Duplicar",
            icon: <Copy size={14} />,
            onClick: () => {
              if (contextMenu.task && contextMenu.columnId) {
                handleDuplicateTask(contextMenu.task, contextMenu.columnId);
              }
            },
          },
          {
            label: "Excluir",
            icon: <Trash2 size={14} />,
            variant: "destructive",
            onClick: () => {
              if (contextMenu.task && contextMenu.columnId) {
                handleDeleteTask(contextMenu.task, contextMenu.columnId);
              }
            },
          },
        ]}
      />

      {/* Menu de Contexto da Coluna (3 pontos) */}
      <ContextMenu
        isOpen={columnContextMenu.isOpen}
        position={columnContextMenu.position}
        onClose={() =>
          setColumnContextMenu((prev) => ({ ...prev, isOpen: false }))
        }
        items={[
          {
            label: "Editar",
            icon: <Pencil size={14} />,
            onClick: () => {
              if (columnContextMenu.column) {
                setColumnModalState({
                  isOpen: true,
                  columnToEdit: columnContextMenu.column,
                });
              }
            },
          },
          {
            label: "Excluir",
            icon: <Trash2 size={14} />,
            variant: "destructive",
            onClick: () => {
              if (columnContextMenu.column) {
                setColumnToDelete(columnContextMenu.column);
              }
            },
          },
        ]}
      />

      {/* Modal: Excluir Coluna */}
      <DeleteBoardColumnModal
        isOpen={Boolean(columnToDelete)}
        columnName={columnToDelete?.title || ""}
        isLoading={isDeletingColumn}
        onClose={() => {
          if (!isDeletingColumn) setColumnToDelete(null);
        }}
        onConfirm={async () => {
          if (columnToDelete) {
            const success = await handleDeleteColumn(columnToDelete);
            if (success) {
              setColumnToDelete(null);
            }
          }
        }}
      />

      {/* Modal: Criar / Editar Coluna */}
      <CreateBoardColumnModal
        isOpen={columnModalState.isOpen}
        columnToEdit={columnModalState.columnToEdit}
        onClose={closeColumnModal}
        onSuccess={handleColumnSaved}
      />

      {/* Modal: Criar / Editar Tarefa */}
      <CreateTaskModal
        isOpen={taskModalState.isOpen}
        onClose={() => setTaskModalState({ isOpen: false, taskToEdit: null })}
        columns={columns.map((c) => ({ id: c.id, title: c.title }))}
        defaultColumnId={taskModalState.columnId}
        taskToEdit={taskModalState.taskToEdit}
        onSuccess={handleTaskSaved}
      />

      {/* Popover Lateral: Detalhes Rápidos da Tarefa */}
      <TaskDetailsPopover
        isOpen={!!selectedTaskDetails}
        onClose={() => setSelectedTaskDetails(null)}
        task={selectedTaskDetails?.task ?? null}
        columnTitle={
          columns.find((c) => c.id === selectedTaskDetails?.columnId)?.title
        }
        anchorRect={selectedTaskDetails?.anchorRect}
        onTaskUpdate={handleTaskDetailsUpdate}
        onDelete={(_taskId) => {
          if (selectedTaskDetails) {
            handleDeleteTask(
              selectedTaskDetails.task,
              selectedTaskDetails.columnId,
            );
            setSelectedTaskDetails(null);
          }
        }}
        onToggleComplete={handleToggleComplete}
      />
    </PageWrapper>
  );
}
