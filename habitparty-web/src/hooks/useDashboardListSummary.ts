"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  deleteBoardColumn,
  moveBoardColumnToWorkspace,
} from "@/actions/boardColumnActions";
import type { ColumnMoveWorkspaceOption } from "@/components/tasks/shared";
import { resolveDashboardVisibleColumnIds } from "@/constants/routine";
import { useContextMenu } from "@/hooks/useContextMenu";
import { useLatestRef } from "@/hooks/useLatestRef";
import { useUIStore } from "@/store/uiStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type {
  DashboardColumnOption,
  DashboardListSummaryProps,
} from "@/types/dashboard";
import type { BoardColumn } from "@/types/task";
import {
  appendVisibleColumnIfSpaceAllows,
  readVisibleColumnsStorage,
  removeVisibleColumnIfPresent,
} from "@/utils/columnVisibility";
import { isTaskConsideredDone } from "@/utils/taskMapper";

export function useDashboardListSummary({
  initialVisibleColumnIds,
  columns,
  onColumnsChange: setColumns,
  onColumnDeleted,
  workspaces = [],
  onColumnMoved,
  createColumnTrigger = 0,
  maxColumns,
  activeWorkspaceId,
  isReadOnly = false,
  isPremium = false,
  tasks,
}: Pick<
  DashboardListSummaryProps,
  | "initialVisibleColumnIds"
  | "columns"
  | "onColumnsChange"
  | "onColumnDeleted"
  | "workspaces"
  | "onColumnMoved"
  | "createColumnTrigger"
  | "maxColumns"
  | "activeWorkspaceId"
  | "isReadOnly"
  | "isPremium"
  | "tasks"
>) {
  const t = useTranslations("dashboard.listSummary");

  const [savedVisibleIds, setSavedVisibleIds] = useState<string[] | null>(
    () => initialVisibleColumnIds ?? null,
  );

  useEffect(() => {
    if (!activeWorkspaceId) {
      setSavedVisibleIds(initialVisibleColumnIds ?? null);
      return;
    }
    const stored = readVisibleColumnsStorage(activeWorkspaceId);
    if (stored) {
      setSavedVisibleIds(stored);
      return;
    }
    setSavedVisibleIds(initialVisibleColumnIds ?? null);
  }, [activeWorkspaceId, initialVisibleColumnIds]);

  const activeColumns = useMemo(() => {
    if (columns.length <= maxColumns) {
      return columns;
    }
    const activeIds = new Set(
      resolveDashboardVisibleColumnIds(columns, savedVisibleIds, maxColumns),
    );
    const filtered = columns.filter((c) => c.id && activeIds.has(c.id));
    return filtered.length > 0
      ? filtered.slice(0, maxColumns)
      : columns.slice(0, maxColumns);
  }, [columns, maxColumns, savedVisibleIds]);

  const surplusCount = !isPremium
    ? Math.max(0, columns.length - maxColumns)
    : 0;
  const isLimitReached = columns.length >= maxColumns;

  // Pré-computa contadores por coluna em uma única passagem O(T) usando critério unificado (inclui hábitos positivos)
  const columnCountsMap = useMemo(() => {
    if (!tasks) return null;
    const map = new Map<string, { completed: number; total: number }>();
    for (const task of tasks) {
      if (!task.columnId) continue;
      const entry = map.get(task.columnId) || { completed: 0, total: 0 };
      entry.total += 1;
      if (isTaskConsideredDone(task)) entry.completed += 1;
      map.set(task.columnId, entry);
    }
    return map;
  }, [tasks]);

  const {
    contextMenu: rawContextMenu,
    openContextMenu,
    toggleFromButton,
    closeContextMenu,
  } = useContextMenu<BoardColumn>();

  const openUpgradeModal = useUIStore((s) => s.openUpgradeModal);
  const [columnToEdit, setColumnToEdit] = useState<BoardColumn | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<BoardColumn | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const isDeletingRef = useRef(false);
  const movingColumnIdsRef = useRef<Set<string>>(new Set());

  const ensureWritable = useCallback(() => {
    if (isReadOnly) {
      openUpgradeModal();
      toast.error(t("readOnlyActionError"));
      return false;
    }
    return true;
  }, [isReadOnly, openUpgradeModal, t]);

  const handleOpenCreateModal = useCallback(() => {
    if (!ensureWritable()) return;
    if (activeWorkspaceId && !useWorkspaceStore.getState().activeWorkspaceId) {
      useWorkspaceStore.getState().setActiveWorkspaceId(activeWorkspaceId);
    }
    setColumnToEdit(null);
    setIsColumnModalOpen(true);
  }, [activeWorkspaceId, ensureWritable]);

  const buildBoardColumn = useCallback(
    (column: DashboardColumnOption): BoardColumn => ({
      id: column.id || "",
      title: column.name || t("untitled"),
      order: column.orderIndex ?? 0,
      icon: column.icon || "sun",
      tasks: [],
    }),
    [t],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, column: DashboardColumnOption) => {
      openContextMenu(e, buildBoardColumn(column));
    },
    [buildBoardColumn, openContextMenu],
  );

  const handleMenuButtonClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, column: DashboardColumnOption) => {
      toggleFromButton(
        e,
        buildBoardColumn(column),
        (current, next) => current?.id === next.id,
      );
    },
    [buildBoardColumn, toggleFromButton],
  );

  const handleDeleteConfirm = async () => {
    if (!columnToDelete?.id || isDeletingRef.current) return;
    if (!ensureWritable()) {
      setColumnToDelete(null);
      return;
    }
    isDeletingRef.current = true;
    setIsDeleting(true);
    try {
      const res = await deleteBoardColumn(columnToDelete.id);
      if (!res.success) {
        toast.error(res.error || t("deleteColumnError"));
        return;
      }
      toast.success(t("deleteColumnSuccess", { title: columnToDelete.title }));
      const deletedId = columnToDelete.id;
      const remainingIds = columns
        .filter((c) => c.id && c.id !== deletedId)
        .map((c) => c.id as string);
      const nextVisibleIds = removeVisibleColumnIfPresent(
        activeWorkspaceId,
        deletedId,
        remainingIds,
        savedVisibleIds,
        maxColumns,
      );
      if (nextVisibleIds) {
        setSavedVisibleIds(nextVisibleIds);
      }
      setColumns((prev) => prev.filter((c) => c.id !== deletedId));
      onColumnDeleted?.(deletedId);
      setColumnToDelete(null);
    } catch {
      toast.error(t("deleteColumnUnexpectedError"));
    } finally {
      isDeletingRef.current = false;
      setIsDeleting(false);
    }
  };

  const handleColumnSaved = (savedCol: BoardColumn, isEditing?: boolean) => {
    if (isEditing) {
      setColumns((prev) =>
        prev.map((c) =>
          c.id === savedCol.id
            ? { ...c, name: savedCol.title, icon: savedCol.icon }
            : c,
        ),
      );
    } else {
      const nextVisibleIds = appendVisibleColumnIfSpaceAllows(
        activeWorkspaceId,
        savedCol.id,
        maxColumns,
        savedVisibleIds,
      );
      if (nextVisibleIds) {
        setSavedVisibleIds(nextVisibleIds);
      }
      setColumns((prev) => [
        ...prev,
        {
          id: savedCol.id,
          name: savedCol.title,
          icon: savedCol.icon,
          orderIndex: savedCol.order,
          isVisible: true,
          isReadOnly,
          archivedCompletedCount: 0,
          archivedTotalCount: 0,
          completedTasks: 0,
          totalTasks: 0,
        },
      ]);
    }
    setIsColumnModalOpen(false);
    setColumnToEdit(null);
  };

  const handleRequestEditColumn = (col: BoardColumn) => {
    if (!ensureWritable()) return;
    setColumnToEdit(col);
    setIsColumnModalOpen(true);
  };

  const handleRequestDeleteColumn = (col: BoardColumn) => {
    if (!ensureWritable()) return;
    setColumnToDelete(col);
  };

  const prevCreateTriggerRef = useRef(createColumnTrigger);
  const handleOpenCreateModalRef = useLatestRef(handleOpenCreateModal);
  useEffect(() => {
    if (createColumnTrigger > prevCreateTriggerRef.current) {
      prevCreateTriggerRef.current = createColumnTrigger;
      handleOpenCreateModalRef.current();
    }
  }, [createColumnTrigger, handleOpenCreateModalRef]);

  const availableTargetWorkspaces = useMemo<ColumnMoveWorkspaceOption[]>(
    () =>
      workspaces
        .filter((ws) => ws.id !== activeWorkspaceId)
        .map((ws) => ({
          id: ws.id,
          name: ws.name,
          isLocked: Boolean(ws.isReadOnly),
        })),
    [workspaces, activeWorkspaceId],
  );

  const handleMoveLockedWorkspace = (
    reason: "source" | "target",
    name?: string,
  ) => {
    toast.warning(
      reason === "source"
        ? t("readOnlyMoveSourceToast")
        : t("readOnlyMoveTargetToast", {
            workspace: name || t("defaultWorkspaceName"),
          }),
    );
    openUpgradeModal();
  };

  const handleMoveColumnToWorkspace = async (
    col: BoardColumn,
    targetWorkspaceId: string,
    targetWorkspaceName: string,
  ) => {
    if (movingColumnIdsRef.current.has(col.id)) return;
    if (isReadOnly) {
      handleMoveLockedWorkspace("source");
      return;
    }

    const targetWs = workspaces.find((ws) => ws.id === targetWorkspaceId);
    if (targetWs?.isReadOnly) {
      handleMoveLockedWorkspace("target", targetWorkspaceName || targetWs.name);
      return;
    }

    closeContextMenu();
    movingColumnIdsRef.current.add(col.id);

    try {
      const response = await moveBoardColumnToWorkspace(col.id, {
        targetWorkspaceId,
      });

      if (!response.success) {
        toast.error(response.error || t("moveColumnError"));
        return;
      }

      const nextColumns = columns.filter((c) => c.id !== col.id);
      const remainingIds = nextColumns
        .map((c) => c.id)
        .filter((id): id is string => Boolean(id));

      const nextVisibleIds = removeVisibleColumnIfPresent(
        activeWorkspaceId,
        col.id,
        remainingIds,
        savedVisibleIds,
        maxColumns,
      );
      if (nextVisibleIds) {
        setSavedVisibleIds(nextVisibleIds);
      }

      appendVisibleColumnIfSpaceAllows(targetWorkspaceId, col.id, maxColumns);

      const resolvedWorkspaceName =
        targetWorkspaceName || targetWs?.name || t("defaultWorkspaceName");
      if (onColumnMoved) {
        onColumnMoved(col.id, targetWorkspaceId, resolvedWorkspaceName);
      } else {
        setColumns(nextColumns);
      }

      toast.success(
        t("moveColumnSuccess", {
          title: col.title || t("untitled"),
          workspace: resolvedWorkspaceName,
        }),
      );
    } catch {
      toast.error(t("moveColumnUnexpectedError"));
    } finally {
      movingColumnIdsRef.current.delete(col.id);
    }
  };

  return {
    columns,
    activeColumns,
    surplusCount,
    isLimitReached,
    columnCountsMap,
    availableTargetWorkspaces,
    contextMenu: {
      isOpen: rawContextMenu.isOpen,
      position: rawContextMenu.position,
      column: rawContextMenu.data,
    },
    closeContextMenu,
    columnToEdit,
    isColumnModalOpen,
    setIsColumnModalOpen,
    setColumnToEdit,
    openUpgradeModal,
    columnToDelete,
    setColumnToDelete,
    isDeleting,
    handleOpenCreateModal,
    handleContextMenu,
    handleMenuButtonClick,
    handleDeleteConfirm,
    handleColumnSaved,
    handleRequestEditColumn,
    handleRequestDeleteColumn,
    handleMoveColumnToWorkspace,
    handleMoveLockedWorkspace,
  };
}
