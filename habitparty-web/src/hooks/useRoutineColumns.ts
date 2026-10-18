"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MAX_COLUMNS_PREMIUM, MAX_VISIBLE_COLUMNS } from "@/constants/routine";
import type { BoardColumn } from "@/types/task";

/**
 * Estado do quadro de rotina: colunas + quais estão visíveis.
 * - Usuários Free: até MAX_VISIBLE_COLUMNS (4) colunas ativas.
 * - Usuários Premium: até MAX_COLUMNS_PREMIUM (6) colunas ativas simultaneamente com scroll horizontal.
 *
 * Persistência dupla resiliente:
 * 1. Cookie (hp_visible_cols_${workspaceId}) para SSR sem hydration mismatch e sem layout shift.
 * 2. LocalStorage (habitparty_visible_columns_${workspaceId}) como fallback imediato no navegador.
 */
export function useRoutineColumns(
  initialColumns: BoardColumn[],
  isPremium = false,
  workspaceId?: string | null,
  initialVisibleColumnIds?: string[],
  targetColumnId?: string,
) {
  const [columns, setColumns] = useState<BoardColumn[]>(initialColumns);
  const maxAllowed = isPremium ? MAX_COLUMNS_PREMIUM : MAX_VISIBLE_COLUMNS;

  const storageKey = workspaceId
    ? `habitparty_visible_columns_${workspaceId}`
    : null;

  // 1. Inicializa o estado com a preferência do Cookie (se vinda do SSR) ou com o padrão das primeiras colunas
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(() => {
    let baseList: string[] = [];
    if (
      Array.isArray(initialVisibleColumnIds) &&
      initialVisibleColumnIds.length > 0
    ) {
      const valid = initialVisibleColumnIds.filter((id) =>
        initialColumns.some((c) => c.id === id),
      );
      if (valid.length > 0) {
        baseList = valid.slice(0, maxAllowed);
      }
    }
    if (baseList.length === 0) {
      baseList = initialColumns.slice(0, maxAllowed).map((c) => c.id);
    }

    // Se houver targetColumnId válido (ex: vindo do Dashboard), garante que ele está presente desde o início
    if (targetColumnId && initialColumns.some((c) => c.id === targetColumnId)) {
      if (!baseList.includes(targetColumnId)) {
        baseList =
          baseList.length < maxAllowed
            ? [...baseList, targetColumnId]
            : [...baseList.slice(0, maxAllowed - 1), targetColumnId];
      }
    }

    return baseList;
  });

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
          const valid = parsed.filter((id: string) =>
            initialColumns.some((c) => c.id === id),
          );
          if (valid.length > 0) {
            let resolved = valid.slice(0, maxAllowed);

            // Garante que targetColumnId não seja apagado pelo localStorage antigo
            if (
              targetColumnId &&
              initialColumns.some((c) => c.id === targetColumnId) &&
              !resolved.includes(targetColumnId)
            ) {
              resolved =
                resolved.length < maxAllowed
                  ? [...resolved, targetColumnId]
                  : [...resolved.slice(0, maxAllowed - 1), targetColumnId];
            }

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
    const isValid = initialColumns.some((c) => c.id === targetColumnId);
    if (!isValid) return;

    setVisibleColumnIds((prev) => {
      if (prev.includes(targetColumnId)) return prev;
      const next =
        prev.length < maxAllowed
          ? [...prev, targetColumnId]
          : [...prev.slice(0, maxAllowed - 1), targetColumnId];
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

  const createColumn = useCallback(() => {
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

    setVisibleColumnIds((prev) => {
      const next = prev.length < maxAllowed ? [...prev, id] : prev;
      persistVisibleColumns(next);
      return next;
    });
  }, [canCreateColumn, maxAllowed, persistVisibleColumns]);

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

  return {
    columns,
    setColumns,
    visibleColumnIds,
    setVisibleColumnIds,
    toggleColumnVisibility,
    showAllColumns,
    ensureColumnVisible,
    createColumn,
    canCreateColumn,
    maxColumns,
  };
}
