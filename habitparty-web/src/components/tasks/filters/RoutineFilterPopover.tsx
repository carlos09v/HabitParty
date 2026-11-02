"use client";

import { FilterX, SlidersHorizontal, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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

export function RoutineFilterPopover({
  filters = DEFAULT_BOARD_FILTERS,

  onFilterChange,
  availableTags = [],
  isCompact = false,
}: RoutineFilterPopoverProps) {
  const t = useTranslations("tasks.filters.popover");
  const { isGamified } = useExperienceMode();
  const [showFilterPopover, setShowFilterPopover] = useState(false);

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
        className={cn(
          "flex items-center gap-1.5 rounded-lg border font-medium transition-all cursor-pointer select-none",
          isCompact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-body-s",
          activeFiltersCount > 0
            ? "bg-gold/15 border-gold/60 text-gold-pressed shadow-glow-gold-xs"
            : "bg-surface border-white/15 text-neutral-200 hover:text-neutral-50 hover:bg-surface-hover hover:border-white/25",
        )}
      >
        <SlidersHorizontal
          size={isCompact ? 13 : 15}
          className={cn(
            "shrink-0",
            activeFiltersCount > 0 ? "text-gold" : "text-neutral-300",
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

          <div className="absolute left-0 top-full mt-2 w-80 rounded-xl bg-popover border border-white/20 p-4 shadow-popover-dark z-50 animate-in fade-in zoom-in-95 backdrop-blur-md">
            {/* Cabeçalho do Popover */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-3">
              <span className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
                <SlidersHorizontal size={13} className="text-gold" />
                {t("title")}
              </span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-tiny text-neutral-400 hover:text-danger-500 transition-colors cursor-pointer"
                >
                  <FilterX size={12} />
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
                      onClick={() =>
                        updateFilter(
                          "taskType",
                          opt.id as "all" | TaskTypeOption,
                        )
                      }
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium transition-all text-center cursor-pointer",
                        filters.taskType === opt.id
                          ? "bg-gold text-on-gold font-bold shadow-xs"
                          : "bg-white/5 text-neutral-300 hover:bg-white/10",
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
                    onClick={() => updateFilter("difficulty", "all")}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                      filters.difficulty === "all"
                        ? "bg-gold text-on-gold font-bold"
                        : "bg-white/5 text-neutral-300 hover:bg-white/10",
                    )}
                  >
                    {t("allOptions")}
                  </button>
                  {TASK_DIFFICULTY_OPTIONS.map((diff) => (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() =>
                        updateFilter(
                          "difficulty",
                          diff.id as TaskDifficultyOption,
                        )
                      }
                      className={cn(
                        "px-2 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                        filters.difficulty === diff.id
                          ? "bg-gold text-on-gold font-bold"
                          : "bg-white/5 text-neutral-300 hover:bg-white/10",
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
                    onClick={() => updateFilter("priority", "all")}
                    className={cn(
                      "px-2 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                      filters.priority === "all"
                        ? "bg-gold text-on-gold font-bold"
                        : "bg-white/5 text-neutral-300 hover:bg-white/10",
                    )}
                  >
                    {t("allOptions")}
                  </button>
                  {TODO_PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        updateFilter("priority", p.id as TaskPriorityOption)
                      }
                      className={cn(
                        "px-2 py-0.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                        filters.priority === p.id
                          ? "bg-gold text-on-gold font-bold"
                          : "bg-white/5 text-neutral-300 hover:bg-white/10",
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
                      onClick={() =>
                        updateFilter(
                          "status",
                          st.id as "all" | "pending" | "completed",
                        )
                      }
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-medium transition-all text-center cursor-pointer",
                        filters.status === st.id
                          ? "bg-gold text-on-gold font-bold shadow-xs"
                          : "bg-white/5 text-neutral-300 hover:bg-white/10",
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
                <div className="flex flex-col gap-1.5 pt-1 border-t border-white/5">
                  <span className="text-label-g font-semibold text-neutral-400 flex items-center gap-1">
                    <Tag size={11} /> {t("tagsLabel")}
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => updateFilter("tag", null)}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-tiny font-medium transition-all cursor-pointer",
                        filters.tag === null
                          ? "bg-gold text-on-gold font-bold"
                          : "bg-white/5 text-neutral-300 hover:bg-white/10",
                      )}
                    >
                      {t("allOptions")}
                    </button>
                    {availableTags.map((tagItem) => (
                      <button
                        key={tagItem}
                        type="button"
                        onClick={() =>
                          updateFilter(
                            "tag",
                            filters.tag === tagItem ? null : tagItem,
                          )
                        }
                        className={cn(
                          "px-2 py-0.5 rounded-full text-tiny font-medium transition-all cursor-pointer truncate max-w-[120px]",
                          filters.tag === tagItem
                            ? "bg-gold text-on-gold font-bold"
                            : "bg-white/5 text-neutral-300 hover:bg-white/10",
                        )}
                      >
                        #{tagItem}
                      </button>
                    ))}
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
