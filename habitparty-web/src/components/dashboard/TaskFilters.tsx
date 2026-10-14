"use client";

import { Calendar, FilterX, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useCompactMode } from "@/hooks/useCompactMode";
import {
  type DashboardAdvancedFilters,
  DEFAULT_DASHBOARD_ADVANCED_FILTERS,
  type TaskFiltersProps,
  type TaskFilterType,
} from "@/types/task";
import { cn } from "@/utils";

const FILTERS: readonly { id: TaskFilterType; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "next7days", label: "Próximos 7 dias..." },
  { id: "nodate", label: "Sem prazo" },
  { id: "overdue", label: "Atrasado" },
] as const;

interface Props extends TaskFiltersProps {
  isCompact?: boolean;
}

export function TaskFilters({
  activeFilter = "today",
  onFilterChange,
  selectedDate,
  onClearDate,
  columns = [],
  advancedFilters = DEFAULT_DASHBOARD_ADVANCED_FILTERS,
  onAdvancedFiltersChange,
  isCompact: propIsCompact,
}: Props) {
  const { isCompact: hookIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? hookIsCompact;
  const [showPopover, setShowPopover] = useState(false);

  const activeFiltersCount = useMemo(() => {
    return (
      (advancedFilters.taskType !== "all" ? 1 : 0) +
      (advancedFilters.columnId !== "all" ? 1 : 0) +
      (advancedFilters.difficulty !== "all" ? 1 : 0) +
      (advancedFilters.hideCompleted ? 1 : 0) +
      (advancedFilters.sortBy !== "default" ? 1 : 0)
    );
  }, [advancedFilters]);

  const formattedDateLabel = useMemo(() => {
    if (!selectedDate) return null;
    try {
      const [y, m, d] = selectedDate.split("-").map(Number);
      const dateObj = new Date(y, (m || 1) - 1, d || 1);
      return dateObj.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const handleSelectStandardFilter = (id: TaskFilterType) => {
    if (selectedDate && onClearDate) {
      onClearDate();
    }
    onFilterChange?.(id);
  };

  const handleResetAdvanced = () => {
    onAdvancedFiltersChange?.(DEFAULT_DASHBOARD_ADVANCED_FILTERS);
  };

  return (
    <nav
      className="flex items-center justify-between gap-4 w-full relative"
      aria-label="Filtros de Data das Tarefas"
    >
      {/* Pílulas de filtro */}
      <div
        className="flex items-center gap-2 overflow-x-auto custom-scrollbar px-1 py-1 -mx-1"
        role="tablist"
      >
        {/* Pílula do dia específico se houver data selecionada */}
        {selectedDate && (
          <button
            type="button"
            onClick={onClearDate}
            className={cn(
              "flex items-center gap-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs bg-gold text-neutral-900 group shrink-0",
              isCompact ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
            )}
            title="Remover filtro de dia específico e voltar ao padrão"
          >
            <Calendar size={isCompact ? 12 : 14} className="shrink-0" />
            <span>Dia: {formattedDateLabel}</span>
            <X
              size={isCompact ? 12 : 14}
              className="shrink-0 group-hover:scale-125 transition-transform ml-0.5"
            />
          </button>
        )}

        {FILTERS.map((f) => {
          const isSelected = !selectedDate && activeFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`panel-${f.id}`}
              id={`tab-${f.id}`}
              onClick={() => handleSelectStandardFilter(f.id)}
              className={cn(
                "rounded-lg font-medium transition-all whitespace-nowrap cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-1 focus:ring-offset-background",
                isCompact ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
                isSelected
                  ? "bg-gold text-neutral-900 font-bold border-transparent shadow-xs"
                  : "bg-primary-dark/20 text-neutral-100 hover:bg-primary-dark/40 border border-primary/30",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Botão de opções e filtros avançados com Popover */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setShowPopover(!showPopover)}
          title="Filtros avançados e opções de ordenação"
          aria-expanded={showPopover}
          aria-label="Abrir filtros avançados"
          className={cn(
            "flex items-center gap-1.5 rounded-lg border transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-gold cursor-pointer",
            isCompact ? "p-1.5 text-xs" : "p-2 text-sm",
            activeFiltersCount > 0
              ? "bg-gold/15 border-gold/60 text-gold shadow-glow-gold-xs font-semibold"
              : "bg-primary-dark/20 hover:bg-primary-dark/40 border-primary/30 text-neutral-300 hover:text-gold",
          )}
        >
          <SlidersHorizontal
            size={isCompact ? 15 : 18}
            className={activeFiltersCount > 0 ? "text-gold" : ""}
            aria-hidden="true"
          />
          {activeFiltersCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-tiny font-bold bg-gold text-neutral-900">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Popover de Filtros Avançados */}
        {showPopover && (
          <>
            <button
              type="button"
              aria-label="Fechar filtros avançados"
              className="fixed inset-0 z-40 cursor-default bg-transparent border-none p-0 m-0"
              onClick={() => setShowPopover(false)}
            />

            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-xl bg-neutral-900/95 border border-primary/40 p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 backdrop-blur-md flex flex-col gap-3">
              {/* Cabeçalho do Popover */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                  <SlidersHorizontal size={13} className="text-gold" />
                  Filtros Avançados
                </span>
                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetAdvanced}
                    className="flex items-center gap-1 text-tiny text-neutral-400 hover:text-danger-500 font-semibold transition-colors cursor-pointer"
                  >
                    <FilterX size={12} />
                    <span>Limpar</span>
                  </button>
                )}
              </div>

              {/* Filtro por Tipo de Tarefa */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="filter-task-type"
                  className="text-tiny text-neutral-400 font-medium"
                >
                  Tipo de Tarefa
                </label>
                <select
                  id="filter-task-type"
                  value={advancedFilters.taskType}
                  onChange={(e) =>
                    onAdvancedFiltersChange?.({
                      ...advancedFilters,
                      taskType: e.target
                        .value as DashboardAdvancedFilters["taskType"],
                    })
                  }
                  className="rounded-lg bg-white/5 border border-white/10 text-neutral-100 text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold/50 cursor-pointer"
                >
                  <option value="all" className="bg-neutral-900">
                    Todos os tipos
                  </option>
                  <option value="HABIT" className="bg-neutral-900">
                    Hábitos
                  </option>
                  <option value="DAILY" className="bg-neutral-900">
                    Diárias
                  </option>
                  <option value="TODO" className="bg-neutral-900">
                    Afazeres
                  </option>
                </select>
              </div>

              {/* Filtro por Lista / Coluna */}
              {columns && columns.length > 0 && (
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="filter-column"
                    className="text-tiny text-neutral-400 font-medium"
                  >
                    Lista / Categoria
                  </label>
                  <select
                    id="filter-column"
                    value={advancedFilters.columnId}
                    onChange={(e) =>
                      onAdvancedFiltersChange?.({
                        ...advancedFilters,
                        columnId: e.target.value,
                      })
                    }
                    className="rounded-lg bg-white/5 border border-white/10 text-neutral-100 text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold/50 cursor-pointer"
                  >
                    <option value="all" className="bg-neutral-900">
                      Todas as listas
                    </option>
                    {columns.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                        className="bg-neutral-900"
                      >
                        {c.name || "Sem título"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filtro por Dificuldade */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="filter-difficulty"
                  className="text-tiny text-neutral-400 font-medium"
                >
                  Dificuldade
                </label>
                <select
                  id="filter-difficulty"
                  value={advancedFilters.difficulty}
                  onChange={(e) =>
                    onAdvancedFiltersChange?.({
                      ...advancedFilters,
                      difficulty: e.target
                        .value as DashboardAdvancedFilters["difficulty"],
                    })
                  }
                  className="rounded-lg bg-white/5 border border-white/10 text-neutral-100 text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold/50 cursor-pointer"
                >
                  <option value="all" className="bg-neutral-900">
                    Todas as dificuldades
                  </option>
                  <option value="TRIVIAL" className="bg-neutral-900">
                    Trivial
                  </option>
                  <option value="EASY" className="bg-neutral-900">
                    Fácil
                  </option>
                  <option value="MEDIUM" className="bg-neutral-900">
                    Médio
                  </option>
                  <option value="HARD" className="bg-neutral-900">
                    Difícil
                  </option>
                </select>
              </div>

              {/* Ordenação */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="filter-sort"
                  className="text-tiny text-neutral-400 font-medium"
                >
                  Ordenar por
                </label>
                <select
                  id="filter-sort"
                  value={advancedFilters.sortBy}
                  onChange={(e) =>
                    onAdvancedFiltersChange?.({
                      ...advancedFilters,
                      sortBy: e.target
                        .value as DashboardAdvancedFilters["sortBy"],
                    })
                  }
                  className="rounded-lg bg-white/5 border border-white/10 text-neutral-100 text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gold/50 cursor-pointer"
                >
                  <option value="default" className="bg-neutral-900">
                    Padrão (Data / Prazo)
                  </option>
                  <option value="difficulty" className="bg-neutral-900">
                    Dificuldade (Maior primeiro)
                  </option>
                  <option value="priority" className="bg-neutral-900">
                    Prioridade (Alta primeiro)
                  </option>
                  <option value="reward" className="bg-neutral-900">
                    Maior Recompensa (XP/Gold)
                  </option>
                </select>
              </div>

              {/* Toggle Ocultar Concluídas */}
              <label className="flex items-center justify-between pt-1 cursor-pointer select-none border-t border-white/10">
                <span className="text-xs text-neutral-200 font-medium">
                  Ocultar tarefas concluídas
                </span>
                <input
                  type="checkbox"
                  checked={advancedFilters.hideCompleted}
                  onChange={(e) =>
                    onAdvancedFiltersChange?.({
                      ...advancedFilters,
                      hideCompleted: e.target.checked,
                    })
                  }
                  className="rounded border-white/20 bg-white/5 text-gold focus:ring-gold/50 h-4 w-4 cursor-pointer"
                />
              </label>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
