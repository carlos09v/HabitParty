import { cn } from "@/utils";
import { getTagDepth, getTagLeafLabel } from "@/utils/tags";

interface HierarchicalTagRowProps {
  tag: string;
  isSelected: boolean;
  count?: number;
  onSelect: (tag: string) => void;
}

/**
 * Linha de seleção hierárquica de tag compartilhada entre os popovers de filtro
 * do Dashboard (`TaskAdvancedFilterPopover`) e de `/tasks` (`RoutineFilterPopover`).
 */
export function HierarchicalTagRow({
  tag,
  isSelected,
  count,
  onSelect,
}: HierarchicalTagRowProps) {
  const depth = getTagDepth(tag);
  const leafLabel = getTagLeafLabel(tag);

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(tag)}
      title={tag}
      style={{ paddingLeft: `${8 + depth * 14}px` }}
      className={cn(
        "w-full text-left pr-2 py-1 rounded-md text-tiny font-medium transition-colors cursor-pointer flex items-center justify-between gap-2 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
        isSelected
          ? "bg-gold text-on-gold font-bold"
          : "bg-surface border border-neutral-700/70 text-neutral-200 hover:bg-surface-hover dark:border-transparent dark:bg-white/5 dark:text-neutral-300 dark:hover:bg-white/10",
      )}
    >
      <span className="flex items-center gap-1.5 min-w-0">
        <span
          aria-hidden="true"
          className={cn(
            "shrink-0",
            isSelected
              ? "text-on-gold/80"
              : "text-neutral-400 dark:text-neutral-500",
          )}
        >
          {depth > 0 ? "↳" : "#"}
        </span>
        <span className="truncate">{leafLabel}</span>
      </span>
      {count !== undefined && (
        <span
          className={cn(
            "shrink-0 tabular-nums text-tiny px-1.5 py-0.5 rounded-full",
            isSelected
              ? "bg-on-gold/15 text-on-gold font-bold"
              : "bg-neutral-700/60 dark:bg-white/8 text-neutral-300 dark:text-neutral-400",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
