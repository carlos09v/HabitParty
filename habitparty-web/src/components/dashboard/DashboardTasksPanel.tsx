"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { TaskFilters } from "@/components/dashboard/TaskFilters";
import { TaskTable } from "@/components/dashboard/TaskTable";
import { useResolvedReadOnlySets } from "@/components/dashboard/useResolvedReadOnlySets";
import { TaskModalsHost } from "@/components/tasks/shared";
import { useDashboardTaskActions } from "@/hooks/useDashboardTaskActions";
import { useDashboardTaskFilters } from "@/hooks/useDashboardTaskFilters";
import {
  applyFocusRecordedToTask,
  useFocusTaskSync,
} from "@/hooks/useFocusTaskSync";
import { useLatestRef } from "@/hooks/useLatestRef";
import { useQuickFocusTask } from "@/hooks/useQuickFocusTask";
import { useTaskDeleteFlow } from "@/hooks/useTaskDeleteFlow";
import { useTaskInteractionModals } from "@/hooks/useTaskInteractionModals";
import { useDashboardFilterStore } from "@/store/dashboardFilterStore";
import { useUIStore } from "@/store/uiStore";
import type { DashboardTasksPanelProps } from "@/types/dashboard";
import type { Task, TaskFilterType } from "@/types/task";
import { computeTagTaskCounts, extractAvailableTagOptions } from "@/utils/tags";
import { isTaskInReadOnlyScope } from "@/utils/taskMapper";
import { replaceUrlSearchParams } from "@/utils/urlParams";

export function DashboardTasksPanel({
  columns,
  workspaces = [],
  activeWorkspaceId,
  defaultColumnId: explicitDefaultColumnId,
  isReadOnly = false,
  readOnlyWorkspaceIds: propReadOnlyWorkspaceIds,
  readOnlyColumnIds: propReadOnlyColumnIds,
  tasks: tasksState,
  onTasksChange: setTasksState,
  hasColumns = true,
  createTaskTrigger = 0,
  onCreateFirstColumn,
  timeZone,
}: DashboardTasksPanelProps) {
  const t = useTranslations("dashboard.tasksPanel");
  const searchParams = useSearchParams();
  const openUpgradeModal = useUIStore((s) => s.openUpgradeModal);
  const itemsPerPage = useDashboardFilterStore((s) => s.itemsPerPage);
  const setItemsPerPage = useDashboardFilterStore((s) => s.setItemsPerPage);
  const resetAdvancedFilters = useDashboardFilterStore(
    (s) => s.resetAdvancedFilters,
  );

  const tasksStateRef = useLatestRef(tasksState);

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

  // Sincroniza eventos de foco com a lista controlada (resolvedSelectedTaskDetails deriva o task vivo automaticamente)
  useFocusTaskSync({
    onFocusRecorded: useCallback(
      (taskId: string, durationMinutes: number, cycles: number) => {
        setTasksState((prev) =>
          prev.map((task) =>
            task.id === taskId
              ? applyFocusRecordedToTask(task, durationMinutes, cycles)
              : task,
          ),
        );
      },
      [setTasksState],
    ),
    onTaskCompleted: useCallback(
      (taskId: string, transformTask: (task: Task) => Task) => {
        setTasksState((prev) =>
          prev.map((task) => (task.id === taskId ? transformTask(task) : task)),
        );
      },
      [setTasksState],
    ),
  });

  const hasMultipleWorkspaces = workspaces.length > 1;
  const quickFocus = useQuickFocusTask();
  const handleStartFocusTaskFromHook = quickFocus.handleStartFocusTask;

  const validWorkspaceIds = useMemo(
    () => workspaces.map((w) => w.id).filter((id): id is string => Boolean(id)),
    [workspaces],
  );

  const { readOnlyWorkspaceIds, readOnlyColumnIds } = useResolvedReadOnlySets(
    workspaces,
    columns,
    propReadOnlyWorkspaceIds,
    propReadOnlyColumnIds,
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

  const tagCounts = useMemo(
    () => computeTagTaskCounts(tasksState, availableTags),
    [tasksState, availableTags],
  );

  const {
    activeFilter,
    setActiveFilter,
    selectedDate,
    handleClearDate,
    searchQuery,
    setSearchQuery,
    advancedFilters,
    setAdvancedFilters,
    filteredTasks,
    overdueCount,
  } = useDashboardTaskFilters(tasksState, validWorkspaceIds, columns, {
    readOnlyWorkspaceIds,
    readOnlyColumnIds,
    timeZone,
  });

  const {
    handleToggleComplete,
    handleHabitChange,
    handleDeleteTask,
    scheduleUndoDeleteTask,
    handleDuplicateTask,
    duplicatingTaskIds,
    handleTaskSaved,
    handleTaskDetailsUpdate,
  } = useDashboardTaskActions({
    tasks: tasksState,
    columns,
    setTasks: setTasksState,
    defaultColumnId,
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

  const syncPageUrlToFirst = useCallback(() => {
    replaceUrlSearchParams((params) => {
      params.delete("page");
    });
  }, []);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    syncPageUrlToFirst();
  }, [syncPageUrlToFirst]);

  // Reseta página e limpa ?page= da URL em uma única fonte de verdade quando qualquer filtro/aba/data muda
  const paginationResetKey = `${activeFilter}|${selectedDate ?? ""}|${advancedFilters.workspaceId}|${advancedFilters.taskType}|${advancedFilters.columnId}|${advancedFilters.difficulty}|${advancedFilters.priority}|${advancedFilters.tag ?? ""}|${advancedFilters.hideCompleted}|${advancedFilters.sortBy}|${searchQuery}|${itemsPerPage}`;
  const prevPaginationResetKeyRef = useRef(paginationResetKey);

  useEffect(() => {
    if (prevPaginationResetKeyRef.current === paginationResetKey) return;
    prevPaginationResetKeyRef.current = paginationResetKey;
    resetPagination();
  }, [paginationResetKey, resetPagination]);

  // Ajusta ?page= na URL quando o total encolhe (ex: após excluir/concluir tarefas na última página)
  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / itemsPerPage),
  );
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
      replaceUrlSearchParams((params) => {
        if (totalPages <= 1) {
          params.delete("page");
        } else {
          params.set("page", String(totalPages));
        }
      });
    }
  }, [currentPage, totalPages]);

  const handleFilterChangeWithReset = useCallback(
    (filter: TaskFilterType) => {
      setActiveFilter(filter);
    },
    [setActiveFilter],
  );

  const handleClearDateWithReset = useCallback(() => {
    handleClearDate();
  }, [handleClearDate]);

  const handleSearchChangeWithReset = useCallback(
    (query: string) => {
      setSearchQuery(query);
    },
    [setSearchQuery],
  );

  const handleAdvancedFiltersChangeWithReset = useCallback(
    (filters: typeof advancedFilters) => {
      setAdvancedFilters(filters);
    },
    [setAdvancedFilters],
  );

  const handleItemsPerPageChange = useCallback(
    (size: number) => {
      setItemsPerPage(size);
    },
    [setItemsPerPage],
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
    onSimpleDelete: scheduleUndoDeleteTask,
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
        openUpgradeModal();
        toast.error(t("readOnlyTaskActionError"));
        return false;
      }
      return true;
    },
    [isTaskReadOnly, openUpgradeModal, t],
  );

  const ensureTaskIdWritable = useCallback(
    (taskId: string): boolean => {
      const target = tasksStateRef.current.find((item) => item.id === taskId);
      if (target && isTaskReadOnly(target)) {
        openUpgradeModal();
        toast.error(t("readOnlyTaskActionError"));
        return false;
      }
      return true;
    },
    [isTaskReadOnly, openUpgradeModal, t, tasksStateRef],
  );

  const defaultWritableColumnId = useMemo(() => {
    if (
      advancedFilters.columnId !== "all" &&
      writableColumns.some((c) => c.id === advancedFilters.columnId)
    ) {
      return advancedFilters.columnId;
    }
    const filteredWsCol =
      advancedFilters.workspaceId !== "all"
        ? writableColumns.find(
            (c) => c.workspaceId === advancedFilters.workspaceId && c.id,
          )?.id
        : undefined;
    return filteredWsCol || defaultColumnId;
  }, [
    writableColumns,
    advancedFilters.columnId,
    advancedFilters.workspaceId,
    defaultColumnId,
  ]);

  const handleOpenCreateTaskModal = useCallback(() => {
    if (writableColumns.length === 0) {
      openUpgradeModal();
      toast.error(t("newTaskNoWritableTitle"));
      return;
    }
    closeTaskDetails();
    const contextualTaskType =
      advancedFilters.taskType !== "all" ? advancedFilters.taskType : undefined;
    const contextualInitialValues = selectedDate
      ? { dueDate: selectedDate }
      : undefined;
    setTaskModalState({
      isOpen: true,
      taskToEdit: null,
      columnId: defaultWritableColumnId,
      defaultTaskType: contextualTaskType,
      initialValues: contextualInitialValues,
    });
  }, [
    writableColumns.length,
    defaultWritableColumnId,
    advancedFilters.taskType,
    selectedDate,
    closeTaskDetails,
    setTaskModalState,
    openUpgradeModal,
    t,
  ]);

  const prevCreateTaskTriggerRef = useRef(createTaskTrigger);
  const openCreateTaskRef = useLatestRef(handleOpenCreateTaskModal);
  useEffect(() => {
    if (createTaskTrigger > prevCreateTaskTriggerRef.current) {
      prevCreateTaskTriggerRef.current = createTaskTrigger;
      openCreateTaskRef.current();
    }
  }, [createTaskTrigger, openCreateTaskRef]);

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
      if (!ensureTaskIdWritable(taskId)) return false;
      return handleToggleComplete(taskId, completed);
    },
    [ensureTaskIdWritable, handleToggleComplete],
  );

  const guardedHabitChange = useCallback(
    (taskId: string, delta: number) => {
      if (!ensureTaskIdWritable(taskId)) return false;
      return handleHabitChange(taskId, delta);
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
    },
    [ensureTaskWritable, handleTaskDetailsUpdate],
  );

  const guardedStartFocusTask = useCallback(
    (task: Task) => {
      if (!ensureTaskWritable(task)) return;
      handleStartFocusTaskFromHook(task);
    },
    [ensureTaskWritable, handleStartFocusTaskFromHook],
  );

  const resolvedSelectedTaskDetails = useMemo(() => {
    if (!selectedTaskDetails) return null;
    const liveTask = tasksState.find(
      (item) => item.id === selectedTaskDetails.task.id,
    );
    return liveTask ? { ...selectedTaskDetails, task: liveTask } : null;
  }, [selectedTaskDetails, tasksState]);

  useEffect(() => {
    if (selectedTaskDetails && !resolvedSelectedTaskDetails) {
      setSelectedTaskDetails(null);
    }
  }, [
    selectedTaskDetails,
    resolvedSelectedTaskDetails,
    setSelectedTaskDetails,
  ]);

  const hasActiveSearchOrFilters =
    searchQuery.trim() !== "" ||
    advancedFilters.workspaceId !== "all" ||
    advancedFilters.taskType !== "all" ||
    advancedFilters.columnId !== "all" ||
    advancedFilters.difficulty !== "all" ||
    advancedFilters.priority !== "all" ||
    advancedFilters.tag !== null ||
    advancedFilters.hideCompleted;

  const handleResetSearchAndFilters = useCallback(() => {
    setSearchQuery("");
    resetAdvancedFilters();
    resetPagination();
  }, [setSearchQuery, resetAdvancedFilters, resetPagination]);

  const handleTaskSavedAndClose = useCallback(
    (savedTask: Task) => {
      handleTaskSaved(savedTask);
      closeTaskModal();
    },
    [handleTaskSaved, closeTaskModal],
  );

  const deleteModalLabels = useMemo(
    () => ({
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
    }),
    [t, taskToDelete?.task.title],
  );

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
    <section
      id="dashboard-tasks-panel"
      className="flex flex-col gap-3 scroll-mt-4"
    >
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="font-bold text-neutral-50 text-lg">{t("title")}</h2>
          <span className="px-2 py-0.5 rounded-md bg-surface/80 dark:bg-surface/60 border border-neutral-700/70 dark:border-primary/30 text-xs text-neutral-300 font-bold tabular-nums shrink-0">
            {filteredTasks.length}
          </span>
        </div>
      </header>

      <TaskFilters
        activeFilter={activeFilter}
        onFilterChange={handleFilterChangeWithReset}
        selectedDate={selectedDate}
        onClearDate={handleClearDateWithReset}
        searchQuery={searchQuery}
        onSearchQueryChange={handleSearchChangeWithReset}
        activeWorkspaceId={activeWorkspaceId}
        columns={columns}
        workspaces={workspaces}
        availableTags={availableTags}
        tagCounts={tagCounts}
        advancedFilters={advancedFilters}
        onAdvancedFiltersChange={handleAdvancedFiltersChangeWithReset}
        onClearAllFilters={handleResetSearchAndFilters}
        onCreateTask={handleOpenCreateTaskModal}
        canCreateTask={writableColumns.length > 0}
        createTaskDisabledReason={t("newTaskNoWritableTitle")}
        overdueCount={overdueCount}
        timeZone={timeZone}
      />

      <TaskTable
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        tasks={filteredTasks}
        columns={columns}
        workspaces={workspaces}
        readOnlyWorkspaceIds={readOnlyWorkspaceIds}
        readOnlyColumnIds={readOnlyColumnIds}
        activeFilter={activeFilter}
        onToggle={guardedToggleComplete}
        onHabitChange={guardedHabitChange}
        onContextMenu={handleOpenContextMenu}
        onOpenDetails={handleOpenDetails}
        onEditTask={handleEditTask}
        onStartFocus={guardedStartFocusTask}
        selectedDate={selectedDate}
        timeZone={timeZone}
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
              ? openUpgradeModal
              : onCreateFirstColumn
            : undefined
        }
        hasActiveFilters={hasActiveSearchOrFilters}
        onClearFilters={handleResetSearchAndFilters}
        deletingTaskIds={checkingDeleteTaskIds}
      />

      <TaskModalsHost
        columns={columns}
        formColumns={formColumns}
        availableTags={availableTags}
        defaultColumnId={defaultWritableColumnId}
        defaultColumnTitle={t("defaultList")}
        showWorkspaceName={hasMultipleWorkspaces}
        isTaskReadOnly={isTaskReadOnly}
        quickFocus={quickFocus}
        contextMenu={contextMenu}
        onCloseContextMenu={closeContextMenu}
        selectedTaskDetails={resolvedSelectedTaskDetails}
        onCloseTaskDetails={closeTaskDetails}
        taskModalState={taskModalState}
        onCloseTaskModal={closeTaskModal}
        onOpenEditTask={handleEditTask}
        onTaskSaved={handleTaskSavedAndClose}
        onTaskDetailsUpdate={guardedTaskDetailsUpdate}
        onDuplicateTask={guardedDuplicateTask}
        duplicatingTaskIds={duplicatingTaskIds}
        onRequestDeleteTask={guardedRequestDeleteTask}
        onToggleComplete={guardedToggleComplete}
        onHabitChange={guardedHabitChange}
        onStartFocus={guardedStartFocusTask}
        taskToDelete={taskToDelete}
        deleteHistory={deleteHistory}
        onDeleteHistoryChange={setDeleteHistory}
        onConfirmDeleteTask={confirmDeleteTask}
        onCancelDeleteTask={cancelDeleteTask}
        deleteModalLabels={deleteModalLabels}
      />
    </section>
  );
}
