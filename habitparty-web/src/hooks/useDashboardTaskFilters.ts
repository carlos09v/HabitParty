"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  DASHBOARD_TASK_FILTERS,
  DEFAULT_DASHBOARD_ADVANCED_FILTERS,
} from "@/constants/dashboard";
import {
  DIFFICULTY_SORT_WEIGHTS,
  normalizeTaskDifficulty,
  normalizeTaskType,
  PRIORITY_SORT_WEIGHTS,
} from "@/constants/task";
import type { DashboardAdvancedFilters } from "@/types/dashboard";
import type { Task, TaskFilterType } from "@/types/task";
import {
  getTodayDateString,
  isTaskScheduledForDate,
} from "@/utils/dashboardMetrics";
import { formatDateParts } from "@/utils/date";

function isValidTaskFilter(val: string | null): val is TaskFilterType {
  return DASHBOARD_TASK_FILTERS.some((f) => f.id === val);
}

function isDailyScheduledBetween(
  task: Task,
  startDate: Date,
  daysCount: number,
): boolean {
  const cursor = new Date(startDate);
  for (let i = 0; i < daysCount; i++) {
    const iso = formatDateParts(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate(),
    );
    if (isTaskScheduledForDate(task, iso, { includeHabits: false })) {
      return true;
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return false;
}

export function useDashboardTaskFilters(tasks: Task[]) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlFilterParam = searchParams.get("filter");
  const initialFilter: TaskFilterType = isValidTaskFilter(urlFilterParam)
    ? urlFilterParam
    : "today";

  const [activeFilter, setActiveFilterState] =
    useState<TaskFilterType>(initialFilter);
  const [advancedFilters, setAdvancedFilters] =
    useState<DashboardAdvancedFilters>(DEFAULT_DASHBOARD_ADVANCED_FILTERS);

  const selectedDate = searchParams.get("date");
  const effectiveFilter = isValidTaskFilter(urlFilterParam)
    ? urlFilterParam
    : activeFilter;

  const setActiveFilter = useCallback(
    (newFilter: TaskFilterType) => {
      setActiveFilterState(newFilter);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("date");
      params.set("filter", newFilter);
      params.set("page", "1");
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleClearDate = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayIso = getTodayDateString(today);

    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);

    const daysInCurrentMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).getDate();
    const remainingDaysInMonth = Math.max(
      1,
      daysInCurrentMonth - today.getDate() + 1,
    );

    // 1. Filtro Temporal
    let result = tasks.filter((task) => {
      const type = normalizeTaskType(task);
      const isDaily = type === "daily";
      const isHabit = type === "habit";

      if (selectedDate) {
        return isTaskScheduledForDate(task, selectedDate, {
          includeHabits: selectedDate === todayIso,
        });
      }

      if (effectiveFilter === "today") {
        return isTaskScheduledForDate(task, todayIso, { includeHabits: true });
      }

      // Hábitos não possuem prazo fixo: ficam visíveis apenas na aba "Hoje"
      if (isHabit) {
        return false;
      }

      // Diárias são avaliadas conforme sua programação real dentro do intervalo
      if (isDaily) {
        if (effectiveFilter === "next7days") {
          return isDailyScheduledBetween(task, today, 8);
        }
        if (effectiveFilter === "this_month") {
          return isDailyScheduledBetween(task, today, remainingDaysInMonth);
        }
        return false;
      }

      // Afazeres (To-Do) sem data de entrega definida
      if (!task.dueDate) {
        return effectiveFilter === "nodate";
      }

      const datePart = task.dueDate.split("T")[0];
      const [year, month, day] = datePart.split("-").map(Number);
      const taskDate = new Date(year, (month || 1) - 1, day || 1);
      taskDate.setHours(0, 0, 0, 0);

      const isPast = taskDate.getTime() < today.getTime();
      const isWithin7Days =
        taskDate.getTime() >= today.getTime() &&
        taskDate.getTime() <= next7Days.getTime();
      const isThisMonth =
        taskDate.getFullYear() === today.getFullYear() &&
        taskDate.getMonth() === today.getMonth();

      switch (effectiveFilter) {
        case "next7days":
          return isWithin7Days;
        case "this_month":
          return isThisMonth;
        case "overdue":
          return isPast && !task.completed;
        case "nodate":
          return false;
        default:
          return true;
      }
    });

    // 2. Filtros Avançados
    if (advancedFilters.taskType !== "all") {
      result = result.filter(
        (t) => normalizeTaskType(t).toUpperCase() === advancedFilters.taskType,
      );
    }

    if (advancedFilters.columnId !== "all") {
      result = result.filter((t) => t.columnId === advancedFilters.columnId);
    }

    if (advancedFilters.difficulty !== "all") {
      result = result.filter(
        (t) =>
          normalizeTaskDifficulty(t.difficulty) === advancedFilters.difficulty,
      );
    }

    if (advancedFilters.hideCompleted) {
      result = result.filter((t) => !t.completed);
    }

    // 3. Ordenação
    result = [...result].sort((a, b) => {
      if (
        advancedFilters.sortBy === "default" ||
        advancedFilters.sortBy === "dueDate"
      ) {
        const dateA = a.dueDate ? a.dueDate.split("T")[0] : "9999-99-99";
        const dateB = b.dueDate ? b.dueDate.split("T")[0] : "9999-99-99";
        return dateA.localeCompare(dateB);
      }
      if (advancedFilters.sortBy === "difficulty") {
        const wa = DIFFICULTY_SORT_WEIGHTS[a.difficulty || ""] || 0;
        const wb = DIFFICULTY_SORT_WEIGHTS[b.difficulty || ""] || 0;
        return wb - wa;
      }
      if (advancedFilters.sortBy === "priority") {
        const wa =
          PRIORITY_SORT_WEIGHTS[a.priority || a.importanceType || ""] || 0;
        const wb =
          PRIORITY_SORT_WEIGHTS[b.priority || b.importanceType || ""] || 0;
        return wb - wa;
      }
      if (advancedFilters.sortBy === "reward") {
        const ra = (a.rewardGold ?? 0) + (a.rewardXp ?? 0);
        const rb = (b.rewardGold ?? 0) + (b.rewardXp ?? 0);
        return rb - ra;
      }
      return 0;
    });

    return result;
  }, [tasks, selectedDate, effectiveFilter, advancedFilters]);

  return {
    activeFilter: effectiveFilter,
    setActiveFilter,
    selectedDate,
    handleClearDate,
    advancedFilters,
    setAdvancedFilters,
    filteredTasks,
  };
}
