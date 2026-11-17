import { Clock } from "lucide-react";
import { cn } from "@/utils";
import { formatFocusMinutes } from "@/utils/focusFormatters";

interface DurationHoursBadgeProps {
  minutes: number;
  id?: string;
  className?: string;
}

/**
 * Exibe o selo compacto de conversão para horas (ex: `= 1h 30m`)
 * quando a duração informada for igual ou superior a 60 minutos.
 */
export function DurationHoursBadge({
  minutes,
  id,
  className,
}: DurationHoursBadgeProps) {
  if (!Number.isFinite(minutes) || minutes < 60) {
    return null;
  }

  return (
    <span
      id={id}
      aria-live="polite"
      className={cn(
        "inline-flex w-fit items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-emerald-700 dark:text-emerald-300 text-label-m font-bold tabular-nums",
        className,
      )}
    >
      <Clock size={11} aria-hidden="true" />
      <span>= {formatFocusMinutes(minutes)}</span>
    </span>
  );
}
