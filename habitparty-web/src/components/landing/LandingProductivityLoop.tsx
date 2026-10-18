import { Sparkles, Zap } from "lucide-react";
import { LANDING_PRODUCTIVITY_STEPS } from "@/constants/landing";
import { cn } from "@/utils";

export function LandingProductivityLoop() {
  return (
    <section
      id="como-funciona"
      className="py-20 md:py-28 relative overflow-hidden"
    >
      {/* Glow de fundo */}
      <div className="cosmic-orb absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[220px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary-light text-xs font-semibold uppercase tracking-wider mb-3">
            <Zap className="w-3.5 h-3.5" />
            Metodologia HabitParty
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-50 tracking-tight">
            O ciclo contínuo de evolução pessoal.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-300">
            Unimos neurociência e mecânicas de gamificação para transformar a
            disciplina em entusiasmo diário.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {LANDING_PRODUCTIVITY_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className={cn(
                  "relative p-8 rounded-2xl bg-card dark:bg-surface/80 border border-neutral-700 dark:border-white/10 shadow-sm dark:shadow-card-deep backdrop-blur-md flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300",
                  step.borderColor,
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-4xl font-black text-neutral-600/40 dark:text-white/10 group-hover:text-neutral-500/50 dark:group-hover:text-white/20 transition-colors font-mono">
                      {step.number}
                    </span>
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-br p-0.5 shadow-md flex items-center justify-center",
                        step.color,
                      )}
                    >
                      <div className="w-full h-full rounded-[10px] bg-card dark:bg-surface flex items-center justify-center">
                        <Icon className="w-6 h-6 text-neutral-50" />
                      </div>
                    </div>
                  </div>

                  <span className="inline-block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    {step.tag}
                  </span>
                  <h3 className="text-xl font-bold text-neutral-50 mb-3 group-hover:text-gold transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-700/60 dark:border-white/5 flex items-center gap-2 text-xs font-semibold text-neutral-400 group-hover:text-neutral-200">
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                  <span>Gamificado e Automatizado</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
