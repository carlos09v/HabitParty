import { Sparkles } from "lucide-react";
import { HELP_PRODUCTIVITY_STEPS } from "@/constants/help";
import { cn } from "@/utils";

export function HelpProductivityCycle() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="text-gold" size={20} />
        <h2 className="text-body-l sm:text-subtitle-s font-bold text-neutral-100">
          Como funciona a dinâmica do HabitParty
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {HELP_PRODUCTIVITY_STEPS.map((stepItem) => (
          <div
            key={stepItem.step}
            className="p-4 rounded-xl bg-surface/40 border border-primary/25 backdrop-blur-md flex flex-col gap-2"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-sm",
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
