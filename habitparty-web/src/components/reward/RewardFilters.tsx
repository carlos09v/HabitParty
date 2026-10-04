import { ChevronDown, LayoutGrid, List, Search } from "lucide-react";
import { useState } from "react";
import { cn } from "@/utils";
import {
  REWARD_TYPE_OPTIONS,
  REWARD_CATEGORY_OPTIONS,
  REWARD_TAG_OPTIONS,
  REWARD_PACKAGE_OPTIONS,
} from "@/constants/reward";

export interface RewardFilterState {
  search: string;
  type: string;
  category: string;
  tag: string;
  packageLevel: string;
  viewMode: "card" | "list";
}

interface RewardFiltersProps {
  filters: RewardFilterState;
  onChange: (newFilters: Partial<RewardFilterState>) => void;
  onClear: () => void;
}

export function RewardFilters({
  filters,
  onChange,
  onClear,
}: RewardFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const toggleDropdown = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.type) ||
    Boolean(filters.category) ||
    Boolean(filters.tag) ||
    Boolean(filters.packageLevel);

  return (
    <nav className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 w-full" aria-label="Filtros de recompensas">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border border-white/20 min-w-[240px] max-w-sm transition-all focus-within:border-primary-light focus-within:ring-2 focus-within:ring-primary-light/50">
          <Search size={18} className="text-neutral-400 shrink-0" aria-hidden="true" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Pesquisar..."
            aria-label="Buscar recompensas"
            className="w-full bg-transparent text-sm text-neutral-50 placeholder:text-neutral-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-surface border border-white/20" role="group" aria-label="Modo de visualização">
          <button
            type="button"
            onClick={() => onChange({ viewMode: "card" })}
            title="Visualização em Grade"
            aria-label="Visualização em Grade"
            aria-pressed={filters.viewMode === "card"}
            className={cn(
              "p-2 rounded-md transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gold/50",
              filters.viewMode === "card"
                ? "bg-white/20 text-gold shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-white/10",
            )}
          >
            <LayoutGrid size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => onChange({ viewMode: "list" })}
            title="Visualização em Lista"
            aria-label="Visualização em Lista"
            aria-pressed={filters.viewMode === "list"}
            className={cn(
              "p-2 rounded-md transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gold/50",
              filters.viewMode === "list"
                ? "bg-white/20 text-gold shadow-sm"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-white/10",
            )}
          >
            <List size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap" role="toolbar" aria-label="Filtros avançados">
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("type")}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === "type"}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border text-sm font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50",
              filters.type
                ? "border-gold text-gold font-bold"
                : "border-white/20 text-neutral-200 hover:border-white/30",
            )}
          >
            <span>
              {filters.type
                ? REWARD_TYPE_OPTIONS.find((o) => o.value === filters.type)?.label
                : "Tipo"}
            </span>
            <ChevronDown size={14} className="text-neutral-400" aria-hidden="true" />
          </button>

          {openDropdown === "type" && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 bg-transparent border-none cursor-default"
                onClick={() => setOpenDropdown(null)}
                aria-label="Fechar menu"
              />
              <ul className="absolute left-0 top-full mt-2 w-48 rounded-lg bg-popover border border-white/20 p-2 shadow-xl z-50 flex flex-col gap-1" role="listbox">
                {REWARD_TYPE_OPTIONS.map((opt) => (
                  <li key={opt.value} role="option" aria-selected={filters.type === opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ type: opt.value });
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full px-3 py-2 rounded-md text-left text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50",
                        filters.type === opt.value
                          ? "bg-gold/20 text-gold font-bold"
                          : "text-neutral-200 hover:bg-white/10",
                      )}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("category")}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === "category"}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border text-sm font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50",
              filters.category
                ? "border-gold text-gold font-bold"
                : "border-white/20 text-neutral-200 hover:border-white/30",
            )}
          >
            <span>
              {filters.category
                ? REWARD_CATEGORY_OPTIONS.find((o) => o.value === filters.category)
                    ?.label
                : "Categorias"}
            </span>
            <ChevronDown size={14} className="text-neutral-400" aria-hidden="true" />
          </button>

          {openDropdown === "category" && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 bg-transparent border-none cursor-default"
                onClick={() => setOpenDropdown(null)}
                aria-label="Fechar menu"
              />
              <ul className="absolute left-0 top-full mt-2 w-48 rounded-lg bg-popover border border-white/20 p-2 shadow-xl z-50 flex flex-col gap-1" role="listbox">
                {REWARD_CATEGORY_OPTIONS.map((opt) => (
                  <li key={opt.value} role="option" aria-selected={filters.category === opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ category: opt.value });
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full px-3 py-2 rounded-md text-left text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50",
                        filters.category === opt.value
                          ? "bg-gold/20 text-gold font-bold"
                          : "text-neutral-200 hover:bg-white/10",
                      )}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("tag")}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === "tag"}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border text-sm font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50",
              filters.tag
                ? "border-gold text-gold font-bold"
                : "border-white/20 text-neutral-200 hover:border-white/30",
            )}
          >
            <span>
              {filters.tag
                ? REWARD_TAG_OPTIONS.find((o) => o.value === filters.tag)?.label
                : "Tags"}
            </span>
            <ChevronDown size={14} className="text-neutral-400" aria-hidden="true" />
          </button>

          {openDropdown === "tag" && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 bg-transparent border-none cursor-default"
                onClick={() => setOpenDropdown(null)}
                aria-label="Fechar menu"
              />
              <ul className="absolute left-0 top-full mt-2 w-48 rounded-lg bg-popover border border-white/20 p-2 shadow-xl z-50 flex flex-col gap-1" role="listbox">
                {REWARD_TAG_OPTIONS.map((opt) => (
                  <li key={opt.value} role="option" aria-selected={filters.tag === opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ tag: opt.value });
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full px-3 py-2 rounded-md text-left text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50",
                        filters.tag === opt.value
                          ? "bg-gold/20 text-gold font-bold"
                          : "text-neutral-200 hover:bg-white/10",
                      )}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown("package")}
            aria-haspopup="listbox"
            aria-expanded={openDropdown === "package"}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg bg-surface border text-sm font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50",
              filters.packageLevel
                ? "border-gold text-gold font-bold"
                : "border-white/20 text-neutral-200 hover:border-white/30",
            )}
          >
            <span>
              {filters.packageLevel
                ? REWARD_PACKAGE_OPTIONS.find(
                    (o) => o.value === filters.packageLevel,
                  )?.label
                : "Pacote"}
            </span>
            <ChevronDown size={14} className="text-neutral-400" aria-hidden="true" />
          </button>

          {openDropdown === "package" && (
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 bg-transparent border-none cursor-default"
                onClick={() => setOpenDropdown(null)}
                aria-label="Fechar menu"
              />
              <ul className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-popover border border-white/20 p-2 shadow-xl z-50 flex flex-col gap-1" role="listbox">
                {REWARD_PACKAGE_OPTIONS.map((opt) => (
                  <li key={opt.value} role="option" aria-selected={filters.packageLevel === opt.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange({ packageLevel: opt.value });
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        "w-full px-3 py-2 rounded-md text-left text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50",
                        filters.packageLevel === opt.value
                          ? "bg-gold/20 text-gold font-bold"
                          : "text-neutral-200 hover:bg-white/10",
                      )}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer ml-2 focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1"
          >
            Limpar
          </button>
        )}
      </div>
    </nav>
  );
}
