"use client";

import { ArrowUpRight, Crown, Lock, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { DashboardColumnCard } from "@/components/dashboard/DashboardColumnCard";
import {
  buildColumnContextMenuItems,
  TaskWorkspaceBadge,
} from "@/components/tasks/shared";
import { ContextMenu } from "@/components/ui/ContextMenu";
import { ListCard } from "@/components/ui/ListCard";
import { useDashboardListSummary } from "@/hooks/useDashboardListSummary";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { DashboardListSummaryProps } from "@/types/dashboard";
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
  initialVisibleColumnIds,
  columns: controlledColumns,
  onColumnsChange,
  onColumnDeleted,
  maxColumns,
  activeWorkspaceId,
  activeWorkspaceName,
  isReadOnly = false,
  isCompact = false,
  isPremium = false,
  tasks,
}: DashboardListSummaryProps) {
  const t = useTranslations("dashboard.listSummary");
  const tMenu = useTranslations("dashboard.taskShared.contextMenu");
  const tUpgrade = useTranslations("upgradeColumnLimitCard");
  const { isGamified } = useExperienceMode();

  const {
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
  } = useDashboardListSummary({
    initialColumns,
    initialVisibleColumnIds,
    columns: controlledColumns,
    onColumnsChange,
    onColumnDeleted,
    maxColumns,
    activeWorkspaceId,
    isReadOnly,
    isPremium,
    tasks,
  });

  const columnMenuItems = useMemo(
    () =>
      buildColumnContextMenuItems({
        column: contextMenu.column,
        onEdit: handleRequestEditColumn,
        onDelete: handleRequestDeleteColumn,
        labels: {
          edit: tMenu("edit"),
          delete: tMenu("delete"),
          layout: tMenu("layout"),
          compact: tMenu("compact"),
          normal: tMenu("normal"),
          wide: tMenu("wide"),
        },
      }),
    [
      contextMenu.column,
      handleRequestEditColumn,
      handleRequestDeleteColumn,
      tMenu,
    ],
  );

  return (
    <section
      className={cn("flex flex-col shrink-0", isCompact ? "gap-2" : "gap-2.5")}
    >
      <header className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3
            className={cn(
              "font-bold text-neutral-50",
              isCompact ? "text-base" : "text-lg",
            )}
          >
            {t("title")}
          </h3>
          {activeWorkspaceName && (
            <TaskWorkspaceBadge
              workspaceName={activeWorkspaceName}
              size="header"
              isCompact={isCompact}
              isReadOnly={isReadOnly}
            />
          )}
          <output
            className="px-2 py-0.5 rounded-md bg-surface/80 dark:bg-surface/60 border border-neutral-700/70 dark:border-primary/30 text-xs text-neutral-300 font-bold tabular-nums"
            aria-label={t("counterAriaLabel")}
          >
            {activeColumns.length}/{maxColumns}
          </output>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={
              activeWorkspaceId
                ? `/tasks?workspaceId=${encodeURIComponent(activeWorkspaceId)}`
                : "/tasks"
            }
            title={t("viewBoardTitle")}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg font-semibold text-neutral-300 hover:text-primary dark:hover:text-gold hover:bg-surface-hover dark:hover:bg-white/5 transition-colors",
              isCompact ? "px-2 py-1 text-xs" : "px-2.5 py-1 text-xs",
            )}
          >
            <span>{t("viewBoard")}</span>
            <ArrowUpRight size={13} aria-hidden="true" />
          </Link>

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

          {isReadOnly ? (
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              title={t("readOnlyHint")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg font-bold transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer border",
                "bg-amber-500/10 text-amber-800 border-amber-500/40 hover:bg-amber-500/20 hover:border-amber-600 dark:bg-gold/10 dark:text-gold dark:border-gold/40 dark:hover:bg-gold/20 dark:hover:border-gold hover:shadow-glow-gold-xs active:scale-95",
                isCompact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs",
              )}
            >
              <Lock size={12} className="shrink-0" aria-hidden="true" />
              <span>{t("readOnlyBadge")}</span>
            </button>
          ) : !isLimitReached ? (
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
                "inline-flex items-center gap-1.5 rounded-lg font-semibold border border-neutral-700 bg-surface/60 dark:border-neutral-700/60 dark:bg-surface/40 text-neutral-400 dark:text-neutral-400 cursor-not-allowed select-none",
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
          "grid grid-cols-2 @lg:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-6 m-0 p-0 list-none w-full",
          isCompact ? "gap-2" : "gap-2.5",
        )}
      >
        {activeColumns.map((column) => (
          <DashboardColumnCard
            key={column.id}
            column={column}
            activeWorkspaceId={activeWorkspaceId}
            dynamicCounts={
              columnCountsMap && column.id
                ? (columnCountsMap.get(column.id) ?? null)
                : null
            }
            hasTaskCountsMap={Boolean(columnCountsMap)}
            isCompact={isCompact}
            isContextMenuOpen={
              contextMenu.isOpen && contextMenu.column?.id === (column.id || "")
            }
            onContextMenu={handleContextMenu}
            onMenuButtonClick={handleMenuButtonClick}
          />
        ))}

        {activeColumns.length === 0 && !isLimitReached && !isReadOnly && (
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

      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() =>
          setContextMenu((prev) => ({ ...prev, isOpen: false, column: null }))
        }
        items={columnMenuItems}
      />

      {isColumnModalOpen && (
        <CreateBoardColumnModal
          isOpen={isColumnModalOpen}
          columnToEdit={columnToEdit}
          onClose={() => {
            setIsColumnModalOpen(false);
            setColumnToEdit(null);
          }}
          onSuccess={handleColumnSaved}
        />
      )}

      {isUpgradeModalOpen && (
        <UpgradePremiumModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
        />
      )}

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
