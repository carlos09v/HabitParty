"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
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

  const maxColumns = maxAllowed;
  const canCreateColumn = columns.length < maxColumns;

  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      setVisibleColumnIds((prev) => {
        let next: string[];
        if (prev.includes(columnId)) {
          next = prev.length > 1 ? prev.filter((id) => id !== columnId) : prev;
        } else if (prev.length < maxAllowed) {
          next = [...prev, columnId];
        } else {
          next = [...prev.slice(0, maxAllowed - 1), columnId];
          if (!isPremium) {
            toast.info(
              `Limite de ${maxAllowed} colunas ativas (Plano Free). Uma coluna foi ocultada do quadro para exibir esta.`,
            );
          }
        }

        persistVisibleColumns(next);
        return next;
      });
    },
    [maxAllowed, isPremium, persistVisibleColumns],
  );

  const showAllColumns = useCallback(() => {
    const next = columns.slice(0, maxAllowed).map((c) => c.id);
    setVisibleColumnIds(next);
    persistVisibleColumns(next);
  }, [columns, maxAllowed, persistVisibleColumns]);

  const ensureColumnVisible = useCallback(
    (columnId: string) => {
      setVisibleColumnIds((prev) => {
        if (prev.includes(columnId)) return prev;
        const next =
          prev.length < maxAllowed
            ? [...prev, columnId]
            : [...prev.slice(0, maxAllowed - 1), columnId];
        persistVisibleColumns(next);
        return next;
      });
    },
    [maxAllowed, persistVisibleColumns],
  );

  const handleColumnSaved = useCallback(
    (savedCol: BoardColumn, isEdit?: boolean) => {
      if (isEdit) {
        setColumns((prev) =>
          prev.map((c) =>
            c.id === savedCol.id
              ? { ...c, title: savedCol.title, icon: savedCol.icon }
              : c,
          ),
        );
      } else {
        setColumns((prev) => [...prev, savedCol]);
        if (visibleColumnIds.length < maxAllowed) {
          toggleColumnVisibility(savedCol.id);
        }
      }
    },
    [visibleColumnIds.length, maxAllowed, toggleColumnVisibility],
  );

  const handleDeleteColumn = useCallback(
    async (column: BoardColumn) => {
      setIsDeletingColumn(true);
      try {
        const res = await deleteBoardColumn(column.id);
        if (!res.success) {
          toast.error(res.error || "Erro ao excluir coluna no servidor.");
          return false;
        }

        setColumns((prev) => prev.filter((c) => c.id !== column.id));
        if (visibleColumnIds.includes(column.id)) {
          toggleColumnVisibility(column.id);
        }

        toast.success(`Coluna "${column.title}" excluída com sucesso!`);
        return true;
      } catch (_error) {
        toast.error("Erro inesperado ao excluir coluna.");
        return false;
      } finally {
        setIsDeletingColumn(false);
      }
    },
    [visibleColumnIds, toggleColumnVisibility],
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
          toast.error(
            res.error || "Erro ao salvar ordem das colunas no servidor.",
          );
        }
      });
    },
    [workspaceId],
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
