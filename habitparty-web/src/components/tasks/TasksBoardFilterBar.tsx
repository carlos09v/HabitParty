"use client";

import { RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { RoutineFilters } from "@/components/tasks/RoutineFilters";
import { WorkspaceSearchHintBanner } from "@/components/tasks/WorkspaceSearchHintBanner";
import { DEFAULT_BOARD_FILTERS, toPriorityMessageKey } from "@/constants/task";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { RoutineFiltersProps } from "@/types/task-ui";
import { getTagLeafLabel } from "@/utils/tags";

interface TasksBoardFilterBarProps {
  sharedFilterProps: Omit<
    RoutineFiltersProps,
    "isDraggingColumn" | "enableDroppable"
  >;
  searchQuery: string;
  localMatchCount: number;
  isDraggingColumn: boolean;
  enableDroppable: boolean;
}

interface ActiveFilterChip {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

export function TasksBoardFilterBar({
  sharedFilterProps,
  searchQuery,
  localMatchCount,
  isDraggingColumn,
  enableDroppable,
}: TasksBoardFilterBarProps) {
  const t = useTranslations("tasks.filters");
  const tPopover = useTranslations("tasks.filters.popover");
  const { isGamified } = useExperienceMode();

  const filters = sharedFilterProps.filters;
  const onFilterChange = sharedFilterProps.onFilterChange;

  const activeChips = useMemo<ActiveFilterChip[]>(() => {
    if (!filters || !onFilterChange) return [];

    const chips: ActiveFilterChip[] = [];

    if (filters.taskType !== "all") {
      chips.push({
        key: `type-${filters.taskType}`,
        label: tPopover("typeLabel"),
        value: tPopover(`types.${filters.taskType}`),
        onRemove: () => onFilterChange({ ...filters, taskType: "all" }),
      });
    }

    if (filters.status !== "all") {
      chips.push({
        key: `status-${filters.status}`,
        label: tPopover("statusLabel"),
        value: tPopover(`statuses.${filters.status}`),
        onRemove: () => onFilterChange({ ...filters, status: "all" }),
      });
    }

    if (filters.difficulty !== "all") {
      chips.push({
        key: `difficulty-${filters.difficulty}`,
        label: isGamified
          ? tPopover("difficultyLabel")
          : tPopover("effortLabel"),
        value: tPopover(`difficulties.${filters.difficulty}`),
        onRemove: () => onFilterChange({ ...filters, difficulty: "all" }),
      });
    }

    if (filters.priority !== "all") {
      chips.push({
        key: `priority-${filters.priority}`,
        label: tPopover("priorityLabel"),
        value: tPopover(`priorities.${toPriorityMessageKey(filters.priority)}`),
        onRemove: () => onFilterChange({ ...filters, priority: "all" }),
      });
    }

    if (filters.tag) {
      chips.push({
        key: `tag-${filters.tag}`,
        label: tPopover("tagsLabel"),
        value: `#${getTagLeafLabel(filters.tag)}`,
        onRemove: () => onFilterChange({ ...filters, tag: null }),
      });
    }

    return chips;
  }, [filters, isGamified, onFilterChange, tPopover]);

  return (
    <div className="shrink-0 flex flex-col gap-2">
      <RoutineFilters
        {...sharedFilterProps}
        isDraggingColumn={isDraggingColumn}
        enableDroppable={enableDroppable}
      />

      {activeChips.length > 0 && onFilterChange && (
        <section
          aria-label={t("activeFiltersAria")}
          className="flex flex-wrap items-center gap-1.5 px-0.5"
        >
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-primary/10 dark:bg-gold/12 border border-primary/25 dark:border-gold/30 text-neutral-100"
            >
              <span className="text-neutral-400 font-normal">
                {chip.label}:
              </span>
              <span className="font-semibold text-primary dark:text-gold max-w-[160px] truncate">
                {chip.value}
              </span>
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={t("removeFilterAria", {
                  label: chip.label,
                  value: chip.value,
                })}
                className="p-0.5 rounded-full text-neutral-400 hover:text-neutral-50 hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}

          {activeChips.length >= 2 && (
            <button
              type="button"
              onClick={() => onFilterChange(DEFAULT_BOARD_FILTERS)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-neutral-400 hover:text-neutral-100 hover:bg-white/8 transition-colors cursor-pointer"
            >
              <RotateCcw size={11} aria-hidden="true" />
              <span>{t("clearAllFilters")}</span>
            </button>
          )}
        </section>
      )}

      <WorkspaceSearchHintBanner
        searchQuery={searchQuery}
        localMatchCount={localMatchCount}
      />
    </div>
  );
}
