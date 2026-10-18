"use client";

import {
  Check,
  Columns3,
  Copy,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Pencil,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { type Dispatch, memo, type SetStateAction } from "react";
import { ContextMenu } from "@/components/ui/ContextMenu";
import type { BoardColumn, Task, TaskTypeOption } from "@/types/task";
import type { ColumnWidthPreset } from "@/types/task-ui";

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

export interface TasksBoardModalsProps {
  columns: BoardColumn[];
  formColumns: { id: string; title: string }[];
  visibleColumnIds: string[];
  maxColumns: number;
  isPremium: boolean;
  columnModalState: { isOpen: boolean; columnToEdit?: BoardColumn | null };
  closeColumnModal: () => void;
  setColumnModalState: Dispatch<
    SetStateAction<{ isOpen: boolean; columnToEdit?: BoardColumn | null }>
  >;
  handleColumnSaved: (col: BoardColumn, isEdit?: boolean) => void;
  taskModalState: {
    isOpen: boolean;
    columnId?: string;
    defaultTaskType?: TaskTypeOption;
    initialTitle?: string;
    taskToEdit?: Task | null;
  };
  setTaskModalState: Dispatch<
    SetStateAction<{
      isOpen: boolean;
      columnId?: string;
      defaultTaskType?: TaskTypeOption;
      initialTitle?: string;
      taskToEdit?: Task | null;
    }>
  >;
  handleTaskSaved: (task: Task, columnId: string) => void;
  selectedTaskDetails: {
    task: Task;
    columnId: string;
    anchorRect?: DOMRect | null;
  } | null;
  setSelectedTaskDetails: Dispatch<
    SetStateAction<{
      task: Task;
      columnId: string;
      anchorRect?: DOMRect | null;
    } | null>
  >;
  contextMenu: {
    isOpen: boolean;
    position: { x: number; y: number };
    task: Task | null;
    columnId: string | null;
  };
  setContextMenu: Dispatch<
    SetStateAction<{
      isOpen: boolean;
      position: { x: number; y: number };
      task: Task | null;
      columnId: string | null;
    }>
  >;
  columnContextMenu: {
    isOpen: boolean;
    position: { x: number; y: number };
    column: BoardColumn | null;
  };
  setColumnContextMenu: Dispatch<
    SetStateAction<{
      isOpen: boolean;
      position: { x: number; y: number };
      column: BoardColumn | null;
    }>
  >;
  columnToDelete: BoardColumn | null;
  setColumnToDelete: (col: BoardColumn | null) => void;
  isDeletingColumn: boolean;
  handleDeleteColumn: (col: BoardColumn) => Promise<boolean>;
  handleDuplicateTask: (task: Task, columnId: string) => void;
  handleDeleteTask: (task: Task, columnId: string) => void;
  handleTaskDetailsUpdate: (task: Task) => void;
  handleToggleComplete: (taskId: string, completed: boolean) => void;
  isColumnsDrawerOpen: boolean;
  setIsColumnsDrawerOpen: (open: boolean) => void;
  toggleColumnVisibility: (id: string) => void;
  showAllColumns: () => void;
  columnWidths?: Record<string, ColumnWidthPreset>;
  onColumnWidthChange?: (columnId: string, width: ColumnWidthPreset) => void;
}

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
  return (
    <>
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
          ...(onColumnWidthChange && columnContextMenu.column
            ? [
                {
                  label: "Layout",
                  icon: <LayoutGrid size={14} />,
                  children: [
                    {
                      label: "Compacto",
                      icon:
                        (columnWidths?.[columnContextMenu.column.id] ||
                          "normal") === "compact" ? (
                          <Check size={14} className="text-gold shrink-0" />
                        ) : (
                          <Minimize2
                            size={14}
                            className="text-neutral-400 shrink-0"
                          />
                        ),
                      active:
                        (columnWidths?.[columnContextMenu.column.id] ||
                          "normal") === "compact",
                      onClick: () => {
                        if (columnContextMenu.column) {
                          onColumnWidthChange(
                            columnContextMenu.column.id,
                            "compact",
                          );
                        }
                      },
                    },
                    {
                      label: "Padrão",
                      icon:
                        (columnWidths?.[columnContextMenu.column.id] ||
                          "normal") === "normal" ? (
                          <Check size={14} className="text-gold shrink-0" />
                        ) : (
                          <Columns3
                            size={14}
                            className="text-neutral-400 shrink-0"
                          />
                        ),
                      active:
                        (columnWidths?.[columnContextMenu.column.id] ||
                          "normal") === "normal",
                      onClick: () => {
                        if (columnContextMenu.column) {
                          onColumnWidthChange(
                            columnContextMenu.column.id,
                            "normal",
                          );
                        }
                      },
                    },
                    {
                      label: "Largo",
                      icon:
                        (columnWidths?.[columnContextMenu.column.id] ||
                          "normal") === "wide" ? (
                          <Check size={14} className="text-gold shrink-0" />
                        ) : (
                          <Maximize2
                            size={14}
                            className="text-neutral-400 shrink-0"
                          />
                        ),
                      active:
                        (columnWidths?.[columnContextMenu.column.id] ||
                          "normal") === "wide",
                      onClick: () => {
                        if (columnContextMenu.column) {
                          onColumnWidthChange(
                            columnContextMenu.column.id,
                            "wide",
                          );
                        }
                      },
                    },
                  ],
                },
              ]
            : []),
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
              handleDeleteTask(
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
