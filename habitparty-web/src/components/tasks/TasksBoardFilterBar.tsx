"use client";

import { RoutineFilters } from "@/components/tasks/RoutineFilters";
import { WorkspaceSearchHintBanner } from "@/components/tasks/WorkspaceSearchHintBanner";
import type { RoutineFiltersProps } from "@/types/task-ui";

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

export function TasksBoardFilterBar({
  sharedFilterProps,
  searchQuery,
  localMatchCount,
  isDraggingColumn,
  enableDroppable,
}: TasksBoardFilterBarProps) {
  return (
    <div className="shrink-0 flex flex-col gap-2">
      <RoutineFilters
        {...sharedFilterProps}
        isDraggingColumn={isDraggingColumn}
        enableDroppable={enableDroppable}
      />
      <WorkspaceSearchHintBanner
        searchQuery={searchQuery}
        localMatchCount={localMatchCount}
      />
    </div>
  );
}
