"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  type DashboardAdvancedFilters,
  DEFAULT_DASHBOARD_ADVANCED_FILTERS,
  type Task,
  type TaskFilterType,
} from "@/types/task";

const WEEKDAY_NAMES = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export function useDashboardTaskFilters(tasks: Task[]) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeFilter, setActiveFilter] = useState<TaskFilterType>("today");
  const [advancedFilters, setAdvancedFilters] =
    useState<DashboardAdvancedFilters>(DEFAULT_DASHBOARD_ADVANCED_FILTERS);

  const selectedDate = searchParams.get("date");

  const handleClearDate = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("date");
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);

    // 1. Filtro Temporal
    let result = tasks.filter((task) => {
      if (selectedDate) {
        if (task.dueDate === selectedDate) return true;
        const type = (task.type || "").toLowerCase();
        if (type === "daily") {
          const [y, m, d] = selectedDate.split("-").map(Number);
          const targetDate = new Date(y, (m || 1) - 1, d || 1);
          const targetDayName = WEEKDAY_NAMES[targetDate.getDay()];
          return (
            !task.daysOfWeek ||
            task.daysOfWeek.length === 0 ||
            task.daysOfWeek.includes(targetDayName)
          );
        }
        return false;
      }

      if (!task.dueDate) {
        return activeFilter === "nodate";
      }

      const [year, month, day] = task.dueDate.split("-").map(Number);
      const taskDate = new Date(year, (month || 1) - 1, day || 1);
      taskDate.setHours(0, 0, 0, 0);

      const isToday = taskDate.getTime() === today.getTime();
      const isPast = taskDate.getTime() < today.getTime();
      const isWithin7Days =
        taskDate.getTime() >= today.getTime() &&
        taskDate.getTime() <= next7Days.getTime();

      switch (activeFilter) {
        case "today":
          return isToday;
        case "next7days":
          return isWithin7Days;
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
        (t) => (t.type || "").toUpperCase() === advancedFilters.taskType,
      );
    }

    if (advancedFilters.columnId !== "all") {
      result = result.filter((t) => t.columnId === advancedFilters.columnId);
    }

    if (advancedFilters.difficulty !== "all") {
      result = result.filter(
        (t) =>
          (t.difficulty || "").toUpperCase() === advancedFilters.difficulty,
      );
    }

    if (advancedFilters.hideCompleted) {
      result = result.filter((t) => !t.completed);
    }

    // 3. Ordenação
    if (advancedFilters.sortBy !== "default") {
      result = [...result].sort((a, b) => {
        if (advancedFilters.sortBy === "dueDate") {
          return (a.dueDate || "9999-99-99").localeCompare(
            b.dueDate || "9999-99-99",
          );
        }
        if (advancedFilters.sortBy === "difficulty") {
          const diffWeight: Record<string, number> = {
            hard: 4,
            medium: 3,
            easy: 2,
            trivial: 1,
          };
          const wa = diffWeight[(a.difficulty || "").toLowerCase()] || 0;
          const wb = diffWeight[(b.difficulty || "").toLowerCase()] || 0;
          return wb - wa;
        }
        if (advancedFilters.sortBy === "priority") {
          const prioWeight: Record<string, number> = {
            high: 3,
            medium: 2,
            low: 1,
          };
          const wa = prioWeight[(a.priority || "").toLowerCase()] || 0;
          const wb = prioWeight[(b.priority || "").toLowerCase()] || 0;
          return wb - wa;
        }
        if (advancedFilters.sortBy === "reward") {
          const ra = (a.rewardGold ?? 0) + (a.rewardXp ?? 0);
          const rb = (b.rewardGold ?? 0) + (b.rewardXp ?? 0);
          return rb - ra;
        }
        return 0;
      });
    }

    return result;
  }, [tasks, selectedDate, activeFilter, advancedFilters]);

  return {
    activeFilter,
    setActiveFilter,
    selectedDate,
    handleClearDate,
    advancedFilters,
    setAdvancedFilters,
    filteredTasks,
  };
}
