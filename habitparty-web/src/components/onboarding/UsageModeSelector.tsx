import { CheckCircle2, Circle } from "lucide-react";
import { USAGE_MODES } from "@/constants/onboarding";
import type { ModeOption, UsageMode } from "@/types/onboarding";
import { cn } from "@/utils";

interface UsageModeSelectorProps {
  selectedMode: UsageMode;
  onSelectMode: (mode: ModeOption) => void;
  disabled?: boolean;
}

export function UsageModeSelector({
  selectedMode,
  onSelectMode,
  disabled = false,
}: UsageModeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-body-s font-bold text-neutral-100 flex items-center gap-2">
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gold/20 text-gold text-[11px] font-bold">
          1
        </span>
        Qual será o seu principal modo de uso?
      </h2>

      {/* Grid 2x2 Compacto de Modos de Uso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {USAGE_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;
          const Icon = mode.icon;

          return (
            <button
              key={mode.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectMode(mode)}
              disabled={disabled}
              className={cn(
                "flex flex-col items-start p-3 sm:p-3.5 rounded-xl border text-left transition-all cursor-pointer relative",
                "outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm text-neutral-50 ring-1 ring-primary/30 dark:border-gold dark:bg-primary-dark/60 dark:shadow-[0_0_14px_rgba(237,229,57,0.18)] dark:ring-1 dark:ring-gold/40 dark:text-neutral-50"
                  : "border-neutral-700 bg-card hover:bg-surface-hover hover:border-neutral-500 text-neutral-300 dark:border-primary/25 dark:bg-surface/40 dark:hover:bg-surface/70 dark:hover:border-primary/50 dark:text-neutral-300",
              )}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <div
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isSelected
                      ? "bg-primary/20 text-primary-dark dark:bg-gold/20 dark:text-gold"
                      : "bg-surface text-neutral-300 dark:bg-primary/20 dark:text-neutral-300",
                  )}
                >
                  <Icon size={16} />
                </div>
                {isSelected ? (
                  <CheckCircle2
                    size={16}
                    className="text-primary-dark dark:text-gold"
                  />
                ) : (
                  <Circle
                    size={16}
                    className="text-neutral-400 dark:text-neutral-500"
                  />
                )}
              </div>
              <span className="text-body-s font-bold text-neutral-50">
                {mode.title}
              </span>
              <span className="text-tiny text-neutral-400 mt-0.5 leading-snug line-clamp-2">
                {mode.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
