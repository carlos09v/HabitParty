"use client";

import { DndContext, DragOverlay, defaultDropAnimation } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarCheck, GripVertical, Plus } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { TaskRow } from "@/components/tasks/shared/TaskRow";
import { getColumnIcon } from "@/constants/routine";
import { TASK_TABLE_GRID_COLS } from "@/constants/task";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { Task } from "@/types/task";
import type {
  RoutineTaskListProps,
  RoutineTaskListSectionProps,
} from "@/types/task-ui";
import { cn } from "@/utils";

const RoutineTaskListSection = memo(function RoutineTaskListSection({
  column,
  isCompact,
  selectedColumnId,
  onAddTaskToColumn,
  onOpenDetails,
  onContextMenu,
  onToggleComplete,
  onHabitChange,
}: RoutineTaskListSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const sectionRef = useRef<HTMLElement | null>(null);
  const isSelected = selectedColumnId === column.id;

  useEffect(() => {
    if (isSelected && sectionRef.current) {
      const timer = setTimeout(() => {
        sectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
        if (typeof window !== "undefined" && window.scrollX !== 0) {
          window.scrollTo({ left: 0 });
        }
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isSelected]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const ColumnIcon = getColumnIcon(column.icon);
  const taskIds = useMemo(() => column.tasks.map((t) => t.id), [column.tasks]);

  const handleOpenRowDetails = useCallback(
    (task: Task, anchorRect?: DOMRect, colId?: string) => {
      onOpenDetails(task, colId || column.id, anchorRect);
    },
    [onOpenDetails, column.id],
  );

  const handleRowContextMenu = useCallback(
    (e: React.MouseEvent, task: Task, colId?: string) => {
      onContextMenu(e, task, colId || column.id);
    },
    [onContextMenu, column.id],
  );

  return (
    <section
      ref={(node) => {
        setNodeRef(node);
        sectionRef.current = node;
      }}
      style={style}
      data-column-id={column.id}
      className={cn(
        "flex flex-col gap-2.5 w-full transition-[background-color,border-color,opacity,box-shadow] duration-150 rounded-xl",
        isSelected &&
          "ring-2 ring-inset ring-gold/90 shadow-glow-gold bg-gold/[0.03] p-2",
        isDragging &&
          "!transition-none opacity-30 border border-dashed border-primary-light p-2",
      )}
      aria-label={`Lista: ${column.title}`}
    >
      {/* Header da Seção da Coluna */}
      <div className="flex items-center justify-between gap-3 border-b border-white/8 pb-2">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing touch-none select-none py-0.5 px-1 rounded-lg hover:bg-white/5 transition-colors group/col-header min-w-0 flex-1"
          title={`Arrastar lista "${column.title}" para reordenar`}
        >
          {/* Grip de Reordenação da Coluna na Lista */}
          <div className="flex items-center justify-center p-0.5 text-neutral-500 group-hover/col-header:text-gold transition-colors shrink-0">
            <GripVertical size={isCompact ? 13 : 15} />
          </div>

          <div
            className={cn(
              "rounded-lg bg-primary-dark/40 border border-white/10 text-gold flex items-center justify-center shrink-0",
              isCompact ? "w-6 h-6" : "w-7 h-7",
            )}
          >
            <ColumnIcon size={isCompact ? 13 : 15} />
          </div>
          <h3
            className={cn(
              "font-bold text-neutral-100 group-hover/col-header:text-gold transition-colors truncate min-w-0",
              isCompact ? "text-xs" : "text-sm",
            )}
          >
            {column.title}
          </h3>
          <span className="text-tiny font-bold px-1.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-neutral-300 shrink-0">
            {column.tasks.length}
          </span>
        </div>

        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onAddTaskToColumn(column.id)}
          title={`Adicionar tarefa em "${column.title}"`}
          className={cn(
            "flex items-center gap-1 text-neutral-400 hover:text-gold hover:bg-white/5 rounded-md transition-all cursor-pointer shrink-0",
            isCompact ? "px-2 py-1 text-label-g" : "px-2.5 py-1 text-xs",
          )}
        >
          <Plus size={isCompact ? 12 : 14} />
          <span className="hidden sm:inline">Adicionar Tarefa</span>
        </button>
      </div>

      {/* Lista de Linhas de Tarefa Sortable */}
      {column.tasks.length === 0 ? (
        <div className="py-6 px-4 text-center rounded-lg border border-dashed border-white/10 text-neutral-500 text-tiny bg-primary-dark/5">
          Nenhuma tarefa nesta lista. Arraste tarefas aqui ou adicione uma nova.
        </div>
      ) : (
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-2 w-full p-0 m-0 list-none min-h-6">
            {column.tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                columnId={column.id}
                columnTitle={column.title}
                isCompact={isCompact}
                isSortable={true}
                onOpenDetails={handleOpenRowDetails}
                onContextMenu={handleRowContextMenu}
                onToggleCompleted={onToggleComplete}
                onHabitChange={onHabitChange}
              />
            ))}
          </ul>
        </SortableContext>
      )}
    </section>
  );
});

export function RoutineTaskList({
  columns,
  visibleColumnIds,
  selectedColumnId,
  isCompact: propIsCompact,
  onAddTaskToColumn,
  onOpenDetails,
  onContextMenu,
  onToggleComplete,
  onHabitChange,
  dndState,
}: RoutineTaskListProps) {
  const { isCompact } = useCompactMode(propIsCompact);

  const visibleColumns = useMemo(
    () => columns.filter((col) => visibleColumnIds.includes(col.id)),
    [columns, visibleColumnIds],
  );

  const totalTasksCount = useMemo(
    () => visibleColumns.reduce((acc, col) => acc + col.tasks.length, 0),
    [visibleColumns],
  );

  const listContent = (
    <div className="flex-1 min-h-0 w-full flex flex-col gap-6 overflow-y-auto pr-1 pb-10">
      {/* Cabeçalho tabular global */}
      <div
        className={cn(
          "hidden md:grid items-center text-xs font-semibold text-neutral-400 border-b border-white/10 select-none",
          TASK_TABLE_GRID_COLS,
          isCompact ? "gap-2.5 px-3 py-1.5" : "gap-4 px-4 py-2",
        )}
        aria-hidden="true"
      >
        <span className="pl-8">Nome da Tarefa</span>
        <span>Lista</span>
        <span>Tipo</span>
        <span>Prioridade</span>
        <span>Frequência / Prazo</span>
        <span className="text-right pr-2">Ações</span>
      </div>

      {visibleColumns.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center text-center py-16 px-4 rounded-2xl border border-dashed border-white/15 bg-primary-dark/10">
          <CalendarCheck size={32} className="text-neutral-500 mb-2" />
          <p className="text-body-m font-bold text-neutral-200">
            Nenhuma coluna visível
          </p>
          <p className="text-body-s text-neutral-400 mt-1">
            Selecione ou crie uma coluna para visualizar suas tarefas.
          </p>
        </div>
      ) : totalTasksCount === 0 ? (
        <div className="w-full flex flex-col items-center justify-center text-center py-16 px-4 rounded-2xl border border-dashed border-white/15 bg-primary-dark/10">
          <CalendarCheck size={32} className="text-gold mb-2" />
          <p className="text-body-m font-bold text-neutral-200">
            Tudo limpo por aqui! 🎉
          </p>
          <p className="text-body-s text-neutral-400 mt-1">
            Nenhuma tarefa cadastrada nas colunas visíveis.
          </p>
        </div>
      ) : (
        <SortableContext
          items={visibleColumns.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {visibleColumns.map((col) => (
            <RoutineTaskListSection
              key={col.id}
              column={col}
              isCompact={isCompact}
              selectedColumnId={selectedColumnId}
              onAddTaskToColumn={onAddTaskToColumn}
              onOpenDetails={onOpenDetails}
              onContextMenu={onContextMenu}
              onToggleComplete={onToggleComplete}
              onHabitChange={onHabitChange}
            />
          ))}
        </SortableContext>
      )}
    </div>
  );

  if (!dndState) {
    return listContent;
  }

  return (
    <DndContext
      id="routine-list-dnd"
      sensors={dndState.sensors}
      collisionDetection={dndState.collisionDetection}
      modifiers={[restrictToWindowEdges]}
      {...dndState.handlers}
    >
      {listContent}

      <DragOverlay dropAnimation={defaultDropAnimation}>
        {dndState.activeColumn && (
          <div className="opacity-95 shadow-2xl p-3 rounded-xl bg-surface border border-gold/70 flex items-center gap-2.5">
            <GripVertical size={14} className="text-gold" />
            <span className="font-bold text-neutral-100 text-sm">
              {dndState.activeColumn.title}
            </span>
            <span className="text-tiny font-bold px-1.5 py-0.5 rounded-full bg-white/10 text-neutral-300">
              {dndState.activeColumn.tasks.length} tarefas
            </span>
          </div>
        )}
        {dndState.activeTask && (
          <div className="opacity-95 shadow-2xl scale-102">
            <TaskRow
              task={dndState.activeTask}
              columnId={dndState.activeTask.columnId || ""}
              columnTitle={
                columns.find((c) => c.id === dndState.activeTask?.columnId)
                  ?.title
              }
              isCompact={isCompact}
              isSortable
              isOverlay
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
