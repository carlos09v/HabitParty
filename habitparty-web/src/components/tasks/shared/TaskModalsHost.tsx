"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { buildTaskContextMenuItems } from "@/components/tasks/shared/taskMenuBuilders";
import { ContextMenu } from "@/components/ui/ContextMenu";
import {
  applyFocusRecordedToTask,
  useFocusTaskSync,
} from "@/hooks/useFocusTaskSync";
import { useIdlePreload } from "@/hooks/useIdlePreload";
import type { useQuickFocusTask } from "@/hooks/useQuickFocusTask";
import { useUIStore } from "@/store/uiStore";
import type { Task, TaskTypeOption } from "@/types/task";
import type { InitialTaskFormData } from "@/types/task-ui";
import { resolveTaskColumnTitle } from "@/utils/taskMapper";

const CreateTaskModal = dynamic(
  () =>
    import("@/components/tasks/CreateTaskModal").then((mod) => ({
      default: mod.CreateTaskModal,
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

const ConfirmationModal = dynamic(
  () =>
    import("@/components/ui/ConfirmationModal").then((mod) => ({
      default: mod.ConfirmationModal,
    })),
  { ssr: false },
);

const SwitchFocusTargetModal = dynamic(
  () =>
    import("@/components/focus/modals/SwitchFocusTargetModal").then((mod) => ({
      default: mod.SwitchFocusTargetModal,
    })),
  { ssr: false },
);

function preloadSharedTaskModalChunks() {
  void import("@/components/tasks/CreateTaskModal");
  void import("@/components/tasks/TaskDetailsPopover");
}

export interface TaskModalsHostProps {
  columns: ReadonlyArray<{
    id?: string;
    name?: string;
    title?: string;
    workspaceName?: string;
  }>;
  formColumns: { id: string; title: string }[];
  availableTags?: string[];
  defaultColumnId?: string;
  defaultColumnTitle?: string;
  showWorkspaceName?: boolean;
  contextMenu: {
    isOpen: boolean;
    position: { x: number; y: number };
    task: Task | null;
    columnId?: string | null;
  };
  onCloseContextMenu: () => void;
  selectedTaskDetails: {
    task: Task;
    columnId?: string | null;
    anchorRect?: DOMRect | null;
  } | null;
  onCloseTaskDetails: () => void;
  taskModalState: {
    isOpen: boolean;
    taskToEdit?: Task | null;
    columnId?: string | null;
    defaultTaskType?: TaskTypeOption;
    initialTitle?: string;
    initialValues?: InitialTaskFormData;
  };
  onCloseTaskModal: () => void;
  onOpenEditTask: (task: Task, columnId?: string) => void;
  onTaskSaved: (savedTask: Task, targetColumnId: string) => void;
  onTaskDetailsUpdate: (updatedTask: Task) => void;
  onDuplicateTask: (task: Task, columnId?: string) => void;
  duplicatingTaskIds?: Set<string>;
  onRequestDeleteTask: (task: Task, columnId?: string) => void;
  onMoveTaskToColumn?: (task: Task, targetColumnId: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => boolean | undefined;
  onHabitChange?: (taskId: string, delta: number) => boolean | undefined;
  onStartFocus?: (task: Task) => void;
  quickFocus?: ReturnType<typeof useQuickFocusTask>;
  isReadOnly?: boolean;
  isTaskReadOnly?: (task: Task) => boolean;
  taskToDelete: { task: Task; columnId?: string } | null;
  deleteHistory: boolean;
  onDeleteHistoryChange: (checked: boolean) => void;
  onConfirmDeleteTask: () => void;
  onCancelDeleteTask: () => void;
  deleteModalLabels: {
    title: string;
    description: ReactNode;
    confirmText: string;
    cancelText: string;
    deleteHistoryLabel: string;
    deleteHistoryHint: string;
  };
}

/**
 * Hospedeiro compartilhado de Modais, Popovers e Menu de Contexto de Tarefas
 * entre o Dashboard (`DashboardTasksPanel`) e o Quadro Kanban (`TasksBoardModals`).
 */
export function TaskModalsHost({
  columns,
  formColumns,
  availableTags = [],
  defaultColumnId,
  defaultColumnTitle = "Geral",
  showWorkspaceName = false,
  contextMenu,
  onCloseContextMenu,
  selectedTaskDetails,
  onCloseTaskDetails,
  taskModalState,
  onCloseTaskModal,
  onOpenEditTask,
  onTaskSaved,
  onTaskDetailsUpdate,
  onDuplicateTask,
  duplicatingTaskIds,
  onRequestDeleteTask,
  onMoveTaskToColumn,
  onToggleComplete,
  onHabitChange,
  onStartFocus,
  quickFocus,
  isReadOnly = false,
  isTaskReadOnly,
  taskToDelete,
  deleteHistory,
  onDeleteHistoryChange,
  onConfirmDeleteTask,
  onCancelDeleteTask,
  deleteModalLabels,
}: TaskModalsHostProps) {
  const tMenus = useTranslations("dashboard.taskShared.contextMenu");
  useIdlePreload(
    preloadSharedTaskModalChunks,
    1200,
    columns.length > 0 && !isReadOnly,
  );

  const [focusHistoryTask, setFocusHistoryTask] = useState<Task | null>(null);

  // Mantém `focusHistoryTask` sincronizado com eventos externos de foco (ex.: conclusão via timer/PiP)
  // mesmo se o popover de detalhes já tiver sido fechado.
  useFocusTaskSync({
    onFocusRecorded: useCallback(
      (taskId: string, durationMinutes: number, cycles: number) => {
        setFocusHistoryTask((prev) =>
          prev && prev.id === taskId
            ? applyFocusRecordedToTask(prev, durationMinutes, cycles)
            : prev,
        );
      },
      [],
    ),
    onTaskCompleted: useCallback(
      (taskId: string, transformTask: (task: Task) => Task) => {
        setFocusHistoryTask((prev) =>
          prev && prev.id === taskId ? transformTask(prev) : prev,
        );
      },
      [],
    ),
  });

  // Quando o popover de detalhes da mesma tarefa ainda está montado, usa o objeto vivo do pai
  const resolvedFocusHistoryTask =
    focusHistoryTask && selectedTaskDetails?.task.id === focusHistoryTask.id
      ? selectedTaskDetails.task
      : focusHistoryTask;

  const isSelectedTaskReadOnly = Boolean(
    selectedTaskDetails &&
      (isReadOnly || isTaskReadOnly?.(selectedTaskDetails.task)),
  );

  const isFocusHistoryTaskReadOnly = Boolean(
    resolvedFocusHistoryTask &&
      (isReadOnly || isTaskReadOnly?.(resolvedFocusHistoryTask)),
  );

  const handleGuardedStartFocus = useCallback(
    (task: Task) => {
      if (onStartFocus) {
        onStartFocus(task);
        return;
      }
      if (isReadOnly || isTaskReadOnly?.(task)) {
        useUIStore.getState().openUpgradeModal();
        return;
      }
      quickFocus?.handleStartFocusTask(task);
    },
    [onStartFocus, isReadOnly, isTaskReadOnly, quickFocus],
  );

  const taskContextMenuItems = useMemo(() => {
    const activeTaskColumnId =
      contextMenu.columnId || contextMenu.task?.columnId || defaultColumnId;
    const moveColumns =
      onMoveTaskToColumn && !isReadOnly
        ? formColumns.map((col) => ({
            id: col.id,
            title: col.title,
            isCurrent: col.id === activeTaskColumnId,
          }))
        : undefined;

    return buildTaskContextMenuItems({
      task: contextMenu.task,
      onEdit: (task) => {
        const colId = contextMenu.columnId || task.columnId || defaultColumnId;
        onOpenEditTask(task, colId);
      },
      onDuplicate: (task) => {
        const colId = contextMenu.columnId || task.columnId || defaultColumnId;
        onDuplicateTask(task, colId);
      },
      onDelete: (task) => {
        const colId = contextMenu.columnId || task.columnId || defaultColumnId;
        onRequestDeleteTask(task, colId);
      },
      onStartFocus: handleGuardedStartFocus,
      moveColumns,
      onMoveToColumn: onMoveTaskToColumn,
      isDuplicating: Boolean(
        contextMenu.task && duplicatingTaskIds?.has(contextMenu.task.id),
      ),
      labels: {
        startFocus: tMenus("startFocus"),
        edit: tMenus("edit"),
        duplicate: tMenus("duplicate"),
        moveToColumn: tMenus("moveToColumn"),
        delete: tMenus("delete"),
      },
    });
  }, [
    contextMenu.task,
    contextMenu.columnId,
    defaultColumnId,
    duplicatingTaskIds,
    formColumns,
    isReadOnly,
    onOpenEditTask,
    onDuplicateTask,
    onRequestDeleteTask,
    onMoveTaskToColumn,
    handleGuardedStartFocus,
    tMenus,
  ]);

  return (
    <>
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={onCloseContextMenu}
        items={taskContextMenuItems}
      />

      {Boolean(taskToDelete) && (
        <ConfirmationModal
          isOpen={Boolean(taskToDelete)}
          title={deleteModalLabels.title}
          description={deleteModalLabels.description}
          confirmText={deleteModalLabels.confirmText}
          cancelText={deleteModalLabels.cancelText}
          variant="danger"
          checkboxLabel={deleteModalLabels.deleteHistoryLabel}
          checkboxHint={deleteModalLabels.deleteHistoryHint}
          checkboxChecked={deleteHistory}
          onCheckboxChange={onDeleteHistoryChange}
          onClose={onCancelDeleteTask}
          onConfirm={onConfirmDeleteTask}
        />
      )}

      {taskModalState.isOpen && (
        <CreateTaskModal
          key={
            taskModalState.taskToEdit?.id ??
            `new-${taskModalState.columnId ?? defaultColumnId ?? ""}-${taskModalState.defaultTaskType ?? ""}-${taskModalState.initialValues?.dueDate ?? ""}-${taskModalState.initialTitle ?? ""}`
          }
          isOpen={taskModalState.isOpen}
          onClose={onCloseTaskModal}
          columns={formColumns}
          availableTags={availableTags}
          defaultColumnId={taskModalState.columnId || defaultColumnId}
          defaultTaskType={taskModalState.defaultTaskType}
          initialTitle={taskModalState.initialTitle}
          initialValues={taskModalState.initialValues}
          taskToEdit={taskModalState.taskToEdit}
          onSuccess={onTaskSaved}
        />
      )}

      {selectedTaskDetails && (
        <TaskDetailsPopover
          key={selectedTaskDetails.task.id}
          isOpen={true}
          onClose={onCloseTaskDetails}
          task={selectedTaskDetails.task}
          availableTags={availableTags}
          columnTitle={resolveTaskColumnTitle(
            selectedTaskDetails.task,
            columns,
            defaultColumnTitle,
            selectedTaskDetails.columnId ?? undefined,
          )}
          workspaceName={
            showWorkspaceName
              ? selectedTaskDetails.task.workspaceName ||
                columns.find(
                  (c) =>
                    c.id ===
                    (selectedTaskDetails.columnId ||
                      selectedTaskDetails.task.columnId),
                )?.workspaceName
              : undefined
          }
          anchorRect={selectedTaskDetails.anchorRect}
          onTaskUpdate={onTaskDetailsUpdate}
          onEdit={(task) => {
            onOpenEditTask(
              task,
              selectedTaskDetails.columnId || task.columnId || defaultColumnId,
            );
          }}
          onDuplicate={(task) => {
            onDuplicateTask(
              task,
              selectedTaskDetails.columnId || task.columnId || defaultColumnId,
            );
          }}
          isDuplicating={Boolean(
            duplicatingTaskIds?.has(selectedTaskDetails.task.id),
          )}
          isReadOnly={isSelectedTaskReadOnly}
          onDelete={(_taskId) => {
            onRequestDeleteTask(
              selectedTaskDetails.task,
              selectedTaskDetails.columnId ||
                selectedTaskDetails.task.columnId ||
                defaultColumnId,
            );
          }}
          onToggleComplete={onToggleComplete}
          onHabitChange={onHabitChange}
          onOpenFocusHistory={(task) => setFocusHistoryTask(task)}
        />
      )}

      {resolvedFocusHistoryTask && (
        <TaskFocusHistoryModal
          isOpen={Boolean(resolvedFocusHistoryTask)}
          onClose={() => setFocusHistoryTask(null)}
          task={resolvedFocusHistoryTask}
          isReadOnly={isFocusHistoryTaskReadOnly}
          onTaskUpdate={(updated) => {
            onTaskDetailsUpdate(updated);
            setFocusHistoryTask(updated);
          }}
        />
      )}

      {quickFocus?.pendingFocusTask && quickFocus.currentFocusTarget && (
        <SwitchFocusTargetModal
          isOpen={true}
          onClose={quickFocus.clearPendingFocusTask}
          currentName={quickFocus.currentFocusTarget.name}
          newTargetName={quickFocus.pendingFocusTask.title}
          isCurrentInventory={
            quickFocus.currentFocusTarget.type === "inventory"
          }
          isCurrentTask={quickFocus.currentFocusTarget.type === "task"}
          isNewTask={true}
          onTransfer={quickFocus.handleTransferFocusTask}
          onSaveAndStartNew={quickFocus.handleSaveAndStartFocusTask}
          onDiscardAndStartNew={quickFocus.handleDiscardAndStartFocusTask}
        />
      )}
    </>
  );
}
