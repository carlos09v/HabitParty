import { ALIGNMENT_OPTIONS } from "@/constants/routine";
import type { BoardAlignmentSelectorProps } from "@/types/task-ui";
import { cn } from "@/utils";

export function BoardAlignmentSelector({
  value,
  onChange,
  isCompact = false,
  className,
}: BoardAlignmentSelectorProps) {
  return (
    <fieldset
      className={cn(
        "flex items-center rounded-lg bg-surface border border-white/15 p-0.5 shadow-xs shrink-0",
        className,
      )}
      aria-label="Alinhamento do quadro Kanban"
    >
      {ALIGNMENT_OPTIONS.map(({ id, label, icon: Icon }) => {
        const isActive = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={isActive}
            title={label}
            className={cn(
              "rounded-md transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-gold/60",
              isCompact ? "p-1" : "p-1.5",
              isActive
                ? "bg-primary-light/20 border border-gold/40 text-gold shadow-glow-gold-xs"
                : "border border-transparent text-neutral-400 hover:text-neutral-100 hover:bg-white/5",
            )}
          >
            <Icon size={isCompact ? 13 : 15} aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </fieldset>
  );
}
