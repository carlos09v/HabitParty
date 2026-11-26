import type { ReactNode } from "react";
import { cn } from "@/utils";

interface FocusStatCardProps {
  label: string;
  icon: ReactNode;
  value: ReactNode;
  subtitle: string;
  tooltip?: string;
  valueClassName?: string;
}

/**
 * Cartão compacto reutilizável do grid 2×2 de indicadores da sidebar de foco.
 */
export function FocusStatCard({
  label,
  icon,
  value,
  subtitle,
  tooltip,
  valueClassName,
}: FocusStatCardProps) {
  return (
    <div
      className="rounded-xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/50 shadow-2xs dark:shadow-none flex flex-col justify-between transition-colors hover:border-primary/40 dark:hover:border-gold/30 p-2.5 gap-1.5"
      title={tooltip}
    >
      <div className="flex items-center justify-between text-neutral-400">
        <span className="text-tiny font-medium truncate">{label}</span>
        {icon}
      </div>
      <div className="flex flex-col">
        <div
          className={cn(
            "text-body-m font-bold text-neutral-50 dark:text-neutral-100 tabular-nums",
            valueClassName,
          )}
        >
          {value}
        </div>
        <span className="text-tiny text-neutral-400 truncate">{subtitle}</span>
      </div>
    </div>
  );
}
