import { Filter, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ListCard } from "@/components/ui/ListCard";
import { getColumnIcon } from "@/constants/routine";
import type { DashboardColumnOption } from "@/types/dashboard";
import { cn } from "@/utils";

interface DashboardColumnCardProps {
  column: DashboardColumnOption;
  activeWorkspaceId?: string;
  dynamicCounts: { completed: number; total: number } | null;
  hasTaskCountsMap: boolean;
  isFiltered?: boolean;
  onFilterByColumn?: (columnId: string, workspaceId?: string) => void;
  isContextMenuOpen: boolean;
  onContextMenu: (e: React.MouseEvent, column: DashboardColumnOption) => void;
  onMenuButtonClick: (
    e: React.MouseEvent<HTMLButtonElement>,
    column: DashboardColumnOption,
  ) => void;
}

export function DashboardColumnCard({
  column,
  activeWorkspaceId,
  dynamicCounts,
  hasTaskCountsMap,
  isFiltered = false,
  onFilterByColumn,
  isContextMenuOpen,
  onContextMenu,
  onMenuButtonClick,
}: DashboardColumnCardProps) {
  const t = useTranslations("dashboard.listSummary");
  const ColumnIcon = getColumnIcon(column.icon);
  const archivedCompleted = column.archivedCompletedCount ?? 0;
  const archivedTotal = column.archivedTotalCount ?? 0;
  const completedCount = hasTaskCountsMap
    ? (dynamicCounts?.completed ?? 0) + archivedCompleted
    : (column.completedTasks ?? 0);
  const totalCount = hasTaskCountsMap
    ? (dynamicCounts?.total ?? 0) + archivedTotal
    : (column.totalTasks ?? 0);
  const colName = column.name || t("defaultList");

  const href = activeWorkspaceId
    ? `/tasks?workspaceId=${encodeURIComponent(activeWorkspaceId)}&columnId=${encodeURIComponent(column.id || "")}`
    : `/tasks?columnId=${encodeURIComponent(column.id || "")}`;

  return (
    <li
      className="list-none min-w-0 relative group/listcard"
      onContextMenu={(e) => onContextMenu(e, column)}
    >
      <Link
        href={href}
        className={cn(
          "focus:outline-none focus:ring-2 focus:ring-gold rounded-xl block w-full",
          isFiltered && "ring-2 ring-amber-500/70 dark:ring-gold/80",
        )}
        title={t("openListTitle", { name: colName })}
      >
        <ListCard
          as="div"
          reserveMenuSpace={true}
          reserveFilterSpace={Boolean(onFilterByColumn && column.id)}
          title={column.name || t("untitled")}
          count={`${completedCount}/${totalCount}`}
          icon={<ColumnIcon size={15} aria-hidden="true" />}
        />
      </Link>

      <div className="absolute top-2 right-1.5 z-10 flex items-center gap-0.5">
        {onFilterByColumn && column.id && (
          <button
            type="button"
            aria-label={t("filterListAria", { name: colName })}
            aria-pressed={isFiltered}
            title={
              isFiltered
                ? t("clearFilterListTitle", { name: colName })
                : t("filterListTitle", { name: colName })
            }
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFilterByColumn(column.id as string, column.workspaceId);
            }}
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-md transition-[opacity,background-color,color] cursor-pointer focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              isFiltered
                ? "opacity-100 bg-amber-500/20 text-amber-800 dark:bg-gold/25 dark:text-gold"
                : "text-neutral-400 hover:text-amber-700 dark:hover:text-gold hover:bg-neutral-800/70 dark:hover:bg-white/10 opacity-100 sm:opacity-0 sm:group-hover/listcard:opacity-100 pointer-coarse:opacity-100 focus-visible:opacity-100",
            )}
          >
            <Filter size={12} aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          aria-label={t("optionsAria", { name: colName })}
          aria-haspopup="menu"
          aria-expanded={isContextMenuOpen}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => onMenuButtonClick(e, column)}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-md transition-[opacity,background-color,color] cursor-pointer",
            "text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/70 dark:hover:bg-white/10",
            "opacity-85 sm:opacity-65 group-hover/listcard:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          )}
        >
          <MoreVertical size={13} aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}
