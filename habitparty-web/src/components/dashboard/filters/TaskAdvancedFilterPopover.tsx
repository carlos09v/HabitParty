import { useTranslations } from "next-intl";
import type { CSSProperties, RefObject } from "react";
import {
  FilterPopoverShell,
  HierarchicalTagRow,
} from "@/components/tasks/shared";
import { Select } from "@/components/ui/Select";
import type { DashboardAdvancedFilters } from "@/types/dashboard";
import { cn } from "@/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface TaskAdvancedFilterPopoverProps {
  id?: string;
  popoverRef: RefObject<HTMLDivElement | null>;
  portalContainer: HTMLElement;
  floatingStyle?: CSSProperties;
  placement: "top" | "bottom";
  activeFiltersCount: number;
  advancedFilters: DashboardAdvancedFilters;
  columnOptions: SelectOption[];
  hasColumns: boolean;
  taskTypeOptions: SelectOption[];
  difficultyOptions: SelectOption[];
  priorityOptions: SelectOption[];
  availableTags: string[];
  tagCounts: Record<string, number>;
  sortOptions: SelectOption[];
  isGamified: boolean;
  onAdvancedFiltersChange?: (filters: DashboardAdvancedFilters) => void;
  onReset: () => void;
}

export function TaskAdvancedFilterPopover({
  id,
  popoverRef,
  portalContainer,
  floatingStyle,
  placement,
  activeFiltersCount,
  advancedFilters,
  columnOptions,
  hasColumns,
  taskTypeOptions,
  difficultyOptions,
  priorityOptions,
  availableTags,
  tagCounts,
  sortOptions,
  isGamified,
  onAdvancedFiltersChange,
  onReset,
}: TaskAdvancedFilterPopoverProps) {
  const t = useTranslations("dashboard.taskFilters");

  return (
    <FilterPopoverShell
      id={id}
      popoverRef={popoverRef}
      portalContainer={portalContainer}
      floatingStyle={floatingStyle}
      placement={placement}
      title={t("advancedTitle")}
      clearLabel={t("clearButton")}
      activeFiltersCount={activeFiltersCount}
      onReset={onReset}
      className="w-[calc(100vw-1.5rem)] sm:w-[420px] max-w-[calc(100vw-1.5rem)]"
    >
      <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 min-h-0 pr-0.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 [&>*]:min-w-0 [&>*:last-child:nth-child(odd)]:sm:col-span-2">
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
            id="filter-priority"
            label={t("priorityLabel")}
            compact
            value={advancedFilters.priority}
            onChange={(val) =>
              onAdvancedFiltersChange?.({
                ...advancedFilters,
                priority: val as DashboardAdvancedFilters["priority"],
              })
            }
            options={priorityOptions}
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
        </div>

        {availableTags.length > 0 && (
          <fieldset className="flex flex-col gap-1.5 border-0 p-0 m-0 pt-2 border-t border-neutral-700/70 dark:border-white/10">
            <legend className="text-label-g font-semibold text-neutral-400 mb-1.5">
              {t("tagsLabel")}
            </legend>
            <div className="flex flex-col gap-1 max-h-36 overflow-y-auto custom-scrollbar pr-0.5">
              <button
                type="button"
                aria-pressed={advancedFilters.tag === null}
                onClick={() =>
                  onAdvancedFiltersChange?.({
                    ...advancedFilters,
                    tag: null,
                  })
                }
                className={cn(
                  "w-full text-left px-2 py-1 rounded-md text-tiny font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                  advancedFilters.tag === null
                    ? "bg-gold text-on-gold font-bold"
                    : "bg-surface border border-neutral-700/70 text-neutral-200 hover:bg-surface-hover dark:border-transparent dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10",
                )}
              >
                {t("allTagsOption")}
              </button>
              {availableTags.map((tag) => (
                <HierarchicalTagRow
                  key={tag}
                  tag={tag}
                  isSelected={advancedFilters.tag === tag}
                  count={tagCounts[tag]}
                  onSelect={(nextTag) =>
                    onAdvancedFiltersChange?.({
                      ...advancedFilters,
                      tag: advancedFilters.tag === nextTag ? null : nextTag,
                    })
                  }
                />
              ))}
            </div>
          </fieldset>
        )}
      </div>
    </FilterPopoverShell>
  );
}
