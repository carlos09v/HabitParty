"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { TaskFilters } from "@/components/dashboard/TaskFilters";
import { TaskTable } from "@/components/dashboard/TaskTable";
import { TaskModalsHost } from "@/components/tasks/shared";
import { DASHBOARD_ITEMS_PER_PAGE } from "@/constants/dashboard";
import { useDashboardTaskActions } from "@/hooks/useDashboardTaskActions";
import { useDashboardTaskFilters } from "@/hooks/useDashboardTaskFilters";
import {
  applyFocusRecordedToTask,
  useFocusTaskSync,
} from "@/hooks/useFocusTaskSync";
import { useQuickFocusTask } from "@/hooks/useQuickFocusTask";
import { useTaskDeleteFlow } from "@/hooks/useTaskDeleteFlow";
import { useTaskInteractionModals } from "@/hooks/useTaskInteractionModals";
import type { DashboardTasksPanelProps } from "@/types/dashboard";
import type { Task, TaskFilterType } from "@/types/task";
import { cn } from "@/utils";
import { extractAvailableTagOptions } from "@/utils/tags";
import { buildReadOnlySets, isTaskInReadOnlyScope } from "@/utils/taskMapper";

const UpgradePremiumModal = dynamic(
  () =>
    import("@/components/subscription/UpgradePremiumModal").then((mod) => ({
      default: mod.UpgradePremiumModal,
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

export function DashboardTasksPanel({
  initialTasks,
  columns,
  workspaces = [],
  defaultColumnId: explicitDefaultColumnId,
  isCompact = false,
  isReadOnly = false,
  tasks: externalTasks,
  onTasksChange,
  hasColumns = true,
  onCreateFirstColumn,
}: DashboardTasksPanelProps) {
  const t = useTranslations("dashboard.tasksPanel");
  const searchParams = useSearchParams();

  const [internalTasks, setInternalTasks] = useState<Task[]>(initialTasks);

  // Sincroniza estado local caso os dados do servidor mudem
  useEffect(() => {
    setInternalTasks(initialTasks);
  }, [initialTasks]);

  const tasksState = externalTasks ?? internalTasks;
  const setTasksState = onTasksChange ?? setInternalTasks;

  const {
    taskModalState,
    setTaskModalState,
    closeTaskModal,
    selectedTaskDetails,
    setSelectedTaskDetails,
    handleOpenTaskDetails,
    closeTaskDetails,
    contextMenu,
    handleOpenTaskContextMenu,
    closeContextMenu,
  } = useTaskInteractionModals();

  // Sincroniza eventos de foco com a lista local (quando não delegada ao DashboardMain) e com o popover aberto
  useFocusTaskSync({
    onFocusRecorded: useCallback(
      (taskId: string, durationMinutes: number, cycles: number) => {
        if (!onTasksChange) {
          setInternalTasks((prev) =>
            prev.map((task) =>
              task.id === taskId
                ? applyFocusRecordedToTask(task, durationMinutes, cycles)
                : task,
            ),
          );
        }
        setSelectedTaskDetails((prev) =>
          prev && prev.task.id === taskId
            ? {
                ...prev,
                task: applyFocusRecordedToTask(
                  prev.task,
                  durationMinutes,
                  cycles,
                ),
              }
            : prev,
        );
      },
      [onTasksChange, setSelectedTaskDetails],
    ),
    onTaskCompleted: useCallback(
      (taskId: string, transformTask: (task: Task) => Task) => {
        if (!onTasksChange) {
          setInternalTasks((prev) =>
            prev.map((task) =>
              task.id === taskId ? transformTask(task) : task,
            ),
          );
        }
        setSelectedTaskDetails((prev) =>
          prev && prev.task.id === taskId
            ? {
                ...prev,
                task: transformTask(prev.task),
              }
            : prev,
        );
      },
      [onTasksChange, setSelectedTaskDetails],
    ),
  });

  const hasMultipleWorkspaces = workspaces.length > 1;
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const {
    pendingFocusTask,
    currentFocusTarget,
    clearPendingFocusTask,
    handleStartFocusTask,
    handleSaveAndStartFocusTask,
    handleDiscardAndStartFocusTask,
  } = useQuickFocusTask();

  const validWorkspaceIds = useMemo(
    () => workspaces.map((w) => w.id).filter((id): id is string => Boolean(id)),
    [workspaces],
  );
  const validColumnIds = useMemo(
    () => columns.map((c) => c.id).filter((id): id is string => Boolean(id)),
    [columns],
  );

  const { readOnlyWorkspaceIds, readOnlyColumnIds } = useMemo(
    () => buildReadOnlySets(workspaces, columns),
    [workspaces, columns],
  );

  const writableColumns = useMemo(
    () => columns.filter((c) => c.id && !readOnlyColumnIds.has(c.id)),
    [columns, readOnlyColumnIds],
  );

  const defaultColumnId =
    explicitDefaultColumnId || writableColumns[0]?.id || columns[0]?.id;

  const availableTags = useMemo(
    () => extractAvailableTagOptions(tasksState),
    [tasksState],
  );

  const {
    activeFilter,
    setActiveFilter,
    selectedDate,
    handleClearDate,
    advancedFilters,
    setAdvancedFilters,
    filteredTasks,
    overdueCount,
  } = useDashboardTaskFilters(tasksState, validWorkspaceIds, validColumnIds);

  const handleTaskUpdatedInDetailsSync = useCallback(
    (updatedTask: Task) => {
      setSelectedTaskDetails((prev) =>
        prev && prev.task.id === updatedTask.id
          ? { ...prev, task: updatedTask }
          : prev,
      );
    },
    [setSelectedTaskDetails],
  );

  const handleTaskDeletedSync = useCallback(
    (deletedTaskId: string) => {
      setSelectedTaskDetails((prev) =>
        prev && prev.task.id === deletedTaskId ? null : prev,
      );
    },
    [setSelectedTaskDetails],
  );

  const {
    handleToggleComplete,
    handleHabitChange,
    handleDeleteTask,
    handleDuplicateTask,
    handleTaskSaved,
    handleTaskDetailsUpdate,
  } = useDashboardTaskActions({
    tasks: tasksState,
    columns,
    setTasks: setTasksState,
    defaultColumnId,
    onTaskUpdatedInDetails: handleTaskUpdatedInDetailsSync,
    onTaskDeleted: handleTaskDeletedSync,
  });

  // Paginação local inteligente sem recarregar o servidor a cada clique
  const pageParam = searchParams.get("page");
  const [currentPage, setCurrentPage] = useState<number>(
    pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1,
  );

  // Sincroniza página caso o parâmetro de busca da URL mude externamente (ex: filtro do calendário)
  useEffect(() => {
    if (pageParam) {
      const parsed = parseInt(pageParam, 10);
      if (!Number.isNaN(parsed) && parsed >= 1) {
        setCurrentPage(parsed);
      }
    } else {
      setCurrentPage(1);
    }
  }, [pageParam]);

  const handleFilterChangeWithReset = useCallback(
    (filter: TaskFilterType) => {
      setCurrentPage(1);
      setActiveFilter(filter);
    },
    [setActiveFilter],
  );

  const handleClearDateWithReset = useCallback(() => {
    setCurrentPage(1);
    handleClearDate();
  }, [handleClearDate]);

  const handleAdvancedFiltersChangeWithReset = useCallback(
    (filters: typeof advancedFilters) => {
      setCurrentPage(1);
      setAdvancedFilters(filters);
    },
    [setAdvancedFilters],
  );

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

  const handleOpenContextMenu = useCallback(
    (e: React.MouseEvent, task: Task) => {
      handleOpenTaskContextMenu(e, task, task.columnId);
    },
    [handleOpenTaskContextMenu],
  );

  const handleOpenDetails = useCallback(
    (task: Task, anchorRect?: DOMRect) => {
      handleOpenTaskDetails(task, task.columnId, anchorRect);
    },
    [handleOpenTaskDetails],
  );

  const isTaskReadOnly = useCallback(
    (task: Task, columnId?: string) =>
      isTaskInReadOnlyScope(
        task,
        readOnlyWorkspaceIds,
        readOnlyColumnIds,
        columnId,
      ),
    [readOnlyWorkspaceIds, readOnlyColumnIds],
  );

  const ensureTaskWritable = useCallback(
    (task: Task, columnId?: string): boolean => {
      if (isTaskReadOnly(task, columnId)) {
        setIsUpgradeModalOpen(true);
        toast.error(t("readOnlyTaskActionError"));
        return false;
      }
      return true;
    },
    [isTaskReadOnly, t],
  );

  const ensureTaskIdWritable = useCallback(
    (taskId: string): boolean => {
      const target = tasksState.find((item) => item.id === taskId);
      if (target && isTaskReadOnly(target)) {
        setIsUpgradeModalOpen(true);
        toast.error(t("readOnlyTaskActionError"));
        return false;
      }
      return true;
    },
    [tasksState, isTaskReadOnly, t],
  );

  const defaultWritableColumnId = useMemo(() => {
    const filteredWsCol =
      advancedFilters.workspaceId !== "all"
        ? writableColumns.find(
            (c) => c.workspaceId === advancedFilters.workspaceId && c.id,
          )?.id
        : undefined;
    return filteredWsCol || defaultColumnId;
  }, [writableColumns, advancedFilters.workspaceId, defaultColumnId]);

  const handleOpenCreateTaskModal = useCallback(() => {
    if (writableColumns.length === 0) {
      setIsUpgradeModalOpen(true);
      toast.error(t("newTaskNoWritableTitle"));
      return;
    }
    closeTaskDetails();
    setTaskModalState({
      isOpen: true,
      taskToEdit: null,
      columnId: defaultWritableColumnId,
    });
  }, [
    writableColumns.length,
    defaultWritableColumnId,
    closeTaskDetails,
    setTaskModalState,
    t,
  ]);

  const handleEditTask = useCallback(
    (task: Task, columnId?: string) => {
      if (!ensureTaskWritable(task, columnId)) return;
      closeTaskDetails();
      setTaskModalState({
        isOpen: true,
        taskToEdit: task,
        columnId: columnId || task.columnId || defaultWritableColumnId,
      });
    },
    [
      ensureTaskWritable,
      defaultWritableColumnId,
      closeTaskDetails,
      setTaskModalState,
    ],
  );

  const guardedToggleComplete = useCallback(
    (taskId: string, completed: boolean) => {
      if (!ensureTaskIdWritable(taskId)) return;
      handleToggleComplete(taskId, completed);
    },
    [ensureTaskIdWritable, handleToggleComplete],
  );

  const guardedHabitChange = useCallback(
    (taskId: string, delta: number) => {
      if (!ensureTaskIdWritable(taskId)) return;
      handleHabitChange(taskId, delta);
    },
    [ensureTaskIdWritable, handleHabitChange],
  );

  const guardedDuplicateTask = useCallback(
    (task: Task, columnId?: string) => {
      if (!ensureTaskWritable(task, columnId)) return;
      handleDuplicateTask(task, columnId);
    },
    [ensureTaskWritable, handleDuplicateTask],
  );

  const guardedRequestDeleteTask = useCallback(
    (task: Task, columnId?: string) => {
      if (!ensureTaskWritable(task, columnId)) return;
      requestDeleteTask(task, columnId);
    },
    [ensureTaskWritable, requestDeleteTask],
  );

  const guardedTaskDetailsUpdate = useCallback(
    (updated: Task) => {
      if (!ensureTaskWritable(updated)) return;
      handleTaskDetailsUpdate(updated);
      setSelectedTaskDetails((prev) =>
        prev ? { ...prev, task: updated } : null,
      );
    },
    [ensureTaskWritable, handleTaskDetailsUpdate, setSelectedTaskDetails],
  );

  const resolvedSelectedTaskDetails = useMemo(() => {
    if (!selectedTaskDetails) return null;
    const liveTask = tasksState.find(
      (item) => item.id === selectedTaskDetails.task.id,
    );
    return liveTask
      ? { ...selectedTaskDetails, task: liveTask }
      : selectedTaskDetails;
  }, [selectedTaskDetails, tasksState]);

  const formColumns = useMemo(
    () =>
      writableColumns.map((c) => {
        const listName = c.name || t("defaultList");
        return {
          id: c.id || "",
          title:
            hasMultipleWorkspaces && c.workspaceName
              ? `${listName} (${c.workspaceName})`
              : listName,
        };
      }),
    [writableColumns, hasMultipleWorkspaces, t],
  );

  return (
    <section className={cn("flex flex-col", isCompact ? "gap-2.5" : "gap-3")}>
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <h3
            className={cn(
              "font-bold text-neutral-50",
              isCompact ? "text-base" : "text-lg",
            )}
          >
            {t("title")}
          </h3>
          <output
            className="px-2 py-0.5 rounded-md bg-surface/80 dark:bg-surface/60 border border-neutral-700/70 dark:border-primary/30 text-xs text-neutral-300 font-bold tabular-nums shrink-0"
            aria-label={t("title")}
          >
            {filteredTasks.length}
          </output>
        </div>
      </header>

      <TaskFilters
        activeFilter={activeFilter}
        onFilterChange={handleFilterChangeWithReset}
        selectedDate={selectedDate}
        onClearDate={handleClearDateWithReset}
        columns={columns}
        workspaces={workspaces}
        advancedFilters={advancedFilters}
        onAdvancedFiltersChange={handleAdvancedFiltersChangeWithReset}
        onCreateTask={handleOpenCreateTaskModal}
        canCreateTask={writableColumns.length > 0}
        createTaskDisabledReason={t("newTaskNoWritableTitle")}
        overdueCount={overdueCount}
        isCompact={isCompact}
      />

      <TaskTable
        itemsPerPage={DASHBOARD_ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        tasks={filteredTasks}
        columns={columns}
        workspaces={workspaces}
        activeFilter={activeFilter}
        onToggle={guardedToggleComplete}
        onHabitChange={guardedHabitChange}
        onContextMenu={handleOpenContextMenu}
        onOpenDetails={handleOpenDetails}
        onEditTask={handleEditTask}
        onStartFocus={handleStartFocusTask}
        selectedDate={selectedDate}
        emptyVariant={
          !hasColumns
            ? isReadOnly
              ? "no_columns_readonly"
              : "no_columns"
            : "default"
        }
        onEmptyAction={
          !hasColumns
            ? isReadOnly
              ? () => setIsUpgradeModalOpen(true)
              : onCreateFirstColumn
            : undefined
        }
        isCompact={isCompact}
        deletingTaskIds={checkingDeleteTaskIds}
      />

      <TaskModalsHost
        columns={columns}
        formColumns={formColumns}
        availableTags={availableTags}
        defaultColumnId={defaultWritableColumnId}
        defaultColumnTitle={t("defaultList")}
        showWorkspaceName={hasMultipleWorkspaces}
        contextMenu={contextMenu}
        onCloseContextMenu={closeContextMenu}
        selectedTaskDetails={resolvedSelectedTaskDetails}
        onCloseTaskDetails={closeTaskDetails}
        taskModalState={taskModalState}
        onCloseTaskModal={closeTaskModal}
        onOpenEditTask={handleEditTask}
        onTaskSaved={(savedTask) => {
          handleTaskSaved(savedTask);
          closeTaskModal();
        }}
        onTaskDetailsUpdate={guardedTaskDetailsUpdate}
        onDuplicateTask={guardedDuplicateTask}
        onRequestDeleteTask={guardedRequestDeleteTask}
        onToggleComplete={guardedToggleComplete}
        onHabitChange={guardedHabitChange}
        onStartFocus={handleStartFocusTask}
        taskToDelete={taskToDelete}
        deleteHistory={deleteHistory}
        onDeleteHistoryChange={setDeleteHistory}
        onConfirmDeleteTask={confirmDeleteTask}
        onCancelDeleteTask={cancelDeleteTask}
        deleteModalLabels={{
          title: t("deleteModalTitle"),
          description: (
            <>
              {t("deleteModalDescPrefix")}{" "}
              <span className="font-bold text-neutral-100">
                &quot;{taskToDelete?.task.title}&quot;
              </span>
              {t("deleteModalDescSuffix")}
            </>
          ),
          confirmText: t("deleteModalConfirm"),
          cancelText: t("deleteModalCancel"),
          deleteHistoryLabel: t("deleteHistoryLabel"),
          deleteHistoryHint: t("deleteHistoryHint"),
        }}
      />

      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}

      {pendingFocusTask && (
        <SwitchFocusTargetModal
          isOpen={pendingFocusTask !== null}
          onClose={clearPendingFocusTask}
          currentName={currentFocusTarget?.name || t("currentSessionFallback")}
          newTargetName={pendingFocusTask.title}
          isCurrentInventory={currentFocusTarget?.type === "inventory"}
          isCurrentTask={currentFocusTarget?.type === "task"}
          isNewTask={true}
          onTransfer={() => {}}
          onSaveAndStartNew={handleSaveAndStartFocusTask}
          onDiscardAndStartNew={handleDiscardAndStartFocusTask}
        />
      )}
    </section>
  );
}
