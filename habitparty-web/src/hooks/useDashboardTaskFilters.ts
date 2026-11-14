"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  syncDashboardFilterUrl,
  useDashboardFilterStore,
} from "@/store/dashboardFilterStore";
import { useUserStore } from "@/store/userStore";
import type { DashboardAdvancedFilters } from "@/types/dashboard";
import type { Task, TaskFilterType } from "@/types/task";
import {
  getTodayDateString,
  isTaskScheduledForDate,
} from "@/utils/dashboardMetrics";
import {
  formatDateParts,
  getDatePartsInTimeZone,
  getOffsetDateString,
} from "@/utils/date";

export { syncDashboardFilterUrl, useDashboardFilterStore };

function isValidTaskFilter(val: string | null): val is TaskFilterType {
  return DASHBOARD_TASK_FILTERS.some((f) => f.id === val);
}

function isDailyScheduledBetween(
  task: Task,
  startDateUtc: Date,
  daysCount: number,
): boolean {
  const cursor = new Date(startDateUtc);
  for (let i = 0; i < daysCount; i++) {
    const iso = formatDateParts(
      cursor.getUTCFullYear(),
      cursor.getUTCMonth(),
      cursor.getUTCDate(),
    );
    if (isTaskScheduledForDate(task, iso, { includeHabits: false })) {
      return true;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return false;
}

export function useDashboardTaskFilters(tasks: Task[]) {
  const searchParams = useSearchParams();
  const userTimeZone = useUserStore((s) => s.user?.timezone);
  const activeFilter = useDashboardFilterStore((s) => s.activeFilter);
  const selectedDate = useDashboardFilterStore((s) => s.selectedDate);
  const setStoreFilter = useDashboardFilterStore((s) => s.setFilter);
  const setStoreSelectedDate = useDashboardFilterStore(
    (s) => s.setSelectedDate,
  );

  const [advancedFilters, setAdvancedFilters] =
    useState<DashboardAdvancedFilters>(DEFAULT_DASHBOARD_ADVANCED_FILTERS);

  // Inicializa a partir da URL na montagem (ou quando a URL muda externamente)
  const urlFilterParam = searchParams.get("filter");
  const urlDateParam = searchParams.get("date");

  useEffect(() => {
    const todayIso = getTodayDateString(new Date(), userTimeZone);
    const resolvedFilter: TaskFilterType = isValidTaskFilter(urlFilterParam)
      ? urlFilterParam
      : "today";

    if (urlDateParam && urlDateParam !== todayIso) {
      setStoreSelectedDate(urlDateParam);
    } else {
      setStoreFilter(urlDateParam === todayIso ? "today" : resolvedFilter);
    }
  }, [
    urlFilterParam,
    urlDateParam,
    userTimeZone,
    setStoreFilter,
    setStoreSelectedDate,
  ]);

  const effectiveFilter = activeFilter;

  const setActiveFilter = useCallback(
    (newFilter: TaskFilterType) => {
      setStoreFilter(newFilter);
      syncDashboardFilterUrl(newFilter, null);
    },
    [setStoreFilter],
  );

  const handleClearDate = useCallback(() => {
    setStoreSelectedDate(null);
    syncDashboardFilterUrl(activeFilter, null);
  }, [activeFilter, setStoreSelectedDate]);

  const filteredTasks = useMemo(() => {
    const now = new Date();
    const nowParts = getDatePartsInTimeZone(now, userTimeZone);
    const todayUtc = new Date(
      Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day),
    );
    const todayIso = formatDateParts(
      nowParts.year,
      nowParts.month - 1,
      nowParts.day,
    );
    const next7DaysIso = getOffsetDateString(7, now, userTimeZone);

    const daysInCurrentMonth = new Date(
      Date.UTC(nowParts.year, nowParts.month, 0),
    ).getUTCDate();
    const remainingDaysInMonth = Math.max(
      1,
      daysInCurrentMonth - nowParts.day + 1,
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
          return isDailyScheduledBetween(task, todayUtc, 8);
        }
        if (effectiveFilter === "this_month") {
          return isDailyScheduledBetween(task, todayUtc, remainingDaysInMonth);
        }
        return false;
      }

      // Afazeres (To-Do) sem data de entrega definida
      if (!task.dueDate) {
        return effectiveFilter === "nodate";
      }

      const datePart = task.dueDate.split("T")[0];
      const [year, month] = datePart.split("-").map(Number);

      const isPast = datePart < todayIso;
      const isWithin7Days = datePart >= todayIso && datePart <= next7DaysIso;
      const isThisMonth = year === nowParts.year && month === nowParts.month;

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
  }, [tasks, selectedDate, effectiveFilter, advancedFilters, userTimeZone]);

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
