"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteBoardColumn,
  moveBoardColumnToWorkspace,
  updateBoardColumnOrder,
} from "@/actions/boardColumnActions";
import {
  MAX_COLUMNS_PREMIUM,
  MAX_VISIBLE_COLUMNS,
  resolveVisibleColumnIds,
} from "@/constants/routine";
import {
  applyFocusRecordedToTask,
  useFocusTaskSync,
} from "@/hooks/useFocusTaskSync";
import type { BoardColumn } from "@/types/task";
import type { ColumnInsertTarget } from "@/types/task-ui";

function persistVisibleColumnsForWorkspace(
  targetWorkspaceId: string | null | undefined,
  ids: string[],
) {
  if (!targetWorkspaceId) return;
  try {
    localStorage.setItem(
      `habitparty_visible_columns_${targetWorkspaceId}`,
      JSON.stringify(ids),
    );
  } catch {
    // localStorage indisponível ou bloqueado
  }
  try {
    // biome-ignore lint/suspicious/noDocumentCookie: Persiste colunas visíveis por workspace no cliente
    document.cookie = `hp_visible_cols_${targetWorkspaceId}=${encodeURIComponent(
      JSON.stringify(ids),
    )}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // falha silenciosa em ambientes restritos
  }
}

function appendVisibleColumnIfSpaceAllows(
  targetWorkspaceId: string,
  columnId: string,
  maxAllowed: number,
) {
  try {
    const raw = localStorage.getItem(
      `habitparty_visible_columns_${targetWorkspaceId}`,
    );
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      !parsed.includes(columnId) &&
      parsed.length < maxAllowed
    ) {
      persistVisibleColumnsForWorkspace(targetWorkspaceId, [
        ...parsed,
        columnId,
      ]);
    }
  } catch {
    // localStorage indisponível ou inválido
  }
}

/**
 * Estado do quadro de rotina: colunas, visibilidade e mutações de colunas.
 * - Usuários Free: até MAX_VISIBLE_COLUMNS (4) colunas ativas.
 * - Usuários Premium: até MAX_COLUMNS_PREMIUM (6) colunas ativas simultaneamente com scroll horizontal.
 */
export function useRoutineColumns(
  initialColumns: BoardColumn[],
  isPremium = false,
  workspaceId?: string | null,
  initialVisibleColumnIds?: string[],
  targetColumnId?: string,
) {
  const t = useTranslations("tasks.hooks");
  const [, startTransition] = useTransition();
  const [columns, setColumns] = useState<BoardColumn[]>(initialColumns);
  const [isDeletingColumn, setIsDeletingColumn] = useState(false);
  const maxAllowed = isPremium ? MAX_COLUMNS_PREMIUM : MAX_VISIBLE_COLUMNS;

  const storageKey = workspaceId
    ? `habitparty_visible_columns_${workspaceId}`
    : null;

  // 1. Inicializa o estado com a preferência do Cookie (se vinda do SSR) ou com o padrão das primeiras colunas
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(() =>
    resolveVisibleColumnIds(
      initialColumns.map((c) => c.id),
      initialVisibleColumnIds,
      maxAllowed,
      targetColumnId,
    ),
  );

  const columnsRef = useRef(columns);
  columnsRef.current = columns;

  const visibleColumnIdsRef = useRef(visibleColumnIds);
  visibleColumnIdsRef.current = visibleColumnIds;

  const persistVisibleColumns = useCallback(
    (ids: string[]) => {
      persistVisibleColumnsForWorkspace(workspaceId, ids);
    },
    [workspaceId],
  );

  // 2. Carrega preferências do localStorage no mount como fallback se o cookie ainda não existia
  useEffect(() => {
    if (!storageKey) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const allIds = initialColumns.map((c) => c.id);
          const resolved = resolveVisibleColumnIds(
            allIds,
            parsed,
            maxAllowed,
            targetColumnId,
          );
          if (resolved.length > 0) {
            setVisibleColumnIds(resolved);
            persistVisibleColumns(resolved);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [
    storageKey,
    maxAllowed,
    initialColumns,
    targetColumnId,
    persistVisibleColumns,
  ]);

  // 3. Sempre que houver ou mudar o targetColumnId (ex: navegação vinda do Dashboard),
  // garante que a coluna esteja visível imediatamente no quadro
  useEffect(() => {
    if (!targetColumnId) return;
    const allIds = initialColumns.map((c) => c.id);
    if (!allIds.includes(targetColumnId)) return;

    setVisibleColumnIds((prev) => {
      if (prev.includes(targetColumnId)) return prev;
      const next = resolveVisibleColumnIds(
        allIds,
        prev,
        maxAllowed,
        targetColumnId,
      );
      persistVisibleColumns(next);
      return next;
    });
  }, [targetColumnId, initialColumns, maxAllowed, persistVisibleColumns]);

  // Sincroniza colunas mantendo tarefas otimistas
  useEffect(() => {
    setColumns((current) =>
      initialColumns.map((newCol) => {
        const currentCol = current.find((c) => c.id === newCol.id);
        if (!currentCol) return newCol;

        const optimisticTasks = currentCol.tasks.filter((t) =>
          t.id.startsWith("temp-"),
        );
        if (optimisticTasks.length > 0) {
          const serverTaskIds = new Set(newCol.tasks.map((t) => t.id));
          const unsaved = optimisticTasks.filter(
            (t) => !serverTaskIds.has(t.id),
          );
          return {
            ...newCol,
            tasks: [...newCol.tasks, ...unsaved],
          };
        }

        return newCol;
      }),
    );
  }, [initialColumns]);

  // Atualiza métricas de foco e conclusão em tempo real quando sessões finalizam no SidebarFocusWidget
  useFocusTaskSync({
    onFocusRecorded: (taskId, durationMinutes, cycles) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) =>
            t.id === taskId
              ? applyFocusRecordedToTask(t, durationMinutes, cycles)
              : t,
          ),
        })),
      );
    },
    onTaskCompleted: (taskId, transformTask) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) => (t.id === taskId ? transformTask(t) : t)),
        })),
      );
    },
  });

  const maxColumns = maxAllowed;
  const canCreateColumn = columns.length < maxColumns;

  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      const prev = visibleColumnIdsRef.current;
      let next: string[];
      let reachedLimit = false;

      if (prev.includes(columnId)) {
        next = prev.length > 1 ? prev.filter((id) => id !== columnId) : prev;
      } else if (prev.length < maxAllowed) {
        next = [...prev, columnId];
      } else {
        next = [...prev.slice(0, maxAllowed - 1), columnId];
        reachedLimit = !isPremium;
      }

      setVisibleColumnIds(next);
      visibleColumnIdsRef.current = next;
      persistVisibleColumns(next);

      if (reachedLimit) {
        toast.info(t("freeColumnLimitToast", { max: maxAllowed }));
      }
    },
    [maxAllowed, isPremium, persistVisibleColumns, t],
  );

  const showAllColumns = useCallback(() => {
    const next = columnsRef.current.slice(0, maxAllowed).map((c) => c.id);
    setVisibleColumnIds(next);
    visibleColumnIdsRef.current = next;
    persistVisibleColumns(next);
  }, [maxAllowed, persistVisibleColumns]);

  const ensureColumnVisible = useCallback(
    (columnId: string) => {
      const prev = visibleColumnIdsRef.current;
      if (prev.includes(columnId)) return;
      const next =
        prev.length < maxAllowed
          ? [...prev, columnId]
          : [...prev.slice(0, maxAllowed - 1), columnId];
      setVisibleColumnIds(next);
      visibleColumnIdsRef.current = next;
      persistVisibleColumns(next);
    },
    [maxAllowed, persistVisibleColumns],
  );

  const handleColumnSaved = useCallback(
    (
      savedCol: BoardColumn,
      isEdit?: boolean,
      insertTarget?: ColumnInsertTarget | null,
    ) => {
      if (isEdit) {
        setColumns((prev) => {
          const next = prev.map((c) =>
            c.id === savedCol.id
              ? { ...c, title: savedCol.title, icon: savedCol.icon }
              : c,
          );
          columnsRef.current = next;
          return next;
        });
      } else if (insertTarget) {
        const currentCols = columnsRef.current;
        const refIdx = currentCols.findIndex(
          (c) => c.id === insertTarget.referenceColumnId,
        );
        let nextCols: BoardColumn[];
        if (refIdx < 0) {
          nextCols = [...currentCols, savedCol];
        } else {
          const insertIdx =
            insertTarget.position === "left" ? refIdx : refIdx + 1;
          nextCols = [
            ...currentCols.slice(0, insertIdx),
            savedCol,
            ...currentCols.slice(insertIdx),
          ].map((c, idx) => ({ ...c, order: idx }));
        }

        setColumns(nextCols);
        columnsRef.current = nextCols;

        if (workspaceId) {
          const payload = nextCols.map((c, idx) => ({
            board_column_id: c.id,
            newIndex: idx,
          }));
          startTransition(async () => {
            const res = await updateBoardColumnOrder(workspaceId, payload);
            if (!res?.success) {
              toast.error(res?.error || t("reorderColumnsError"));
            }
          });
        }

        const currentVis = visibleColumnIdsRef.current;
        if (!currentVis.includes(savedCol.id)) {
          const visRefIdx = currentVis.indexOf(insertTarget.referenceColumnId);
          let nextVis: string[];
          if (visRefIdx >= 0) {
            const visInsertIdx =
              insertTarget.position === "left" ? visRefIdx : visRefIdx + 1;
            const withInserted = [
              ...currentVis.slice(0, visInsertIdx),
              savedCol.id,
              ...currentVis.slice(visInsertIdx),
            ];
            nextVis = withInserted.slice(0, maxAllowed);
          } else {
            nextVis =
              currentVis.length < maxAllowed
                ? [...currentVis, savedCol.id]
                : [...currentVis.slice(0, maxAllowed - 1), savedCol.id];
          }
          setVisibleColumnIds(nextVis);
          visibleColumnIdsRef.current = nextVis;
          persistVisibleColumns(nextVis);
        }
      } else {
        setColumns((prev) => {
          const next = [...prev, savedCol];
          columnsRef.current = next;
          return next;
        });
        if (visibleColumnIdsRef.current.length < maxAllowed) {
          toggleColumnVisibility(savedCol.id);
        }
      }
    },
    [maxAllowed, toggleColumnVisibility, workspaceId, persistVisibleColumns, t],
  );

  const handleDeleteColumn = useCallback(
    async (column: BoardColumn) => {
      setIsDeletingColumn(true);
      try {
        const res = await deleteBoardColumn(column.id);
        if (!res.success) {
          toast.error(res.error || t("deleteColumnServerError"));
          return false;
        }

        setColumns((prev) => {
          const next = prev.filter((c) => c.id !== column.id);
          columnsRef.current = next;
          return next;
        });
        if (visibleColumnIdsRef.current.includes(column.id)) {
          toggleColumnVisibility(column.id);
        }

        toast.success(t("deleteColumnSuccess", { title: column.title }));
        return true;
      } catch (_error) {
        toast.error(t("deleteColumnUnexpectedError"));
        return false;
      } finally {
        setIsDeletingColumn(false);
      }
    },
    [toggleColumnVisibility, t],
  );

  const handleColumnReorder = useCallback(
    (reorderedColumns: BoardColumn[], previousColumns?: BoardColumn[]) => {
      if (!workspaceId) return;

      const payload = reorderedColumns.map((c, idx) => ({
        board_column_id: c.id,
        newIndex: idx,
      }));

      startTransition(async () => {
        const res = await updateBoardColumnOrder(workspaceId, payload);
        if (!res.success) {
          if (previousColumns) {
            columnsRef.current = previousColumns;
            setColumns(previousColumns);
          }
          toast.error(res.error || t("reorderColumnsError"));
        }
      });
    },
    [workspaceId, t],
  );

  const handleMoveColumnToWorkspace = useCallback(
    async (
      column: BoardColumn,
      targetWorkspaceId: string,
      targetWorkspaceName?: string,
    ) => {
      try {
        const res = await moveBoardColumnToWorkspace(column.id, {
          targetWorkspaceId,
        });
        if (!res.success) {
          toast.error(res.error || t("moveColumnError"));
          return false;
        }

        const remainingColumns = columnsRef.current.filter(
          (c) => c.id !== column.id,
        );
        setColumns(remainingColumns);
        columnsRef.current = remainingColumns;

        if (visibleColumnIdsRef.current.includes(column.id)) {
          let nextVisible = visibleColumnIdsRef.current.filter(
            (id) => id !== column.id,
          );
          if (nextVisible.length === 0 && remainingColumns.length > 0) {
            nextVisible = [remainingColumns[0].id];
          }
          setVisibleColumnIds(nextVisible);
          visibleColumnIdsRef.current = nextVisible;
          persistVisibleColumns(nextVisible);
        }

        appendVisibleColumnIfSpaceAllows(
          targetWorkspaceId,
          column.id,
          maxAllowed,
        );

        toast.success(
          t("moveColumnSuccess", {
            title: column.title,
            workspace: targetWorkspaceName || t("defaultWorkspaceName"),
          }),
        );
        return true;
      } catch (_error) {
        toast.error(t("moveColumnUnexpectedError"));
        return false;
      }
    },
    [maxAllowed, persistVisibleColumns, t],
  );

  return {
    columns,
    setColumns,
    visibleColumnIds,
    setVisibleColumnIds,
    toggleColumnVisibility,
    showAllColumns,
    ensureColumnVisible,
    canCreateColumn,
    maxColumns,
    handleColumnSaved,
    handleDeleteColumn,
    isDeletingColumn,
    handleMoveColumnToWorkspace,
    handleColumnReorder,
  };
}
