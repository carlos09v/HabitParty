import { Sparkles } from "lucide-react";
import { HELP_PRODUCTIVITY_STEPS } from "@/constants/help";
import { cn } from "@/utils";

interface HelpProductivityCycleProps {
  isCompact?: boolean;
}

export function HelpProductivityCycle({
  isCompact = false,
}: HelpProductivityCycleProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="text-gold" size={20} />
        <h2 className="text-body-m sm:text-subtitle-s font-bold text-neutral-100">
          Como funciona a dinâmica do HabitParty
        </h2>
      </div>

      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
          isCompact ? "gap-2.5" : "gap-3.5",
        )}
      >
        {HELP_PRODUCTIVITY_STEPS.map((stepItem) => (
          <div
            key={stepItem.step}
            className={cn(
              "rounded-xl bg-surface/40 border border-primary/25 backdrop-blur-md flex flex-col",
              isCompact ? "p-3 gap-1.5" : "p-4 gap-2",
            )}
          >
            <div
              className={cn(
                "rounded-lg border flex items-center justify-center font-bold",
                isCompact ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm",
                stepItem.badgeClassName,
              )}
            >
              {stepItem.step}
            </div>
            <h3 className="text-body-s font-bold text-neutral-100">
              {stepItem.title}
            </h3>
            <p className="text-tiny text-neutral-300 leading-relaxed">
              {stepItem.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
