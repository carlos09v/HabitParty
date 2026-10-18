"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  DEFAULT_BOARD_FILTERS,
  normalizeTaskDifficulty,
  normalizeTaskType,
} from "@/constants/task";
import type { BoardColumn, BoardFilterState } from "@/types/task";

/**
 * Hook dedicado ao controle de busca, filtros de tags, tipos, dificuldade, status e Modo Foco no Kanban.
 * Utiliza useDeferredValue para garantir digitação suave a 60/120fps sem travar o thread principal.
 */
export function useBoardFilters(columns: BoardColumn[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [focusMode, setFocusMode] = useState(false);
  const [filters, setFilters] = useState<BoardFilterState>(
    DEFAULT_BOARD_FILTERS,
  );

  // Lista de tags únicas presentes nas tarefas atuais para o filtro
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const col of columns) {
      for (const task of col.tasks) {
        if (task.tags && Array.isArray(task.tags)) {
          for (const t of task.tags) {
            if (t?.trim()) tagSet.add(t.trim());
          }
        }
      }
    }
    return Array.from(tagSet);
  }, [columns]);

  // Colunas com tarefas filtradas aplicadas em memória
  const filteredColumns = useMemo(() => {
    const hasFilter =
      deferredSearchQuery.trim() !== "" ||
      focusMode ||
      filters.taskType !== "all" ||
      filters.difficulty !== "all" ||
      filters.priority !== "all" ||
      filters.status !== "all" ||
      filters.tag !== null;

    if (!hasFilter) return columns;

    const q = deferredSearchQuery.toLowerCase().trim();

    return columns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((task) => {
        // 1. Busca textual
        if (q) {
          const matchesTitle = task.title.toLowerCase().includes(q);
          const matchesDesc = (task.description || "")
            .toLowerCase()
            .includes(q);
          if (!matchesTitle && !matchesDesc) return false;
        }

        const resolvedType = normalizeTaskType(task);

        // 2. Modo Foco: oculta tarefas concluídas (exceto hábitos)
        if (focusMode && task.completed && resolvedType !== "habit") {
          return false;
        }

        // 3. Filtro por Tipo de Tarefa
        if (filters.taskType !== "all") {
          if (resolvedType.toUpperCase() !== filters.taskType) return false;
        }

        // 4. Filtro por Dificuldade
        if (filters.difficulty !== "all") {
          const normalizedTDiff = normalizeTaskDifficulty(task.difficulty);
          if (normalizedTDiff !== filters.difficulty) return false;
        }

        // 5. Filtro por Prioridade
        if (filters.priority !== "all") {
          const taskPriority = (task.priority || "NONE").toUpperCase();
          const filterPriority = filters.priority.toUpperCase();
          if (taskPriority !== filterPriority) return false;
        }

        // 6. Filtro por Status
        if (filters.status === "completed" && !task.completed) return false;
        if (filters.status === "pending" && task.completed) return false;

        // 6. Filtro por Tag
        if (filters.tag) {
          const hasTag =
            task.tags?.includes(filters.tag) ||
            (task.category && task.category === filters.tag);
          if (!hasTag) return false;
        }

        return true;
      }),
    }));
  }, [columns, deferredSearchQuery, focusMode, filters]);

  return {
    searchQuery,
    setSearchQuery,
    focusMode,
    setFocusMode,
    filters,
    setFilters,
    availableTags,
    filteredColumns,
  };
}
