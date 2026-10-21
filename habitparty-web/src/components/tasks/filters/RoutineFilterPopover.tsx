"use client";

import { FilterX, SlidersHorizontal, Tag } from "lucide-react";
import { useState } from "react";
import {
  STATUS_FILTER_OPTIONS,
  TASK_TYPE_FILTER_OPTIONS,
} from "@/constants/routine";
import {
  DEFAULT_BOARD_FILTERS,
  TASK_DIFFICULTY_OPTIONS,
  TODO_PRIORITY_OPTIONS,
} from "@/constants/task";
import type {
  BoardFilterState,
  TaskDifficultyOption,
  TaskPriorityOption,
  TaskTypeOption,
} from "@/types/task";
import type { RoutineFilterPopoverProps } from "@/types/task-ui";
import { cn } from "@/utils";

export function RoutineFilterPopover({
  filters = DEFAULT_BOARD_FILTERS,

  onFilterChange,
  availableTags = [],
  isCompact = false,
}: RoutineFilterPopoverProps) {
  const [showFilterPopover, setShowFilterPopover] = useState(false);

  const activeFiltersCount =
    (filters.taskType !== "all" ? 1 : 0) +
    (filters.difficulty !== "all" ? 1 : 0) +
    (filters.priority !== "all" ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0) +
    (filters.tag !== null ? 1 : 0);

  const handleResetFilters = () => {
    onFilterChange?.(DEFAULT_BOARD_FILTERS);
  };

  const updateFilter = <K extends keyof BoardFilterState>(
    key: K,
    val: BoardFilterState[K],
  ) => {
    onFilterChange?.({
      ...filters,
      [key]: val,
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowFilterPopover(!showFilterPopover)}
        aria-expanded={showFilterPopover}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border font-medium transition-all cursor-pointer select-none",
          isCompact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-body-s",
          activeFiltersCount > 0
            ? "bg-gold/15 border-gold/60 text-gold-pressed shadow-glow-gold-xs"
            : "bg-surface border-white/15 text-neutral-200 hover:text-neutral-50 hover:bg-surface-hover hover:border-white/25",
        )}
      >
        <SlidersHorizontal
          size={isCompact ? 13 : 15}
          className={cn(
            "shrink-0",
            activeFiltersCount > 0 ? "text-gold" : "text-neutral-300",
          )}
        />
        <span>Filtrar</span>
        {activeFiltersCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-tiny font-bold bg-gold text-neutral-900">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {showFilterPopover && (
        <>
          <button
            type="button"
            aria-label="Fechar popover de filtros"
            className="fixed inset-0 z-40 cursor-default bg-transparent border-none p-0 m-0"
            onClick={() => setShowFilterPopover(false)}
          />

          <div className="absolute left-0 top-full mt-2 w-80 rounded-xl bg-popover border border-white/20 p-4 shadow-popover-dark z-50 animate-in fade-in zoom-in-95 backdrop-blur-md">
            {/* Cabeçalho do Popover */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
              <span className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                <SlidersHorizontal size={13} className="text-gold" />
                Filtrar Atividades
              </span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-tiny text-neutral-400 hover:text-danger-500 transition-colors cursor-pointer"
                >
                  <FilterX size={12} />
                  <span>Limpar</span>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {/* 1. Tipo de Tarefa */}
              <div className="flex flex-col gap-1.5">
                <span className="text-label-g font-semibold text-neutral-400">
                  Tipo de Tarefa
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {TASK_TYPE_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() =>
                        updateFilter(
                          "taskType",
                          opt.id as "all" | TaskTypeOption,
                        )
                      }
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium transition-all text-center cursor-pointer",
                        filters.taskType === opt.id
                          ? "bg-gold text-neutral-900 font-bold shadow-xs"
                          : "bg-white/5 text-neutral-300 hover:bg-white/10",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Dificuldade */}
              <div className="flex flex-col gap-1.5">
                <span className="text-label-g font-semibold text-neutral-400">
                  Dificuldade
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => updateFilter("difficulty", "all")}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                      filters.difficulty === "all"
                        ? "bg-gold text-neutral-900 font-bold"
                        : "bg-white/5 text-neutral-300 hover:bg-white/10",
                    )}
                  >
                    Todas
                  </button>
                  {TASK_DIFFICULTY_OPTIONS.map((diff) => (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() =>
                        updateFilter(
                          "difficulty",
                          diff.id as TaskDifficultyOption,
                        )
                      }
                      className={cn(
                        "px-2 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                        filters.difficulty === diff.id
                          ? "bg-gold text-neutral-900 font-bold"
                          : "bg-white/5 text-neutral-300 hover:bg-white/10",
                      )}
                    >
                      {diff.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Prioridade */}
              <div className="flex flex-col gap-1.5">
                <span className="text-label-g font-semibold text-neutral-400">
                  Prioridade
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => updateFilter("priority", "all")}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                      filters.priority === "all"
                        ? "bg-gold text-neutral-900 font-bold"
                        : "bg-white/5 text-neutral-300 hover:bg-white/10",
                    )}
                  >
                    Todas
                  </button>
                  {TODO_PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        updateFilter("priority", p.id as TaskPriorityOption)
                      }
                      className={cn(
                        "px-2 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                        filters.priority === p.id
                          ? "bg-gold text-neutral-900 font-bold"
                          : "bg-white/5 text-neutral-300 hover:bg-white/10",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Status */}
              <div className="flex flex-col gap-1.5">
                <span className="text-label-g font-semibold text-neutral-400">
                  Status
                </span>
                <div className="grid grid-cols-3 gap-1">
                  {STATUS_FILTER_OPTIONS.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() =>
                        updateFilter(
                          "status",
                          st.id as "all" | "pending" | "completed",
                        )
                      }
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium transition-all text-center cursor-pointer",
                        filters.status === st.id
                          ? "bg-gold text-neutral-900 font-bold shadow-xs"
                          : "bg-white/5 text-neutral-300 hover:bg-white/10",
                      )}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Tags (se houver disponíveis no quadro) */}
              {availableTags.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1 border-t border-white/5">
                  <span className="text-label-g font-semibold text-neutral-400 flex items-center gap-1">
                    <Tag size={11} /> Tags
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => updateFilter("tag", null)}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-tiny font-medium transition-all cursor-pointer",
                        filters.tag === null
                          ? "bg-gold text-neutral-900 font-bold"
                          : "bg-white/5 text-neutral-300 hover:bg-white/10",
                      )}
                    >
                      Todas
                    </button>
                    {availableTags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          updateFilter("tag", filters.tag === t ? null : t)
                        }
                        className={cn(
                          "px-2 py-0.5 rounded-full text-tiny font-medium transition-all cursor-pointer truncate max-w-[120px]",
                          filters.tag === t
                            ? "bg-gold text-neutral-900 font-bold"
                            : "bg-white/5 text-neutral-300 hover:bg-white/10",
                        )}
                      >
                        #{t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
