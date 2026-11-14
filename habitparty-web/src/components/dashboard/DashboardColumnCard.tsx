"use client";

import { MoreVertical } from "lucide-react";
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
  isCompact: boolean;
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
  isCompact,
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
        className="focus:outline-none focus:ring-2 focus:ring-gold rounded-xl block w-full"
        title={t("openListTitle", { name: colName })}
      >
        <ListCard
          as="div"
          reserveMenuSpace={true}
          compact={isCompact}
          title={column.name || t("untitled")}
          count={`${completedCount}/${totalCount}`}
          icon={<ColumnIcon size={isCompact ? 14 : 15} aria-hidden="true" />}
        />
      </Link>
      <button
        type="button"
        aria-label={t("optionsAria", { name: colName })}
        aria-haspopup="menu"
        aria-expanded={isContextMenuOpen}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => onMenuButtonClick(e, column)}
        className={cn(
          "absolute top-2 right-1.5 z-10 flex items-center justify-center w-7 h-7 rounded-md transition-[opacity,background-color,color] cursor-pointer",
          "text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/70 dark:hover:bg-white/10",
          "opacity-85 sm:opacity-65 group-hover/listcard:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        )}
      >
        <MoreVertical size={14} aria-hidden="true" />
      </button>
    </li>
  );
}
