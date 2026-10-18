"use client";

import { FOCUS_POMO_PRESETS } from "@/constants/focus";
import { cn } from "@/utils";

export interface FocusDurationPresetsProps {
  totalDurationSeconds: number;
  onChangeDuration: (minutes: number) => void;
}

export function FocusDurationPresets({
  totalDurationSeconds,
  onChangeDuration,
}: FocusDurationPresetsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-tiny text-neutral-400 mr-1">Duração:</span>
      {FOCUS_POMO_PRESETS.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChangeDuration(m)}
          className={cn(
            "px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
            totalDurationSeconds === m * 60
              ? "bg-gold text-neutral-900 border-gold font-bold shadow-glow-gold-xs"
              : "bg-surface/80 border-primary/30 text-neutral-300 hover:text-gold hover:border-gold/40",
          )}
        >
          {m}m
        </button>
      ))}
    </div>
  );
}
