"use client";

import { useTranslations } from "next-intl";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
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
import { normalizeTaskType } from "@/constants/task";
import {
  applyFocusRecordedToTask,
  useFocusTaskSync,
} from "@/hooks/useFocusTaskSync";
import { useIsomorphicLayoutEffect } from "@/hooks/useIsomorphicLayoutEffect";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import type { BoardColumn, Task } from "@/types/task";
import type { ColumnInsertTarget } from "@/types/task-ui";
import {
  appendVisibleColumnIfSpaceAllows,
  persistVisibleColumnsClient,
  readVisibleColumnsStorage,
} from "@/utils/columnVisibility";
import { mapTaskInColumns } from "@/utils/taskMapper";

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
  onFocusTaskSynced?: (taskId: string, updater: (task: Task) => Task) => void,
) {
  const t = useTranslations("tasks.hooks");
  const [columns, setColumns] = useState<BoardColumn[]>(initialColumns);
  const [isDeletingColumn, setIsDeletingColumn] = useState(false);
  const maxAllowed = isPremium ? MAX_COLUMNS_PREMIUM : MAX_VISIBLE_COLUMNS;
  const onFocusTaskSyncedRef = useRef(onFocusTaskSynced);
  const reorderChainRef = useRef<Promise<void>>(Promise.resolve());
  const reorderSeqRef = useRef(0);

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
  const visibleColumnIdsRef = useRef(visibleColumnIds);

  useIsomorphicLayoutEffect(() => {
    onFocusTaskSyncedRef.current = onFocusTaskSynced;
    columnsRef.current = columns;
    visibleColumnIdsRef.current = visibleColumnIds;
  }, [onFocusTaskSynced, columns, visibleColumnIds]);

  const loadedArchivedTaskIdsRef = useRef<Set<string>>(new Set());
  const consumedTargetColumnIdRef = useRef<string | undefined>(targetColumnId);
  const isDeletingColumnRef = useRef(false);
  const movingColumnIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    void workspaceId;
    loadedArchivedTaskIdsRef.current.clear();
  }, [workspaceId]);

  const registerLoadedArchivedTasks = useCallback((tasks: Task[]) => {
    for (const task of tasks) {
      loadedArchivedTaskIdsRef.current.add(task.id);
    }
  }, []);

  const unregisterLoadedArchivedTask = useCallback((taskId: string) => {
    loadedArchivedTaskIdsRef.current.delete(taskId);
  }, []);

  const persistVisibleColumns = useCallback(
    (ids: string[]) => {
      persistVisibleColumnsClient(workspaceId, ids);
    },
    [workspaceId],
  );

  // 2. Carrega preferências do localStorage apenas ao montar/trocar workspace ou limite
  // (sem reescrever localStorage + cookie a cada refresh de initialColumns).
  const initialColumnIdsKey = initialColumns.map((c) => c.id).join(",");

  useEffect(() => {
    const stored = readVisibleColumnsStorage(workspaceId);
    if (!stored || stored.length === 0) return;

    const allIds = initialColumnIdsKey ? initialColumnIdsKey.split(",") : [];
    const activeTargetForSync =
      targetColumnId && consumedTargetColumnIdRef.current !== targetColumnId
        ? targetColumnId
        : undefined;
    const resolved = resolveVisibleColumnIds(
      allIds,
      stored,
      maxAllowed,
      activeTargetForSync,
    );
    if (resolved.length === 0) return;

    const current = visibleColumnIdsRef.current;
    const isSame =
      current.length === resolved.length &&
      current.every((id, index) => id === resolved[index]);
    if (!isSame) {
      setVisibleColumnIds(resolved);
      visibleColumnIdsRef.current = resolved;
      persistVisibleColumns(resolved);
    }
  }, [
    workspaceId,
    maxAllowed,
    initialColumnIdsKey,
    targetColumnId,
    persistVisibleColumns,
  ]);

  // 3. Sempre que houver um NOVO targetColumnId (ex: navegação vinda do Dashboard),
  // garante que a coluna esteja visível imediatamente — sem re-exibir colunas já ocultadas pelo usuário
  useEffect(() => {
    if (!targetColumnId) {
      consumedTargetColumnIdRef.current = undefined;
      return;
    }
    if (consumedTargetColumnIdRef.current === targetColumnId) return;
    const allIds = initialColumnIdsKey ? initialColumnIdsKey.split(",") : [];
    if (!allIds.includes(targetColumnId)) return;

    consumedTargetColumnIdRef.current = targetColumnId;
    setVisibleColumnIds((prev) => {
      if (prev.includes(targetColumnId)) return prev;
      const next = resolveVisibleColumnIds(
        allIds,
        prev,
        maxAllowed,
        targetColumnId,
      );
      visibleColumnIdsRef.current = next;
      persistVisibleColumns(next);
      return next;
    });
  }, [targetColumnId, initialColumnIdsKey, maxAllowed, persistVisibleColumns]);

  // Sincroniza colunas mantendo tarefas otimistas e arquivadas carregadas sob demanda
  useEffect(() => {
    const serverTaskIds = new Set(
      initialColumns.flatMap((col) => col.tasks.map((t) => t.id)),
    );
    for (const id of serverTaskIds) {
      loadedArchivedTaskIdsRef.current.delete(id);
    }

    setColumns((current) => {
      const preservedArchivedByCol = new Map<string, Task[]>();
      if (loadedArchivedTaskIdsRef.current.size > 0) {
        for (const currentCol of current) {
          for (const task of currentCol.tasks) {
            if (
              loadedArchivedTaskIdsRef.current.has(task.id) &&
              !serverTaskIds.has(task.id)
            ) {
              const list = preservedArchivedByCol.get(currentCol.id) ?? [];
              list.push(
                task.columnId === currentCol.id
                  ? task
                  : { ...task, columnId: currentCol.id },
              );
              preservedArchivedByCol.set(currentCol.id, list);
            }
          }
        }
      }

      return initialColumns.map((newCol) => {
        const currentCol = current.find((c) => c.id === newCol.id);
        const optimisticTasks =
          currentCol?.tasks.filter(
            (t) => t.id.startsWith("temp-") && !serverTaskIds.has(t.id),
          ) ?? [];
        const preservedArchived = preservedArchivedByCol.get(newCol.id) ?? [];

        if (optimisticTasks.length === 0 && preservedArchived.length === 0) {
          return newCol;
        }

        const completedArchivedPreserved = preservedArchived.filter(
          (t) => normalizeTaskType(t) === "todo" && t.completed,
        ).length;

        return {
          ...newCol,
          tasks: [...newCol.tasks, ...optimisticTasks, ...preservedArchived],
          archivedTotalCount: Math.max(
            0,
            (newCol.archivedTotalCount ?? 0) - completedArchivedPreserved,
          ),
          archivedCompletedCount: Math.max(
            0,
            (newCol.archivedCompletedCount ?? 0) - completedArchivedPreserved,
          ),
        };
      });
    });
  }, [initialColumns]);

  // Atualiza métricas de foco e conclusão em tempo real quando sessões finalizam no SidebarFocusWidget
  useFocusTaskSync({
    onFocusRecorded: (taskId, durationMinutes, cycles) => {
      const updater = (t: Task) =>
        applyFocusRecordedToTask(t, durationMinutes, cycles);
      setColumns((prev) => mapTaskInColumns(prev, taskId, updater));
      onFocusTaskSyncedRef.current?.(taskId, updater);
    },
    onTaskCompleted: (taskId, transformTask) => {
      setColumns((prev) => mapTaskInColumns(prev, taskId, transformTask));
      onFocusTaskSyncedRef.current?.(taskId, transformTask);
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
      if (!columnsRef.current.some((c) => c.id === columnId)) return;
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
          const fallbackCols = [...currentCols, savedCol];
          startTransition(async () => {
            const res = await updateBoardColumnOrder(workspaceId, payload);
            if (!res?.success) {
              setColumns(fallbackCols);
              columnsRef.current = fallbackCols;
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

  const removeColumnFromVisible = useCallback(
    (columnId: string, remainingColumns: BoardColumn[]) => {
      const remainingIds = remainingColumns.map((c) => c.id);
      const filtered = visibleColumnIdsRef.current.filter(
        (id) => id !== columnId && remainingIds.includes(id),
      );

      // Backfill: se ainda existem colunas ocultas e sobrou vaga até maxAllowed (ex: Free rebaixado 6→5), promove a próxima
      const nextVisible = [...filtered];
      const targetVisibleCount = Math.min(remainingIds.length, maxAllowed);
      if (nextVisible.length < targetVisibleCount) {
        for (const candidateId of remainingIds) {
          if (nextVisible.length >= targetVisibleCount) break;
          if (!nextVisible.includes(candidateId)) {
            nextVisible.push(candidateId);
          }
        }
      }

      persistVisibleColumns(nextVisible);
      setVisibleColumnIds(nextVisible);
      visibleColumnIdsRef.current = nextVisible;
    },
    [maxAllowed, persistVisibleColumns],
  );

  const handleDeleteColumn = useCallback(
    async (column: BoardColumn) => {
      if (isDeletingColumnRef.current) return false;
      isDeletingColumnRef.current = true;
      setIsDeletingColumn(true);
      try {
        const res = await deleteBoardColumn(column.id);
        if (!res.success) {
          toast.error(res.error || t("deleteColumnServerError"));
          return false;
        }

        const focusStore = useFocusTimerStore.getState();
        for (const task of column.tasks) {
          loadedArchivedTaskIdsRef.current.delete(task.id);
          focusStore.handleExternalTaskRemovedOrCompleted(task.id);
        }

        const remainingColumns = columnsRef.current.filter(
          (c) => c.id !== column.id,
        );
        setColumns(remainingColumns);
        columnsRef.current = remainingColumns;

        removeColumnFromVisible(column.id, remainingColumns);

        toast.success(t("deleteColumnSuccess", { title: column.title }));
        return true;
      } catch (_error) {
        toast.error(t("deleteColumnUnexpectedError"));
        return false;
      } finally {
        isDeletingColumnRef.current = false;
        setIsDeletingColumn(false);
      }
    },
    [removeColumnFromVisible, t],
  );

  const handleColumnReorder = useCallback(
    (reorderedColumns: BoardColumn[], previousColumns?: BoardColumn[]) => {
      if (!workspaceId) return;

      const payload = reorderedColumns.map((c, idx) => ({
        board_column_id: c.id,
        newIndex: idx,
      }));

      const reorderSeq = ++reorderSeqRef.current;
      reorderChainRef.current = reorderChainRef.current
        .then(async () => {
          const res = await updateBoardColumnOrder(workspaceId, payload);
          if (!res.success) {
            if (previousColumns && reorderSeq === reorderSeqRef.current) {
              startTransition(() => {
                columnsRef.current = previousColumns;
                setColumns(previousColumns);
              });
            }
            toast.error(res.error || t("reorderColumnsError"));
          }
        })
        .catch(() => {
          toast.error(t("reorderColumnsError"));
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
      if (movingColumnIdsRef.current.has(column.id)) return false;
      movingColumnIdsRef.current.add(column.id);
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

        removeColumnFromVisible(column.id, remainingColumns);

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
      } finally {
        movingColumnIdsRef.current.delete(column.id);
      }
    },
    [maxAllowed, removeColumnFromVisible, t],
  );

  return {
    columns,
    setColumns,
    registerLoadedArchivedTasks,
    unregisterLoadedArchivedTask,
    visibleColumnIds,
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
