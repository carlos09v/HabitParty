"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/utils";

export type ViewMode = "card" | "list";

export interface ViewModeSelectorProps {
  value: ViewMode | string;
  onChange: (mode: ViewMode) => void;
  isCompact?: boolean;
  className?: string;
}

export function ViewModeSelector({
  value,
  onChange,
  isCompact = false,
  className,
}: ViewModeSelectorProps) {
  const activeMode: ViewMode = value === "list" ? "list" : "card";

  return (
    <fieldset
      className={cn("flex items-center gap-3 border-none p-0 m-0", className)}
      aria-label="Modo de visualização"
    >
      <button
        type="button"
        onClick={() => onChange("card")}
        aria-pressed={activeMode === "card"}
        title="Visualização em cards"
        className={cn(
          "rounded-[6px] transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gold/50",
          isCompact ? "p-1" : "p-1.5",
          activeMode === "card"
            ? "bg-background border border-gold/50 text-gold shadow-xs"
            : "border border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/5",
        )}
      >
        <LayoutGrid size={isCompact ? 16 : 18} aria-hidden="true" />
      </button>

      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={activeMode === "list"}
        title="Visualização em lista"
        className={cn(
          "rounded-[6px] transition-all cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gold/50",
          isCompact ? "p-1" : "p-1.5",
          activeMode === "list"
            ? "bg-background border border-gold/50 text-gold shadow-xs"
            : "border border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/5",
        )}
      >
        <List size={isCompact ? 16 : 18} aria-hidden="true" />
      </button>
    </fieldset>
  );
}
