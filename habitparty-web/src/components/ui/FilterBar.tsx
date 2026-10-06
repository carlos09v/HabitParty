"use client";

import { ChevronDown, Search } from "lucide-react";
import { useState } from "react";
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

  const toggleDropdown = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const hasActiveDropdowns = dropdownFilters?.some((f) => Boolean(f.value));

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
              "flex items-center gap-2 rounded-lg bg-surface border border-white/15 max-w-xs flex-1 transition-all focus-within:border-primary-light focus-within:shadow-[0_0_8px_rgba(168,99,255,0.25)]",
              isCompact ? "px-2.5 py-1.5 min-w-44" : "px-3 py-2.5 min-w-56",
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
      </div>

      {(dropdownFilters || middleActions) && (
        <div className="flex items-center gap-2 flex-wrap">
          {dropdownFilters?.map((filter) => (
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
                    className="absolute left-0 top-full mt-2 w-48 rounded-lg bg-popover border border-white/20 p-2 shadow-xl z-50 flex flex-col gap-1"
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
                "font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer ml-2 focus:outline-none focus:ring-2 focus:ring-white rounded",
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
    </nav>
  );
}
