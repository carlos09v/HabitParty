"use client";

import {
  CalendarCheck,
  Crown,
  FilterX,
  FolderPlus,
  Lock,
  Plus,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { useResolvedReadOnlySets } from "@/components/dashboard/useResolvedReadOnlySets";
import { TaskRow } from "@/components/tasks/shared/TaskRow";
import { Pagination } from "@/components/ui/Pagination";
import {
  DASHBOARD_EMPTY_MESSAGES,
  DASHBOARD_ITEMS_PER_PAGE,
  DASHBOARD_PAGE_SIZE_OPTIONS,
  isDashboardStandardFilterId,
} from "@/constants/dashboard";
import { TASK_TABLE_GRID_COLS } from "@/constants/task";
import { useDateFormat } from "@/hooks/useDateFormat";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { TaskTableProps } from "@/types/dashboard";
import { cn } from "@/utils";
import { formatShortDate } from "@/utils/date";
import { isTaskInReadOnlyScope } from "@/utils/taskMapper";
import { replaceUrlSearchParams } from "@/utils/urlParams";

export function TaskTable({
  itemsPerPage = DASHBOARD_ITEMS_PER_PAGE,
  onItemsPerPageChange,
  currentPage = 1,
  tasks,
  columns,
  workspaces = [],
  readOnlyWorkspaceIds: propReadOnlyWorkspaceIds,
  readOnlyColumnIds: propReadOnlyColumnIds,
  activeFilter = "today",
  onToggle,
  onHabitChange,
  onContextMenu,
  onOpenDetails,
  onEditTask,
  selectedDate,
  onPageChange,
  deletingTaskIds,
  onStartFocus,
  emptyVariant = "default",
  onEmptyAction,
  hasActiveFilters = false,
  onClearFilters,
  timeZone,
}: TaskTableProps) {
  const t = useTranslations("dashboard.taskTable");
  const locale = useLocale() as AppLocale;
  const { dateFormat } = useDateFormat();
  const userTimeZone = useUserStore((s) => s.user?.timezone) ?? timeZone;
  const totalItems = tasks.length;
  const hasMultipleWorkspaces = workspaces.length > 1;
  const { columnTitleMap, columnWorkspaceMap } = useMemo(() => {
    const titleMap = new Map<string, string>();
    const workspaceMap = new Map<string, string>();
    if (!columns) {
      return { columnTitleMap: titleMap, columnWorkspaceMap: workspaceMap };
    }
    for (const col of columns) {
      if (!col.id) continue;
      const title = col.name;
      if (title) {
        titleMap.set(col.id, title);
      }
      if (hasMultipleWorkspaces && col.workspaceName) {
        workspaceMap.set(col.id, col.workspaceName);
      }
    }
    return { columnTitleMap: titleMap, columnWorkspaceMap: workspaceMap };
  }, [columns, hasMultipleWorkspaces]);
  const { readOnlyWorkspaceIds, readOnlyColumnIds } = useResolvedReadOnlySets(
    workspaces,
    columns,
    propReadOnlyWorkspaceIds,
    propReadOnlyColumnIds,
  );
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedTasks = tasks.slice(startIndex, startIndex + itemsPerPage);

  const formattedDate = formatShortDate(selectedDate, {
    locale,
    dateFormat,
    timeZone: userTimeZone,
  });

  const EmptyIcon = isDashboardStandardFilterId(activeFilter)
    ? DASHBOARD_EMPTY_MESSAGES[activeFilter].icon
    : CalendarCheck;

  const isNoColumns = emptyVariant === "no_columns";
  const isNoColumnsReadOnly = emptyVariant === "no_columns_readonly";
  const isFilteredEmpty =
    !isNoColumns && !isNoColumnsReadOnly && hasActiveFilters;

  const emptyMeta = isNoColumns
    ? {
        title: t("empty.noColumns.title"),
        description: t("empty.noColumns.description"),
        actionLabel: t("empty.noColumns.action"),
        actionIcon: Plus,
        onAction: onEmptyAction,
        icon: FolderPlus,
      }
    : isNoColumnsReadOnly
      ? {
          title: t("empty.noColumnsReadOnly.title"),
          description: t("empty.noColumnsReadOnly.description"),
          actionLabel: t("empty.noColumnsReadOnly.action"),
          actionIcon: Crown,
          onAction: onEmptyAction,
          icon: Lock,
        }
      : isFilteredEmpty
        ? {
            title: t("empty.filtered.title"),
            description: t("empty.filtered.description"),
            actionLabel: onClearFilters
              ? t("empty.filtered.action")
              : undefined,
            actionIcon: FilterX,
            onAction: onClearFilters,
            icon: FilterX,
          }
        : selectedDate
          ? {
              title: t("emptyDateTitle"),
              description: t("emptyDateDesc", { date: formattedDate }),
              icon: CalendarCheck,
            }
          : isDashboardStandardFilterId(activeFilter)
            ? {
                title: t(`empty.${activeFilter}.title`),
                description: t(`empty.${activeFilter}.description`),
                icon: EmptyIcon,
              }
            : {
                title: t("emptyFallbackTitle"),
                description: t("emptyFallbackDesc"),
                icon: CalendarCheck,
              };

  const EmptyStateIcon = emptyMeta.icon;
  const EmptyActionIcon = emptyMeta.actionIcon ?? Plus;

  const panelId = selectedDate ? "panel-date" : `panel-${activeFilter}`;
  const tabId = selectedDate ? undefined : `tab-${activeFilter}`;

  return (
    <section
      id={panelId}
      role={selectedDate ? undefined : "tabpanel"}
      aria-labelledby={tabId}
      aria-label={selectedDate ? t("ariaLabel") : undefined}
      className="@container flex flex-col gap-2 w-full"
    >
      {/* Cabeçalho da Grade Responsivo */}
      <div
        className={cn(
          "grid items-center text-xs font-semibold text-neutral-300 border-l-4 border-r border-transparent gap-2.5 @lg:gap-3 px-3 @lg:px-4 py-2",
          TASK_TABLE_GRID_COLS,
        )}
        aria-hidden="true"
      >
        <span className="min-w-0 truncate pl-8.5 sm:pl-7.5">
          {t("colName")}
        </span>
        <span className="hidden @lg:block min-w-0">
          {hasMultipleWorkspaces ? t("colWorkspaceList") : t("colList")}
        </span>
        <span className="min-w-0">{t("colType")}</span>
        <span className="hidden @lg:block text-center min-w-0">
          {t("colPriority")}
        </span>
        <span className="hidden @2xl:block min-w-0 truncate">
          {t("colSchedule")}
        </span>
        <span className="text-right sr-only">{t("colActions")}</span>
      </div>

      {/* Linhas de Tarefas ou Estado Vazio */}
      {paginatedTasks.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-neutral-700 dark:border-primary/30 bg-primary-dark/20 py-12 px-6 gap-3.5">
          <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/25 border border-primary/25 dark:border-primary/40 flex items-center justify-center text-primary dark:text-gold shadow-xs">
            <EmptyStateIcon size={24} aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-body-m font-bold text-neutral-100">
              {emptyMeta.title}
            </h3>
            <p className="text-body-s text-neutral-400 max-w-sm">
              {emptyMeta.description}
            </p>
          </div>
          {emptyMeta.actionLabel && emptyMeta.onAction && (
            <button
              type="button"
              onClick={emptyMeta.onAction}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold px-4 py-2 text-xs shadow-sm transition-colors cursor-pointer"
            >
              <EmptyActionIcon size={15} aria-hidden="true" />
              <span>{emptyMeta.actionLabel}</span>
            </button>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-1.5 w-full p-0 m-0 list-none">
          {paginatedTasks.map((task, idx) => (
            <li
              key={task.id}
              className={cn("list-none", idx >= 12 && "deferred-list-row")}
            >
              <TaskRow
                task={task}
                columnTitle={
                  columns
                    ? (task.columnId
                        ? columnTitleMap.get(task.columnId)
                        : undefined) || ""
                    : undefined
                }
                workspaceName={
                  hasMultipleWorkspaces
                    ? task.workspaceName ||
                      (task.columnId
                        ? columnWorkspaceMap.get(task.columnId)
                        : undefined)
                    : undefined
                }
                isReadOnly={isTaskInReadOnlyScope(
                  task,
                  readOnlyWorkspaceIds,
                  readOnlyColumnIds,
                )}
                activeFilter={activeFilter}
                selectedDate={selectedDate}
                isDeleteChecking={Boolean(deletingTaskIds?.has(task.id))}
                onToggle={onToggle}
                onHabitChange={onHabitChange}
                onContextMenu={onContextMenu}
                onOpenDetails={onOpenDetails}
                onEditTask={onEditTask}
                onStartFocus={onStartFocus}
              />
            </li>
          ))}
        </ul>
      )}

      {totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {onItemsPerPageChange && totalItems > 5 && (
            <div className="flex items-center gap-1.5 text-tiny text-neutral-400">
              <span>{t("itemsPerPageLabel")}</span>
              <div className="inline-flex items-center rounded-lg bg-surface dark:bg-white/5 border border-neutral-700 dark:border-white/10 p-0.5">
                {DASHBOARD_PAGE_SIZE_OPTIONS.map((size) => {
                  const isActive = itemsPerPage === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => onItemsPerPageChange(size)}
                      aria-pressed={isActive}
                      className={cn(
                        "px-2 py-0.5 rounded-md font-bold tabular-nums transition-colors cursor-pointer",
                        isActive
                          ? "bg-gold text-on-gold shadow-xs"
                          : "text-neutral-400 hover:text-neutral-100",
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <Pagination
              currentPage={safeCurrentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              itemLabel={t("paginationItemLabel")}
              onPageChange={(newPage) => {
                if (newPage < 1 || newPage > totalPages) return;
                onPageChange?.(newPage);
                replaceUrlSearchParams((params) => {
                  if (newPage <= 1) {
                    params.delete("page");
                  } else {
                    params.set("page", String(newPage));
                  }
                });
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
