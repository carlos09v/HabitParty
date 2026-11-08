import { useTranslations } from "next-intl";
import { ALIGNMENT_OPTIONS } from "@/constants/routine";
import type { BoardAlignmentSelectorProps } from "@/types/task-ui";
import { cn } from "@/utils";

export function BoardAlignmentSelector({
  value,
  onChange,
  isCompact = false,
  className,
}: BoardAlignmentSelectorProps) {
  const t = useTranslations("tasks.filters.alignment");

  return (
    <fieldset
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg bg-card dark:bg-surface border border-neutral-700 dark:border-white/15 p-0.5 m-0 shadow-xs shrink-0",
        className,
      )}
      aria-label={t("ariaLabel")}
    >
      <span
        aria-hidden="true"
        className={cn(
          "hidden md:inline font-medium text-neutral-400 select-none pl-2 pr-1",
          isCompact ? "text-tiny" : "text-xs",
        )}
      >
        {t("prefixLabel")}
      </span>
      {ALIGNMENT_OPTIONS.map(({ id, icon: Icon }) => {
        const isActive = value === id;
        const label = t(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={isActive}
            title={label}
            className={cn(
              "rounded-md transition-colors cursor-pointer flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-primary/50 dark:focus:ring-gold/60",
              isCompact ? "p-1" : "p-1.5",
              isActive
                ? "bg-primary/10 border border-primary/35 text-primary dark:bg-gold/20 dark:border-gold/50 dark:text-gold dark:shadow-glow-gold-xs"
                : "border border-transparent text-neutral-400 hover:text-neutral-100 hover:bg-surface dark:hover:bg-white/5",
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
