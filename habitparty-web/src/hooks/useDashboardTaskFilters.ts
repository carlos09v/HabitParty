"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { DEFAULT_DASHBOARD_ADVANCED_FILTERS } from "@/constants/dashboard";
import { ALL_WEEK_DAYS, normalizeTaskType } from "@/constants/task";
import type { DashboardAdvancedFilters } from "@/types/dashboard";
import type { Task, TaskFilterType } from "@/types/task";

export function useDashboardTaskFilters(tasks: Task[]) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlFilterParam = searchParams.get("filter");
  const initialFilter: TaskFilterType =
    urlFilterParam === "today" ||
    urlFilterParam === "next7days" ||
    urlFilterParam === "this_month" ||
    urlFilterParam === "overdue" ||
    urlFilterParam === "nodate"
      ? (urlFilterParam as TaskFilterType)
      : "today";

  const [activeFilter, setActiveFilterState] =
    useState<TaskFilterType>(initialFilter);
  const [advancedFilters, setAdvancedFilters] =
    useState<DashboardAdvancedFilters>(DEFAULT_DASHBOARD_ADVANCED_FILTERS);

  const selectedDate = searchParams.get("date");
  const effectiveFilter =
    urlFilterParam === "today" ||
    urlFilterParam === "next7days" ||
    urlFilterParam === "this_month" ||
    urlFilterParam === "overdue" ||
    urlFilterParam === "nodate"
      ? (urlFilterParam as TaskFilterType)
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

    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);

    // 1. Filtro Temporal
    let result = tasks.filter((task) => {
      const type = normalizeTaskType(task);
      const isDaily = type === "daily";
      const isHabit = type === "habit";

      if (selectedDate) {
        if (
          task.dueDate === selectedDate ||
          task.dueDate?.startsWith(selectedDate)
        )
          return true;
        if (isDaily) {
          const [y, m, d] = selectedDate.split("-").map(Number);
          const targetDate = new Date(y, (m || 1) - 1, d || 1);
          const targetDayName = ALL_WEEK_DAYS[targetDate.getDay()];
          return (
            !task.daysOfWeek ||
            task.daysOfWeek.length === 0 ||
            task.daysOfWeek.includes(targetDayName)
          );
        }
        return false;
      }

      if (!task.dueDate) {
        if (effectiveFilter === "nodate") return true;
        if (effectiveFilter === "today") {
          if (isHabit) return true;
          if (isDaily) {
            const todayDayName = ALL_WEEK_DAYS[today.getDay()];
            return (
              !task.daysOfWeek ||
              task.daysOfWeek.length === 0 ||
              task.daysOfWeek.includes(todayDayName)
            );
          }
        }
        return false;
      }

      const datePart = task.dueDate.split("T")[0];
      const [year, month, day] = datePart.split("-").map(Number);
      const taskDate = new Date(year, (month || 1) - 1, day || 1);
      taskDate.setHours(0, 0, 0, 0);

      const isToday = taskDate.getTime() === today.getTime();
      const isPast = taskDate.getTime() < today.getTime();
      const isWithin7Days =
        taskDate.getTime() >= today.getTime() &&
        taskDate.getTime() <= next7Days.getTime();
      const isThisMonth =
        taskDate.getFullYear() === today.getFullYear() &&
        taskDate.getMonth() === today.getMonth();

      switch (effectiveFilter) {
        case "today":
          return (
            isToday ||
            isHabit ||
            (isDaily &&
              (!task.daysOfWeek ||
                task.daysOfWeek.length === 0 ||
                task.daysOfWeek.includes(ALL_WEEK_DAYS[today.getDay()])))
          );
        case "next7days":
          return isWithin7Days || isDaily || isHabit;
        case "this_month":
          return isThisMonth || isDaily || isHabit;
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
      result = result.filter(
        (t) =>
          t.columnId === advancedFilters.columnId ||
          t.category === advancedFilters.columnId,
      );
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
