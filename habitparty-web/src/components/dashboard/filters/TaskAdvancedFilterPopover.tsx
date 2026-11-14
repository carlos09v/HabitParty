"use client";

import { FilterX, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CSSProperties, RefObject } from "react";
import { createPortal } from "react-dom";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import type { DashboardAdvancedFilters } from "@/types/dashboard";
import { cn } from "@/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface TaskAdvancedFilterPopoverProps {
  popoverRef: RefObject<HTMLDivElement | null>;
  floatingStyle?: CSSProperties;
  placement: "top" | "bottom";
  activeFiltersCount: number;
  advancedFilters: DashboardAdvancedFilters;
  hasMultipleWorkspaces: boolean;
  workspaceOptions: SelectOption[];
  columnOptions: SelectOption[];
  hasColumns: boolean;
  taskTypeOptions: SelectOption[];
  difficultyOptions: SelectOption[];
  sortOptions: SelectOption[];
  isGamified: boolean;
  onWorkspaceChange: (workspaceId: string) => void;
  onAdvancedFiltersChange?: (filters: DashboardAdvancedFilters) => void;
  onReset: () => void;
}

export function TaskAdvancedFilterPopover({
  popoverRef,
  floatingStyle,
  placement,
  activeFiltersCount,
  advancedFilters,
  hasMultipleWorkspaces,
  workspaceOptions,
  columnOptions,
  hasColumns,
  taskTypeOptions,
  difficultyOptions,
  sortOptions,
  isGamified,
  onWorkspaceChange,
  onAdvancedFiltersChange,
  onReset,
}: TaskAdvancedFilterPopoverProps) {
  const t = useTranslations("dashboard.taskFilters");

  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="false"
      aria-label={t("advancedTitle")}
      style={floatingStyle}
      className={cn(
        "w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] rounded-xl bg-popover border border-neutral-700 dark:border-primary/40 p-4 shadow-xl animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-3",
        placement === "top" ? "origin-bottom" : "origin-top",
      )}
    >
      <div className="flex items-center justify-between pb-2 border-b border-neutral-700 dark:border-white/10">
        <span className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
          <SlidersHorizontal
            size={13}
            className="text-amber-700 dark:text-gold"
          />
          {t("advancedTitle")}
        </span>
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-tiny text-neutral-400 hover:text-danger-600 dark:hover:text-danger-300 font-semibold transition-colors cursor-pointer"
          >
            <FilterX size={12} />
            <span>{t("clearButton")}</span>
          </button>
        )}
      </div>

      {hasMultipleWorkspaces && (
        <Select
          id="filter-workspace"
          label={t("workspaceLabel")}
          compact
          value={advancedFilters.workspaceId}
          onChange={onWorkspaceChange}
          options={workspaceOptions}
        />
      )}

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

      {hasColumns && (
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

      <div className="flex items-center justify-between pt-2 border-t border-neutral-700 dark:border-white/10 group">
        <label
          htmlFor="filter-hide-completed"
          className="text-xs text-neutral-200 group-hover:text-primary dark:group-hover:text-gold transition-colors font-medium cursor-pointer select-none"
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
    </div>,
    document.body,
  );
}
