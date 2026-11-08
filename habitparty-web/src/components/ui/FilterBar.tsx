"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Select } from "@/components/ui/Select";
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
  const t = useTranslations("ui.filterBar");
  const { isCompact } = useCompactMode();
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

  const hasActiveDropdowns = dropdownFilters?.some((f) => Boolean(f.value));
  const activeFiltersCount =
    dropdownFilters?.filter((f) => Boolean(f.value)).length ?? 0;

  return (
    <nav
      className={cn(
        "flex flex-col xl:flex-row items-stretch xl:items-center justify-between w-full",
        isCompact ? "gap-2.5" : "gap-4",
      )}
      aria-label={t("navAria")}
    >
      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
        {search && (
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg bg-card dark:bg-surface border border-neutral-600 dark:border-white/15 shadow-2xs dark:shadow-none w-full sm:w-auto sm:max-w-xs flex-1 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 dark:focus-within:ring-0 dark:focus-within:border-primary-light dark:focus-within:shadow-[0_0_8px_rgba(168,99,255,0.25)]",
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
              placeholder={search.placeholder || t("searchDefaultPlaceholder")}
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

        {/* FILTROS: DESKTOP (Reutiliza o Select universal na variante filter) */}
        {(dropdownFilters || middleActions) && (
          <div className="hidden md:flex items-center gap-2 flex-wrap">
            {dropdownFilters?.map((filter, index) => (
              <Select
                key={filter.id}
                id={`desktop-filter-${filter.id}`}
                variant="filter"
                compact={isCompact}
                placeholder={filter.label}
                value={filter.value}
                options={filter.options}
                align={
                  index >= (dropdownFilters?.length ?? 0) - 1 ? "right" : "left"
                }
                onChange={(val) => onDropdownChange?.(filter.id, val)}
                aria-label={filter.label}
              />
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
                {t("clear")}
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
                "flex items-center gap-1.5 rounded-lg border font-semibold transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50",
                isCompact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
                activeFiltersCount > 0
                  ? "border-amber-500/45 bg-amber-500/15 text-amber-800 dark:border-gold/50 dark:bg-gold/15 dark:text-gold shadow-glow-gold-xs font-bold"
                  : "border-neutral-700 dark:border-white/20 bg-card dark:bg-surface text-neutral-200 hover:border-neutral-600 dark:hover:border-white/30",
              )}
              aria-label={t("openFiltersAria")}
            >
              <SlidersHorizontal
                size={isCompact ? 13 : 15}
                aria-hidden="true"
              />
              <span>{t("filters")}</span>
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
              {t("clear")}
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
          aria-label={t("mobileDialogAria")}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label={t("closeFiltersAria")}
            onClick={() => setIsMobileFiltersOpen(false)}
            className="fixed inset-0 bg-neutral-950/80 transition-opacity animate-in fade-in duration-200 cursor-default border-none p-0 m-0 w-full h-full"
          />

          {/* Painel do Bottom Sheet */}
          <div className="relative w-full sm:max-w-md bg-card dark:bg-surface border-t sm:border border-neutral-700 dark:border-white/15 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl flex flex-col gap-4 z-10 animate-in slide-in-from-bottom duration-300 max-h-[85dvh] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-700 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal
                  size={18}
                  className="text-amber-600 dark:text-gold"
                  aria-hidden="true"
                />
                <h3 className="font-bold text-neutral-50 text-base">
                  {t("filters")}
                </h3>
                {activeFiltersCount > 0 && (
                  <span className="text-xs bg-amber-500/15 dark:bg-gold/20 text-amber-800 dark:text-gold font-bold px-2 py-0.5 rounded-full border border-amber-500/35 dark:border-gold/30">
                    {activeFiltersCount === 1
                      ? t("activeCountSingular")
                      : t("activeCountPlural", { count: activeFiltersCount })}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="text-neutral-400 hover:text-neutral-100 p-1.5 rounded-lg hover:bg-surface-hover dark:hover:bg-white/10 transition-colors cursor-pointer"
                aria-label={t("closeFiltersAria")}
              >
                <X size={18} />
              </button>
            </div>

            {/* Selects padronizados do Design System */}
            <div className="flex flex-col gap-3.5 py-1">
              {dropdownFilters?.map((filter) => (
                <Select
                  key={filter.id}
                  id={`mobile-filter-${filter.id}`}
                  label={filter.label}
                  value={filter.value || ""}
                  options={filter.options}
                  compact
                  onChange={(val) => onDropdownChange?.(filter.id, val)}
                />
              ))}
            </div>

            {/* Rodapé de Ações */}
            <div className="flex items-center gap-3 pt-3 border-t border-neutral-700 dark:border-white/10 mt-1">
              {hasActiveDropdowns && onClearDropdowns && (
                <button
                  type="button"
                  onClick={() => {
                    onClearDropdowns();
                    setIsMobileFiltersOpen(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-700 dark:border-white/15 text-neutral-300 hover:text-neutral-100 text-sm font-semibold hover:bg-surface dark:hover:bg-white/5 transition-colors text-center cursor-pointer"
                >
                  {t("clear")}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-gold text-on-gold font-bold text-sm hover:bg-gold-hover shadow-glow-gold-xs transition-colors text-center cursor-pointer"
              >
                {t("apply")}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
