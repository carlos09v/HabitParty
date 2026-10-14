"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { components } from "@/api/schema";
import { TaskFilters } from "@/components/dashboard/TaskFilters";
import { TaskTable } from "@/components/dashboard/TaskTable";
import { useDashboardTaskActions } from "@/hooks/useDashboardTaskActions";
import { useDashboardTaskFilters } from "@/hooks/useDashboardTaskFilters";
import type { Task } from "@/types/task";
import { cn } from "@/utils";

type Column = components["schemas"]["BoardColumnSummaryDTO"];

interface DashboardTasksPanelProps {
  initialTasks: Task[];
  columns: Column[];
  isCompact?: boolean;
  isWelcomeExpanded?: boolean;
}

export function DashboardTasksPanel({
  initialTasks,
  columns,
  isCompact = false,
  isWelcomeExpanded = true,
}: DashboardTasksPanelProps) {
  const searchParams = useSearchParams();
  const [tasksState, setTasksState] = useState<Task[]>(initialTasks);

  useEffect(() => {
    setTasksState(initialTasks);
  }, [initialTasks]);

  const {
    activeFilter,
    setActiveFilter,
    selectedDate,
    handleClearDate,
    advancedFilters,
    setAdvancedFilters,
    filteredTasks,
  } = useDashboardTaskFilters(tasksState);

  const { handleToggleComplete, handleHabitChange } = useDashboardTaskActions({
    setTasks: setTasksState,
  });

  const itemsPerPage = isWelcomeExpanded ? 3 : 5;
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;

  return (
    <section className={cn("flex flex-col", isCompact ? "gap-4" : "gap-5")}>
      <TaskFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        selectedDate={selectedDate}
        onClearDate={handleClearDate}
        columns={columns}
        advancedFilters={advancedFilters}
        onAdvancedFiltersChange={setAdvancedFilters}
        isCompact={isCompact}
      />
      <TaskTable
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        tasks={filteredTasks}
        activeFilter={activeFilter}
        onToggle={handleToggleComplete}
        onHabitChange={handleHabitChange}
        selectedDate={selectedDate}
        isCompact={isCompact}
      />
    </section>
  );
}
