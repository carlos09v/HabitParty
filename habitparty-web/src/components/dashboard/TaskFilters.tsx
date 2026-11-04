"use client";

import { Calendar, FilterX, SlidersHorizontal, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import {
  DASHBOARD_TASK_FILTERS,
  DEFAULT_DASHBOARD_ADVANCED_FILTERS,
} from "@/constants/dashboard";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useCompactMode } from "@/hooks/useCompactMode";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type {
  DashboardAdvancedFilters,
  TaskFiltersProps,
} from "@/types/dashboard";
import type { TaskFilterType } from "@/types/task";
import { cn } from "@/utils";
import { formatShortDate } from "@/utils/date";

export function TaskFilters({
  activeFilter = "today",
  onFilterChange,
  selectedDate,
  onClearDate,
  columns = [],
  advancedFilters = DEFAULT_DASHBOARD_ADVANCED_FILTERS,
  onAdvancedFiltersChange,
  isCompact: propIsCompact,
}: TaskFiltersProps) {
  const t = useTranslations("dashboard.taskFilters");
  const locale = useLocale() as AppLocale;
  const { isCompact: hookIsCompact } = useCompactMode();
  const { isGamified } = useExperienceMode();
  const isCompact = propIsCompact ?? hookIsCompact;
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useClickOutside(popoverRef, () => setShowPopover(false), {
    enabled: showPopover,
    onEscape: () => setShowPopover(false),
  });

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
    return formatShortDate(selectedDate, { monthFormat: "short", locale });
  }, [selectedDate, locale]);

  const columnOptions = useMemo(() => {
    const opts = [{ value: "all", label: t("allColumns") }];
    if (columns) {
      for (const c of columns) {
        if (c.id) {
          opts.push({ value: c.id, label: c.name || t("untitledColumn") });
        }
      }
    }
    return opts;
  }, [columns, t]);

  const taskTypeOptions = useMemo(
    () => [
      { value: "all", label: t("allTypes") },
      { value: "HABIT", label: t("habits") },
      { value: "DAILY", label: t("dailies") },
      { value: "TODO", label: t("todos") },
    ],
    [t],
  );

  const difficultyOptions = useMemo(
    () => [
      { value: "all", label: t("allDifficulties") },
      { value: "TRIVIAL", label: t("trivial") },
      { value: "EASY", label: t("easy") },
      { value: "MEDIUM", label: t("medium") },
      { value: "HARD", label: t("hard") },
    ],
    [t],
  );

  const sortOptions = useMemo(
    () => [
      { value: "default", label: t("sortDefault") },
      { value: "difficulty", label: t("sortDifficulty") },
      { value: "priority", label: t("sortPriority") },
      { value: "reward", label: t("sortReward") },
    ],
    [t],
  );

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
      aria-label={t("ariaLabel")}
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
            role="tab"
            id="tab-date"
            aria-selected={true}
            aria-controls="panel-date"
            onClick={onClearDate}
            className={cn(
              "flex items-center gap-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer shadow-xs bg-gold text-on-gold group shrink-0",
              isCompact ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
            )}
            title={t("clearDateTitle")}
          >
            <Calendar size={isCompact ? 12 : 14} className="shrink-0" />
            <span>
              {t("datePillLabel", { date: formattedDateLabel || "" })}
            </span>
            <X
              size={isCompact ? 12 : 14}
              className="shrink-0 group-hover:scale-125 transition-transform ml-0.5"
            />
          </button>
        )}

        {DASHBOARD_TASK_FILTERS.map((f) => {
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
                  ? "bg-gold text-on-gold font-bold border-transparent shadow-xs"
                  : "bg-primary-dark/20 text-neutral-100 hover:bg-primary-dark/40 border border-primary/30",
              )}
            >
              {t(`tabs.${f.id}`)}
            </button>
          );
        })}
      </div>

      {/* Botão de opções e filtros avançados com Popover */}
      <div ref={popoverRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setShowPopover(!showPopover)}
          title={t("advancedButtonTitle")}
          aria-expanded={showPopover}
          aria-label={t("openAdvancedAria")}
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
            <span className="px-1.5 py-0.5 rounded-full text-tiny font-bold bg-gold text-on-gold">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Popover de Filtros Avançados */}
        {showPopover && (
          <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-xl bg-popover/95 border border-primary/40 p-4 shadow-xl z-50 animate-in fade-in zoom-in-95 backdrop-blur-md flex flex-col gap-3">
            {/* Cabeçalho do Popover */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                <SlidersHorizontal size={13} className="text-gold" />
                {t("advancedTitle")}
              </span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetAdvanced}
                  className="flex items-center gap-1 text-tiny text-neutral-400 hover:text-danger-500 font-semibold transition-colors cursor-pointer"
                >
                  <FilterX size={12} />
                  <span>{t("clearButton")}</span>
                </button>
              )}
            </div>

            {/* Filtro por Tipo de Tarefa */}
            <Select
              id="filter-task-type"
              label={t("taskTypeLabel")}
              compact
              value={advancedFilters.taskType}
              onChange={(val) =>
                onAdvancedFiltersChange?.({
                  ...advancedFilters,
                  taskType: val as DashboardAdvancedFilters["taskType"],
                })
              }
              options={taskTypeOptions}
            />

            {/* Filtro por Lista / Coluna */}
            {columns && columns.length > 0 && (
              <Select
                id="filter-column"
                label={t("columnLabel")}
                compact
                value={advancedFilters.columnId}
                onChange={(val) =>
                  onAdvancedFiltersChange?.({
                    ...advancedFilters,
                    columnId: val,
                  })
                }
                options={columnOptions}
              />
            )}

            {/* Filtro por Dificuldade / Esforço */}
            <Select
              id="filter-difficulty"
              label={isGamified ? t("difficultyLabel") : t("effortLabel")}
              compact
              value={advancedFilters.difficulty}
              onChange={(val) =>
                onAdvancedFiltersChange?.({
                  ...advancedFilters,
                  difficulty: val as DashboardAdvancedFilters["difficulty"],
                })
              }
              options={difficultyOptions}
            />

            {/* Ordenação */}
            <Select
              id="filter-sort"
              label={t("sortByLabel")}
              compact
              value={advancedFilters.sortBy}
              onChange={(val) =>
                onAdvancedFiltersChange?.({
                  ...advancedFilters,
                  sortBy: val as DashboardAdvancedFilters["sortBy"],
                })
              }
              options={sortOptions}
            />

            {/* Toggle Ocultar Concluídas */}
            <div className="flex items-center justify-between pt-2 border-t border-white/10 group">
              <label
                htmlFor="filter-hide-completed"
                className="text-xs text-neutral-200 group-hover:text-gold transition-colors font-medium cursor-pointer select-none"
              >
                {t("hideCompletedLabel")}
              </label>
              <Switch
                id="filter-hide-completed"
                size="sm"
                checked={advancedFilters.hideCompleted}
                onCheckedChange={(checked) =>
                  onAdvancedFiltersChange?.({
                    ...advancedFilters,
                    hideCompleted: checked,
                  })
                }
                aria-label={t("hideCompletedLabel")}
              />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
