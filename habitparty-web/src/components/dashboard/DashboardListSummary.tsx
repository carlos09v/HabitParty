"use client";

import { Crown, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteBoardColumn } from "@/actions/boardColumnActions";
import { UpgradeColumnLimitCard } from "@/components/subscription/UpgradeColumnLimitCard";
import { buildColumnContextMenuItems } from "@/components/tasks/shared";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { ListCard } from "@/components/ui/ListCard";
import { getColumnIcon, resolveVisibleColumnIds } from "@/constants/routine";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type {
  ColumnSummaryDTO,
  DashboardListSummaryProps,
} from "@/types/dashboard";
import type { BoardColumn } from "@/types/task";
import { cn } from "@/utils";

const CreateBoardColumnModal = dynamic(
  () =>
    import("@/components/tasks/CreateBoardColumnModal").then((mod) => ({
      default: mod.CreateBoardColumnModal,
    })),
  { ssr: false },
);

const ConfirmationModal = dynamic(
  () =>
    import("@/components/ui/ConfirmationModal").then((mod) => ({
      default: mod.ConfirmationModal,
    })),
  { ssr: false },
);

export function DashboardListSummary({
  initialColumns,
  columns: controlledColumns,
  onColumnsChange,
  onColumnDeleted,
  maxColumns,
  activeWorkspaceId,
  isCompact = false,
  isPremium = false,
  tasks,
}: DashboardListSummaryProps) {
  const t = useTranslations("dashboard.listSummary");
  const tMenu = useTranslations("dashboard.taskShared.contextMenu");
  const { isGamified } = useExperienceMode();
  const [internalColumns, setInternalColumns] =
    useState<ColumnSummaryDTO[]>(initialColumns);
  const columns = controlledColumns ?? internalColumns;
  const setColumns = onColumnsChange ?? setInternalColumns;
  const [savedVisibleIds, setSavedVisibleIds] = useState<string[] | null>(null);

  useEffect(() => {
    setInternalColumns(initialColumns);
  }, [initialColumns]);

  useEffect(() => {
    if (!activeWorkspaceId) {
      setSavedVisibleIds(null);
      return;
    }
    try {
      const raw = localStorage.getItem(
        `habitparty_visible_columns_${activeWorkspaceId}`,
      );
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedVisibleIds(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [activeWorkspaceId]);

  const activeColumns = useMemo(() => {
    if (columns.length <= maxColumns) {
      return columns;
    }
    const allIds = columns.map((c) => c.id || "").filter(Boolean);
    const activeIds = new Set(
      resolveVisibleColumnIds(allIds, savedVisibleIds, maxColumns),
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
  const showTrailingActionCard = !isLimitReached || !isPremium;
  const itemWidthClass = isCompact
    ? "min-w-[100px] max-w-[130px]"
    : "min-w-[110px] max-w-[160px]";

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

  // Context Menu da coluna
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    column: BoardColumn | null;
  }>({
    isOpen: false,
    position: { x: 0, y: 0 },
    column: null,
  });

  // Modal de edição da coluna
  const [columnToEdit, setColumnToEdit] = useState<BoardColumn | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Modal de exclusão da coluna
  const [columnToDelete, setColumnToDelete] = useState<BoardColumn | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleContextMenu = (e: React.MouseEvent, column: ColumnSummaryDTO) => {
    e.preventDefault();
    e.stopPropagation();
    const boardCol: BoardColumn = {
      id: column.id || "",
      title: column.name || t("untitled"),
      order: column.orderIndex ?? 0,
      icon: column.icon || "sun",
      tasks: [],
    };
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      column: boardCol,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!columnToDelete?.id) return;
    setIsDeleting(true);
    try {
      const res = await deleteBoardColumn(columnToDelete.id);
      if (!res.success) {
        toast.error(res.error || t("deleteColumnError"));
        return;
      }
      toast.success(t("deleteColumnSuccess", { title: columnToDelete.title }));
      const deletedId = columnToDelete.id;
      setColumns((prev) => prev.filter((c) => c.id !== deletedId));
      onColumnDeleted?.(deletedId);
      setColumnToDelete(null);
    } catch {
      toast.error(t("deleteColumnUnexpectedError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const columnMenuItems = useMemo(
    () =>
      buildColumnContextMenuItems({
        column: contextMenu.column,
        onEdit: (col) => {
          setColumnToEdit(col);
          setIsEditModalOpen(true);
        },
        onDelete: (col) => setColumnToDelete(col),
        labels: {
          edit: tMenu("edit"),
          delete: tMenu("delete"),
          layout: tMenu("layout"),
          compact: tMenu("compact"),
          normal: tMenu("normal"),
          wide: tMenu("wide"),
        },
      }),
    [contextMenu.column, tMenu],
  );

  return (
    <section
      className={cn("flex flex-col shrink-0", isCompact ? "gap-3" : "gap-4")}
    >
      <header className="flex items-center justify-between gap-2">
        <h3
          className={cn(
            "font-bold text-neutral-50",
            isCompact ? "text-base" : "text-lg",
          )}
        >
          {t("title")}
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          {surplusCount > 0 && (
            <span
              title={
                isGamified
                  ? t("storedInBackpackTitleGamified", { count: surplusCount })
                  : t("storedInBackpackTitleProductivity", {
                      count: surplusCount,
                    })
              }
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-tiny font-bold bg-gold/10 text-gold border border-gold/30"
            >
              <Crown size={11} className="fill-gold/20 shrink-0" />
              <span>
                {isGamified
                  ? t("storedInBackpackBadgeGamified", { count: surplusCount })
                  : t("storedInBackpackBadgeProductivity", {
                      count: surplusCount,
                    })}
              </span>
            </span>
          )}
          <output
            className="text-sm text-neutral-400 font-bold"
            aria-label={t("counterAriaLabel")}
          >
            {activeColumns.length}/{maxColumns}
          </output>
        </div>
      </header>

      <ul className="flex items-center gap-3 sm:gap-3.5 w-full overflow-x-auto custom-scrollbar px-1 py-2 m-0 list-none">
        {activeColumns.map((column) => {
          const ColumnIcon = getColumnIcon(column.icon);
          const dynamicCounts =
            columnCountsMap && column.id
              ? columnCountsMap.get(column.id)
              : null;
          const completedCount = columnCountsMap
            ? (dynamicCounts?.completed ?? 0)
            : (column.completedTasks ?? 0);
          const totalCount = columnCountsMap
            ? (dynamicCounts?.total ?? 0)
            : (column.totalTasks ?? 0);

          return (
            <li
              key={column.id}
              className={cn("list-none flex-1", itemWidthClass)}
              onContextMenu={(e) => handleContextMenu(e, column)}
            >
              <Link
                href={`/tasks?columnId=${column.id}`}
                className="focus:outline-none focus:ring-2 focus:ring-gold rounded-lg block w-full"
                title={t("rightClickHint", {
                  name: column.name || t("defaultList"),
                })}
              >
                <ListCard
                  compact={isCompact}
                  title={column.name || t("untitled")}
                  count={`${completedCount}/${totalCount}`}
                  icon={
                    <ColumnIcon size={isCompact ? 16 : 18} aria-hidden="true" />
                  }
                />
              </Link>
            </li>
          );
        })}

        {showTrailingActionCard && (
          <li className={cn("list-none flex-1", itemWidthClass)}>
            {isLimitReached ? (
              <UpgradeColumnLimitCard
                compact={isCompact}
                isPremium={isPremium}
                currentCount={columns.length}
                maxCount={maxColumns}
              />
            ) : (
              <Link
                href="/tasks?createColumn=true"
                className="focus:outline-none focus:ring-2 focus:ring-gold rounded-lg block w-full"
              >
                <ListCard
                  compact={isCompact}
                  title={t("addCard")}
                  subtitle={t("addCardSubtitle")}
                  isAdd={true}
                  icon={<Plus size={isCompact ? 16 : 18} aria-hidden="true" />}
                />
              </Link>
            )}
          </li>
        )}
      </ul>

      {/* Popover / Context Menu com Editar e Excluir */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() =>
          setContextMenu((prev) => ({ ...prev, isOpen: false, column: null }))
        }
        items={columnMenuItems}
      />

      {/* Modal: Editar Coluna */}
      {isEditModalOpen && (
        <CreateBoardColumnModal
          isOpen={isEditModalOpen}
          columnToEdit={columnToEdit}
          onClose={() => {
            setIsEditModalOpen(false);
            setColumnToEdit(null);
          }}
          onSuccess={(savedCol) => {
            setColumns((prev) =>
              prev.map((c) =>
                c.id === savedCol.id
                  ? { ...c, name: savedCol.title, icon: savedCol.icon }
                  : c,
              ),
            );
            setIsEditModalOpen(false);
            setColumnToEdit(null);
          }}
        />
      )}

      {/* Modal: Confirmação de Exclusão da Coluna */}
      {Boolean(columnToDelete) && (
        <ConfirmationModal
          isOpen={Boolean(columnToDelete)}
          title={t("deleteModalTitle")}
          description={
            <>
              {t("deleteModalDescPrefix")}{" "}
              <span className="font-bold text-neutral-100">
                &quot;{columnToDelete?.title}&quot;
              </span>
              {t("deleteModalDescSuffix")}
            </>
          }
          confirmText={t("deleteModalConfirm")}
          cancelText={t("deleteModalCancel")}
          variant="danger"
          isLoading={isDeleting}
          onClose={() => {
            if (!isDeleting) setColumnToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </section>
  );
}
