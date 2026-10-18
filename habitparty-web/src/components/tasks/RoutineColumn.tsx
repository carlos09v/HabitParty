"use client";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreVertical, Plus } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { getColumnIcon } from "@/constants/routine";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { RoutineColumnProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { RoutineQuickAddForm } from "./RoutineQuickAddForm";
import { RoutineTaskCard } from "./RoutineTaskCard";

export const RoutineColumn = memo(function RoutineColumn({
  column,
  isSelected = false,
  isCompact: propIsCompact,
  widthPreset = "normal",
  onAddTaskToColumn,
  onQuickCreateTask,
  onOpenDetails,
  onContextMenu,
  onOpenColumnMenu,
  onToggleComplete,
  onHabitChange,
  isOverlay = false,
}: RoutineColumnProps) {
  const { isCompact: hookIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? hookIsCompact;
  const ColumnIcon = getColumnIcon(column.icon);
  const columnRef = useRef<HTMLDivElement | null>(null);

  const [isQuickAdding, setIsQuickAdding] = useState(false);

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
      const timer = setTimeout(() => {
        const column = columnRef.current;
        if (!column) return;

        // Rola EXCLUSIVAMENTE o container com overflow-x do Kanban para o centro,
        // evitando que scrollIntoView borbulhe e desloque a página principal ou corte a sidebar.
        const scrollContainer = column.closest<HTMLElement>(".overflow-x-auto");
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const columnRect = column.getBoundingClientRect();

          const currentScroll = scrollContainer.scrollLeft;
          const relativeLeft =
            columnRect.left - containerRect.left + currentScroll;
          const targetScroll =
            relativeLeft -
            scrollContainer.clientWidth / 2 +
            column.clientWidth / 2;

          scrollContainer.scrollTo({
            left: Math.max(0, targetScroll),
            behavior: "smooth",
          });
        }

        // Garante que containers ancestrais (layout/main/window) permaneçam estáticos em 0
        if (typeof window !== "undefined" && window.scrollX !== 0) {
          window.scrollTo({ left: 0 });
        }
        const mainEl = column.closest("main");
        if (mainEl && mainEl.scrollLeft !== 0) {
          mainEl.scrollLeft = 0;
        }
        const layoutContainer = mainEl?.parentElement;
        if (layoutContainer && layoutContainer.scrollLeft !== 0) {
          layoutContainer.scrollLeft = 0;
        }
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isSelected]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const taskIds = useMemo(() => column.tasks.map((t) => t.id), [column.tasks]);

  return (
    <div
      ref={setCombinedRef}
      data-column-id={column.id}
      style={style}
      className={cn(
        "flex flex-col w-full h-full min-h-0 flex-1 min-w-0 transition-[background-color,border-color,box-shadow,opacity] duration-150 select-none bg-transparent rounded-2xl",
        isSelected && "ring-2 ring-gold/90 shadow-glow-gold bg-gold/[0.03]",
        isDragging &&
          "!transition-none opacity-30 border-dashed border-primary-light scale-98",
        isOverlay &&
          "!transition-none shadow-card-deep border-gold/70 bg-primary-dark/60 scale-102 rotate-1 z-50",
      )}
    >
      {/* HEADER DA COLUNA (Arrastável com dnd-kit) */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "flex items-center justify-between cursor-grab active:cursor-grabbing group/header touch-none shrink-0",
          isCompact ? "p-2.5 mb-1" : "p-3.5 mb-2",
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <GripVertical
            size={isCompact ? 13 : 15}
            className="text-neutral-500/70 group-hover/header:text-gold transition-colors shrink-0 -mr-0.5"
          />
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
          "flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar",
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
                isCompact={isCompact}
                onOpenDetails={onOpenDetails}
                onContextMenu={onContextMenu}
                onToggleCompleted={onToggleComplete}
                onHabitChange={onHabitChange}
              />
            ))
          )}
        </SortableContext>

        {/* Campo de Criação Rápida Inline */}
        {isQuickAdding && (
          <RoutineQuickAddForm
            columnId={column.id}
            isCompact={isCompact}
            isColumnCompact={widthPreset === "compact"}
            onClose={() => setIsQuickAdding(false)}
            onQuickCreateTask={onQuickCreateTask}
            onOpenDetailedForm={onAddTaskToColumn}
          />
        )}
      </div>

      {/* BOTÃO INFERIOR DE ADICIONAR TAREFA RÁPIDA */}
      <div className={cn("shrink-0", isCompact ? "p-1.5 pt-0" : "p-2.5 pt-0")}>
        {!isQuickAdding && (
          <button
            type="button"
            onClick={() => {
              if (onQuickCreateTask) {
                setIsQuickAdding(true);
              } else {
                onAddTaskToColumn?.(column.id);
              }
            }}
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
        )}
      </div>
    </div>
  );
});
