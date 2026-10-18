"use client";

import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ViewModeSelector } from "@/components/ui/ViewModeSelector";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { FilterBarProps } from "@/types/ui";
import { cn } from "@/utils";

export function FilterBar({
  search,
  viewMode,
  dropdownFilters,
  onDropdownChange,
  onClearDropdowns,
  leftActions,
  middleActions,
  rightActions,
}: FilterBarProps) {
  const { isCompact } = useCompactMode();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (!isMobileFiltersOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileFiltersOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileFiltersOpen]);

  const toggleDropdown = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const hasActiveDropdowns = dropdownFilters?.some((f) => Boolean(f.value));
  const activeFiltersCount =
    dropdownFilters?.filter((f) => Boolean(f.value)).length ?? 0;

  return (
    <nav
      className={cn(
        "flex flex-col xl:flex-row items-stretch xl:items-center justify-between w-full transition-all",
        isCompact ? "gap-2.5" : "gap-4",
      )}
      aria-label="Barra de Filtros"
    >
      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
        {search && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg bg-surface border border-white/15 w-full sm:w-auto sm:max-w-xs flex-1 transition-all focus-within:border-primary-light focus-within:shadow-[0_0_8px_rgba(168,99,255,0.25)]",
              isCompact
                ? "px-2.5 py-1.5 min-w-0 sm:min-w-44"
                : "px-3 py-2.5 min-w-0 sm:min-w-56",
            )}
          >
            <Search
              size={isCompact ? 14 : 16}
              className="text-neutral-400 shrink-0"
            />
            <input
              type="text"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder || "Pesquisar..."}
              className={cn(
                "w-full bg-transparent text-neutral-50 placeholder:text-neutral-400 focus:outline-none",
                isCompact ? "text-xs" : "text-body-s",
              )}
            />
          </div>
        )}

        {leftActions}

        {viewMode && (
          <ViewModeSelector
            value={viewMode.value}
            onChange={viewMode.onChange}
            isCompact={isCompact}
          />
        )}

        {/* FILTROS: DESKTOP (Dropdowns Inline posicionados à esquerda) */}
        {(dropdownFilters || middleActions) && (
          <div className="hidden md:flex items-center gap-2 flex-wrap">
            {dropdownFilters?.map((filter, index) => (
              <div className="relative" key={filter.id}>
                <button
                  type="button"
                  onClick={() => toggleDropdown(filter.id)}
                  aria-haspopup="listbox"
                  aria-expanded={openDropdown === filter.id}
                  className={cn(
                    "flex items-center gap-2 rounded-lg bg-surface border font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50",
                    isCompact ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm",
                    filter.value
                      ? "border-gold text-gold font-bold"
                      : "border-white/20 text-neutral-200 hover:border-white/30",
                  )}
                >
                  <span>
                    {filter.value
                      ? filter.options.find((o) => o.value === filter.value)
                          ?.label
                      : filter.label}
                  </span>
                  <ChevronDown
                    size={isCompact ? 12 : 14}
                    className="text-neutral-400"
                    aria-hidden="true"
                  />
                </button>

                {openDropdown === filter.id && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40 bg-transparent border-none cursor-default"
                      onClick={() => setOpenDropdown(null)}
                      aria-label="Fechar menu"
                    />
                    <div
                      className={cn(
                        "absolute top-full mt-2 w-48 rounded-lg bg-popover border border-white/20 p-2 shadow-xl z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-100",
                        index >= (dropdownFilters?.length ?? 0) - 1
                          ? "right-0"
                          : "left-0",
                      )}
                      role="listbox"
                    >
                      {filter.options.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          role="option"
                          aria-selected={filter.value === opt.value}
                          onClick={() => {
                            onDropdownChange?.(filter.id, opt.value);
                            setOpenDropdown(null);
                          }}
                          className={cn(
                            "w-full rounded-md text-left transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50",
                            isCompact
                              ? "px-2 py-1.5 text-xs"
                              : "px-3 py-2 text-sm",
                            filter.value === opt.value
                              ? "bg-gold/20 text-gold font-bold"
                              : "text-neutral-200 hover:bg-white/10",
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}

            {hasActiveDropdowns && onClearDropdowns && (
              <button
                type="button"
                onClick={onClearDropdowns}
                className={cn(
                  "font-medium text-neutral-300 hover:text-neutral-50 transition-colors cursor-pointer ml-1 focus:outline-none focus:ring-2 focus:ring-gold/50 rounded",
                  isCompact ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1",
                )}
              >
                Limpar
              </button>
            )}

            {middleActions}
          </div>
        )}
      </div>

      {/* FILTROS: MOBILE (Botão Unificado que abre Drawer) */}
      {(dropdownFilters || middleActions) && (
        <div className="flex md:hidden items-center gap-2 flex-wrap">
          {dropdownFilters && dropdownFilters.length > 0 && (
            <button
              type="button"
              onClick={() => setIsMobileFiltersOpen(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border font-semibold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50",
                isCompact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
                activeFiltersCount > 0
                  ? "border-gold/50 bg-gold/15 text-gold shadow-glow-gold-xs font-bold"
                  : "border-white/20 bg-surface text-neutral-200 hover:border-white/30",
              )}
              aria-label="Abrir filtros"
            >
              <SlidersHorizontal
                size={isCompact ? 13 : 15}
                aria-hidden="true"
              />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-gold text-neutral-950 text-[10px] font-black inline-flex items-center justify-center ml-0.5">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}

          {hasActiveDropdowns && onClearDropdowns && (
            <button
              type="button"
              onClick={onClearDropdowns}
              className={cn(
                "font-medium text-neutral-300 hover:text-neutral-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50 rounded",
                isCompact ? "text-xs px-1.5 py-0.5" : "text-sm px-2 py-1",
              )}
            >
              Limpar
            </button>
          )}

          {middleActions}
        </div>
      )}

      {rightActions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {rightActions}
        </div>
      )}

      {/* DRAWER / BOTTOM SHEET DE FILTROS MOBILE (< md) */}
      {isMobileFiltersOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtros do Catálogo"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop com blur suave */}
          <button
            type="button"
            aria-label="Fechar filtros"
            onClick={() => setIsMobileFiltersOpen(false)}
            className="fixed inset-0 bg-neutral-950/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-default border-none p-0 m-0 w-full h-full"
          />

          {/* Painel do Bottom Sheet */}
          <div className="relative w-full sm:max-w-md bg-surface border-t sm:border border-white/15 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 z-10 animate-in slide-in-from-bottom duration-300 max-h-[85dvh] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal
                  size={18}
                  className="text-gold"
                  aria-hidden="true"
                />
                <h3 className="font-bold text-neutral-50 text-base">Filtros</h3>
                {activeFiltersCount > 0 && (
                  <span className="text-xs bg-gold/20 text-gold font-bold px-2 py-0.5 rounded-full border border-gold/30">
                    {activeFiltersCount} ativo
                    {activeFiltersCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Fechar filtros"
              >
                <X size={18} />
              </button>
            </div>

            {/* Selects com labels semânticas */}
            <div className="flex flex-col gap-3.5 py-1">
              {dropdownFilters?.map((filter) => (
                <div key={filter.id} className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`mobile-filter-${filter.id}`}
                    className="text-xs font-semibold text-neutral-300"
                  >
                    {filter.label}
                  </label>
                  <div className="relative flex items-center">
                    <select
                      id={`mobile-filter-${filter.id}`}
                      value={filter.value || ""}
                      onChange={(e) => {
                        onDropdownChange?.(filter.id, e.target.value);
                      }}
                      className="w-full appearance-none rounded-xl bg-surface-hover/80 border border-white/15 text-neutral-100 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold/50 cursor-pointer font-medium"
                    >
                      {filter.options.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-neutral-900 text-neutral-100"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3.5 text-neutral-400">
                      <ChevronDown size={16} aria-hidden="true" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé de Ações */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/10 mt-1">
              {hasActiveDropdowns && onClearDropdowns && (
                <button
                  type="button"
                  onClick={() => {
                    onClearDropdowns();
                    setIsMobileFiltersOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-white/15 text-neutral-300 hover:text-neutral-100 text-sm font-semibold hover:bg-white/5 transition-colors text-center cursor-pointer"
                >
                  Limpar
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-gold text-neutral-950 font-bold text-sm hover:bg-gold-hover shadow-glow-gold-xs transition-all text-center cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
