"use client";

import { Plus, SquarePlus } from "lucide-react";
import { FilterBar } from "@/components/ui/FilterBar";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { RoutineFiltersProps } from "@/types/task";
import { cn } from "@/utils";
import { FocusModeToggle } from "./filters/FocusModeToggle";
import { RoutineFilterPopover } from "./filters/RoutineFilterPopover";
import { RoutineListsMenu } from "./filters/RoutineListsMenu";

export function RoutineFilters({
  search = "",
  onSearch,
  filters = {
    taskType: "all",
    difficulty: "all",
    status: "all",
    tag: null,
  },
  onFilterChange,
  focusMode = false,
  onToggleFocusMode,
  availableTags = [],
  onOpenCreateColumn,
  onOpenCreateTask,
  columnsCount = 4,
  maxColumns = 4,
  isPremium = false,
  canCreateColumn = true,
  columnsList = [],
  visibleColumnIds = [],
  onToggleColumnVisibility,
}: RoutineFiltersProps) {
  const { isCompact } = useCompactMode();

  const leftActions = (
    <>
      <RoutineFilterPopover
        filters={filters}
        onFilterChange={onFilterChange}
        availableTags={availableTags}
        isCompact={isCompact}
      />

      <FocusModeToggle
        focusMode={focusMode}
        onToggleFocusMode={onToggleFocusMode}
        isCompact={isCompact}
      />
    </>
  );

  const rightActions = (
    <>
      {isPremium && (
        <RoutineListsMenu
          columnsCount={columnsCount}
          maxColumns={maxColumns}
          columnsList={columnsList}
          visibleColumnIds={visibleColumnIds}
          onToggleColumnVisibility={onToggleColumnVisibility}
          isCompact={isCompact}
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
          "flex items-center gap-1.5 rounded-lg bg-surface border font-semibold transition-all shadow-xs",
          isCompact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2.5 text-body-s",
          canCreateColumn
            ? "border-white/15 text-neutral-100 hover:bg-surface-hover hover:border-gold hover:text-gold cursor-pointer active:scale-98"
            : "border-white/10 text-neutral-500 bg-surface/50 cursor-not-allowed opacity-50",
        )}
      >
        <SquarePlus size={isCompact ? 14 : 16} className="shrink-0" />
        <span>Criar coluna</span>
      </button>

      <button
        type="button"
        onClick={onOpenCreateTask}
        className={cn(
          "flex items-center gap-1.5 rounded-lg bg-gold hover:bg-gold-hover active:bg-gold-pressed text-neutral-900 font-bold transition-all cursor-pointer active:scale-98",
          isCompact
            ? "px-3 py-1.5 text-xs shadow-glow-gold-md"
            : "px-3.5 py-2.5 text-body-s shadow-glow-gold",
        )}
      >
        <Plus
          size={isCompact ? 14 : 16}
          className="stroke-3 shrink-0 text-neutral-900"
        />
        <span className="text-neutral-900">Adicionar Tarefa</span>
      </button>
    </>
  );

  return (
    <FilterBar
      search={{
        value: search,
        onChange: (val) => onSearch?.(val),
      }}
      leftActions={leftActions}
      rightActions={rightActions}
    />
  );
}
