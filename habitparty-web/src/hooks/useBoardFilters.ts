"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  DEFAULT_BOARD_FILTERS,
  normalizeTaskDifficulty,
  normalizeTaskType,
} from "@/constants/task";
import type { BoardColumn, BoardFilterState } from "@/types/task";
import {
  doesTaskMatchTagFilter,
  extractAvailableTagOptions,
} from "@/utils/tags";

/**
 * Hook dedicado ao controle de busca, filtros de tags, tipos, dificuldade e status no Kanban.
 * Utiliza useDeferredValue para garantir digitação suave a 60/120fps sem travar o thread principal.
 */
export function useBoardFilters(
  columns: BoardColumn[],
  initialSearchQuery = "",
) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [filters, setFilters] = useState<BoardFilterState>(
    DEFAULT_BOARD_FILTERS,
  );

  // Lista de tags únicas presentes nas tarefas atuais (com ancestrais hierárquicos expostos para filtro)
  const availableTags = useMemo(() => {
    return extractAvailableTagOptions(columns.flatMap((col) => col.tasks));
  }, [columns]);

  // Colunas com tarefas filtradas aplicadas em memória
  const filteredColumns = useMemo(() => {
    const hasFilter =
      deferredSearchQuery.trim() !== "" ||
      filters.taskType !== "all" ||
      filters.difficulty !== "all" ||
      filters.priority !== "all" ||
      filters.status !== "all" ||
      filters.tag !== null;

    if (!hasFilter) return columns;

    const q = deferredSearchQuery.toLowerCase().trim();

    return columns.map((col) => {
      const nextTasks = col.tasks.filter((task) => {
        // 1. Busca textual
        if (q) {
          const matchesTitle = task.title.toLowerCase().includes(q);
          const matchesDesc = (task.description || "")
            .toLowerCase()
            .includes(q);
          if (!matchesTitle && !matchesDesc) return false;
        }

        const resolvedType = normalizeTaskType(task);

        // 2. Filtro por Tipo de Tarefa
        if (filters.taskType !== "all") {
          if (resolvedType.toUpperCase() !== filters.taskType) return false;
        }

        // 3. Filtro por Dificuldade
        if (filters.difficulty !== "all") {
          const normalizedTDiff = normalizeTaskDifficulty(task.difficulty);
          if (normalizedTDiff !== filters.difficulty) return false;
        }

        // 4. Filtro por Prioridade
        if (filters.priority !== "all") {
          const taskPriority = (task.priority || "NONE").toUpperCase();
          const filterPriority = filters.priority.toUpperCase();
          if (taskPriority !== filterPriority) return false;
        }

        // 5. Filtro por Status
        if (filters.status === "completed" && !task.completed) return false;
        if (filters.status === "pending" && task.completed) return false;

        // 6. Filtro por Tag (suporta tags hierárquicas: selecionar pai casa filhos)
        if (filters.tag && !doesTaskMatchTagFilter(task, filters.tag)) {
          return false;
        }

        return true;
      });

      if (nextTasks.length === col.tasks.length) {
        return col;
      }

      return {
        ...col,
        tasks: nextTasks,
      };
    });
  }, [columns, deferredSearchQuery, filters]);

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    availableTags,
    filteredColumns,
  };
}
