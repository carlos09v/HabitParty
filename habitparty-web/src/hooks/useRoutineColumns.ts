"use client";

import { useState } from "react";
import { MAX_COLUMNS_PREMIUM, MAX_VISIBLE_COLUMNS } from "@/constants/routine";
import type { BoardColumn } from "@/types/task";

/**
 * Estado do quadro de rotina: colunas + quais estão visíveis.
 * Até `MAX_VISIBLE_COLUMNS` ocupam a tela; o restante fica no menu "Listas".
 */
export function useRoutineColumns(initialColumns: BoardColumn[]) {
  const [columns, setColumns] = useState<BoardColumn[]>(initialColumns);
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(() =>
    initialColumns.slice(0, MAX_VISIBLE_COLUMNS).map((c) => c.id),
  );

  const toggleColumnVisibility = (columnId: string) => {
    setVisibleColumnIds((prev) => {
      if (prev.includes(columnId)) {
        // Mantém ao menos uma coluna visível
        return prev.length > 1 ? prev.filter((id) => id !== columnId) : prev;
      }
      // Se já houver o máximo, substitui a última
      return prev.length < MAX_VISIBLE_COLUMNS
        ? [...prev, columnId]
        : [...prev.slice(0, MAX_VISIBLE_COLUMNS - 1), columnId];
    });
  };

  const canCreateColumn = columns.length < MAX_COLUMNS_PREMIUM;

  const createColumn = () => {
    if (!canCreateColumn) return;

    const id = `col-${crypto.randomUUID()}`;
    setColumns((prev) => [
      ...prev,
      {
        id,
        title: `Nova Lista ${prev.length + 1}`,
        order: prev.length,
        tasks: [],
      },
    ]);

    if (visibleColumnIds.length < MAX_VISIBLE_COLUMNS) {
      setVisibleColumnIds((prev) => [...prev, id]);
    }
  };

  return {
    columns,
    setColumns,
    visibleColumnIds,
    toggleColumnVisibility,
    createColumn,
    canCreateColumn,
  };
}
