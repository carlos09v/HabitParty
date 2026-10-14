import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreVertical, Plus } from "lucide-react";
import { memo, useEffect, useMemo, useRef } from "react";
import { getColumnIcon } from "@/constants/routine";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { RoutineColumnProps } from "@/types/task";
import { cn } from "@/utils";
import { RoutineTaskCard } from "./RoutineTaskCard";

export const RoutineColumn = memo(function RoutineColumn({
  column,
  columnIndex: _columnIndex,
  isSelected = false,
  onAddTaskToColumn,
  onOpenDetails,
  onContextMenu,
  onOpenColumnMenu,
  onToggleComplete,
  onHabitChange,
  isOverlay = false,
}: RoutineColumnProps) {
  const { isCompact } = useCompactMode();
  const ColumnIcon = getColumnIcon(column.icon);
  const columnRef = useRef<HTMLDivElement | null>(null);

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
    disabled: isOverlay,
  });

  const setCombinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    columnRef.current = node;
  };

  useEffect(() => {
    if (isSelected && columnRef.current) {
      columnRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [isSelected]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const taskIds = useMemo(() => column.tasks.map((t) => t.id), [column.tasks]);

  return (
    <div
      ref={setCombinedRef}
      data-column-id={column.id}
      style={style}
      className={cn(
        "flex flex-col w-full h-full min-h-0 shrink-0 transition-all duration-300 select-none bg-transparent rounded-2xl",
        isSelected && "ring-2 ring-gold/90 shadow-glow-gold bg-gold/[0.03]",
        isDragging && "opacity-30 border-dashed border-primary-light scale-98",
        isOverlay &&
          "shadow-card-deep border-gold/70 bg-primary-dark/60 scale-102 rotate-1 z-50",
      )}
    >
      {/* HEADER DA COLUNA (Arrastável com dnd-kit) */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "flex items-center justify-between cursor-grab active:cursor-grabbing group/header touch-none transition-all shrink-0",
          isCompact ? "p-2.5 mb-1" : "p-3.5 mb-2",
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={cn(
              "rounded-md bg-primary-dark/40 text-neutral-300 group-hover/header:text-gold transition-colors shrink-0",
              isCompact ? "p-1" : "p-1.5",
            )}
          >
            <ColumnIcon size={isCompact ? 14 : 16} />
          </div>

          <h3
            className={cn(
              "font-bold text-neutral-100 truncate",
              isCompact ? "text-xs sm:text-sm" : "text-sm sm:text-base",
            )}
          >
            {column.title}
          </h3>

          <span
            className={cn(
              "font-bold rounded-full bg-white/8 text-neutral-300 shrink-0",
              isCompact ? "text-tiny px-1.5 py-0.5" : "text-xs px-2 py-0.5",
            )}
          >
            {column.tasks.length}
          </span>
        </div>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            aria-label={`Opções da coluna ${column.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onOpenColumnMenu?.(e, column);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            className="text-neutral-500 hover:text-gold p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
            title="Opções da coluna"
          >
            <MoreVertical size={isCompact ? 14 : 16} />
          </button>
        </div>
      </div>

      {/* ÁREA DE TAREFAS (Sortable vertical com dnd-kit) */}
      <div
        className={cn(
          "flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar transition-all",
          isCompact ? "gap-2 p-1.5" : "gap-2.5 p-3",
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.length === 0 ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border border-dashed border-primary/30 text-neutral-400",
                isCompact ? "h-24 text-xs" : "h-28 text-body-s",
              )}
            >
              Nenhuma tarefa aqui
            </div>
          ) : (
            column.tasks.map((task) => (
              <RoutineTaskCard
                key={task.id}
                task={task}
                columnId={column.id}
                onOpenDetails={onOpenDetails}
                onContextMenu={onContextMenu}
                onToggleCompleted={onToggleComplete}
                onHabitChange={onHabitChange}
              />
            ))
          )}
        </SortableContext>
      </div>

      {/* BOTÃO INFERIOR DE ADICIONAR TAREFA RÁPIDA */}
      <div className={cn("shrink-0", isCompact ? "p-1.5 pt-0" : "p-2.5 pt-0")}>
        <button
          type="button"
          onClick={() => onAddTaskToColumn?.(column.id)}
          className={cn(
            "w-full flex items-center justify-center border border-dashed transition-all cursor-pointer",
            "border-primary/40 bg-primary-dark/10 font-semibold text-neutral-300",
            "hover:border-gold hover:text-gold hover:bg-primary-dark/25 hover:shadow-glow-gold-sm",
            isCompact
              ? "gap-1.5 py-1.5 rounded-lg text-xs"
              : "gap-2 py-2 rounded-xl text-body-s",
          )}
        >
          <Plus size={isCompact ? 14 : 15} />
          <span>Adicionar tarefa</span>
        </button>
      </div>
    </div>
  );
});
