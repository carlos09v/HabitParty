"use client";

import dynamic from "next/dynamic";
import { memo, useCallback, useMemo, useState } from "react";
import {
  buildColumnContextMenuItems,
  buildTaskContextMenuItems,
} from "@/components/tasks/shared";
import { ContextMenu } from "@/components/ui/ContextMenu";
import type { Task } from "@/types/task";
import type { TasksBoardModalsProps } from "@/types/task-ui";
import { shouldConfirmTaskDeletion } from "@/utils/validators";

const CreateBoardColumnModal = dynamic(
  () =>
    import("@/components/tasks/CreateBoardColumnModal").then((mod) => ({
      default: mod.CreateBoardColumnModal,
    })),
  { ssr: false },
);

const CreateTaskModal = dynamic(
  () =>
    import("@/components/tasks/CreateTaskModal").then((mod) => ({
      default: mod.CreateTaskModal,
    })),
  { ssr: false },
);

const ConfirmationModal = dynamic(
  () =>
    import("@/components/ui/ConfirmationModal").then((mod) => ({
      default: mod.ConfirmationModal,
    })),
  { ssr: false },
);

const RoutineColumnsDrawer = dynamic(
  () =>
    import("@/components/tasks/RoutineColumnsDrawer").then((mod) => ({
      default: mod.RoutineColumnsDrawer,
    })),
  { ssr: false },
);

const TaskDetailsPopover = dynamic(
  () =>
    import("@/components/tasks/TaskDetailsPopover").then((mod) => ({
      default: mod.TaskDetailsPopover,
    })),
  { ssr: false },
);

/**
 * Componente modular que isola todos os modais, popovers e menus de contexto do Kanban,
 * deixando o TasksBoardContainer focado exclusivamente na orquestração dos dados e layout.
 */
export const TasksBoardModals = memo(function TasksBoardModals({
  columns,
  formColumns,
  visibleColumnIds,
  maxColumns,
  isPremium,
  columnModalState,
  closeColumnModal,
  setColumnModalState,
  handleColumnSaved,
  taskModalState,
  setTaskModalState,
  handleTaskSaved,
  selectedTaskDetails,
  setSelectedTaskDetails,
  contextMenu,
  setContextMenu,
  columnContextMenu,
  setColumnContextMenu,
  columnToDelete,
  setColumnToDelete,
  isDeletingColumn,
  handleDeleteColumn,
  handleDuplicateTask,
  handleDeleteTask,
  handleTaskDetailsUpdate,
  handleToggleComplete,
  isColumnsDrawerOpen,
  setIsColumnsDrawerOpen,
  toggleColumnVisibility,
  showAllColumns,
  columnWidths,
  onColumnWidthChange,
}: TasksBoardModalsProps) {
  const [taskToDelete, setTaskToDelete] = useState<{
    task: Task;
    columnId: string;
  } | null>(null);

  const requestDeleteTask = useCallback(
    (task: Task, columnId: string) => {
      if (shouldConfirmTaskDeletion(task)) {
        setTaskToDelete({ task, columnId });
      } else {
        handleDeleteTask(task, columnId);
      }
    },
    [handleDeleteTask],
  );

  const taskContextMenuItems = useMemo(
    () =>
      buildTaskContextMenuItems({
        task: contextMenu.task,
        onEdit: (task) => {
          if (contextMenu.columnId) {
            setTaskModalState({
              isOpen: true,
              columnId: contextMenu.columnId,
              taskToEdit: task,
            });
          }
        },
        onDuplicate: (task) => {
          if (contextMenu.columnId) {
            handleDuplicateTask(task, contextMenu.columnId);
          }
        },
        onDelete: (task) => {
          if (contextMenu.columnId) {
            requestDeleteTask(task, contextMenu.columnId);
          }
        },
      }),
    [
      contextMenu.task,
      contextMenu.columnId,
      setTaskModalState,
      handleDuplicateTask,
      requestDeleteTask,
    ],
  );

  const columnContextMenuItems = useMemo(
    () =>
      buildColumnContextMenuItems({
        column: columnContextMenu.column,
        columnWidths,
        onColumnWidthChange,
        onEdit: (col) =>
          setColumnModalState({
            isOpen: true,
            columnToEdit: col,
          }),
        onDelete: (col) => setColumnToDelete(col),
      }),
    [
      columnContextMenu.column,
      columnWidths,
      onColumnWidthChange,
      setColumnModalState,
      setColumnToDelete,
    ],
  );

  return (
    <>
      {/* Menu de Contexto da Tarefa (botão direito) */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        items={taskContextMenuItems}
      />

      {/* Menu de Contexto da Coluna (3 pontos) */}
      <ContextMenu
        isOpen={columnContextMenu.isOpen}
        position={columnContextMenu.position}
        onClose={() =>
          setColumnContextMenu((prev) => ({ ...prev, isOpen: false }))
        }
        items={columnContextMenuItems}
      />

      {/* Modal: Excluir Coluna */}
      {Boolean(columnToDelete) && (
        <ConfirmationModal
          isOpen={Boolean(columnToDelete)}
          title="Excluir Coluna"
          description={
            <>
              Tem certeza de que deseja excluir a coluna{" "}
              <span className="font-bold text-neutral-100">
                &quot;{columnToDelete?.title}&quot;
              </span>
              ? Esta ação é irreversível e todas as tarefas desta coluna serão
              removidas permanentemente.
            </>
          }
          confirmText="Excluir Coluna"
          cancelText="Cancelar"
          variant="danger"
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
      )}

      {/* Modal: Excluir Tarefa Relevante (Checklist, Hardcore ou Ofensiva) */}
      {Boolean(taskToDelete) && (
        <ConfirmationModal
          isOpen={Boolean(taskToDelete)}
          title="Excluir Tarefa"
          description={
            <>
              Tem certeza de que deseja excluir a tarefa{" "}
              <span className="font-bold text-neutral-100">
                &quot;{taskToDelete?.task.title}&quot;
              </span>
              ? Esta tarefa possui subtarefas, Modo Hardcore ou histórico de
              ofensiva ativo, e a exclusão não pode ser desfeita.
            </>
          }
          confirmText="Excluir Tarefa"
          cancelText="Cancelar"
          variant="danger"
          onClose={() => setTaskToDelete(null)}
          onConfirm={() => {
            if (taskToDelete) {
              handleDeleteTask(taskToDelete.task, taskToDelete.columnId);
              setTaskToDelete(null);
            }
          }}
        />
      )}

      {/* Modal: Criar / Editar Coluna */}
      {columnModalState.isOpen && (
        <CreateBoardColumnModal
          isOpen={columnModalState.isOpen}
          columnToEdit={columnModalState.columnToEdit}
          onClose={closeColumnModal}
          onSuccess={handleColumnSaved}
        />
      )}

      {/* Modal: Criar / Editar Tarefa */}
      {taskModalState.isOpen && (
        <CreateTaskModal
          isOpen={taskModalState.isOpen}
          onClose={() =>
            setTaskModalState({
              isOpen: false,
              taskToEdit: null,
              defaultTaskType: undefined,
              initialTitle: undefined,
            })
          }
          columns={formColumns}
          defaultColumnId={taskModalState.columnId}
          defaultTaskType={taskModalState.defaultTaskType}
          initialTitle={taskModalState.initialTitle}
          taskToEdit={taskModalState.taskToEdit}
          onSuccess={handleTaskSaved}
        />
      )}

      {/* Popover Lateral: Detalhes Rápidos da Tarefa */}
      {Boolean(selectedTaskDetails) && (
        <TaskDetailsPopover
          isOpen={!!selectedTaskDetails}
          onClose={() => setSelectedTaskDetails(null)}
          task={selectedTaskDetails?.task ?? null}
          columnTitle={
            columns.find((c) => c.id === selectedTaskDetails?.columnId)?.title
          }
          anchorRect={selectedTaskDetails?.anchorRect}
          onTaskUpdate={handleTaskDetailsUpdate}
          onEdit={(task) => {
            if (selectedTaskDetails) {
              setTaskModalState({
                isOpen: true,
                columnId: selectedTaskDetails.columnId,
                taskToEdit: task,
              });
              setSelectedTaskDetails(null);
            }
          }}
          onDuplicate={(task) => {
            if (selectedTaskDetails) {
              handleDuplicateTask(task, selectedTaskDetails.columnId);
              setSelectedTaskDetails(null);
            }
          }}
          onDelete={(_taskId) => {
            if (selectedTaskDetails) {
              requestDeleteTask(
                selectedTaskDetails.task,
                selectedTaskDetails.columnId,
              );
              setSelectedTaskDetails(null);
            }
          }}
          onToggleComplete={handleToggleComplete}
        />
      )}

      {/* Gaveta Lateral: Gerenciar Colunas (carregada sob demanda) */}
      {isColumnsDrawerOpen && (
        <RoutineColumnsDrawer
          isOpen={isColumnsDrawerOpen}
          onClose={() => setIsColumnsDrawerOpen(false)}
          columns={columns}
          visibleColumnIds={visibleColumnIds}
          maxColumns={maxColumns}
          isPremium={isPremium}
          onToggleVisibility={toggleColumnVisibility}
          onShowAll={showAllColumns}
          onOpenCreateColumn={() =>
            setColumnModalState({ isOpen: true, columnToEdit: null })
          }
          onEditColumn={(col) =>
            setColumnModalState({ isOpen: true, columnToEdit: col })
          }
          onDeleteColumn={(col) => setColumnToDelete(col)}
        />
      )}
    </>
  );
});
