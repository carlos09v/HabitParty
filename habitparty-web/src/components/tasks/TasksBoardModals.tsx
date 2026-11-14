"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { memo, useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  buildColumnContextMenuItems,
  TaskModalsHost,
} from "@/components/tasks/shared";
import { ContextMenu } from "@/components/ui/ContextMenu";
import type { TasksBoardModalsProps } from "@/types/task-ui";

const CreateBoardColumnModal = dynamic(
  () =>
    import("@/components/tasks/CreateBoardColumnModal").then((mod) => ({
      default: mod.CreateBoardColumnModal,
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
  availableTargetWorkspaces,
  isWorkspaceReadOnly,
  onMoveColumnToWorkspace,
  onMoveLockedWorkspace,
}: TasksBoardModalsProps) {
  const t = useTranslations("tasks.container");
  const tFilters = useTranslations("tasks.filters");
  const tMenus = useTranslations("dashboard.taskShared.contextMenu");

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
        availableWorkspaces: availableTargetWorkspaces,
        isSourceWorkspaceReadOnly: isWorkspaceReadOnly,
        onColumnWidthChange,
        onEdit: (col) =>
          setColumnModalState({
            isOpen: true,
            columnToEdit: col,
            insertTarget: null,
          }),
        onInsertLeft: (col) => handleInsertColumnRelative(col, "left"),
        onInsertRight: (col) => handleInsertColumnRelative(col, "right"),
        onMoveToWorkspace: onMoveColumnToWorkspace
          ? (col, targetWorkspaceId, targetWorkspaceName) => {
              void onMoveColumnToWorkspace(
                col,
                targetWorkspaceId,
                targetWorkspaceName,
              );
            }
          : undefined,
        onMoveLockedWorkspace,
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
          moveTo: tMenus("moveTo"),
          noTargetWorkspaces: tMenus("noTargetWorkspaces"),
          vipBadge: tMenus("vipBadge"),
          readOnlyHint: tMenus("readOnlyWorkspaceHint"),
        },
      }),
    [
      columnContextMenu.column,
      columnWidths,
      availableTargetWorkspaces,
      isWorkspaceReadOnly,
      onColumnWidthChange,
      setColumnModalState,
      handleInsertColumnRelative,
      onMoveColumnToWorkspace,
      onMoveLockedWorkspace,
      setColumnToDelete,
      tMenus,
    ],
  );

  return (
    <>
      <TaskModalsHost
        columns={columns}
        formColumns={formColumns}
        availableTags={availableTags}
        defaultColumnId={columns[0]?.id}
        defaultColumnTitle={t("defaultColumnTitle")}
        contextMenu={contextMenu}
        onCloseContextMenu={() =>
          setContextMenu((prev) => ({ ...prev, isOpen: false }))
        }
        selectedTaskDetails={selectedTaskDetails}
        onCloseTaskDetails={() => setSelectedTaskDetails(null)}
        taskModalState={taskModalState}
        onCloseTaskModal={() =>
          setTaskModalState({
            isOpen: false,
            taskToEdit: null,
            defaultTaskType: undefined,
            initialTitle: undefined,
            initialValues: undefined,
          })
        }
        onOpenEditTask={(task, columnId) => {
          if (columnId) {
            setTaskModalState({
              isOpen: true,
              columnId,
              taskToEdit: task,
            });
          }
        }}
        onTaskSaved={handleTaskSaved}
        onTaskDetailsUpdate={handleTaskDetailsUpdate}
        onDuplicateTask={(task, columnId) => {
          if (columnId) {
            handleDuplicateTask(task, columnId);
          }
        }}
        onRequestDeleteTask={(task, columnId) => {
          if (columnId) {
            requestDeleteTask(task, columnId);
          }
        }}
        onToggleComplete={handleToggleComplete}
        onHabitChange={handleHabitChange}
        taskToDelete={taskToDelete}
        deleteHistory={deleteHistory}
        onDeleteHistoryChange={onDeleteHistoryChange}
        onConfirmDeleteTask={onConfirmDeleteTask}
        onCancelDeleteTask={onCancelDeleteTask}
        deleteModalLabels={{
          title: t("deleteTaskModal.title"),
          description: t.rich("deleteTaskModal.description", {
            title: taskToDelete?.task.title ?? "",
            bold: (chunks) => (
              <span className="font-bold text-neutral-100">{chunks}</span>
            ),
          }),
          confirmText: t("deleteTaskModal.confirmText"),
          cancelText: t("deleteTaskModal.cancelText"),
          deleteHistoryLabel: t("deleteTaskModal.deleteHistoryLabel"),
          deleteHistoryHint: t("deleteTaskModal.deleteHistoryHint"),
        }}
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
