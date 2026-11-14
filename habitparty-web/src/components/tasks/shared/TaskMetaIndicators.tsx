"use client";

import { Timer, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useFocusTimerStore } from "@/store/focusTimerStore";
import { cn } from "@/utils";
import { formatDurationMinutes } from "@/utils/focusFormatters";

export function TaskHardcoreBadge({
  isHardcoreOverdue,
  isCompact = false,
}: {
  isHardcoreOverdue: boolean;
  isCompact?: boolean;
}) {
  const t = useTranslations("dashboard.taskShared.badges");
  const { isGamified } = useExperienceMode();

  const title = isGamified
    ? isHardcoreOverdue
      ? t("hardcoreOverdueTitle")
      : t("hardcoreActiveTitle")
    : isHardcoreOverdue
      ? t("hardcoreOverdueTitleProductivity")
      : t("hardcoreActiveTitleProductivity");

  return (
    <span
      title={title}
      className={cn(
        "shrink-0 transition-colors",
        isHardcoreOverdue
          ? "text-danger-500 animate-pulse"
          : "text-warning-500 hover:text-warning-hover",
      )}
    >
      <Zap size={isCompact ? 10 : 12} />
    </span>
  );
}

export function TaskFocusTimeBadge({
  taskId,
  totalFocusMinutes = 0,
  focusCyclesCount = 0,
  isCompact = false,
}: {
  taskId: string;
  totalFocusMinutes?: number;
  focusCyclesCount?: number;
  isCompact?: boolean;
}) {
  const t = useTranslations("dashboard.taskShared.badges");
  const focusState = useFocusTimerStore((s) => {
    if (s.target?.taskId !== taskId) return "none";
    if (s.isActive && !s.isPaused) return "running";
    if (s.isActive) return "paused";
    return "linked";
  });

  if (focusState === "none" && totalFocusMinutes <= 0) {
    return null;
  }

  const formattedTime =
    totalFocusMinutes > 0 ? formatDurationMinutes(totalFocusMinutes) : null;

  return (
    <span
      title={
        focusState === "running"
          ? t("focusRunningTitle")
          : t("focusTimeTitle", {
              time: formattedTime || "0m",
              cycles: focusCyclesCount,
            })
      }
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-md border px-1.5 py-0.5 shrink-0 transition-colors",
        isCompact ? "text-label-s leading-none" : "text-tiny",
        focusState === "running"
          ? "text-amber-800 bg-amber-500/15 border-amber-500/45 dark:text-gold dark:bg-gold/15 dark:border-gold/50 animate-pulse font-semibold"
          : focusState !== "none"
            ? "text-amber-700 bg-amber-500/10 border-amber-500/35 dark:text-gold/90 dark:bg-gold/10 dark:border-gold/30"
            : "text-neutral-300 bg-surface border-neutral-700 dark:bg-white/5 dark:border-white/12",
      )}
    >
      <Timer
        size={isCompact ? 9 : 11}
        className={cn(
          "shrink-0",
          focusState !== "none"
            ? "text-gold-ink dark:text-gold"
            : "text-primary dark:text-purple-200",
        )}
      />
      <span>{formattedTime || t("focusActiveShort")}</span>
    </span>
  );
}
