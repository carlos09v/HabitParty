"use client";

import { FilterX, SlidersHorizontal, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
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
import type {
  BoardFilterState,
  TaskDifficultyOption,
  TaskPriorityOption,
  TaskTypeOption,
} from "@/types/task";
import type { RoutineFilterPopoverProps } from "@/types/task-ui";
import { cn } from "@/utils";
import { getTagDepth, getTagLeafLabel } from "@/utils/tags";

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
  isCompact = false,
}: RoutineFilterPopoverProps) {
  const t = useTranslations("tasks.filters.popover");
  const { isGamified } = useExperienceMode();
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const popoverId = useId();

  useEffect(() => {
    if (!showFilterPopover) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setShowFilterPopover(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showFilterPopover]);

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
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowFilterPopover(!showFilterPopover)}
        aria-expanded={showFilterPopover}
        aria-controls={popoverId}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border font-medium transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70",
          isCompact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-body-s",
          activeFiltersCount > 0
            ? "bg-amber-500/15 border-amber-500/50 text-gold-ink shadow-glow-gold-xs dark:bg-gold/15 dark:border-gold/60 dark:text-gold-pressed"
            : "bg-surface border-neutral-700 text-neutral-200 hover:text-neutral-50 hover:bg-surface-hover hover:border-neutral-600 dark:border-white/15 dark:hover:border-white/25",
        )}
      >
        <SlidersHorizontal
          size={isCompact ? 13 : 15}
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

      {showFilterPopover && (
        <>
          <button
            type="button"
            aria-label={t("closeAria")}
            className="fixed inset-0 z-40 cursor-default bg-transparent border-none p-0 m-0"
            onClick={() => setShowFilterPopover(false)}
          />

          <div
            id={popoverId}
            role="dialog"
            aria-label={t("title")}
            className="absolute left-0 top-full mt-2 w-80 rounded-xl bg-popover border border-neutral-700 dark:border-white/20 p-4 shadow-lg dark:shadow-popover-dark z-50 animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Cabeçalho do Popover */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-700 dark:border-white/10 mb-3">
              <span className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                <SlidersHorizontal
                  size={13}
                  className="text-gold-ink dark:text-gold"
                  aria-hidden="true"
                />
                {t("title")}
              </span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-tiny text-neutral-400 hover:text-danger-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-danger-500 rounded transition-colors cursor-pointer"
                >
                  <FilterX size={12} aria-hidden="true" />
                  <span>{t("clear")}</span>
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {/* 1. Tipo de Tarefa */}
              <div className="flex flex-col gap-1.5">
                <span className="text-label-g font-semibold text-neutral-400">
                  {t("typeLabel")}
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {TASK_TYPE_FILTER_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={filters.taskType === opt.id}
                      onClick={() =>
                        updateFilter(
                          "taskType",
                          opt.id as "all" | TaskTypeOption,
                        )
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
              </div>

              {/* 2. Dificuldade / Esforço */}
              <div className="flex flex-col gap-1.5">
                <span className="text-label-g font-semibold text-neutral-400">
                  {isGamified ? t("difficultyLabel") : t("effortLabel")}
                </span>
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
              </div>

              {/* 3. Prioridade */}
              <div className="flex flex-col gap-1.5">
                <span className="text-label-g font-semibold text-neutral-400">
                  {t("priorityLabel")}
                </span>
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
              </div>

              {/* 4. Status */}
              <div className="flex flex-col gap-1.5">
                <span className="text-label-g font-semibold text-neutral-400">
                  {t("statusLabel")}
                </span>
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
                      {t(
                        `statuses.${st.id as "all" | "pending" | "completed"}`,
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Tags (se houver disponíveis no quadro) */}
              {availableTags.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1 border-t border-neutral-700 dark:border-white/5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-label-g font-semibold text-neutral-400 flex items-center gap-1">
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
                    {availableTags.map((tagItem) => {
                      const depth = getTagDepth(tagItem);
                      const leafLabel = getTagLeafLabel(tagItem);
                      const isSelected = filters.tag === tagItem;
                      const count = tagCounts?.[tagItem];
                      return (
                        <button
                          key={tagItem}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() =>
                            updateFilter("tag", isSelected ? null : tagItem)
                          }
                          title={tagItem}
                          style={{ paddingLeft: `${8 + depth * 14}px` }}
                          className={cn(
                            "w-full text-left pr-2 py-1 rounded-md text-tiny font-medium transition-colors cursor-pointer flex items-center justify-between gap-2 min-w-0",
                            PILL_FOCUS_CLASSES,
                            isSelected
                              ? SELECTED_PILL_CLASSES
                              : UNSELECTED_PILL_CLASSES,
                          )}
                        >
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span
                              aria-hidden="true"
                              className={cn(
                                "shrink-0",
                                isSelected
                                  ? "text-on-gold/80"
                                  : "text-neutral-400 dark:text-neutral-500",
                              )}
                            >
                              {depth > 0 ? "↳" : "#"}
                            </span>
                            <span className="truncate">{leafLabel}</span>
                          </span>
                          {count !== undefined && (
                            <span
                              className={cn(
                                "shrink-0 tabular-nums text-tiny px-1.5 py-0.5 rounded-full",
                                isSelected
                                  ? "bg-on-gold/15 text-on-gold font-bold"
                                  : "bg-neutral-700/60 dark:bg-white/8 text-neutral-300 dark:text-neutral-400",
                              )}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
