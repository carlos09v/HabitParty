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
  workspaceId,
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
  onCloseColumnContextMenu,
  columnToDelete,
  setColumnToDelete,
  isDeletingColumn,
  handleDeleteColumn,
  handleDuplicateTask,
  duplicatingTaskIds,
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
  isWorkspaceReadOnly = false,
  onMoveColumnToWorkspace,
  onMoveLockedWorkspace,
  onMoveTaskToColumn,
  onMoveColumnDirection,
  onStartFocus,
  quickFocus,
  onOpenEditTask,
  onOpenCreateColumn,
  ensureWriteAccess,
}: TasksBoardModalsProps) {
  const t = useTranslations("tasks.container");
  const tFilters = useTranslations("tasks.filters");
  const tMenus = useTranslations("dashboard.taskShared.contextMenu");

  const handleInsertColumnRelative = useCallback(
    (refColumn: (typeof columns)[number], position: "left" | "right") => {
      if (
        ensureWriteAccess &&
        !ensureWriteAccess(t("readOnlyCreateColumnToast"))
      ) {
        return;
      }
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
    [
      columns,
      ensureWriteAccess,
      isPremium,
      maxColumns,
      setColumnModalState,
      t,
      tFilters,
    ],
  );

  const handleRequestEditColumn = useCallback(
    (col: (typeof columns)[number]) => {
      if (
        ensureWriteAccess &&
        !ensureWriteAccess(t("readOnlyColumnActionToast"))
      ) {
        return;
      }
      setColumnModalState({
        isOpen: true,
        columnToEdit: col,
        insertTarget: null,
      });
    },
    [ensureWriteAccess, setColumnModalState, t],
  );

  const handleRequestDeleteColumn = useCallback(
    (col: (typeof columns)[number]) => {
      if (
        ensureWriteAccess &&
        !ensureWriteAccess(t("readOnlyColumnActionToast"))
      ) {
        return;
      }
      setColumnToDelete(col);
    },
    [ensureWriteAccess, setColumnToDelete, t],
  );

  const handleCloseColumnsDrawer = useCallback(() => {
    setIsColumnsDrawerOpen(false);
  }, [setIsColumnsDrawerOpen]);

  const handleRequestCreateColumn = useCallback(() => {
    if (onOpenCreateColumn) {
      onOpenCreateColumn();
      return;
    }
    if (
      ensureWriteAccess &&
      !ensureWriteAccess(t("readOnlyCreateColumnToast"))
    ) {
      return;
    }
    setColumnModalState({ isOpen: true, columnToEdit: null });
  }, [ensureWriteAccess, onOpenCreateColumn, setColumnModalState, t]);

  const columnContextMenuItems = useMemo(() => {
    const activeColIndex = columnContextMenu.column
      ? columns.findIndex((c) => c.id === columnContextMenu.column?.id)
      : -1;
    const canMoveLeft = activeColIndex > 0;
    const canMoveRight =
      activeColIndex >= 0 && activeColIndex < columns.length - 1;

    return buildColumnContextMenuItems({
      column: columnContextMenu.column,
      columnWidths,
      availableWorkspaces: availableTargetWorkspaces,
      isSourceWorkspaceReadOnly: isWorkspaceReadOnly,
      onColumnWidthChange,
      onEdit: handleRequestEditColumn,
      canMoveLeft: Boolean(onMoveColumnDirection && canMoveLeft),
      canMoveRight: Boolean(onMoveColumnDirection && canMoveRight),
      onMoveLeft: onMoveColumnDirection
        ? (col) => onMoveColumnDirection(col, "left")
        : undefined,
      onMoveRight: onMoveColumnDirection
        ? (col) => onMoveColumnDirection(col, "right")
        : undefined,
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
      onDelete: handleRequestDeleteColumn,
      labels: {
        edit: tMenus("edit"),
        delete: tMenus("delete"),
        moveLeft: tMenus("moveLeft"),
        moveRight: tMenus("moveRight"),
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
    });
  }, [
    columns,
    columnContextMenu.column,
    columnWidths,
    availableTargetWorkspaces,
    isWorkspaceReadOnly,
    onColumnWidthChange,
    onMoveColumnDirection,
    handleRequestEditColumn,
    handleInsertColumnRelative,
    onMoveColumnToWorkspace,
    onMoveLockedWorkspace,
    handleRequestDeleteColumn,
    tMenus,
  ]);

  const handleCloseTaskContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, isOpen: false }));
  }, [setContextMenu]);

  const handleCloseTaskDetails = useCallback(() => {
    setSelectedTaskDetails(null);
  }, [setSelectedTaskDetails]);

  const handleCloseTaskModal = useCallback(() => {
    setTaskModalState({
      isOpen: false,
      taskToEdit: null,
      defaultTaskType: undefined,
      initialTitle: undefined,
      initialValues: undefined,
    });
  }, [setTaskModalState]);

  const handleOpenEditTaskSafe = useCallback(
    (
      task: TasksBoardModalsProps["columns"][number]["tasks"][number],
      columnId?: string,
    ) => {
      if (onOpenEditTask) {
        onOpenEditTask(task, columnId);
        return;
      }
      if (
        ensureWriteAccess &&
        !ensureWriteAccess(t("readOnlyModifyTaskToast"))
      ) {
        return;
      }
      if (columnId) {
        setTaskModalState({
          isOpen: true,
          columnId,
          taskToEdit: task,
        });
      }
    },
    [ensureWriteAccess, onOpenEditTask, setTaskModalState, t],
  );

  const handleDuplicateTaskSafe = useCallback(
    (
      task: TasksBoardModalsProps["columns"][number]["tasks"][number],
      columnId?: string,
    ) => {
      if (columnId) {
        handleDuplicateTask(task, columnId);
      }
    },
    [handleDuplicateTask],
  );

  const handleRequestDeleteTaskSafe = useCallback(
    (
      task: TasksBoardModalsProps["columns"][number]["tasks"][number],
      columnId?: string,
    ) => {
      if (columnId) {
        requestDeleteTask(task, columnId);
      }
    },
    [requestDeleteTask],
  );

  const deleteModalLabels = useMemo(
    () => ({
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
    }),
    [t, taskToDelete?.task.title],
  );

  return (
    <>
      <TaskModalsHost
        columns={columns}
        formColumns={formColumns}
        availableTags={availableTags}
        defaultColumnId={columns[0]?.id}
        defaultColumnTitle={t("defaultColumnTitle")}
        isReadOnly={isWorkspaceReadOnly}
        quickFocus={quickFocus}
        contextMenu={contextMenu}
        onCloseContextMenu={handleCloseTaskContextMenu}
        selectedTaskDetails={selectedTaskDetails}
        onCloseTaskDetails={handleCloseTaskDetails}
        taskModalState={taskModalState}
        onCloseTaskModal={handleCloseTaskModal}
        onOpenEditTask={handleOpenEditTaskSafe}
        onTaskSaved={handleTaskSaved}
        onTaskDetailsUpdate={handleTaskDetailsUpdate}
        onDuplicateTask={handleDuplicateTaskSafe}
        duplicatingTaskIds={duplicatingTaskIds}
        onRequestDeleteTask={handleRequestDeleteTaskSafe}
        onMoveTaskToColumn={onMoveTaskToColumn}
        onToggleComplete={handleToggleComplete}
        onHabitChange={handleHabitChange}
        onStartFocus={onStartFocus}
        taskToDelete={taskToDelete}
        deleteHistory={deleteHistory}
        onDeleteHistoryChange={onDeleteHistoryChange}
        onConfirmDeleteTask={onConfirmDeleteTask}
        onCancelDeleteTask={onCancelDeleteTask}
        deleteModalLabels={deleteModalLabels}
      />

      {/* Menu de Contexto da Coluna (3 pontos) */}
      <ContextMenu
        isOpen={columnContextMenu.isOpen}
        position={columnContextMenu.position}
        onClose={onCloseColumnContextMenu}
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
          workspaceId={workspaceId}
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
          onClose={handleCloseColumnsDrawer}
          columns={columns}
          visibleColumnIds={visibleColumnIds}
          maxColumns={maxColumns}
          isPremium={isPremium}
          isReadOnly={isWorkspaceReadOnly}
          onToggleVisibility={toggleColumnVisibility}
          onShowAll={showAllColumns}
          onOpenCreateColumn={handleRequestCreateColumn}
          onEditColumn={handleRequestEditColumn}
          onDeleteColumn={handleRequestDeleteColumn}
        />
      )}
    </>
  );
});
