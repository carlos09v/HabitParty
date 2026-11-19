"use client";

import { ChevronRight, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DEFAULT_POMO_MINUTES, getFocusIcon } from "@/constants/focus";
import type { FocusActivity } from "@/types/focus";
import { cn } from "@/utils";
import { formatFocusMinutes } from "@/utils/focusFormatters";

interface ActivityWidgetRowProps {
  activity: FocusActivity;
  minutes: number;
  isContextMenuOpen: boolean;
  onContextMenu: (e: React.MouseEvent, act: FocusActivity) => void;
  onMenuButtonClick: (
    e: React.MouseEvent<HTMLButtonElement>,
    act: FocusActivity,
  ) => void;
}

export function ActivityWidgetRow({
  activity,
  minutes,
  isContextMenuOpen,
  onContextMenu,
  onMenuButtonClick,
}: ActivityWidgetRowProps) {
  const t = useTranslations("dashboard.sidebarRight.activitiesWidget");
  const Icon = getFocusIcon(activity.icon);
  const typeLabel =
    activity.recordType === "POMO"
      ? t("pomodoroDuration", {
          minutes: activity.targetTimeMinutes || DEFAULT_POMO_MINUTES,
        })
      : t("freeStopwatch");

  return (
    <div className="relative w-full group/act">
      <Link
        href={`/focus?activityId=${activity.id}&from=dashboard`}
        onContextMenu={(e) => onContextMenu(e, activity)}
        title={t("rightClickHint", {
          name: activity.name,
          type: typeLabel,
        })}
        className={cn(
          "group flex items-center justify-between rounded-lg border transition-colors p-2 pr-8",
          "bg-card dark:bg-primary-dark/20 border-neutral-700 dark:border-primary/30 shadow-2xs dark:shadow-none hover:bg-card-hover dark:hover:bg-primary-dark/40 hover:border-primary/35 dark:hover:border-primary-light/50",
        )}
      >
        <div className="flex items-center min-w-0 flex-1 gap-2">
          <div className="p-1 rounded bg-primary/10 dark:bg-primary-dark/40 text-primary dark:text-neutral-300 group-hover:text-primary-dark dark:group-hover:text-gold transition-colors shrink-0">
            <Icon size={15} />
          </div>
          <span className="font-medium text-neutral-100 truncate group-hover:text-primary dark:group-hover:text-gold transition-colors text-body-s">
            {activity.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <span className="text-xs font-bold text-neutral-200 group-hover:text-primary dark:group-hover:text-gold transition-colors">
            {formatFocusMinutes(minutes)}
          </span>
          <ChevronRight
            size={14}
            className="text-neutral-500 group-hover:text-primary dark:group-hover:text-gold transition-colors"
          />
        </div>
      </Link>
      <button
        type="button"
        aria-label={t("optionsAria", { name: activity.name })}
        aria-haspopup="menu"
        aria-expanded={isContextMenuOpen}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => onMenuButtonClick(e, activity)}
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-md transition-[opacity,background-color,color] cursor-pointer",
          "text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/70 dark:hover:bg-white/10",
          "opacity-85 sm:opacity-65 group-hover/act:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        )}
      >
        <MoreVertical size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
