import { closestCorners, DndContext, DragOverlay } from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { useMemo } from "react";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useRoutineBoardDnd } from "@/hooks/useRoutineBoardDnd";
import type { RoutineBoardProps } from "@/types/task";
import { cn } from "@/utils";
import { RoutineColumn } from "./RoutineColumn";
import { RoutineTaskCard } from "./RoutineTaskCard";

export function RoutineBoard({
  columns,
  setColumns,
  visibleColumnIds,
  maxColumns,
  selectedColumnId,
  onAddColumn,
  onAddTaskToColumn,
  onOpenDetails,
  onContextMenu,
  onOpenColumnMenu,
  onTaskMove,
  onColumnReorder,
  onToggleComplete,
  onHabitChange,
}: RoutineBoardProps) {
  const { isCompact } = useCompactMode();
  const { sensors, activeColumn, activeTask, handlers } = useRoutineBoardDnd({
    columns,
    setColumns,
    onTaskMove,
    onColumnReorder,
  });

  // Filtra as colunas que estão visíveis no quadro (máximo 4)
  const visibleColumns = useMemo(
    () => columns.filter((col) => visibleColumnIds.includes(col.id)),
    [columns, visibleColumnIds],
  );

  // Garante que a ordem dos IDs no SortableContext seja rigorosamente a mesma dos nós renderizados
  const visibleColumnIdsOrdered = useMemo(
    () => visibleColumns.map((col) => col.id),
    [visibleColumns],
  );

  const canAddColumn = maxColumns ? columns.length < maxColumns : true;
  const showAddColumnCard = canAddColumn && visibleColumns.length < 4;

  return (
    <DndContext
      id="routine-board-dnd"
      sensors={sensors}
      collisionDetection={closestCorners}
      modifiers={[restrictToWindowEdges]}
      {...handlers}
    >
      {/* Grid de até 4 colunas ocupando a tela toda */}
      <div
        className={cn(
          "w-full h-full min-h-0 flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 min-w-0 items-stretch transition-all duration-200",
          isCompact ? "gap-3.5 pb-2 pt-1" : "gap-6 pb-4 pt-2",
        )}
      >
        <SortableContext
          items={visibleColumnIdsOrdered}
          strategy={horizontalListSortingStrategy}
        >
          {visibleColumns.map((column, idx) => (
            <RoutineColumn
              key={column.id}
              column={column}
              columnIndex={idx}
              isSelected={selectedColumnId === column.id}
              onAddTaskToColumn={onAddTaskToColumn}
              onOpenDetails={onOpenDetails}
              onContextMenu={onContextMenu}
              onOpenColumnMenu={onOpenColumnMenu}
              onToggleComplete={onToggleComplete}
              onHabitChange={onHabitChange}
            />
          ))}
        </SortableContext>

        {/* Card "+ Criar Coluna" exibido se houver menos de 4 visíveis e não atingiu o limite do plano */}
        {showAddColumnCard && (
          <button
            type="button"
            onClick={onAddColumn}
            aria-label="Criar nova coluna"
            className={cn(
              "w-full h-full min-h-0 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer group",
              isCompact ? "min-h-48 gap-2" : "min-h-64 gap-3",
              "border-white/20 bg-transparent text-neutral-400",
              "hover:border-gold hover:text-gold hover:bg-white/5 hover:shadow-sm focus:outline-none",
            )}
          >
            <div
              className={cn(
                "rounded-xl bg-white/10 text-neutral-400 group-hover:text-gold group-hover:bg-gold/20 transition-colors",
                isCompact ? "p-2.5" : "p-3",
              )}
            >
              <Plus size={isCompact ? 20 : 24} aria-hidden="true" />
            </div>
            <span
              className={cn("font-bold", isCompact ? "text-sm" : "text-base")}
            >
              Criar nova coluna
            </span>
          </button>
        )}
      </div>

      {/* Overlay suave durante o arrasto */}
      <DragOverlay>
        {activeColumn && (
          <RoutineColumn column={activeColumn} columnIndex={0} isOverlay />
        )}
        {activeTask && (
          <RoutineTaskCard
            task={activeTask}
            columnId={activeTask.columnId || ""}
            isOverlay
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
