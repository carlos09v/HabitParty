"use client";

import { GripVertical, Plus, Sun } from "lucide-react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type BoardColumn } from "@/types/task";
import { RoutineTaskCard } from "./RoutineTaskCard";
import { cn } from "@/utils";

interface RoutineColumnProps {
  column: BoardColumn;
  columnIndex: number;
  onAddTaskToColumn?: (columnId: string) => void;
  isOverlay?: boolean;
}

export function RoutineColumn({
  column,
  columnIndex,
  onAddTaskToColumn,
  isOverlay = false,
}: RoutineColumnProps) {
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

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const taskIds = column.tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col w-full h-full shrink-0 transition-all duration-200 select-none bg-transparent border-none",
        isDragging && "opacity-30 border-dashed border-primary-light scale-98",
        isOverlay &&
          "shadow-[0_15px_30px_rgba(0,0,0,0.5)] border-gold/70 bg-primary-dark/60 scale-102 rotate-1 z-50",
      )}
    >
      {/* HEADER DA COLUNA (Arrastável com dnd-kit) */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between p-3.5 mb-2 cursor-grab active:cursor-grabbing group/header touch-none"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-primary-dark/40 text-neutral-300 group-hover/header:text-gold transition-colors shrink-0">
            <Sun size={16} />
          </div>

          <h3 className="text-subtitle-s font-bold text-neutral-100 truncate">
            {column.title}
          </h3>

          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/8 text-neutral-300 shrink-0">
            {column.tasks.length}
          </span>
        </div>

        <div className="text-neutral-500 group-hover/header:text-neutral-300 p-1 rounded hover:bg-white/6 transition-colors">
          <GripVertical size={16} />
        </div>
      </div>

      {/* ÁREA DE TAREFAS (Sortable vertical com dnd-kit) */}
      <div className="flex flex-col gap-2.5 p-3 flex-1 overflow-y-auto custom-scrollbar min-h-[160px] max-h-[calc(100vh-340px)]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {column.tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 rounded-xl border border-dashed border-primary/30 text-neutral-400 text-body-s">
              Nenhuma tarefa aqui
            </div>
          ) : (
            column.tasks.map((task) => (
              <RoutineTaskCard
                key={task.id}
                task={task}
                columnId={column.id}
              />
            ))
          )}
        </SortableContext>
      </div>

      {/* BOTÃO INFERIOR DE ADICIONAR TAREFA RÁPIDA */}
      <div className="p-2.5 pt-0">
        <button
          type="button"
          onClick={() => onAddTaskToColumn?.(column.id)}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed transition-all cursor-pointer",
            "border-primary/40 bg-primary-dark/10 text-body-s font-semibold text-neutral-300",
            "hover:border-gold hover:text-gold hover:bg-primary-dark/25 hover:shadow-[0_0_10px_rgba(237,229,57,0.15)]",
          )}
        >
          <Plus size={15} />
          <span>Adicionar tarefa</span>
        </button>
      </div>
    </div>
  );
}
