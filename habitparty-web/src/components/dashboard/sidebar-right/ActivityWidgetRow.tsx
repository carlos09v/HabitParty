"use client";

import { MoreVertical, Pause, Play } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { getFocusIcon } from "@/constants/focusIcons";
import { DEFAULT_POMO_MINUTES } from "@/constants/focusRules";
import { useFocusTimerStore } from "@/store/focusTimerStore";
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
  onQuickFocus?: (activity: FocusActivity) => void;
}

export function ActivityWidgetRow({
  activity,
  minutes,
  isContextMenuOpen,
  onContextMenu,
  onMenuButtonClick,
  onQuickFocus,
}: ActivityWidgetRowProps) {
  const t = useTranslations("dashboard.sidebarRight.activitiesWidget");
  const isTarget = useFocusTimerStore(
    (s) => s.target?.type === "activity" && s.target.id === activity.id,
  );
  const isRunning = useFocusTimerStore(
    (s) =>
      s.target?.type === "activity" &&
      s.target.id === activity.id &&
      s.isActive &&
      !s.isPaused,
  );

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
          "group flex items-center justify-between rounded-lg border transition-colors p-2 pr-14",
          isRunning
            ? "bg-amber-500/10 dark:bg-gold/12 border-amber-500/50 dark:border-gold/50 shadow-glow-gold-xs"
            : "bg-card dark:bg-primary-dark/20 border-neutral-700 dark:border-primary/30 shadow-2xs dark:shadow-none hover:bg-card-hover dark:hover:bg-primary-dark/40 hover:border-primary/35 dark:hover:border-primary-light/50",
        )}
      >
        <div className="flex items-center min-w-0 flex-1 gap-2">
          <div
            className={cn(
              "p-1 rounded transition-colors shrink-0",
              isRunning
                ? "bg-gold/20 text-amber-800 dark:text-gold"
                : "bg-primary/10 dark:bg-primary-dark/40 text-primary dark:text-neutral-300 group-hover:text-primary-dark dark:group-hover:text-gold",
            )}
          >
            <Icon size={15} />
          </div>
          <span className="font-medium text-neutral-100 truncate group-hover:text-primary dark:group-hover:text-gold transition-colors text-body-s">
            {activity.name}
          </span>
        </div>

        <span className="text-xs font-bold text-neutral-200 group-hover:text-primary dark:group-hover:text-gold transition-colors tabular-nums shrink-0 ml-2">
          {formatFocusMinutes(minutes)}
        </span>
      </Link>

      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
        {onQuickFocus && (
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickFocus(activity);
            }}
            aria-label={
              isRunning
                ? t("pauseFocusAria", { name: activity.name })
                : t("startFocusAria", { name: activity.name })
            }
            title={
              isRunning
                ? t("pauseFocusAria", { name: activity.name })
                : t("startFocusAria", { name: activity.name })
            }
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
              isRunning
                ? "bg-gold text-on-gold shadow-glow-gold-xs"
                : isTarget
                  ? "bg-gold/20 text-amber-800 dark:text-gold hover:bg-gold hover:text-on-gold"
                  : "text-neutral-400 hover:text-amber-700 dark:hover:text-gold hover:bg-amber-500/15 dark:hover:bg-gold/15",
            )}
          >
            {isRunning ? (
              <Pause size={11} className="fill-current" aria-hidden="true" />
            ) : (
              <Play size={11} className="fill-current" aria-hidden="true" />
            )}
          </button>
        )}

        <button
          type="button"
          aria-label={t("optionsAria", { name: activity.name })}
          aria-haspopup="menu"
          aria-expanded={isContextMenuOpen}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => onMenuButtonClick(e, activity)}
          className={cn(
            "flex items-center justify-center w-6 h-6 rounded-md transition-[opacity,background-color,color] cursor-pointer",
            "text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800/70 dark:hover:bg-white/10",
            "opacity-85 sm:opacity-65 group-hover/act:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
          )}
        >
          <MoreVertical size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
