"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteBoardColumn } from "@/actions/boardColumnActions";
import { resolveDashboardVisibleColumnIds } from "@/constants/routine";
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

export function useDashboardListSummary({
  initialColumns,
  initialVisibleColumnIds,
  columns: controlledColumns,
  onColumnsChange,
  onColumnDeleted,
  maxColumns,
  activeWorkspaceId,
  isReadOnly = false,
  isPremium = false,
  tasks,
}: Pick<
  DashboardListSummaryProps,
  | "initialColumns"
  | "initialVisibleColumnIds"
  | "columns"
  | "onColumnsChange"
  | "onColumnDeleted"
  | "maxColumns"
  | "activeWorkspaceId"
  | "isReadOnly"
  | "isPremium"
  | "tasks"
>) {
  const t = useTranslations("dashboard.listSummary");
  const [internalColumns, setInternalColumns] =
    useState<DashboardColumnOption[]>(initialColumns);
  const columns = controlledColumns ?? internalColumns;
  const setColumns = onColumnsChange ?? setInternalColumns;

  const [savedVisibleIds, setSavedVisibleIds] = useState<string[] | null>(
    () => initialVisibleColumnIds ?? null,
  );

  useEffect(() => {
    setInternalColumns(initialColumns);
  }, [initialColumns]);

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
    if (initialVisibleColumnIds) {
      setSavedVisibleIds(initialVisibleColumnIds);
    }
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

  // Pré-computa contadores por coluna em uma única passagem O(T) em vez de O(C * T)
  const columnCountsMap = useMemo(() => {
    if (!tasks) return null;
    const map = new Map<string, { completed: number; total: number }>();
    for (const task of tasks) {
      if (!task.columnId) continue;
      const entry = map.get(task.columnId) || { completed: 0, total: 0 };
      entry.total += 1;
      if (task.completed) entry.completed += 1;
      map.set(task.columnId, entry);
    }
    return map;
  }, [tasks]);

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    column: BoardColumn | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    column: null,
  });

  const [columnToEdit, setColumnToEdit] = useState<BoardColumn | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [columnToDelete, setColumnToDelete] = useState<BoardColumn | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const ensureWritable = () => {
    if (isReadOnly) {
      setIsUpgradeModalOpen(true);
      toast.error(t("readOnlyActionError"));
      return false;
    }
    return true;
  };

  const handleOpenCreateModal = () => {
    if (!ensureWritable()) return;
    if (activeWorkspaceId && !useWorkspaceStore.getState().activeWorkspaceId) {
      useWorkspaceStore.getState().setActiveWorkspaceId(activeWorkspaceId);
    }
    setColumnToEdit(null);
    setIsColumnModalOpen(true);
  };

  const buildBoardColumn = (column: DashboardColumnOption): BoardColumn => ({
    id: column.id || "",
    title: column.name || t("untitled"),
    order: column.orderIndex ?? 0,
    icon: column.icon || "sun",
    tasks: [],
  });

  const handleContextMenu = (
    e: React.MouseEvent,
    column: DashboardColumnOption,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      column: buildBoardColumn(column),
    });
  };

  const handleMenuButtonClick = (
    e: React.MouseEvent<HTMLButtonElement>,
    column: DashboardColumnOption,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const isSameOpen =
      contextMenu.isOpen && contextMenu.column?.id === (column.id || "");
    if (isSameOpen) {
      setContextMenu((prev) => ({ ...prev, isOpen: false, column: null }));
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({
      isOpen: true,
      position: { x: rect.left, y: rect.bottom + 4 },
      column: buildBoardColumn(column),
    });
  };

  const handleDeleteConfirm = async () => {
    if (!columnToDelete?.id) return;
    if (!ensureWritable()) {
      setColumnToDelete(null);
      return;
    }
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

  return {
    columns,
    activeColumns,
    surplusCount,
    isLimitReached,
    columnCountsMap,
    contextMenu,
    setContextMenu,
    columnToEdit,
    isColumnModalOpen,
    setIsColumnModalOpen,
    setColumnToEdit,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
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
  };
}
