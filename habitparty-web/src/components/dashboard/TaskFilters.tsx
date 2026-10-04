"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/utils";

export type TaskFilterType = "today" | "next7days" | "nodate" | "overdue";

interface TaskFiltersProps {
  activeFilter?: TaskFilterType;
  onFilterChange?: (filter: TaskFilterType) => void;
  showCompleted?: boolean;
  onToggleShowCompleted?: () => void;
}

export function TaskFilters({
  activeFilter = "today",
  onFilterChange,
  showCompleted = true,
  onToggleShowCompleted,
}: TaskFiltersProps) {
  const [currentFilter, setCurrentFilter] = useState<TaskFilterType>(activeFilter);

  const filters: { id: TaskFilterType; label: string }[] = [
    { id: "today", label: "Hoje" },
    { id: "next7days", label: "Próximos 7 dias..." },
    { id: "nodate", label: "Sem prazo" },
    { id: "overdue", label: "Atrasado" },
  ];

  const handleSelect = (id: TaskFilterType) => {
    setCurrentFilter(id);
    onFilterChange?.(id);
  };

  return (
    <nav className="flex items-center justify-between gap-4 w-full" aria-label="Filtros de Data das Tarefas">
      {/* Pílulas de filtro */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar px-1 py-1 -mx-1" role="tablist">
        {filters.map((f) => {
          const isSelected = currentFilter === f.id;
          return (
            
              <button
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls={`panel-${f.id}`}
                id={`tab-${f.id}`}
                onClick={() => handleSelect(f.id)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-1 focus:ring-offset-background",
                  isSelected
                    ? "bg-gold text-neutral-900 font-bold border-transparent shadow-sm"
                    : "bg-primary-dark/20 text-neutral-100 hover:bg-primary-dark/40 border border-primary/30",
                )}
              >
                {f.label}
              </button>
            
          );
        })}
      </div>

      {/* Botão de opções e filtros adicionais */}
      <button
        type="button"
        title="Opções de visualização"
        aria-label="Opções de visualização avançadas"
        className="p-2 rounded-lg bg-primary-dark/20 hover:bg-primary-dark/40 border border-primary/30 text-neutral-300 hover:text-gold transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-gold"
      >
        <SlidersHorizontal size={18} aria-hidden="true" />
      </button>
    </nav>
  );
}
