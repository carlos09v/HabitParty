import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/utils";

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: ReactNode;
  icon?: LucideIcon;
  badge?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  options: readonly SegmentedControlOption<T>[] | SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * Seletor segmentado com navegação tátil acessível (radiogroup).
 * Substitui seletores inline duplicados com estilo gamificado consistente.
 */
export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className,
  size = "sm",
  disabled = false,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "grid p-1 bg-surface/80 rounded-xl border border-primary/25 gap-1.5 select-none",
        options.length === 2 && "grid-cols-2",
        options.length === 3 && "grid-cols-3",
        options.length === 4 && "grid-cols-4",
        options.length > 4 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4",
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const isDisabled = disabled || option.disabled;
        const Icon = option.icon;

        return (
          // biome-ignore lint/a11y/useSemanticElements: Segmented buttons in radiogroup toolbar pattern
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={isDisabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-lg font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer outline-none",
              size === "sm" ? "py-2 px-3 text-xs" : "py-2.5 px-3.5 text-body-s",
              isSelected
                ? "bg-gold/20 border border-gold text-gold font-bold shadow-glow-gold-xs"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5 border border-transparent",
              isDisabled &&
                "opacity-40 cursor-not-allowed hover:bg-transparent",
              "focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            )}
          >
            {Icon && (
              <Icon
                size={size === "sm" ? 14 : 16}
                className={cn(
                  "shrink-0",
                  isSelected ? "text-gold" : "text-neutral-400",
                )}
              />
            )}
            <span className="truncate">{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={cn(
                  "text-tiny px-1.5 py-0.5 rounded-full border shrink-0",
                  isSelected
                    ? "bg-gold/20 border-gold/40 text-gold"
                    : "bg-surface border-primary/30 text-neutral-300",
                )}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
