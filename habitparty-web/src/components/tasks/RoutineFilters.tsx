"use client";

import { useDroppable } from "@dnd-kit/core";
import { ArchiveRestore, Columns3, SquarePlus } from "lucide-react";
import { FilterBar } from "@/components/ui/FilterBar";
import { PrimaryActionButton } from "@/components/ui/PrimaryActionButton";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { RoutineFiltersProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { BoardAlignmentSelector } from "./filters/BoardAlignmentSelector";
import { RoutineFilterPopover } from "./filters/RoutineFilterPopover";

interface StoreColumnButtonUIProps {
  onOpenColumnsDrawer?: () => void;
  isCompact?: boolean;
  visibleCount: number;
  maxColumns: number;
  isDraggingColumn?: boolean;
  isOver?: boolean;
  setNodeRef?: (element: HTMLElement | null) => void;
}

function StoreColumnButtonUI({
  onOpenColumnsDrawer,
  isCompact,
  visibleCount,
  maxColumns,
  isDraggingColumn = false,
  isOver = false,
  setNodeRef,
}: StoreColumnButtonUIProps) {
  // Apenas considera "isOver" se o elemento arrastado for de fato uma Coluna, nunca um Card de Tarefa
  const isOverValid = isOver && isDraggingColumn;

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onOpenColumnsDrawer}
      title={
        isDraggingColumn
          ? "Solte aqui para ocultar e guardar esta coluna"
          : "Gerenciar colunas e visibilidade no quadro"
      }
      className={cn(
        "flex items-center gap-1.5 rounded-lg border font-semibold shadow-xs transition-all cursor-pointer select-none active:scale-98 shrink-0",
        isCompact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2.5 text-body-s",
        isOverValid
          ? "bg-gold/25 border-gold text-white ring-2 ring-gold/70 shadow-glow-gold scale-105"
          : isDraggingColumn
            ? "border-dashed border-gold/70 bg-gold/10 text-gold animate-pulse shadow-glow-gold-xs"
            : "bg-surface border-white/15 text-neutral-200 hover:border-gold/50 hover:bg-surface-hover hover:text-white",
      )}
    >
      {isDraggingColumn ? (
        <ArchiveRestore
          size={isCompact ? 14 : 15}
          className={cn("text-gold", isOverValid && "animate-bounce")}
        />
      ) : (
        <Columns3 size={isCompact ? 14 : 15} className="text-primary-light" />
      )}
      <span>
        {isOverValid
          ? "Solte para guardar"
          : isDraggingColumn
            ? "Guardar"
            : "Colunas"}
      </span>
      <span className="text-gold font-bold">
        {visibleCount}/{maxColumns}
      </span>
    </button>
  );
}

function DroppableStoreColumnButton(
  props: Omit<StoreColumnButtonUIProps, "isOver" | "setNodeRef">,
) {
  const { setNodeRef, isOver } = useDroppable({
    id: "store-column-button",
    data: { type: "ColumnStoreButton" },
    disabled: !props.isDraggingColumn,
  });

  return (
    <StoreColumnButtonUI {...props} setNodeRef={setNodeRef} isOver={isOver} />
  );
}

export function RoutineFilters({
  search = "",
  onSearch,
  viewMode,
  filters = {
    taskType: "all",
    difficulty: "all",
    priority: "all",
    status: "all",
    tag: null,
  },
  onFilterChange,
  alignment = "left",
  onAlignmentChange,
  availableTags = [],
  onOpenCreateColumn,
  onOpenCreateTask,
  maxColumns = 4,
  isPremium = false,
  canCreateColumn = true,
  visibleColumnIds = [],
  onOpenColumnsDrawer,
  isDraggingColumn = false,
  enableDroppable = false,
  isCompact: propIsCompact,
}: RoutineFiltersProps) {
  const { isCompact } = useCompactMode(propIsCompact);

  const leftActions = (
    <>
      <RoutineFilterPopover
        filters={filters}
        onFilterChange={onFilterChange}
        availableTags={availableTags}
        isCompact={isCompact}
      />

      {onAlignmentChange && viewMode?.value === "card" && (
        <BoardAlignmentSelector
          value={alignment}
          onChange={onAlignmentChange}
          isCompact={isCompact}
        />
      )}
    </>
  );

  const rightActions = (
    <>
      {enableDroppable ? (
        <DroppableStoreColumnButton
          onOpenColumnsDrawer={onOpenColumnsDrawer}
          isCompact={isCompact}
          visibleCount={visibleColumnIds.length}
          maxColumns={maxColumns}
          isDraggingColumn={isDraggingColumn}
        />
      ) : (
        <StoreColumnButtonUI
          onOpenColumnsDrawer={onOpenColumnsDrawer}
          isCompact={isCompact}
          visibleCount={visibleColumnIds.length}
          maxColumns={maxColumns}
          isDraggingColumn={isDraggingColumn}
        />
      )}

      <button
        type="button"
        onClick={onOpenCreateColumn}
        disabled={!canCreateColumn}
        title={
          !canCreateColumn
            ? `Limite de ${maxColumns} listas atingido${!isPremium ? " (plano Free)" : ""}`
            : "Criar nova coluna"
        }
        className={cn(
          "flex items-center gap-1.5 rounded-lg bg-surface border font-semibold transition-all shadow-xs shrink-0",
          isCompact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2.5 text-body-s",
          canCreateColumn
            ? "border-white/15 text-neutral-100 hover:bg-surface-hover hover:border-gold hover:text-gold cursor-pointer active:scale-98"
            : "border-white/10 text-neutral-500 bg-surface/50 cursor-not-allowed opacity-50",
        )}
      >
        <SquarePlus size={isCompact ? 14 : 16} className="shrink-0" />
        <span className="hidden sm:inline">Criar coluna</span>
      </button>

      <PrimaryActionButton
        label="Adicionar Tarefa"
        onClick={onOpenCreateTask}
        isCompact={isCompact}
      />
    </>
  );

  return (
    <FilterBar
      search={{
        value: search,
        onChange: (val) => onSearch?.(val),
      }}
      viewMode={viewMode}
      leftActions={leftActions}
      rightActions={rightActions}
    />
  );
}
