import { cn } from "@/utils";

export interface TaskTagBadgesProps {
  primaryLabel?: string | null;
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
  fallbackLabel,
  hasExtraTags = false,
  extraTagsCount = 0,
  extraTagsTitle,
  isCompact = false,
  variant = "card",
}: TaskTagBadgesProps) {
  const label = primaryLabel || fallbackLabel;
  if (!label) return null;

  return (
    <>
      <span
        className={cn(
          "rounded font-medium bg-white/5 border border-white/10 truncate",
          variant === "card"
            ? cn(
                "text-neutral-300",
                isCompact
                  ? "px-1 py-0.5 text-label-s font-normal leading-tight max-w-[80px]"
                  : "px-1.5 py-0.5 text-tiny max-w-[100px]",
              )
            : cn(
                "text-neutral-200",
                isCompact ? "px-1.5 py-0.5 text-tiny" : "px-2 py-0.5 text-xs",
              ),
        )}
        title={primaryLabel || "Geral"}
      >
        {label}
      </span>

      {hasExtraTags && extraTagsCount > 0 && (
        <span
          className={cn(
            "rounded font-medium bg-white/5 border border-white/10 text-neutral-400 shrink-0 select-none",
            variant === "card"
              ? isCompact
                ? "px-1 py-0.5 text-label-s font-normal leading-tight"
                : "px-1.5 py-0.5 text-tiny"
              : isCompact
                ? "px-1 py-0.5 text-label-s"
                : "px-1.5 py-0.5 text-tiny",
          )}
          title={extraTagsTitle}
        >
          +{extraTagsCount}
        </span>
      )}
    </>
  );
}
