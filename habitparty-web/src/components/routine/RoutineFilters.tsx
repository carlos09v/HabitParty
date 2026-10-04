"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Columns3,
  SquarePlus,
  Eye,
  EyeOff,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/utils";

export interface ColumnSummary {
  id: string;
  title: string;
  tasksCount: number;
}

interface RoutineFiltersProps {
  onSearch?: (query: string) => void;
  onOpenCreateColumn?: () => void;
  onOpenCreateTask?: () => void;
  columnsCount?: number;
  maxColumns?: number;
  columnsList?: ColumnSummary[];
  visibleColumnIds?: string[];
  onToggleColumnVisibility?: (columnId: string) => void;
}

export function RoutineFilters({
  onSearch,
  onOpenCreateColumn,
  onOpenCreateTask,
  columnsCount = 5,
  maxColumns = 6,
  columnsList = [],
  visibleColumnIds = [],
  onToggleColumnVisibility,
}: RoutineFiltersProps) {
  const [search, setSearch] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    onSearch?.(val);
  };

  return (
    <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 w-full">
      {/* SEÇÃO ESQUERDA: Busca, Filtro e Modo Foco (Padding fiel 12px 10px, rounded-md) */}
      <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
        {/* Input de Busca com padding exato do Figma (12px 10px, h-11) */}
        <div className="flex items-center gap-2 px-2.5 py-3 rounded-md bg-[#331866] border border-white/15 min-w-[220px] max-w-xs flex-1 transition-all focus-within:border-primary-light focus-within:shadow-[0_0_8px_rgba(168,99,255,0.25)]">
          <Search size={16} className="text-neutral-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Pesquisar..."
            className="w-full bg-transparent text-body-s text-neutral-50 placeholder:text-neutral-400 focus:outline-none"
          />
        </div>

        {/* Botão de Filtro (12px 10px, rounded-md) */}
        <button
          type="button"
          className="flex items-center gap-2 px-2.5 py-3 rounded-md bg-[#331866] border border-white/15 text-body-s text-neutral-200 hover:text-neutral-50 hover:bg-[#3d1d7a] hover:border-white/25 transition-all cursor-pointer"
        >
          <SlidersHorizontal size={15} className="text-neutral-300 shrink-0" />
          <span>Filtrar</span>
        </button>

        {/* Switch do Modo Foco */}
        <div className="flex items-center gap-3 px-3 py-2.5">
          <span className="text-[12px] font-medium text-neutral-300 select-none">
            Modo Foco:
          </span>
          <button
            type="button"
            onClick={() => setFocusMode(!focusMode)}
            aria-pressed={focusMode}
            className={cn(
              "w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center",
              focusMode ? "bg-gold" : "bg-white/15",
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full transition-transform shadow-xs",
                focusMode
                  ? "translate-x-4 bg-neutral-900"
                  : "translate-x-0 bg-neutral-400",
              )}
            />
          </button>
        </div>

        {/* Card View / List View Toggle */}
        <div className="flex items-center bg-[#331866] border border-white/15 rounded-md p-1">
          <button
            type="button"
            className="p-1.5 rounded bg-white/10 text-neutral-100 shadow-sm cursor-pointer"
            title="Card View"
          >
            <LayoutGrid size={15} />
          </button>
          <button
            type="button"
            className="p-1.5 rounded text-neutral-400 hover:text-neutral-200 cursor-pointer"
            title="List View"
          >
            <List size={15} />
          </button>
        </div>
      </div>

      {/* SEÇÃO DIREITA: Contador de Listas (Premium) + Criar Coluna + Adicionar Tarefa */}
      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        {/* Badge do Figma: Listas 5/6 interativo para gerenciar listas visíveis */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowListMenu(!showListMenu)}
            title="Gerenciar quais listas estão visíveis na tela"
            className="flex items-center gap-1.5 px-2.5 py-3 rounded-md bg-[#331866] border border-white/15 text-body-s text-neutral-200 font-semibold shadow-xs hover:border-gold/50 hover:bg-[#3d1d7a] transition-all cursor-pointer select-none"
          >
            <Columns3 size={15} className="text-primary-light" />
            <span>Listas</span>
            <span className="text-gold font-bold">
              {columnsCount}/{maxColumns}
            </span>
            <ChevronDown
              size={13}
              className={cn(
                "text-neutral-400 transition-transform",
                showListMenu && "rotate-180",
              )}
            />
          </button>

          {/* Dropdown do botão de Listas */}
          {showListMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowListMenu(false)}
              />

              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-[#241147] border border-white/20 p-3.5 shadow-[0_12px_28px_rgba(0,0,0,0.6)] z-50 animate-in fade-in zoom-in-95 backdrop-blur-md">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                  <span className="text-body-s font-bold text-neutral-100">
                    Listas de Rotina
                  </span>
                  <span className="text-[11px] font-bold text-gold">
                    {visibleColumnIds.length}/4 visíveis
                  </span>
                </div>

                <p className="text-[11px] text-neutral-400 mb-2.5 leading-snug">
                  Até 4 listas ocupam a tela toda. As demais permanecem salvas
                  aqui:
                </p>

                <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                  {columnsList.map((col) => {
                    const isVisible = visibleColumnIds.includes(col.id);
                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => onToggleColumnVisibility?.(col.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-body-s font-medium transition-all text-left cursor-pointer",
                          isVisible
                            ? "bg-white/10 text-neutral-50 border border-white/15"
                            : "bg-white/3 text-neutral-400 hover:text-neutral-200 hover:bg-white/6",
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isVisible ? (
                            <Eye size={14} className="text-gold shrink-0" />
                          ) : (
                            <EyeOff
                              size={14}
                              className="text-neutral-500 shrink-0"
                            />
                          )}
                          <span className="truncate">{col.title}</span>
                        </div>

                        <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-white/8 text-neutral-300 shrink-0">
                          {col.tasksCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Botão: Criar Coluna (com ícone SquarePlus do Lucide) */}
        <button
          type="button"
          onClick={onOpenCreateColumn}
          className="flex items-center gap-2 px-3 py-3 rounded-md bg-[#331866] border border-white/15 text-body-s text-neutral-100 font-semibold hover:bg-[#3d1d7a] hover:border-gold hover:text-gold transition-all cursor-pointer shadow-xs active:scale-98"
        >
          <SquarePlus size={16} className="shrink-0" />
          <span>Criar coluna</span>
        </button>

        {/* Botão Principal CTA: Adicionar Tarefa com ícone Plus (+) do Figma */}
        <button
          type="button"
          onClick={onOpenCreateTask}
          className="flex items-center gap-1.5 px-3.5 py-3 rounded-md bg-gold hover:bg-gold-hover active:bg-gold-pressed text-neutral-900 font-bold text-body-s shadow-[0_0_15px_rgba(237,229,57,0.3)] transition-all cursor-pointer active:scale-98"
        >
          <Plus size={16} className="stroke-[3] shrink-0" />
          <span>Adicionar Tarefa</span>
        </button>
      </div>
    </div>
  );
}
