import { type Dispatch, type SetStateAction, useMemo } from "react";
import { DEFAULT_BOARD_FILTERS } from "@/constants/task";
import type { AppLocale } from "@/i18n/config";
import type { BoardColumn, BoardFilterState } from "@/types/task";
import { calculateTasksWelcomeStats } from "@/utils/catalogMetrics";

interface UseTasksWelcomeStatsParams {
  columns: BoardColumn[];
  filteredColumns: BoardColumn[];
  filters: BoardFilterState;
  setFilters: Dispatch<SetStateAction<BoardFilterState>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  locale: AppLocale;
}

/**
 * Calcula estatísticas interativas de boas-vindas e contagem local de correspondências do quadro.
 */
export function useTasksWelcomeStats({
  columns,
  filteredColumns,
  filters,
  setFilters,
  searchQuery,
  setSearchQuery,
  locale,
}: UseTasksWelcomeStatsParams) {
  const localMatchCount = useMemo(
    () => filteredColumns.reduce((sum, col) => sum + col.tasks.length, 0),
    [filteredColumns],
  );

  const hasActiveBoardFilters =
    filters.taskType !== "all" ||
    filters.difficulty !== "all" ||
    filters.priority !== "all" ||
    filters.status !== "all" ||
    filters.tag !== null ||
    Boolean(searchQuery);

  const tasksStats = useMemo(() => {
    const { stats } = calculateTasksWelcomeStats(columns, undefined, locale);
    return stats.map((stat, index) => {
      if (index === 0) {
        return {
          ...stat,
          onClick: hasActiveBoardFilters
            ? () => {
                setFilters(DEFAULT_BOARD_FILTERS);
                setSearchQuery("");
              }
            : undefined,
        };
      }
      if (index === 1) {
        return {
          ...stat,
          active: filters.status === "completed",
          onClick: () =>
            setFilters((prev) => ({
              ...prev,
              status: prev.status === "completed" ? "all" : "completed",
            })),
        };
      }
      if (index === 2) {
        return {
          ...stat,
          active: filters.taskType === "HABIT",
          onClick: () =>
            setFilters((prev) => ({
              ...prev,
              taskType: prev.taskType === "HABIT" ? "all" : "HABIT",
            })),
        };
      }
      return stat;
    });
  }, [
    columns,
    locale,
    hasActiveBoardFilters,
    filters.status,
    filters.taskType,
    setFilters,
    setSearchQuery,
  ]);

  return {
    localMatchCount,
    tasksStats,
  };
}
