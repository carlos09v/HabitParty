import { CalendarClock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils";

interface TaskEventBadgeProps {
  isCompact?: boolean;
  isInProgress?: boolean;
  endTime?: string | null;
  className?: string;
  showIcon?: boolean;
}

/**
 * Badge dedicada para indicar que a tarefa To-Do está configurada como um Evento
 * (possui horário de início/término ou dia inteiro) e destacar quando está em andamento.
 */
export function TaskEventBadge({
  isCompact = false,
  isInProgress = false,
  endTime,
  className,
  showIcon = true,
}: TaskEventBadgeProps) {
  const t = useTranslations("dashboard.taskShared.badges");
  const size = isCompact ? 9 : 11;
  const title = isInProgress
    ? endTime
      ? t("eventInProgressTitle", { end: endTime })
      : t("eventInProgressAllDayTitle")
    : t("eventBadgeTitle");

  return (
    <span
      className={cn(
        "rounded font-semibold border max-w-full shrink-0 uppercase transition-colors inline-flex items-center gap-1 leading-none",
        isInProgress
          ? "text-emerald-700 bg-emerald-500/15 border-emerald-500/40 dark:text-emerald-300 dark:bg-emerald-500/15 dark:border-emerald-400/40"
          : "text-sky-700 bg-sky-500/15 border-sky-500/40 dark:text-info dark:bg-info/15 dark:border-info/40",
        isCompact
          ? "h-[18px] px-1.5 text-label-s tracking-normal"
          : "h-[20px] px-2 text-label-m tracking-wide shadow-2xs",
        className,
      )}
      title={title}
    >
      {showIcon &&
        (isInProgress ? (
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0"
          />
        ) : (
          <CalendarClock
            size={size}
            className="shrink-0 text-sky-700 dark:text-info stroke-[2.5]"
          />
        ))}
      <span className="truncate">
        {isInProgress ? t("eventInProgressLabel") : t("eventBadgeLabel")}
      </span>
    </span>
  );
}
