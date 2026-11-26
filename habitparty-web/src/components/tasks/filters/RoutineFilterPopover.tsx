"use client";

import { SlidersHorizontal, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId } from "react";
import {
  FilterPopoverShell,
  HierarchicalTagRow,
} from "@/components/tasks/shared";
import {
  STATUS_FILTER_OPTIONS,
  TASK_TYPE_FILTER_OPTIONS,
} from "@/constants/routine";
import {
  DEFAULT_BOARD_FILTERS,
  TASK_DIFFICULTY_OPTIONS,
  TODO_PRIORITY_OPTIONS,
  toPriorityMessageKey,
} from "@/constants/task";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFloatingPopover } from "@/hooks/useFloatingPopover";
import type {
  BoardFilterState,
  TaskDifficultyOption,
  TaskPriorityOption,
  TaskTypeOption,
} from "@/types/task";
import type { RoutineFilterPopoverProps } from "@/types/task-ui";
import { cn } from "@/utils";

const UNSELECTED_PILL_CLASSES =
  "bg-surface border border-neutral-700/70 text-neutral-200 hover:bg-surface-hover dark:border-transparent dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10";
const SELECTED_PILL_CLASSES = "bg-gold text-on-gold font-bold";
const PILL_FOCUS_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";

export function RoutineFilterPopover({
  filters = DEFAULT_BOARD_FILTERS,

  onFilterChange,
  availableTags = [],
  tagCounts,
}: RoutineFilterPopoverProps) {
  const t = useTranslations("tasks.filters.popover");
  const { isGamified } = useExperienceMode();
  const popoverId = useId();
  const {
    containerRef,
    triggerRef,
    popoverRef,
    isOpen: showFilterPopover,
    toggle: toggleFilterPopover,
    coords,
    shouldRenderPortal,
    portalContainer,
    floatingStyle,
  } = useFloatingPopover<HTMLDivElement, HTMLButtonElement, HTMLDivElement>({
    align: "left",
    estimatedHeight: 400,
    estimatedWidth: 320,
    maxAllowedHeight: 420,
    offset: 8,
    margin: 12,
    zIndex: 130,
    restoreFocusOnEscape: true,
  });

  const activeFiltersCount =
    (filters.taskType !== "all" ? 1 : 0) +
    (filters.difficulty !== "all" ? 1 : 0) +
    (filters.priority !== "all" ? 1 : 0) +
    (filters.status !== "all" ? 1 : 0) +
    (filters.tag !== null ? 1 : 0);

  const handleResetFilters = () => {
    onFilterChange?.(DEFAULT_BOARD_FILTERS);
  };

  const updateFilter = <K extends keyof BoardFilterState>(
    key: K,
    val: BoardFilterState[K],
  ) => {
    onFilterChange?.({
      ...filters,
      [key]: val,
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleFilterPopover}
        aria-expanded={showFilterPopover}
        aria-controls={popoverId}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border font-medium transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 px-3 py-2 text-body-s",
          activeFiltersCount > 0
            ? "bg-amber-500/15 border-amber-500/50 text-gold-ink shadow-glow-gold-xs dark:bg-gold/15 dark:border-gold/60 dark:text-gold"
            : "bg-surface border-neutral-700 text-neutral-200 hover:text-neutral-50 hover:bg-surface-hover hover:border-neutral-600 dark:border-white/15 dark:hover:border-white/25",
        )}
      >
        <SlidersHorizontal
          size={15}
          aria-hidden="true"
          className={cn(
            "shrink-0",
            activeFiltersCount > 0
              ? "text-gold-ink dark:text-gold"
              : "text-neutral-300",
          )}
        />
        <span>{t("triggerLabel")}</span>
        {activeFiltersCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-tiny font-bold bg-gold text-on-gold">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {showFilterPopover && shouldRenderPortal && coords && portalContainer && (
        <FilterPopoverShell
          id={popoverId}
          popoverRef={popoverRef}
          portalContainer={portalContainer}
          floatingStyle={floatingStyle}
          placement={coords.placement}
          title={t("title")}
          clearLabel={t("clear")}
          activeFiltersCount={activeFiltersCount}
          onReset={handleResetFilters}
          className="w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] dark:border-white/20 shadow-lg dark:shadow-popover-dark"
        >
          <div className="flex flex-col gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
            {/* 1. Tipo de Tarefa */}
            <fieldset className="flex flex-col gap-1.5 border-0 p-0 m-0">
              <legend className="text-label-g font-semibold text-neutral-400 mb-1.5">
                {t("typeLabel")}
              </legend>
              <div className="grid grid-cols-2 gap-1.5">
                {TASK_TYPE_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={filters.taskType === opt.id}
                    onClick={() =>
                      updateFilter("taskType", opt.id as "all" | TaskTypeOption)
                    }
                    className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium transition-colors text-center cursor-pointer",
                      PILL_FOCUS_CLASSES,
                      filters.taskType === opt.id
                        ? `${SELECTED_PILL_CLASSES} shadow-xs`
                        : UNSELECTED_PILL_CLASSES,
                    )}
                  >
                    {t(`types.${opt.id as "all" | TaskTypeOption}`)}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* 2. Dificuldade / Esforço */}
            <fieldset className="flex flex-col gap-1.5 border-0 p-0 m-0">
              <legend className="text-label-g font-semibold text-neutral-400 mb-1.5">
                {isGamified ? t("difficultyLabel") : t("effortLabel")}
              </legend>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  aria-pressed={filters.difficulty === "all"}
                  onClick={() => updateFilter("difficulty", "all")}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                    PILL_FOCUS_CLASSES,
                    filters.difficulty === "all"
                      ? SELECTED_PILL_CLASSES
                      : UNSELECTED_PILL_CLASSES,
                  )}
                >
                  {t("allOptions")}
                </button>
                {TASK_DIFFICULTY_OPTIONS.map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    aria-pressed={filters.difficulty === diff.id}
                    onClick={() =>
                      updateFilter(
                        "difficulty",
                        diff.id as TaskDifficultyOption,
                      )
                    }
                    className={cn(
                      "px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                      PILL_FOCUS_CLASSES,
                      filters.difficulty === diff.id
                        ? SELECTED_PILL_CLASSES
                        : UNSELECTED_PILL_CLASSES,
                    )}
                  >
                    {t(`difficulties.${diff.id}`)}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* 3. Prioridade */}
            <fieldset className="flex flex-col gap-1.5 border-0 p-0 m-0">
              <legend className="text-label-g font-semibold text-neutral-400 mb-1.5">
                {t("priorityLabel")}
              </legend>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  aria-pressed={filters.priority === "all"}
                  onClick={() => updateFilter("priority", "all")}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                    PILL_FOCUS_CLASSES,
                    filters.priority === "all"
                      ? SELECTED_PILL_CLASSES
                      : UNSELECTED_PILL_CLASSES,
                  )}
                >
                  {t("allOptions")}
                </button>
                {TODO_PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={filters.priority === p.id}
                    onClick={() =>
                      updateFilter("priority", p.id as TaskPriorityOption)
                    }
                    className={cn(
                      "px-2 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                      PILL_FOCUS_CLASSES,
                      filters.priority === p.id
                        ? SELECTED_PILL_CLASSES
                        : UNSELECTED_PILL_CLASSES,
                    )}
                  >
                    {t(`priorities.${toPriorityMessageKey(p.id)}`)}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* 4. Status */}
            <fieldset className="flex flex-col gap-1.5 border-0 p-0 m-0">
              <legend className="text-label-g font-semibold text-neutral-400 mb-1.5">
                {t("statusLabel")}
              </legend>
              <div className="grid grid-cols-3 gap-1">
                {STATUS_FILTER_OPTIONS.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    aria-pressed={filters.status === st.id}
                    onClick={() =>
                      updateFilter(
                        "status",
                        st.id as "all" | "pending" | "completed",
                      )
                    }
                    className={cn(
                      "px-2 py-1 rounded-md text-xs font-medium transition-colors text-center cursor-pointer",
                      PILL_FOCUS_CLASSES,
                      filters.status === st.id
                        ? `${SELECTED_PILL_CLASSES} shadow-xs`
                        : UNSELECTED_PILL_CLASSES,
                    )}
                  >
                    {t(`statuses.${st.id as "all" | "pending" | "completed"}`)}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* 5. Tags (se houver disponíveis no quadro) */}
            {availableTags.length > 0 && (
              <fieldset className="flex flex-col gap-1.5 pt-1 border-0 border-t border-neutral-700 dark:border-white/5 p-0 m-0">
                <legend className="sr-only">{t("tagsLabel")}</legend>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-label-g font-semibold text-neutral-400 flex items-center gap-1"
                    aria-hidden="true"
                  >
                    <Tag size={11} aria-hidden="true" /> {t("tagsLabel")}
                  </span>
                  <button
                    type="button"
                    aria-pressed={filters.tag === null}
                    onClick={() => updateFilter("tag", null)}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-tiny font-medium transition-colors cursor-pointer",
                      PILL_FOCUS_CLASSES,
                      filters.tag === null
                        ? SELECTED_PILL_CLASSES
                        : UNSELECTED_PILL_CLASSES,
                    )}
                  >
                    {t("allOptions")}
                  </button>
                </div>
                <div className="flex flex-col gap-0.5 max-h-36 overflow-y-auto custom-scrollbar pr-0.5">
                  {availableTags.map((tagItem) => (
                    <HierarchicalTagRow
                      key={tagItem}
                      tag={tagItem}
                      isSelected={filters.tag === tagItem}
                      count={tagCounts?.[tagItem]}
                      onSelect={(selected) =>
                        updateFilter(
                          "tag",
                          filters.tag === selected ? null : selected,
                        )
                      }
                    />
                  ))}
                </div>
              </fieldset>
            )}
          </div>
        </FilterPopoverShell>
      )}
    </div>
  );
}
