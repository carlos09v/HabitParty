"use client";

import type { IconPickerProps } from "@/types/ui";
import { cn } from "@/utils";

export function IconPicker({
  options,
  value,
  onChange,
  disabled = false,
  columns = 5,
  className,
  isCompact = false,
}: IconPickerProps) {
  const gridColsClass =
    columns === 4
      ? "grid-cols-4"
      : columns === 6
        ? "grid-cols-6"
        : "grid-cols-5";

  return (
    <fieldset
      className={cn("grid gap-2 border-0 p-0 m-0", gridColsClass, className)}
    >
      <legend className="sr-only">Seleção de ícone</legend>
      {options.map((item) => {
        const Icon = item.icon;
        const isSelected = value.toLowerCase() === item.id.toLowerCase();

        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={isSelected}
            title={item.label}
            onClick={() => onChange(item.id)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-lg border transition-all cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-gold",
              isCompact ? "p-1.5 min-h-[50px]" : "p-2 min-h-[56px]",
              isSelected
                ? "border-gold bg-gold/20 text-gold shadow-glow-gold-xs font-bold"
                : "border-primary/30 bg-primary-dark/20 text-white hover:text-gold hover:border-gold/40",
              disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <Icon size={isCompact ? 16 : 18} />
            <span className="text-[10px] font-medium leading-none truncate max-w-full">
              {item.label}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}
