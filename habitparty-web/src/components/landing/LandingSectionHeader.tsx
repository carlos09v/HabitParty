import type { ReactNode } from "react";
import { cn } from "@/utils";

interface LandingSectionHeaderProps {
  badge: string;
  badgeIcon: ReactNode;
  badgeClassName?: string;
  title: string;
  subtitle?: ReactNode;
  titleId?: string;
  titleClassName?: string;
  className?: string;
}

export function LandingSectionHeader({
  badge,
  badgeIcon,
  badgeClassName,
  title,
  subtitle,
  titleId,
  titleClassName,
  className,
}: LandingSectionHeaderProps) {
  return (
    <div
      className={cn("text-center max-w-3xl mx-auto mb-14 sm:mb-16", className)}
    >
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-3 border",
          badgeClassName ??
            "bg-card dark:bg-surface border-neutral-700 dark:border-white/10 text-neutral-200",
        )}
      >
        {badgeIcon}
        <span>{badge}</span>
      </div>
      <h2
        id={titleId}
        className={cn(
          "text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-50 tracking-tight text-balance",
          titleClassName,
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base sm:text-lg text-neutral-300 text-pretty">
          {subtitle}
        </p>
      )}
    </div>
  );
}
