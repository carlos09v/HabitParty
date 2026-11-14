"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useTaskDeleteFlow } from "@/hooks/useTaskDeleteFlow";
import type { DashboardTasksPanelProps } from "@/types/dashboard";
import type { Task } from "@/types/task";
import { cn } from "@/utils";
import { extractAvailableTagOptions } from "@/utils/tags";

export function DashboardTasksPanel({
  initialTasks,
  columns,
  isCompact = false,
  tasks: externalTasks,
  onTasksChange,
  onTaskCompletedTodayChange,
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

  const [selectedTaskDetails, setSelectedTaskDetails] = useState<{
    task: Task;
    anchorRect?: DOMRect;
  } | null>(null);

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
      [onTasksChange],
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
      [onTasksChange],
    ),
  });

  const defaultColumnId = columns[0]?.id;

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
  } = useDashboardTaskFilters(tasksState);

  const {
    handleToggleComplete,
    handleHabitChange,
    handleDeleteTask,
    handleDuplicateTask,
    handleTaskSaved,
    handleTaskDetailsUpdate,
  } = useDashboardTaskActions({
    tasks: tasksState,
    setTasks: setTasksState,
    defaultColumnId,
    onTaskCompletedTodayChange,
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

  // Reseta para a página 1 sempre que os filtros ou a data mudarem
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reseta para a primeira página sempre que qualquer filtro mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, selectedDate, advancedFilters]);

  // Estados dos modais e menus de contexto interativos
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    task: Task | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    task: null,
  });

  const [taskModalState, setTaskModalState] = useState<{
    isOpen: boolean;
    taskToEdit: Task | null;
    columnId?: string;
  }>({
    isOpen: false,
    taskToEdit: null,
  });

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
      e.preventDefault();
      setContextMenu({
        isOpen: true,
        position: { x: e.clientX, y: e.clientY },
        task,
      });
    },
    [],
  );

  const handleOpenDetails = useCallback((task: Task, anchorRect?: DOMRect) => {
    setSelectedTaskDetails({ task, anchorRect });
  }, []);

  const handleEditTask = useCallback(
    (task: Task, columnId?: string) => {
      setSelectedTaskDetails(null);
      setTaskModalState({
        isOpen: true,
        taskToEdit: task,
        columnId: columnId || task.columnId || defaultColumnId,
      });
    },
    [defaultColumnId],
  );

  const formColumns = useMemo(
    () =>
      columns.map((c) => ({
        id: c.id || "",
        title: c.name || t("defaultList"),
      })),
    [columns, t],
  );

  return (
    <section className={cn("flex flex-col", isCompact ? "gap-4" : "gap-5")}>
      <TaskFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        selectedDate={selectedDate}
        onClearDate={handleClearDate}
        columns={columns}
        advancedFilters={advancedFilters}
        onAdvancedFiltersChange={setAdvancedFilters}
        isCompact={isCompact}
      />

      <TaskTable
        itemsPerPage={DASHBOARD_ITEMS_PER_PAGE}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        tasks={filteredTasks}
        columns={columns}
        activeFilter={activeFilter}
        onToggle={handleToggleComplete}
        onHabitChange={handleHabitChange}
        onContextMenu={handleOpenContextMenu}
        onOpenDetails={handleOpenDetails}
        onEditTask={handleEditTask}
        selectedDate={selectedDate}
        isCompact={isCompact}
        deletingTaskIds={checkingDeleteTaskIds}
      />

      <TaskModalsHost
        columns={columns}
        formColumns={formColumns}
        availableTags={availableTags}
        defaultColumnId={defaultColumnId}
        defaultColumnTitle={t("defaultList")}
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
            columnId: undefined,
          })
        }
        onOpenEditTask={handleEditTask}
        onTaskSaved={(savedTask) => {
          handleTaskSaved(savedTask);
          setTaskModalState({
            isOpen: false,
            taskToEdit: null,
            columnId: undefined,
          });
        }}
        onTaskDetailsUpdate={(updated) => {
          handleTaskDetailsUpdate(updated);
          setSelectedTaskDetails((prev) =>
            prev ? { ...prev, task: updated } : null,
          );
        }}
        onDuplicateTask={(task) => handleDuplicateTask(task)}
        onRequestDeleteTask={(task) => requestDeleteTask(task)}
        onToggleComplete={handleToggleComplete}
        onHabitChange={handleHabitChange}
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
    </section>
  );
}
