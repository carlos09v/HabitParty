import { cn } from "@/utils";

export interface FilterTabOption<T extends string = string> {
  id: T;
  label: string;
}

interface FilterTabStripProps<T extends string = string> {
  options: readonly FilterTabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Faixa horizontal rolável de botões de filtro (pills) padronizada para uso em `FilterBar.leftActions`.
 * Garante foco visível acessível (`ring-focus-ring`) e contraste WCAG AA em todos os 7 temas.
 */
export function FilterTabStrip<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: FilterTabStripProps<T>) {
  return (
    <fieldset
      aria-label={ariaLabel}
      className={cn(
        "flex items-center gap-1.5 p-1 m-0 rounded-xl bg-surface dark:bg-surface/70 border border-neutral-700 dark:border-white/10 shrink-0 overflow-x-auto max-w-full custom-scrollbar",
        className,
      )}
    >
      {options.map((tab) => {
        const isActive = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
              isActive
                ? "bg-gold text-on-gold font-bold shadow-sm"
                : "text-neutral-300 hover:text-neutral-50 hover:bg-card/70 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-white/5",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </fieldset>
  );
}
