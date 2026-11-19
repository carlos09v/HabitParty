"use client";

import { cn } from "@/utils";

interface VolumeRangeSliderProps {
  /** Normalized volume value in [0, 1]. */
  value: number;
  onChange: (volume: number) => void;
  ariaLabel: string;
  trackClassName?: string;
}

export function VolumeRangeSlider({
  value,
  onChange,
  ariaLabel,
  trackClassName = "bg-neutral-700 dark:bg-primary/40",
}: VolumeRangeSliderProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-neutral-400 font-semibold">0%</span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={value}
        onChange={(e) => onChange(Number.parseFloat(e.target.value))}
        aria-label={ariaLabel}
        className={cn(
          "w-full h-2 rounded-lg appearance-none cursor-pointer accent-gold",
          trackClassName,
        )}
      />
      <span className="text-xs text-neutral-400 font-semibold">100%</span>
    </div>
  );
}
