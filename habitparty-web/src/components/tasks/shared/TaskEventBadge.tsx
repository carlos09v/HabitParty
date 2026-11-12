import { CalendarClock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/utils";

interface TaskEventBadgeProps {
  isCompact?: boolean;
  className?: string;
  showIcon?: boolean;
}

/**
 * Badge dedicada para indicar que a tarefa To-Do está configurada como um Evento
 * (possui horário de início/término ou dia inteiro).
 */
export function TaskEventBadge({
  isCompact = false,
  className,
  showIcon = true,
}: TaskEventBadgeProps) {
  const t = useTranslations("dashboard.taskShared.badges");
  const size = isCompact ? 9 : 11;

  return (
    <span
      className={cn(
        "rounded font-semibold border truncate shrink-0 uppercase transition-colors inline-flex items-center gap-1 leading-none text-sky-700 bg-sky-500/15 border-sky-500/40 dark:text-info dark:bg-info/15 dark:border-info/40",
        isCompact
          ? "px-1.5 py-0.5 text-label-s tracking-normal leading-tight"
          : "px-2 py-0.5 text-label-m tracking-wide shadow-2xs",
        className,
      )}
      title={t("eventBadgeTitle")}
    >
      {showIcon && (
        <CalendarClock
          size={size}
          className="shrink-0 text-sky-600 dark:text-info stroke-[2.5]"
        />
      )}
      <span>{t("eventBadgeLabel")}</span>
    </span>
  );
}
