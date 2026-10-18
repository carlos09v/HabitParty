import { Award } from "lucide-react";
import { LANDING_FEATURES } from "@/constants/landing";
import { cn } from "@/utils";

export function LandingFeaturesGrid() {
  return (
    <section id="recursos" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-card dark:bg-surface border border-neutral-700 dark:border-white/10 text-neutral-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <Award className="w-3.5 h-3.5 text-gold" />
            Arsenal Completo
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-50 tracking-tight">
            Tudo o que você precisa para dominar sua rotina.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-300">
            Cada recurso foi desenhado para eliminar atrito e recompensar sua
            dedicação com elegância e consistência.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {LANDING_FEATURES.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-6 sm:p-7 rounded-2xl bg-card hover:bg-surface dark:bg-surface/70 dark:hover:bg-surface/90 border border-neutral-700 dark:border-white/10 hover:border-primary-light/35 shadow-xs dark:shadow-card-deep transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-surface dark:bg-card border border-neutral-700 dark:border-white/10 flex items-center justify-center text-primary-dark dark:text-primary-light group-hover:text-gold group-hover:border-gold/30 transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border",
                      item.badgeColor,
                    )}
                  >
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-neutral-50 group-hover:text-gold transition-colors mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
