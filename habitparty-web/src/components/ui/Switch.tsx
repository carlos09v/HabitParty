import { cn } from "@/utils";

export interface SwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  thumbContent?: React.ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
}

export function Switch({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  size = "md",
  className,
  thumbContent,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
}: SwitchProps) {
  const isSm = size === "sm";

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onCheckedChange(!checked);
      }}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50 select-none",
        isSm ? "h-5 w-9" : "h-6 w-11",
        checked
          ? "bg-amber-400 dark:bg-amber-500 shadow-glow-gold-xs border border-amber-300 dark:border-amber-400"
          : "bg-neutral-600 border border-neutral-500/70 dark:bg-neutral-800 dark:border-white/10",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center transform rounded-full shadow-sm transition-transform duration-200",
          isSm ? "h-3.5 w-3.5" : "h-4.5 w-4.5",
          checked
            ? isSm
              ? "translate-x-4.5 bg-on-gold text-white"
              : "translate-x-5.5 bg-on-gold text-white"
            : "translate-x-1 bg-white text-neutral-400 dark:text-neutral-600",
        )}
      >
        {thumbContent}
      </span>
    </button>
  );
}
