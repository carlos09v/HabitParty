import { useTranslations } from "next-intl";
import { cn } from "@/utils";

export interface TaskTagBadgesProps {
  primaryLabel?: string | null;
  primaryTitle?: string | null;
  fallbackLabel?: string;
  hasExtraTags?: boolean;
  extraTagsCount?: number;
  extraTagsTitle?: string;
  isCompact?: boolean;
  variant?: "card" | "row";
}

/**
 * Exibe a pílula principal de tag/lista e o contador `+N` de tags extras,
 * compartilhado entre RoutineTaskCard e TaskRow.
 */
export function TaskTagBadges({
  primaryLabel,
  primaryTitle,
  fallbackLabel,
  hasExtraTags = false,
  extraTagsCount = 0,
  extraTagsTitle,
  isCompact = false,
  variant = "card",
}: TaskTagBadgesProps) {
  const t = useTranslations("dashboard.taskShared.badges");
  const label = primaryLabel || fallbackLabel;
  if (!label) return null;

  if (variant === "card") {
    return (
      <span className="inline-flex items-center gap-1 min-w-0 max-w-full">
        <span
          className={cn(
            "inline-flex items-center min-w-0 rounded font-medium bg-surface/80 dark:bg-white/5 border border-neutral-700/60 dark:border-white/10 text-neutral-300 leading-none",
            isCompact
              ? "h-[17px] px-1.5 text-label-s font-normal"
              : "h-[18px] px-1.5 text-tiny",
          )}
          title={primaryTitle || primaryLabel || t("defaultCategory")}
        >
          <span className="truncate">{label}</span>
        </span>

        {hasExtraTags && extraTagsCount > 0 && (
          <span
            className={cn(
              "inline-flex items-center justify-center rounded font-medium bg-surface/80 dark:bg-white/5 border border-neutral-700/60 dark:border-white/10 text-neutral-400 shrink-0 select-none leading-none tabular-nums",
              isCompact
                ? "h-[17px] px-1 text-label-s font-normal"
                : "h-[18px] px-1.5 text-tiny",
            )}
            title={extraTagsTitle}
          >
            +{extraTagsCount}
          </span>
        )}
      </span>
    );
  }

  return (
    <>
      <span
        className={cn(
          "rounded font-medium bg-surface/80 dark:bg-white/5 border border-neutral-700/60 dark:border-white/10 truncate text-neutral-200",
          isCompact ? "px-1.5 py-0.5 text-tiny" : "px-2 py-0.5 text-xs",
        )}
        title={primaryTitle || primaryLabel || t("defaultCategory")}
      >
        {label}
      </span>

      {hasExtraTags && extraTagsCount > 0 && (
        <span
          className={cn(
            "rounded font-medium bg-surface/80 dark:bg-white/5 border border-neutral-700/60 dark:border-white/10 text-neutral-400 shrink-0 select-none tabular-nums",
            isCompact ? "px-1 py-0.5 text-label-s" : "px-1.5 py-0.5 text-tiny",
          )}
          title={extraTagsTitle}
        >
          +{extraTagsCount}
        </span>
      )}
    </>
  );
}
