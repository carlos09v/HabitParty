"use client";

import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { DASHBOARD_TASK_FILTERS } from "@/constants/dashboard";
import {
  DIFFICULTY_SORT_WEIGHTS,
  normalizeTaskDifficulty,
  normalizeTaskType,
  PRIORITY_SORT_WEIGHTS,
} from "@/constants/task";
import { useMidnightRollover } from "@/hooks/useMidnightRollover";
import { useMinuteTicker } from "@/hooks/useMinuteTicker";
import {
  syncDashboardFilterUrl,
  useDashboardFilterStore,
} from "@/store/dashboardFilterStore";
import { useUserStore } from "@/store/userStore";
import type {
  DashboardAdvancedFilters,
  DashboardColumnOption,
} from "@/types/dashboard";
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
import { doesTaskMatchTagFilter } from "@/utils/tags";
import { isTaskInReadOnlyScope } from "@/utils/taskMapper";
import {
  isTodoTimeOverdueToday,
  isTodoTimeOverdueTodayFast,
} from "@/utils/taskSchedule";

export { syncDashboardFilterUrl, useDashboardFilterStore };

function isValidTaskFilter(val: string | null): val is TaskFilterType {
  return DASHBOARD_TASK_FILTERS.some((f) => f.id === val);
}

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isValidIsoCalendarDate(val: string | null): val is string {
  if (!val) return false;
  const match = ISO_DATE_PATTERN.exec(val);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year &&
    utc.getUTCMonth() === month - 1 &&
    utc.getUTCDate() === day
  );
}

function getTaskPrioritySortWeight(task: Task): number {
  const priority = task.priority;
  if (priority && priority.toUpperCase() !== "NONE") {
    return PRIORITY_SORT_WEIGHTS[priority] || 0;
  }
  if (normalizeTaskType(task) === "habit") {
    const habitImportance = task.importanceType || task.importance || "";
    return PRIORITY_SORT_WEIGHTS[habitImportance] || 0;
  }
  return 0;
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

function isTodoTaskOverdueFast(
  task: Task,
  todayIso: string,
  currentMinutes: number,
): boolean {
  if (normalizeTaskType(task) !== "todo" || task.completed || !task.dueDate) {
    return false;
  }
  const datePart = task.dueDate.split("T")[0];
  if (datePart < todayIso) {
    return true;
  }
  return (
    datePart === todayIso && isTodoTimeOverdueTodayFast(task, currentMinutes)
  );
}

export function isTodoTaskOverdue(
  task: Task,
  todayIso: string,
  now: Date,
  timeZone?: string | null,
): boolean {
  if (normalizeTaskType(task) !== "todo" || task.completed || !task.dueDate) {
    return false;
  }
  const datePart = task.dueDate.split("T")[0];
  if (datePart < todayIso) {
    return true;
  }
  return datePart === todayIso && isTodoTimeOverdueToday(task, now, timeZone);
}

function matchesStructuralAdvancedFilters(
  task: Task,
  advancedFilters: DashboardAdvancedFilters,
): boolean {
  if (
    advancedFilters.workspaceId !== "all" &&
    task.workspaceId !== advancedFilters.workspaceId
  ) {
    return false;
  }
  if (
    advancedFilters.taskType !== "all" &&
    normalizeTaskType(task).toUpperCase() !== advancedFilters.taskType
  ) {
    return false;
  }
  if (
    advancedFilters.columnId !== "all" &&
    task.columnId !== advancedFilters.columnId
  ) {
    return false;
  }
  if (
    advancedFilters.difficulty !== "all" &&
    normalizeTaskDifficulty(task.difficulty) !== advancedFilters.difficulty
  ) {
    return false;
  }
  if (advancedFilters.priority !== "all") {
    const taskPriority = (task.priority || "NONE").toUpperCase();
    if (taskPriority !== advancedFilters.priority.toUpperCase()) {
      return false;
    }
  }
  if (
    advancedFilters.tag &&
    !doesTaskMatchTagFilter(task, advancedFilters.tag)
  ) {
    return false;
  }
  return true;
}

function getTaskDueSortKey(task: Task): string {
  const datePart = task.dueDate ? task.dueDate.split("T")[0] : "9999-99-99";
  const timePart = task.dueTime || task.startTime || "99:99";
  return `${datePart}T${timePart}`;
}

export function useDashboardTaskFilters(
  tasks: Task[],
  validWorkspaceIds?: string[],
  validColumns?: ReadonlyArray<
    Pick<DashboardColumnOption, "id" | "workspaceId">
  >,
  options?: {
    readOnlyWorkspaceIds?: ReadonlySet<string>;
    readOnlyColumnIds?: ReadonlySet<string>;
    timeZone?: string | null;
  },
) {
  const searchParams = useSearchParams();
  const storeUserTimeZone = useUserStore((s) => s.user?.timezone);
  const userTimeZone = storeUserTimeZone ?? options?.timeZone;
  const readOnlyWorkspaceIds = options?.readOnlyWorkspaceIds;
  const readOnlyColumnIds = options?.readOnlyColumnIds;
  const todayIsoRollover = useMidnightRollover(userTimeZone);
  const hasTimedTodoToday = useMemo(
    () =>
      tasks.some((task) => {
        if (
          normalizeTaskType(task) !== "todo" ||
          task.completed ||
          !task.dueDate
        ) {
          return false;
        }
        const datePart = task.dueDate.split("T")[0];
        return (
          datePart === todayIsoRollover &&
          Boolean(task.dueTime || task.startTime || task.dueEndTime)
        );
      }),
    [tasks, todayIsoRollover],
  );
  const minuteTick = useMinuteTicker(hasTimedTodoToday);
  const activeFilter = useDashboardFilterStore((s) => s.activeFilter);
  const selectedDate = useDashboardFilterStore((s) => s.selectedDate);
  const searchQuery = useDashboardFilterStore((s) => s.searchQuery);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const advancedFilters = useDashboardFilterStore((s) => s.advancedFilters);
  const setStoreFilter = useDashboardFilterStore((s) => s.setFilter);
  const setStoreSelectedDate = useDashboardFilterStore(
    (s) => s.setSelectedDate,
  );
  const hydrateFromUrl = useDashboardFilterStore((s) => s.hydrateFromUrl);
  const setSearchQuery = useDashboardFilterStore((s) => s.setSearchQuery);
  const setAdvancedFilters = useDashboardFilterStore(
    (s) => s.setAdvancedFilters,
  );

  // Higieniza workspaceId / columnId persistidos caso o ambiente ou lista não exista mais
  // (inclusive quando a última lista é excluída ou movida para outro ambiente)
  useEffect(() => {
    const invalidWorkspace =
      advancedFilters.workspaceId !== "all" &&
      validWorkspaceIds !== undefined &&
      !validWorkspaceIds.includes(advancedFilters.workspaceId);

    const matchedColumn =
      advancedFilters.columnId !== "all" && validColumns !== undefined
        ? validColumns.find((col) => col.id === advancedFilters.columnId)
        : undefined;
    const invalidColumn =
      advancedFilters.columnId !== "all" &&
      validColumns !== undefined &&
      (!matchedColumn ||
        (advancedFilters.workspaceId !== "all" &&
          Boolean(matchedColumn.workspaceId) &&
          matchedColumn.workspaceId !== advancedFilters.workspaceId));

    if (invalidWorkspace || invalidColumn) {
      setAdvancedFilters((prev) => ({
        ...prev,
        workspaceId: invalidWorkspace ? "all" : prev.workspaceId,
        columnId: invalidWorkspace || invalidColumn ? "all" : prev.columnId,
      }));
    }
  }, [
    advancedFilters.workspaceId,
    advancedFilters.columnId,
    validWorkspaceIds,
    validColumns,
    setAdvancedFilters,
  ]);

  // Inicializa a partir da URL somente quando os parâmetros da URL efetivamente mudam
  // (evita que a hidratação tardia de userTimeZone sobrescreva uma aba já clicada pelo usuário)
  const urlFilterParam = searchParams.get("filter");
  const urlDateParam = searchParams.get("date");
  const lastSyncedUrlKeyRef = useRef<string | null>(null);
  const userTimeZoneRef = useRef(userTimeZone);
  useEffect(() => {
    userTimeZoneRef.current = userTimeZone;
  }, [userTimeZone]);

  useEffect(() => {
    const validUrlDate = isValidIsoCalendarDate(urlDateParam)
      ? urlDateParam
      : null;
    const urlKey = `${urlFilterParam ?? ""}|${validUrlDate ?? ""}`;
    if (lastSyncedUrlKeyRef.current === urlKey) return;
    lastSyncedUrlKeyRef.current = urlKey;

    const todayIso = getTodayDateString(new Date(), userTimeZoneRef.current);
    const resolvedFilter: TaskFilterType = isValidTaskFilter(urlFilterParam)
      ? urlFilterParam
      : "today";

    if (validUrlDate && validUrlDate !== todayIso) {
      hydrateFromUrl(resolvedFilter, validUrlDate);
    } else {
      hydrateFromUrl(
        validUrlDate === todayIso ? "today" : resolvedFilter,
        null,
      );
    }
  }, [urlFilterParam, urlDateParam, hydrateFromUrl]);

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

  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

  const { filteredTasks, overdueCount } = useMemo(() => {
    void minuteTick;
    void todayIsoRollover;
    const now = new Date();
    const nowParts = getDatePartsInTimeZone(now, userTimeZone);
    const currentMinutes = nowParts.hour * 60 + nowParts.minute;
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
    const excludeReadOnlyOverdue =
      advancedFilters.workspaceId === "all" &&
      Boolean(readOnlyWorkspaceIds && readOnlyColumnIds);

    interface SortableTaskEntry {
      task: Task;
      completedNum: number;
      overdueNum: number;
      hardcoreUrgentNum: number;
      dueSortKey: string;
      priorityWeight: number;
      difficultyWeight: number;
      rewardScore: number;
    }

    const sortableEntries: SortableTaskEntry[] = [];
    let nextOverdueCount = 0;

    // Passagem única O(N): aplica filtros estruturais, calcula overdueCount, filtra janela temporal/busca
    // e pré-computa todas as chaves de ordenação (Schwartzian transform, zero Intl dentro do .sort()).
    for (const task of tasks) {
      if (!matchesStructuralAdvancedFilters(task, advancedFilters)) {
        continue;
      }

      const isOverdue = isTodoTaskOverdueFast(task, todayIso, currentMinutes);
      const isReadOnlyInAllScope =
        excludeReadOnlyOverdue &&
        isTaskInReadOnlyScope(
          task,
          readOnlyWorkspaceIds as ReadonlySet<string>,
          readOnlyColumnIds as ReadonlySet<string>,
        );

      if (isOverdue && !isReadOnlyInAllScope) {
        nextOverdueCount += 1;
      }

      if (advancedFilters.hideCompleted && task.completed) {
        continue;
      }

      // 1. Filtro Temporal
      const type = normalizeTaskType(task);
      const isDaily = type === "daily";
      const isHabit = type === "habit";
      let matchesTemporal = false;

      if (selectedDate) {
        matchesTemporal = isTaskScheduledForDate(task, selectedDate, {
          includeHabits: selectedDate === todayIso,
        });
      } else if (effectiveFilter === "today") {
        matchesTemporal = isTaskScheduledForDate(task, todayIso, {
          includeHabits: true,
        });
      } else if (isHabit) {
        matchesTemporal = false;
      } else if (isDaily) {
        if (effectiveFilter === "next7days") {
          matchesTemporal = isDailyScheduledBetween(task, todayUtc, 8);
        } else if (effectiveFilter === "this_month") {
          matchesTemporal = isDailyScheduledBetween(
            task,
            todayUtc,
            remainingDaysInMonth,
          );
        } else {
          matchesTemporal = false;
        }
      } else if (!task.dueDate) {
        matchesTemporal = effectiveFilter === "nodate";
      } else {
        const datePart = task.dueDate.split("T")[0];
        switch (effectiveFilter) {
          case "next7days":
            matchesTemporal = datePart >= todayIso && datePart <= next7DaysIso;
            break;
          case "this_month": {
            const [year, month] = datePart.split("-").map(Number);
            matchesTemporal =
              datePart >= todayIso &&
              year === nowParts.year &&
              month === nowParts.month;
            break;
          }
          case "overdue":
            matchesTemporal = isOverdue && !isReadOnlyInAllScope;
            break;
          case "nodate":
            matchesTemporal = false;
            break;
          default:
            matchesTemporal = true;
            break;
        }
      }

      if (!matchesTemporal) {
        continue;
      }

      // 2. Busca Inline
      if (normalizedQuery) {
        const matchesTitle = task.title.toLowerCase().includes(normalizedQuery);
        const matchesDesc = Boolean(
          task.description?.toLowerCase().includes(normalizedQuery),
        );
        const matchesTag = Boolean(
          task.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery)),
        );
        if (!matchesTitle && !matchesDesc && !matchesTag) {
          continue;
        }
      }

      sortableEntries.push({
        task,
        completedNum: task.completed ? 1 : 0,
        overdueNum: isOverdue ? 1 : 0,
        hardcoreUrgentNum:
          task.isHardcoreModeEnabled && !task.completed ? 1 : 0,
        dueSortKey: getTaskDueSortKey(task),
        priorityWeight: getTaskPrioritySortWeight(task),
        difficultyWeight: DIFFICULTY_SORT_WEIGHTS[task.difficulty || ""] || 0,
        rewardScore: (task.rewardGold ?? 0) + (task.rewardXp ?? 0),
      });
    }

    // 3. Ordenação sobre chaves pré-computadas
    const sortBy = advancedFilters.sortBy;
    sortableEntries.sort((a, b) => {
      if (sortBy === "default") {
        const completedDiff = a.completedNum - b.completedNum;
        if (completedDiff !== 0) return completedDiff;

        const overdueDiff = b.overdueNum - a.overdueNum;
        if (overdueDiff !== 0) return overdueDiff;

        const hardcoreDiff = b.hardcoreUrgentNum - a.hardcoreUrgentNum;
        if (hardcoreDiff !== 0) return hardcoreDiff;

        if (a.dueSortKey !== b.dueSortKey) {
          return a.dueSortKey < b.dueSortKey ? -1 : 1;
        }

        return b.priorityWeight - a.priorityWeight;
      }

      if (sortBy === "dueDate") {
        return a.dueSortKey === b.dueSortKey
          ? 0
          : a.dueSortKey < b.dueSortKey
            ? -1
            : 1;
      }
      if (sortBy === "difficulty") {
        return b.difficultyWeight - a.difficultyWeight;
      }
      if (sortBy === "priority") {
        return b.priorityWeight - a.priorityWeight;
      }
      if (sortBy === "reward") {
        return b.rewardScore - a.rewardScore;
      }
      return 0;
    });

    return {
      filteredTasks: sortableEntries.map((entry) => entry.task),
      overdueCount: nextOverdueCount,
    };
  }, [
    tasks,
    selectedDate,
    effectiveFilter,
    advancedFilters,
    normalizedQuery,
    userTimeZone,
    todayIsoRollover,
    minuteTick,
    readOnlyWorkspaceIds,
    readOnlyColumnIds,
  ]);

  return {
    activeFilter: effectiveFilter,
    setActiveFilter,
    selectedDate,
    handleClearDate,
    searchQuery,
    setSearchQuery,
    advancedFilters,
    setAdvancedFilters,
    filteredTasks,
    overdueCount,
  };
}
