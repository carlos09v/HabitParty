"use client";

import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import { Columns3, Plus } from "lucide-react";
import { useCallback, useMemo, useRef } from "react";
import { useCompactMode } from "@/hooks/useCompactMode";
import { COLUMN_WIDTH_CLASSES } from "@/hooks/useRoutineBoardLayout";
import type { RoutineBoardProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { RoutineColumn } from "./RoutineColumn";

export function RoutineBoard({
  columns,
  visibleColumnIds,
  selectedColumnId,
  isCompact: propIsCompact,
  alignment = "left",
  columnWidths = {},
  getColumnWidthClass: customGetColumnWidthClass,
  onAddColumn,
  onAddTaskToColumn,
  onOpenDetails,
  onContextMenu,
  onOpenColumnMenu,
  onToggleComplete,
  onHabitChange,
  onQuickCreateTask,
}: RoutineBoardProps) {
  const { isCompact: hookIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? hookIsCompact;
  const containerRef = useRef<HTMLDivElement | null>(null);

  const resolveColumnWidthClass = useCallback(
    (colId: string) => {
      if (customGetColumnWidthClass) {
        return customGetColumnWidthClass(colId);
      }
      const preset = columnWidths[colId] || "normal";
      return COLUMN_WIDTH_CLASSES[preset] || COLUMN_WIDTH_CLASSES.normal;
    },
    [customGetColumnWidthClass, columnWidths],
  );

  // Filtra as colunas que estão visíveis no quadro
  const visibleColumns = useMemo(
    () => columns.filter((col) => visibleColumnIds.includes(col.id)),
    [columns, visibleColumnIds],
  );

  // Garante que a ordem dos IDs no SortableContext seja rigorosamente a mesma dos nós renderizados
  const visibleColumnIdsOrdered = useMemo(
    () => visibleColumns.map((col) => col.id),
    [visibleColumns],
  );

  // 1. ESTADO VAZIO: WORKSPACE SEM COLUNAS
  if (columns.length === 0) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-12">
        <div className="max-w-md w-full flex flex-col items-center gap-4 p-8 rounded-2xl border border-dashed border-primary/35 bg-primary-dark/20 backdrop-blur-xs">
          <div className="w-16 h-16 rounded-2xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shadow-glow-gold-xs">
            <Columns3 size={32} />
          </div>
          <div className="flex flex-col gap-1.5 items-center">
            <h3 className="text-lg font-bold text-neutral-100">
              Seu quadro ainda não tem listas!
            </h3>
            <p className="text-sm text-neutral-400 max-w-sm">
              Crie sua primeira coluna (ex: A Fazer, Em Andamento, Rotinas) para
              começar a organizar suas tarefas e manter o foco.
            </p>
          </div>
          {onAddColumn && (
            <button
              type="button"
              onClick={onAddColumn}
              className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-neutral-950 font-bold text-sm shadow-glow-gold-xs transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Criar Primeira Coluna</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. ESTADO VAZIO: TODAS AS COLUNAS ESTÃO OCULTAS
  if (visibleColumns.length === 0) {
    return (
      <div className="w-full flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="max-w-md w-full flex flex-col items-center gap-3 p-6 rounded-2xl border border-dashed border-white/10 bg-white/5">
          <h3 className="text-base font-bold text-neutral-200">
            Todas as colunas estão ocultas
          </h3>
          <p className="text-xs text-neutral-400">
            Abra o gerenciador de colunas na barra de filtros para reexibi-las
            no quadro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-0 flex-1 flex flex-col min-w-0"
    >
      {/* Quadro Kanban: Colunas fluidas com rolagem horizontal suave quando necessário */}
      <div
        className={cn(
          "w-full h-full min-h-0 flex-1 overflow-x-auto custom-scrollbar min-w-0",
          isCompact ? "pb-2 pt-1" : "pb-4 pt-2",
        )}
      >
        <div
          className={cn(
            "min-w-full w-max h-full flex items-stretch",
            isCompact ? "gap-3" : "gap-4",
            alignment === "center" && "justify-center",
            alignment === "right" && "justify-end",
            alignment === "left" && "justify-start",
          )}
        >
          <SortableContext
            items={visibleColumnIdsOrdered}
            strategy={horizontalListSortingStrategy}
          >
            {visibleColumns.map((column, idx) => (
              <div
                key={column.id}
                className={cn(
                  "h-full shrink-0 flex flex-col transition-[width] duration-150",
                  resolveColumnWidthClass(column.id),
                )}
              >
                <RoutineColumn
                  column={column}
                  columnIndex={idx}
                  isSelected={selectedColumnId === column.id}
                  isCompact={isCompact}
                  widthPreset={columnWidths[column.id] || "normal"}
                  onAddTaskToColumn={onAddTaskToColumn}
                  onQuickCreateTask={onQuickCreateTask}
                  onOpenDetails={onOpenDetails}
                  onContextMenu={onContextMenu}
                  onOpenColumnMenu={onOpenColumnMenu}
                  onToggleComplete={onToggleComplete}
                  onHabitChange={onHabitChange}
                />
              </div>
            ))}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}
