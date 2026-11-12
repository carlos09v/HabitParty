"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteBoardColumn,
  updateBoardColumnOrder,
} from "@/actions/boardColumnActions";
import {
  MAX_COLUMNS_PREMIUM,
  MAX_VISIBLE_COLUMNS,
  resolveVisibleColumnIds,
} from "@/constants/routine";
import type { BoardColumn } from "@/types/task";
import type { ColumnInsertTarget } from "@/types/task-ui";

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

  // Função dedicada para persistir somente sob ações do usuário
  const persistVisibleColumns = useCallback(
    (ids: string[]) => {
      if (storageKey) {
        try {
          localStorage.setItem(storageKey, JSON.stringify(ids));
        } catch {
          // localStorage indisponível ou bloqueado
        }
      }

      if (workspaceId) {
        try {
          // biome-ignore lint/suspicious/noDocumentCookie: Persiste colunas visíveis por workspace no cliente
          document.cookie = `hp_visible_cols_${workspaceId}=${encodeURIComponent(
            JSON.stringify(ids),
          )}; path=/; max-age=31536000; SameSite=Lax`;
        } catch {
          // falha silenciosa em ambientes restritos
        }
      }
    },
    [storageKey, workspaceId],
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
  useEffect(() => {
    const handleFocusRecorded = (event: Event) => {
      const detail = (
        event as CustomEvent<{
          taskId?: string;
          durationMinutes?: number;
          cycles?: number;
        }>
      ).detail;
      if (!detail?.taskId) return;
      const mins = detail.durationMinutes ?? 0;
      const cyc = detail.cycles ?? 0;
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) =>
            t.id === detail.taskId
              ? {
                  ...t,
                  totalFocusMinutes: (t.totalFocusMinutes ?? 0) + mins,
                  focusCyclesCount: (t.focusCyclesCount ?? 0) + cyc,
                }
              : t,
          ),
        })),
      );
    };

    const handleTaskCompleted = (event: Event) => {
      const detail = (event as CustomEvent<{ taskId?: string }>).detail;
      if (!detail?.taskId) return;
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) =>
            t.id === detail.taskId
              ? { ...t, completed: true, hasClaimedReward: true }
              : t,
          ),
        })),
      );
    };

    window.addEventListener(
      "habitparty:task-focus-recorded",
      handleFocusRecorded,
    );
    window.addEventListener(
      "habitparty:task-completed-from-focus",
      handleTaskCompleted,
    );
    return () => {
      window.removeEventListener(
        "habitparty:task-focus-recorded",
        handleFocusRecorded,
      );
      window.removeEventListener(
        "habitparty:task-completed-from-focus",
        handleTaskCompleted,
      );
    };
  }, []);

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
    (reorderedColumns: BoardColumn[]) => {
      if (!workspaceId) return;

      const payload = reorderedColumns.map((c, idx) => ({
        board_column_id: c.id,
        newIndex: idx,
      }));

      startTransition(async () => {
        const res = await updateBoardColumnOrder(workspaceId, payload);
        if (!res.success) {
          toast.error(res.error || t("reorderColumnsError"));
        }
      });
    },
    [workspaceId, t],
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
    handleColumnReorder,
  };
}
