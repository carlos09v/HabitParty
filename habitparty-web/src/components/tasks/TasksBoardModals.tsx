"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { memo, useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  buildColumnContextMenuItems,
  buildTaskContextMenuItems,
} from "@/components/tasks/shared";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { useIdlePreload } from "@/hooks/useIdlePreload";
import type { Task } from "@/types/task";
import type { TasksBoardModalsProps } from "@/types/task-ui";
import { resolveTaskColumnTitle } from "@/utils/taskMapper";

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

const TaskFocusHistoryModal = dynamic(
  () =>
    import("@/components/tasks/TaskFocusHistoryModal").then((mod) => ({
      default: mod.TaskFocusHistoryModal,
    })),
  { ssr: false },
);

function preloadTasksBoardModalChunks() {
  void import("@/components/tasks/CreateTaskModal");
  void import("@/components/tasks/TaskDetailsPopover");
  void import("@/components/tasks/TaskFocusHistoryModal");
}

/**
 * Componente modular que isola todos os modais, popovers e menus de contexto do Kanban,
 * deixando o TasksBoardContainer focado exclusivamente na orquestração dos dados e layout.
 */
export const TasksBoardModals = memo(function TasksBoardModals({
  columns,
  formColumns,
  visibleColumnIds,
  availableTags = [],
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
  taskToDelete,
  deleteHistory,
  onDeleteHistoryChange,
  requestDeleteTask,
  onConfirmDeleteTask,
  onCancelDeleteTask,
  handleTaskDetailsUpdate,
  handleToggleComplete,
  handleHabitChange,
  isColumnsDrawerOpen,
  setIsColumnsDrawerOpen,
  toggleColumnVisibility,
  showAllColumns,
  columnWidths,
  onColumnWidthChange,
}: TasksBoardModalsProps) {
  const t = useTranslations("tasks.container");
  const tFilters = useTranslations("tasks.filters");
  const tMenus = useTranslations("dashboard.taskShared.contextMenu");
  useIdlePreload(preloadTasksBoardModalChunks);

  const [focusHistoryTask, setFocusHistoryTask] = useState<Task | null>(null);

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
        labels: {
          startFocus: tMenus("startFocus"),
          edit: tMenus("edit"),
          duplicate: tMenus("duplicate"),
          delete: tMenus("delete"),
        },
      }),
    [
      contextMenu.task,
      contextMenu.columnId,
      setTaskModalState,
      handleDuplicateTask,
      requestDeleteTask,
      tMenus,
    ],
  );

  const handleInsertColumnRelative = useCallback(
    (refColumn: (typeof columns)[number], position: "left" | "right") => {
      if (columns.length >= maxColumns) {
        toast.info(
          isPremium
            ? tFilters("newColumnMaxReachedTitle", { max: maxColumns })
            : tFilters("newColumnFreeLimitTitle", { max: maxColumns }),
        );
        return;
      }
      const refIdx = columns.findIndex((c) => c.id === refColumn.id);
      const baseIndex = refIdx >= 0 ? refIdx : columns.length;
      const orderIndex = position === "left" ? baseIndex : baseIndex + 1;
      setColumnModalState({
        isOpen: true,
        columnToEdit: null,
        insertTarget: {
          referenceColumnId: refColumn.id,
          position,
          orderIndex,
        },
      });
    },
    [columns, maxColumns, isPremium, setColumnModalState, tFilters],
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
            insertTarget: null,
          }),
        onInsertLeft: (col) => handleInsertColumnRelative(col, "left"),
        onInsertRight: (col) => handleInsertColumnRelative(col, "right"),
        onDelete: (col) => setColumnToDelete(col),
        labels: {
          edit: tMenus("edit"),
          delete: tMenus("delete"),
          insertLeft: tMenus("insertLeft"),
          insertRight: tMenus("insertRight"),
          layout: tMenus("layout"),
          compact: tMenus("compact"),
          normal: tMenus("normal"),
          wide: tMenus("wide"),
        },
      }),
    [
      columnContextMenu.column,
      columnWidths,
      onColumnWidthChange,
      setColumnModalState,
      handleInsertColumnRelative,
      setColumnToDelete,
      tMenus,
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
          title={t("deleteColumnModal.title")}
          description={t.rich("deleteColumnModal.description", {
            title: columnToDelete?.title ?? "",
            bold: (chunks) => (
              <span className="font-bold text-neutral-100">{chunks}</span>
            ),
          })}
          confirmText={t("deleteColumnModal.confirmText")}
          cancelText={t("deleteColumnModal.cancelText")}
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

      {/* Modal: Excluir Tarefa */}
      {Boolean(taskToDelete) && (
        <ConfirmationModal
          isOpen={Boolean(taskToDelete)}
          title={t("deleteTaskModal.title")}
          description={t.rich("deleteTaskModal.description", {
            title: taskToDelete?.task.title ?? "",
            bold: (chunks) => (
              <span className="font-bold text-neutral-100">{chunks}</span>
            ),
          })}
          confirmText={t("deleteTaskModal.confirmText")}
          cancelText={t("deleteTaskModal.cancelText")}
          variant="danger"
          checkboxLabel={t("deleteTaskModal.deleteHistoryLabel")}
          checkboxHint={t("deleteTaskModal.deleteHistoryHint")}
          checkboxChecked={deleteHistory}
          onCheckboxChange={onDeleteHistoryChange}
          onClose={onCancelDeleteTask}
          onConfirm={onConfirmDeleteTask}
        />
      )}

      {/* Modal: Criar / Editar Coluna */}
      {columnModalState.isOpen && (
        <CreateBoardColumnModal
          isOpen={columnModalState.isOpen}
          columnToEdit={columnModalState.columnToEdit}
          insertTarget={columnModalState.insertTarget}
          onClose={closeColumnModal}
          onSuccess={handleColumnSaved}
        />
      )}

      {/* Modal: Criar / Editar Tarefa */}
      {taskModalState.isOpen && (
        <CreateTaskModal
          key={
            taskModalState.taskToEdit?.id ??
            `new-${taskModalState.columnId ?? ""}-${taskModalState.defaultTaskType ?? ""}-${taskModalState.initialTitle ?? ""}`
          }
          isOpen={taskModalState.isOpen}
          onClose={() =>
            setTaskModalState({
              isOpen: false,
              taskToEdit: null,
              defaultTaskType: undefined,
              initialTitle: undefined,
              initialValues: undefined,
            })
          }
          columns={formColumns}
          availableTags={availableTags}
          defaultColumnId={taskModalState.columnId}
          defaultTaskType={taskModalState.defaultTaskType}
          initialTitle={taskModalState.initialTitle}
          initialValues={taskModalState.initialValues}
          taskToEdit={taskModalState.taskToEdit}
          onSuccess={handleTaskSaved}
        />
      )}

      {/* Popover Lateral: Detalhes Rápidos da Tarefa */}
      {selectedTaskDetails && (
        <TaskDetailsPopover
          key={selectedTaskDetails.task.id}
          isOpen={true}
          onClose={() => setSelectedTaskDetails(null)}
          task={selectedTaskDetails.task}
          availableTags={availableTags}
          columnTitle={resolveTaskColumnTitle(
            selectedTaskDetails.task,
            columns,
            t("defaultColumnTitle"),
            selectedTaskDetails.columnId,
          )}
          anchorRect={selectedTaskDetails.anchorRect}
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
          onHabitChange={handleHabitChange}
          onOpenFocusHistory={(task) => setFocusHistoryTask(task)}
        />
      )}

      {/* Modal Dedicado de Histórico de Foco da Tarefa */}
      {focusHistoryTask && (
        <TaskFocusHistoryModal
          isOpen={Boolean(focusHistoryTask)}
          onClose={() => setFocusHistoryTask(null)}
          task={focusHistoryTask}
          onTaskUpdate={handleTaskDetailsUpdate}
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
