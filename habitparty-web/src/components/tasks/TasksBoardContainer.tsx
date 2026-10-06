"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateBoardColumnOrderAction } from "@/actions/boardColumnActions";
import {
  changeTaskStatus,
  completeTask,
  deleteTask,
  moveTasks,
} from "@/actions/taskActions";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { CreateBoardColumnModal } from "@/components/tasks/CreateBoardColumnModal";
import { CreateTaskModal } from "@/components/tasks/CreateTaskModal";
import { RoutineBoard } from "@/components/tasks/RoutineBoard";
import { RoutineFilters } from "@/components/tasks/RoutineFilters";
import { TaskDetailsPopover } from "@/components/tasks/TaskDetailsPopover";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { WelcomeCard } from "@/components/ui/WelcomeCard";
import {
  DEFAULT_BOARD_FILTERS,
  normalizeTaskDifficulty,
  normalizeTaskType,
} from "@/constants/task";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useRoutineColumns } from "@/hooks/useRoutineColumns";
import { useUserStore } from "@/store/userStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type {
  BoardColumn,
  BoardFilterState,
  ColumnSummary,
  Task,
  UpdateTaskOrderDTO,
} from "@/types/task";
import { cn } from "@/utils";

export function TasksBoardContainer({
  initialColumns,
  initialOpenCreateColumn = false,
}: {
  initialColumns: BoardColumn[];
  initialOpenCreateColumn?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const is_Premium = useUserStore((state) => state.is_Premium);
  const activeWorkspaceId = useWorkspaceStore(
    (state) => state.activeWorkspaceId,
  );
  const { isCompact } = useCompactMode();
  const [, startTransition] = useTransition();

  const [isCreateColumnOpen, setIsCreateColumnOpen] = useState(
    initialOpenCreateColumn,
  );

  useEffect(() => {
    if (
      initialOpenCreateColumn ||
      searchParams.get("createColumn") === "true"
    ) {
      setIsCreateColumnOpen(true);
    }
  }, [initialOpenCreateColumn, searchParams]);
  const [taskModalState, setTaskModalState] = useState<{
    isOpen: boolean;
    columnId?: string;
    taskToEdit?: Task | null;
  }>({ isOpen: false, taskToEdit: null });

  const [selectedTaskDetails, setSelectedTaskDetails] = useState<{
    task: Task;
    columnId: string;
    anchorRect?: DOMRect | null;
  } | null>(null);

  // Estado dos filtros e busca
  const [searchQuery, setSearchQuery] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [filters, setFilters] = useState<BoardFilterState>(
    DEFAULT_BOARD_FILTERS,
  );

  // Context Menu state (botão direito na tarefa)
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    task: Task | null;
    columnId: string | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    task: null,
    columnId: null,
  });

  const {
    columns,
    setColumns,
    visibleColumnIds,
    toggleColumnVisibility,
    canCreateColumn,
    maxColumns,
  } = useRoutineColumns(initialColumns, is_Premium);

  // Lista de tags únicas presentes nas tarefas atuais para o filtro
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const col of columns) {
      for (const task of col.tasks) {
        if (task.tags && Array.isArray(task.tags)) {
          for (const t of task.tags) {
            if (t?.trim()) tagSet.add(t.trim());
          }
        }
      }
    }
    return Array.from(tagSet);
  }, [columns]);

  // Colunas com tarefas filtradas aplicadas em memória
  const filteredColumns = useMemo(() => {
    const hasFilter =
      searchQuery.trim() !== "" ||
      focusMode ||
      filters.taskType !== "all" ||
      filters.difficulty !== "all" ||
      filters.status !== "all" ||
      filters.tag !== null;

    if (!hasFilter) return columns;

    const q = searchQuery.toLowerCase().trim();

    return columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((task) => {
        // 1. Busca textual
        if (q) {
          const matchesTitle = task.title.toLowerCase().includes(q);
          const matchesDesc = (task.description || "")
            .toLowerCase()
            .includes(q);
          if (!matchesTitle && !matchesDesc) return false;
        }

        const resolvedType = normalizeTaskType(task);

        // 2. Modo Foco: oculta tarefas concluídas (exceto hábitos)
        if (focusMode && task.completed && resolvedType !== "habit") {
          return false;
        }

        // 3. Filtro por Tipo de Tarefa
        if (filters.taskType !== "all") {
          if (resolvedType.toUpperCase() !== filters.taskType) return false;
        }

        // 4. Filtro por Dificuldade
        if (filters.difficulty !== "all") {
          const normalizedTDiff = normalizeTaskDifficulty(task.difficulty);
          if (normalizedTDiff !== filters.difficulty) return false;
        }

        // 5. Filtro por Status
        if (filters.status === "completed" && !task.completed) return false;
        if (filters.status === "pending" && task.completed) return false;

        // 6. Filtro por Tag
        if (filters.tag) {
          const hasTag =
            task.tags?.includes(filters.tag) ||
            (task.category && task.category === filters.tag);
          if (!hasTag) return false;
        }

        return true;
      }),
    }));
  }, [columns, searchQuery, focusMode, filters]);

  const columnsList: ColumnSummary[] = useMemo(
    () =>
      columns.map((col) => ({
        id: col.id,
        title: col.title,
        tasksCount: col.tasks.length,
      })),
    [columns],
  );

  const handleColumnCreated = (newCol: BoardColumn) => {
    setColumns((prev) => [...prev, newCol]);
    if (visibleColumnIds.length < 4) {
      toggleColumnVisibility(newCol.id);
    }
  };

  const handleTaskSaved = (savedTask: Task, targetColumnId: string) => {
    setColumns((prev) =>
      prev.map((col) => {
        const existsInThisCol = col.tasks.some((t) => t.id === savedTask.id);

        if (col.id === targetColumnId) {
          if (existsInThisCol) {
            return {
              ...col,
              tasks: col.tasks.map((t) =>
                t.id === savedTask.id ? savedTask : t,
              ),
            };
          }
          return { ...col, tasks: [...col.tasks, savedTask] };
        }

        if (existsInThisCol) {
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== savedTask.id),
          };
        }

        return col;
      }),
    );
  };

  const handleContextMenu = (
    e: React.MouseEvent,
    task: Task,
    columnId: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      task,
      columnId,
    });
  };

  const handleDeleteTask = async (task: Task, targetColumnId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === targetColumnId
          ? { ...col, tasks: col.tasks.filter((t) => t.id !== task.id) }
          : col,
      ),
    );
    toast.success(`Tarefa "${task.title}" excluída com sucesso!`);

    const res = await deleteTask(task.id);
    if (!res.success) {
      toast.error(res.error || "Erro ao excluir tarefa no servidor.");
    }
  };

  // Persistência ao mover / reordenar tarefa entre colunas
  const handleTaskMove = (
    _taskId: string,
    targetColumnId: string,
    _newIndex: number,
    allTargetTasks?: Task[],
  ) => {
    const tasksToUpdate =
      allTargetTasks ||
      columns.find((c) => c.id === targetColumnId)?.tasks ||
      [];

    const updates: UpdateTaskOrderDTO[] = tasksToUpdate.map((t, idx) => ({
      taskId: t.id,
      boardColumnId: targetColumnId,
      newOrderIndex: idx,
    }));

    if (updates.length > 0) {
      startTransition(async () => {
        const res = await moveTasks(updates);
        if (!res.success) {
          toast.error(
            res.error || "Erro ao salvar nova posição da tarefa no servidor.",
          );
        }
      });
    }
  };

  // Persistência ao reordenar colunas
  const handleColumnReorder = (reorderedColumns: BoardColumn[]) => {
    if (!activeWorkspaceId) return;

    const payload = reorderedColumns.map((c, idx) => ({
      board_column_id: c.id,
      newIndex: idx,
    }));

    startTransition(async () => {
      const res = await updateBoardColumnOrderAction(
        activeWorkspaceId,
        payload,
      );
      if (!res.success) {
        toast.error(
          res.error || "Erro ao salvar ordem das colunas no servidor.",
        );
      }
    });
  };

  return (
    <PageWrapper noScroll isCompact={isCompact}>
      {/* Banner de Boas-vindas */}
      <WelcomeCard
        compact
        title="Gerencie suas Tarefas!"
        subtitle="Organize seu Layout e mantenha o ritmo."
        bullets={[
          "Organize seu Layout e arraste colunas para a melhor ordem.",
          "Crie colunas apropriadas para cada contexto de tarefa.",
          "Classifique entre Diário, Hábito e Afazer (ToDo).",
        ]}
        imageSrc="/assets/undraw/task/undraw_next-task_jtbr 1.svg"
        imageWidth={isCompact ? 115 : 136}
        imageHeight={isCompact ? 75 : 93}
        className={cn(
          "rounded-xl border border-primary/30 bg-primary-dark/20 shrink-0 transition-all mb-2",
          isCompact ? "p-3 max-w-xl" : "p-4 sm:p-5 max-w-2xl",
        )}
      />

      {/* Barra de Filtros com Popover Completo, Busca e Modo Foco */}
      <RoutineFilters
        search={searchQuery}
        onSearch={setSearchQuery}
        filters={filters}
        onFilterChange={setFilters}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode((prev) => !prev)}
        availableTags={availableTags}
        columnsCount={columns.length}
        maxColumns={maxColumns}
        isPremium={is_Premium}
        canCreateColumn={canCreateColumn}
        columnsList={columnsList}
        visibleColumnIds={visibleColumnIds}
        onToggleColumnVisibility={toggleColumnVisibility}
        onOpenCreateColumn={() => setIsCreateColumnOpen(true)}
        onOpenCreateTask={() =>
          setTaskModalState({
            isOpen: true,
            columnId: columns[0]?.id,
            taskToEdit: null,
          })
        }
      />

      {/* Quadro Kanban Responsivo */}
      <section
        className="flex-1 min-w-0 flex flex-col"
        aria-label="Quadro de rotinas"
      >
        <RoutineBoard
          columns={filteredColumns}
          setColumns={setColumns}
          visibleColumnIds={visibleColumnIds}
          maxColumns={maxColumns}
          onAddColumn={() => setIsCreateColumnOpen(true)}
          onAddTaskToColumn={(colId) =>
            setTaskModalState({
              isOpen: true,
              columnId: colId,
              taskToEdit: null,
            })
          }
          onOpenDetails={(task, columnId, anchorRect) =>
            setSelectedTaskDetails({ task, columnId, anchorRect })
          }
          onContextMenu={handleContextMenu}
          onTaskMove={handleTaskMove}
          onColumnReorder={handleColumnReorder}
        />
      </section>

      {/* Context Menu ao clicar com botão direito na tarefa */}
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

      {/* Modal: Criar Coluna */}
      <CreateBoardColumnModal
        isOpen={isCreateColumnOpen}
        onClose={() => {
          setIsCreateColumnOpen(false);
          if (searchParams.get("createColumn") === "true") {
            const nextParams = new URLSearchParams(searchParams.toString());
            nextParams.delete("createColumn");
            const qs = nextParams.toString();
            router.replace(qs ? `/tasks?${qs}` : "/tasks", { scroll: false });
          }
        }}
        onSuccess={handleColumnCreated}
      />

      {/* Modal: Criar / Editar Tarefa */}
      <CreateTaskModal
        isOpen={taskModalState.isOpen}
        onClose={() => setTaskModalState({ isOpen: false, taskToEdit: null })}
        columns={columns.map((c) => ({ id: c.id, title: c.title }))}
        defaultColumnId={taskModalState.columnId}
        taskToEdit={taskModalState.taskToEdit}
        onSuccess={handleTaskSaved}
      />

      {/* Popover Lateral: Detalhes Rápidos da Tarefa (ao clicar na tarefa com botão esquerdo) */}
      <TaskDetailsPopover
        isOpen={!!selectedTaskDetails}
        onClose={() => setSelectedTaskDetails(null)}
        task={selectedTaskDetails?.task ?? null}
        columnTitle={
          columns.find((c) => c.id === selectedTaskDetails?.columnId)?.title
        }
        anchorRect={selectedTaskDetails?.anchorRect}
        onTaskUpdate={(updatedTask) => {
          setSelectedTaskDetails((prev) =>
            prev ? { ...prev, task: updatedTask } : null,
          );
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              tasks: col.tasks.map((t) =>
                t.id === updatedTask.id ? updatedTask : t,
              ),
            })),
          );
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
        onToggleComplete={(taskId, completed) => {
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              tasks: col.tasks.map((t) =>
                t.id === taskId ? { ...t, completed } : t,
              ),
            })),
          );
          startTransition(async () => {
            if (completed) {
              await completeTask(taskId);
            } else {
              await changeTaskStatus(taskId, "PENDING");
            }
          });
        }}
      />
    </PageWrapper>
  );
}
