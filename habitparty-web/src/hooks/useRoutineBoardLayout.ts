"use client";

import { useCallback, useEffect, useState } from "react";
import { COLUMN_WIDTH_CLASSES } from "@/constants/routine";
import type { BoardAlignment, ColumnWidthPreset } from "@/types/task-ui";

export interface UseRoutineBoardLayoutOptions {
  workspaceId?: string | null;
  defaultAlignment?: BoardAlignment;
}

export function useRoutineBoardLayout({
  workspaceId,
  defaultAlignment = "left",
}: UseRoutineBoardLayoutOptions = {}) {
  const storageKey = workspaceId
    ? `habitparty_board_layout_${workspaceId}`
    : "habitparty_board_layout_default";

  const [alignment, setAlignmentState] =
    useState<BoardAlignment>(defaultAlignment);
  const [columnWidths, setColumnWidths] = useState<
    Record<string, ColumnWidthPreset>
  >({});

  // 1. Carrega preferências salvas no localStorage
  useEffect(() => {
    if (!storageKey) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          if (
            parsed.alignment === "left" ||
            parsed.alignment === "center" ||
            parsed.alignment === "right"
          ) {
            setAlignmentState(parsed.alignment);
          }
          if (parsed.columnWidths && typeof parsed.columnWidths === "object") {
            setColumnWidths(parsed.columnWidths);
          }
        }
      }
    } catch {
      // Falha silenciosa em caso de indisponibilidade do localStorage
    }
  }, [storageKey]);

  // 2. Persistência auxiliar
  const persistLayout = useCallback(
    (
      newAlignment: BoardAlignment,
      newWidths: Record<string, ColumnWidthPreset>,
    ) => {
      if (!storageKey) return;
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            alignment: newAlignment,
            columnWidths: newWidths,
          }),
        );
      } catch {
        // Falha silenciosa
      }
    },
    [storageKey],
  );

  const setAlignment = useCallback(
    (newAlignment: BoardAlignment) => {
      setAlignmentState(newAlignment);
      persistLayout(newAlignment, columnWidths);
    },
    [columnWidths, persistLayout],
  );

  const setColumnWidth = useCallback(
    (columnId: string, width: ColumnWidthPreset) => {
      setColumnWidths((prev) => {
        const next = { ...prev, [columnId]: width };
        persistLayout(alignment, next);
        return next;
      });
    },
    [alignment, persistLayout],
  );

  const getColumnWidth = useCallback(
    (columnId: string): ColumnWidthPreset => {
      return columnWidths[columnId] || "normal";
    },
    [columnWidths],
  );

  const getColumnWidthClass = useCallback(
    (columnId: string): string => {
      const preset = columnWidths[columnId] || "normal";
      return COLUMN_WIDTH_CLASSES[preset];
    },
    [columnWidths],
  );

  return {
    alignment,
    setAlignment,
    columnWidths,
    setColumnWidth,
    getColumnWidth,
    getColumnWidthClass,
  };
}
