"use client";

import { Copy, Pencil, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TaskFilters } from "@/components/dashboard/TaskFilters";
import { TaskTable } from "@/components/dashboard/TaskTable";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { DASHBOARD_ITEMS_PER_PAGE } from "@/constants/dashboard";
import { useDashboardTaskActions } from "@/hooks/useDashboardTaskActions";
import { useDashboardTaskFilters } from "@/hooks/useDashboardTaskFilters";
import type { DashboardTasksPanelProps } from "@/types/dashboard";
import type { Task } from "@/types/task";
import { cn } from "@/utils";

const TaskDetailsPopover = dynamic(
  () =>
    import("@/components/tasks/TaskDetailsPopover").then((mod) => ({
      default: mod.TaskDetailsPopover,
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

export function DashboardTasksPanel({
  initialTasks,
  columns,
  isCompact = false,
  tasks: externalTasks,
  onTasksChange,
}: DashboardTasksPanelProps) {
  const searchParams = useSearchParams();
  const [internalTasks, setInternalTasks] = useState<Task[]>(initialTasks);

  // Sincroniza estado local caso os dados do servidor mudem
  useEffect(() => {
    setInternalTasks(initialTasks);
  }, [initialTasks]);

  const tasksState = externalTasks ?? internalTasks;
  const setTasksState = onTasksChange ?? setInternalTasks;

  const defaultColumnId = columns[0]?.id;

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

  const [selectedTaskDetails, setSelectedTaskDetails] = useState<{
    task: Task;
    anchorRect?: DOMRect;
  } | null>(null);

  const [taskModalState, setTaskModalState] = useState<{
    isOpen: boolean;
    taskToEdit: Task | null;
    columnId?: string;
  }>({
    isOpen: false,
    taskToEdit: null,
  });

  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

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

  const formColumns = useMemo(
    () =>
      columns.map((c) => ({
        id: c.id || "",
        title: c.name || "Lista",
      })),
    [columns],
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
        activeFilter={activeFilter}
        onToggle={handleToggleComplete}
        onHabitChange={handleHabitChange}
        onContextMenu={handleOpenContextMenu}
        onOpenDetails={handleOpenDetails}
        onDelete={(task) => setTaskToDelete(task)}
        onEdit={(task) =>
          setTaskModalState({
            isOpen: true,
            taskToEdit: task,
            columnId: task.columnId || defaultColumnId,
          })
        }
        onDuplicate={(task) => handleDuplicateTask(task)}
        selectedDate={selectedDate}
        isCompact={isCompact}
      />

      {/* Menu de Contexto da Tarefa (Botão Direito ou Botão Mais Opções) */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu((prev) => ({ ...prev, isOpen: false }))}
        items={[
          {
            label: "Editar",
            icon: <Pencil size={14} />,
            onClick: () => {
              if (contextMenu.task) {
                setTaskModalState({
                  isOpen: true,
                  taskToEdit: contextMenu.task,
                  columnId: contextMenu.task.columnId || defaultColumnId,
                });
              }
            },
          },
          {
            label: "Duplicar",
            icon: <Copy size={14} />,
            onClick: () => {
              if (contextMenu.task) {
                handleDuplicateTask(contextMenu.task);
              }
            },
          },
          {
            label: "Excluir",
            icon: <Trash2 size={14} />,
            variant: "destructive",
            onClick: () => {
              if (contextMenu.task) {
                setTaskToDelete(contextMenu.task);
              }
            },
          },
        ]}
      />

      {/* Popover Lateral Flutuante de Detalhes Rápidos */}
      {Boolean(selectedTaskDetails) && (
        <TaskDetailsPopover
          isOpen={Boolean(selectedTaskDetails)}
          onClose={() => setSelectedTaskDetails(null)}
          task={selectedTaskDetails?.task ?? null}
          columnTitle={
            columns.find((c) => c.id === selectedTaskDetails?.task?.columnId)
              ?.name || selectedTaskDetails?.task?.category
          }
          anchorRect={selectedTaskDetails?.anchorRect}
          onTaskUpdate={(updated) => {
            handleTaskDetailsUpdate(updated);
            setSelectedTaskDetails((prev) =>
              prev ? { ...prev, task: updated } : null,
            );
          }}
          onEdit={(task) => {
            setTaskModalState({
              isOpen: true,
              taskToEdit: task,
              columnId: task.columnId || defaultColumnId,
            });
            setSelectedTaskDetails(null);
          }}
          onDuplicate={(task) => {
            handleDuplicateTask(task);
            setSelectedTaskDetails(null);
          }}
          onDelete={(taskId) => {
            const task = tasksState.find((t) => t.id === taskId);
            if (task) {
              handleDeleteTask(task);
            }
            setSelectedTaskDetails(null);
          }}
          onToggleComplete={handleToggleComplete}
        />
      )}

      {/* Modal Completo: Criar / Editar Tarefa */}
      {taskModalState.isOpen && (
        <CreateTaskModal
          isOpen={taskModalState.isOpen}
          onClose={() =>
            setTaskModalState({
              isOpen: false,
              taskToEdit: null,
              columnId: undefined,
            })
          }
          columns={formColumns}
          defaultColumnId={taskModalState.columnId || defaultColumnId}
          taskToEdit={taskModalState.taskToEdit}
          onSuccess={(savedTask) => {
            handleTaskSaved(savedTask);
            setTaskModalState({
              isOpen: false,
              taskToEdit: null,
              columnId: undefined,
            });
          }}
        />
      )}

      {/* Modal de Confirmação para Excluir Tarefa */}
      {Boolean(taskToDelete) && (
        <ConfirmationModal
          isOpen={Boolean(taskToDelete)}
          title="Excluir Tarefa"
          description={
            <>
              Tem certeza de que deseja excluir a tarefa{" "}
              <span className="font-bold text-neutral-100">
                &quot;{taskToDelete?.title}&quot;
              </span>
              ? Esta ação não pode ser desfeita.
            </>
          }
          confirmText="Excluir Tarefa"
          cancelText="Cancelar"
          variant="danger"
          onClose={() => setTaskToDelete(null)}
          onConfirm={async () => {
            if (taskToDelete) {
              await handleDeleteTask(taskToDelete);
              setTaskToDelete(null);
            }
          }}
        />
      )}
    </section>
  );
}
