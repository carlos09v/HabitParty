"use client";

import {
  closestCorners,
  DndContext,
  DragOverlay,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type { BoardColumn } from "@/types/task";
import { cn } from "@/utils";
import { RoutineColumn } from "./RoutineColumn";
import { RoutineTaskCard } from "./RoutineTaskCard";
import { useRoutineBoardDnd } from "@/hooks/useRoutineBoardDnd";

interface RoutineBoardProps {
  columns: BoardColumn[];
  setColumns: React.Dispatch<React.SetStateAction<BoardColumn[]>>;
  visibleColumnIds: string[];
  onAddColumn?: () => void;
}

export function RoutineBoard({
  columns,
  setColumns,
  visibleColumnIds,
  onAddColumn,
}: RoutineBoardProps) {
  const { sensors, activeColumn, activeTask, handlers } = useRoutineBoardDnd(setColumns);

  // Filtra as colunas que estão visíveis no quadro (máximo 4)
  const visibleColumns = columns.filter((col) =>
    visibleColumnIds.includes(col.id),
  );

  return (
    <DndContext
      id="routine-board-dnd"
      sensors={sensors}
      collisionDetection={closestCorners}
      {...handlers}
    >
      {/* Grid de até 4 colunas ocupando a tela toda */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 min-w-0 pb-6 pt-2">
        <SortableContext
          items={visibleColumnIds}
          strategy={horizontalListSortingStrategy}
        >
          {visibleColumns.map((column, idx) => (
            <RoutineColumn key={column.id} column={column} columnIndex={idx} />
          ))}
        </SortableContext>

        {/* Card "+ Criar Coluna" exibido SOMENTE se houver menos de 4 colunas visíveis */}
        {visibleColumns.length < 4 && (
          <button
            type="button"
            onClick={onAddColumn}
            aria-label="Criar nova coluna"
            className={cn(
              "w-full h-full min-h-[260px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group ",
              "border-white/20 bg-transparent text-neutral-400",
              "hover:border-gold hover:text-gold hover:bg-white/5 hover:shadow-sm focus:outline-none",
            )}
          >
            <div className="p-3 rounded-xl bg-white/10 text-neutral-400 group-hover:text-gold group-hover:bg-gold/20 transition-colors">
              <Plus size={24} aria-hidden="true" />
            </div>
            <span className="text-base font-bold">Criar nova coluna</span>
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
