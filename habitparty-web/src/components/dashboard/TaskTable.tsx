"use client";

import { CalendarCheck, FolderPlus, Lock, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { TaskRow } from "@/components/tasks/shared/TaskRow";
import { Pagination } from "@/components/ui/Pagination";
import {
  DASHBOARD_EMPTY_MESSAGES,
  isDashboardStandardFilterId,
} from "@/constants/dashboard";
import { TASK_TABLE_GRID_COLS } from "@/constants/task";
import { useDateFormat } from "@/hooks/useDateFormat";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { TaskTableProps } from "@/types/dashboard";
import { cn } from "@/utils";
import { formatShortDate } from "@/utils/date";
import {
  buildReadOnlySets,
  isTaskInReadOnlyScope,
  resolveTaskColumnTitle,
} from "@/utils/taskMapper";

export function TaskTable({
  itemsPerPage = 3,
  currentPage = 1,
  tasks,
  columns,
  workspaces = [],
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
  emptyActionLabel,
  onEmptyAction,
}: TaskTableProps) {
  const t = useTranslations("dashboard.taskTable");
  const locale = useLocale() as AppLocale;
  const { dateFormat } = useDateFormat();
  const userTimeZone = useUserStore((s) => s.user?.timezone);
  const totalItems = tasks.length;
  const hasMultipleWorkspaces = workspaces.length > 1;
  const columnWorkspaceMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!columns || !hasMultipleWorkspaces) return map;
    for (const col of columns) {
      if (col.id && col.workspaceName) {
        map.set(col.id, col.workspaceName);
      }
    }
    return map;
  }, [columns, hasMultipleWorkspaces]);
  const { readOnlyWorkspaceIds, readOnlyColumnIds } = useMemo(
    () => buildReadOnlySets(workspaces, columns),
    [workspaces, columns],
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

  const emptyMeta = isNoColumns
    ? {
        title: t("empty.noColumns.title"),
        description: t("empty.noColumns.description"),
        actionLabel: emptyActionLabel || t("empty.noColumns.action"),
        icon: FolderPlus,
      }
    : isNoColumnsReadOnly
      ? {
          title: t("empty.noColumnsReadOnly.title"),
          description: t("empty.noColumnsReadOnly.description"),
          actionLabel: emptyActionLabel || t("empty.noColumnsReadOnly.action"),
          icon: Lock,
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

  const panelId = selectedDate ? "panel-date" : `panel-${activeFilter}`;
  const tabId = selectedDate ? "tab-date" : `tab-${activeFilter}`;

  return (
    <section
      id={panelId}
      role="tabpanel"
      aria-labelledby={tabId}
      className="@container flex flex-col gap-2 w-full"
      aria-label={t("ariaLabel")}
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
            <h4 className="text-body-m font-bold text-neutral-100">
              {emptyMeta.title}
            </h4>
            <p className="text-body-s text-neutral-400 max-w-sm">
              {emptyMeta.description}
            </p>
          </div>
          {emptyMeta.actionLabel && onEmptyAction && (
            <button
              type="button"
              onClick={onEmptyAction}
              className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold px-4 py-2 text-xs shadow-sm transition-colors cursor-pointer"
            >
              <Plus size={15} aria-hidden="true" />
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
                    ? resolveTaskColumnTitle(task, columns, "")
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
        <Pagination
          currentPage={safeCurrentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          itemLabel={t("paginationItemLabel")}
          onPageChange={(newPage) => {
            if (newPage < 1 || newPage > totalPages) return;
            onPageChange?.(newPage);
            if (typeof window !== "undefined") {
              const url = new URL(window.location.href);
              if (newPage <= 1) {
                url.searchParams.delete("page");
              } else {
                url.searchParams.set("page", String(newPage));
              }
              window.history.replaceState(
                window.history.state,
                "",
                `${url.pathname}${url.search}${url.hash}`,
              );
            }
          }}
        />
      )}
    </section>
  );
}
