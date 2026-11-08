"use client";

import { Crown, Lock, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { deleteBoardColumn } from "@/actions/boardColumnActions";
import { buildColumnContextMenuItems } from "@/components/tasks/shared";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { ListCard } from "@/components/ui/ListCard";
import { getColumnIcon, resolveVisibleColumnIds } from "@/constants/routine";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useWorkspaceStore } from "@/store/workspaceStore";
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

const UpgradePremiumModal = dynamic(
  () =>
    import("@/components/subscription/UpgradePremiumModal").then((mod) => ({
      default: mod.UpgradePremiumModal,
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
  const tUpgrade = useTranslations("upgradeColumnLimitCard");
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

  // Modal de criação/edição da coluna e Upgrade
  const [columnToEdit, setColumnToEdit] = useState<BoardColumn | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Modal de exclusão da coluna
  const [columnToDelete, setColumnToDelete] = useState<BoardColumn | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreateModal = () => {
    if (activeWorkspaceId && !useWorkspaceStore.getState().activeWorkspaceId) {
      useWorkspaceStore.getState().setActiveWorkspaceId(activeWorkspaceId);
    }
    setColumnToEdit(null);
    setIsColumnModalOpen(true);
  };

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
          setIsColumnModalOpen(true);
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
      className={cn(
        "flex flex-col shrink-0",
        isCompact ? "gap-2.5" : "gap-3.5",
      )}
    >
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5">
          <h3
            className={cn(
              "font-bold text-neutral-50",
              isCompact ? "text-base" : "text-lg",
            )}
          >
            {t("title")}
          </h3>
          <output
            className="px-2 py-0.5 rounded-md bg-surface/80 dark:bg-surface/60 border border-neutral-700/70 dark:border-primary/30 text-xs text-neutral-300 font-bold tabular-nums"
            aria-label={t("counterAriaLabel")}
          >
            {activeColumns.length}/{maxColumns}
          </output>
        </div>

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
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-tiny font-bold bg-amber-500/10 text-amber-800 border border-amber-500/30 dark:bg-gold/10 dark:text-gold dark:border-gold/30"
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

          {!isLimitReached ? (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg font-bold transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer border",
                "bg-primary/15 dark:bg-primary/25 text-primary dark:text-neutral-100 border-primary/35 dark:border-primary-light/45",
                "hover:bg-gold hover:text-on-gold hover:border-gold dark:hover:bg-gold dark:hover:text-on-gold dark:hover:border-gold hover:shadow-glow-gold-xs active:scale-95",
                isCompact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs",
              )}
            >
              <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
              <span>{t("addCardSubtitle")}</span>
            </button>
          ) : !isPremium ? (
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              title={tUpgrade("upgradeSubtitle")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg font-bold transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer border",
                "bg-amber-500/10 text-amber-700 border-amber-500/40 hover:bg-amber-500/20 hover:border-amber-600 dark:bg-gold/10 dark:text-gold dark:border-gold/40 dark:hover:bg-gold/20 dark:hover:border-gold hover:shadow-glow-gold-xs active:scale-95",
                isCompact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs",
              )}
            >
              <Crown size={13} className="fill-gold/20 shrink-0" />
              <span>{t("addCardSubtitle")}</span>
            </button>
          ) : (
            <span
              title={tUpgrade("maxSubtitle", {
                current: columns.length,
                max: maxColumns,
              })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg font-semibold border border-neutral-700 bg-surface/60 dark:border-neutral-700/60 dark:bg-surface/40 text-neutral-400 dark:text-neutral-500 cursor-not-allowed select-none",
                isCompact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs",
              )}
            >
              <Lock size={12} aria-hidden="true" />
              <span>{tUpgrade("title")}</span>
            </span>
          )}
        </div>
      </header>

      <ul
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 m-0 p-0 list-none w-full",
          isCompact ? "gap-2.5" : "gap-3",
        )}
      >
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
              className="list-none min-w-0"
              onContextMenu={(e) => handleContextMenu(e, column)}
            >
              <Link
                href={`/tasks?columnId=${column.id}`}
                className="focus:outline-none focus:ring-2 focus:ring-gold rounded-xl block w-full"
                title={t("rightClickHint", {
                  name: column.name || t("defaultList"),
                })}
              >
                <ListCard
                  compact={isCompact}
                  title={column.name || t("untitled")}
                  count={`${completedCount}/${totalCount}`}
                  icon={
                    <ColumnIcon size={isCompact ? 15 : 17} aria-hidden="true" />
                  }
                />
              </Link>
            </li>
          );
        })}

        {activeColumns.length === 0 && !isLimitReached && (
          <li className="list-none min-w-0 col-span-2 sm:col-span-1">
            <ListCard
              compact={isCompact}
              title={t("addCard")}
              subtitle={t("addCardSubtitle")}
              isAdd={true}
              onClick={handleOpenCreateModal}
              icon={<Plus size={isCompact ? 15 : 17} aria-hidden="true" />}
            />
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

      {/* Modal: Criar ou Editar Coluna */}
      {isColumnModalOpen && (
        <CreateBoardColumnModal
          isOpen={isColumnModalOpen}
          columnToEdit={columnToEdit}
          onClose={() => {
            setIsColumnModalOpen(false);
            setColumnToEdit(null);
          }}
          onSuccess={(savedCol, isEditing) => {
            if (isEditing) {
              setColumns((prev) =>
                prev.map((c) =>
                  c.id === savedCol.id
                    ? { ...c, name: savedCol.title, icon: savedCol.icon }
                    : c,
                ),
              );
            } else {
              setColumns((prev) => [
                ...prev,
                {
                  id: savedCol.id,
                  name: savedCol.title,
                  icon: savedCol.icon,
                  orderIndex: savedCol.order,
                  completedTasks: 0,
                  totalTasks: 0,
                },
              ]);
            }
            setIsColumnModalOpen(false);
            setColumnToEdit(null);
          }}
        />
      )}

      {/* Modal: Upgrade Premium */}
      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
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
