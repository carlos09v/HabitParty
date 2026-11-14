"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { type ReactNode, useMemo, useState } from "react";
import { buildTaskContextMenuItems } from "@/components/tasks/shared/taskMenuBuilders";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { useIdlePreload } from "@/hooks/useIdlePreload";
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

function preloadSharedTaskModalChunks() {
  void import("@/components/tasks/CreateTaskModal");
  void import("@/components/tasks/TaskDetailsPopover");
  void import("@/components/tasks/TaskFocusHistoryModal");
}

export interface TaskModalsHostProps {
  columns: ReadonlyArray<{ id?: string; name?: string; title?: string }>;
  formColumns: { id: string; title: string }[];
  availableTags?: string[];
  defaultColumnId?: string;
  defaultColumnTitle?: string;
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
  onRequestDeleteTask: (task: Task, columnId?: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onHabitChange?: (taskId: string, delta: number) => void;
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
  onRequestDeleteTask,
  onToggleComplete,
  onHabitChange,
  taskToDelete,
  deleteHistory,
  onDeleteHistoryChange,
  onConfirmDeleteTask,
  onCancelDeleteTask,
  deleteModalLabels,
}: TaskModalsHostProps) {
  const tMenus = useTranslations("dashboard.taskShared.contextMenu");
  useIdlePreload(preloadSharedTaskModalChunks);

  const [focusHistoryTask, setFocusHistoryTask] = useState<Task | null>(null);

  const taskContextMenuItems = useMemo(
    () =>
      buildTaskContextMenuItems({
        task: contextMenu.task,
        onEdit: (task) => {
          const colId =
            contextMenu.columnId || task.columnId || defaultColumnId;
          onOpenEditTask(task, colId);
        },
        onDuplicate: (task) => {
          const colId =
            contextMenu.columnId || task.columnId || defaultColumnId;
          onDuplicateTask(task, colId);
        },
        onDelete: (task) => {
          const colId =
            contextMenu.columnId || task.columnId || defaultColumnId;
          onRequestDeleteTask(task, colId);
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
      defaultColumnId,
      onOpenEditTask,
      onDuplicateTask,
      onRequestDeleteTask,
      tMenus,
    ],
  );

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
            `new-${taskModalState.columnId ?? defaultColumnId ?? ""}-${taskModalState.defaultTaskType ?? ""}-${taskModalState.initialTitle ?? ""}`
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
          anchorRect={selectedTaskDetails.anchorRect}
          onTaskUpdate={onTaskDetailsUpdate}
          onEdit={(task) => {
            onOpenEditTask(
              task,
              selectedTaskDetails.columnId || task.columnId || defaultColumnId,
            );
            onCloseTaskDetails();
          }}
          onDuplicate={(task) => {
            onDuplicateTask(
              task,
              selectedTaskDetails.columnId || task.columnId || defaultColumnId,
            );
            onCloseTaskDetails();
          }}
          onDelete={(_taskId) => {
            onRequestDeleteTask(
              selectedTaskDetails.task,
              selectedTaskDetails.columnId ||
                selectedTaskDetails.task.columnId ||
                defaultColumnId,
            );
            onCloseTaskDetails();
          }}
          onToggleComplete={onToggleComplete}
          onHabitChange={onHabitChange}
          onOpenFocusHistory={(task) => setFocusHistoryTask(task)}
        />
      )}

      {focusHistoryTask && (
        <TaskFocusHistoryModal
          isOpen={Boolean(focusHistoryTask)}
          onClose={() => setFocusHistoryTask(null)}
          task={focusHistoryTask}
          onTaskUpdate={(updated) => {
            onTaskDetailsUpdate(updated);
            setFocusHistoryTask(updated);
          }}
        />
      )}
    </>
  );
}
