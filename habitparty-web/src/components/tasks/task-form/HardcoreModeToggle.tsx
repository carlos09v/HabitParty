"use client";

import { Info } from "lucide-react";
import { cn } from "@/utils";

interface HardcoreModeToggleProps {
  isHardcore: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function HardcoreModeToggle({
  isHardcore,
  onChange,
  disabled = false,
}: HardcoreModeToggleProps) {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-white/10 mt-auto">
      <div className="flex items-center gap-1.5">
        <span className="text-body-s font-medium text-neutral-300">
          Modo Hardcore?
        </span>
        <span
          title="Penalidade mais severa em moedas/vida ao falhar"
          className="text-white/80 hover:text-gold cursor-help transition-colors"
        >
          <Info size={14} />
        </span>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={isHardcore}
        disabled={disabled}
        onClick={() => onChange(!isHardcore)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gold/50 disabled:opacity-50",
          isHardcore ? "bg-danger-500" : "bg-neutral-700",
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            isHardcore ? "translate-x-6" : "translate-x-1",
          )}
        />
      </button>
    </div>
  );
}
