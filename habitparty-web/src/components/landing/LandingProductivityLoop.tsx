import { Sparkles, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { LandingSectionHeader } from "@/components/landing/LandingSectionHeader";
import {
  LANDING_ANCHORS,
  LANDING_PRODUCTIVITY_STEP_CONFIGS,
} from "@/constants/landing";
import { cn } from "@/utils";

export function LandingProductivityLoop() {
  const t = useTranslations("landing.productivityLoop");

  return (
    <section
      id={LANDING_ANCHORS.howItWorks}
      className="landing-section-deferred py-20 md:py-28 relative overflow-hidden scroll-mt-20"
    >
      {/* Glow de fundo */}
      <div
        aria-hidden="true"
        className="cosmic-orb absolute top-1/2 left-1/4 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18)_0%,transparent_70%)] pointer-events-none -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingSectionHeader
          badge={t("badge")}
          badgeIcon={<Zap className="w-3.5 h-3.5" aria-hidden="true" />}
          badgeClassName="bg-primary/10 border-primary/30 text-primary dark:text-primary-light"
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-2xl lg:max-w-none mx-auto relative">
          {LANDING_PRODUCTIVITY_STEP_CONFIGS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  "relative p-6 lg:p-8 rounded-2xl bg-card/85 dark:bg-surface/85 border shadow-none flex flex-col justify-between",
                  step.borderColor,
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "text-4xl font-black font-mono",
                        step.numberColor,
                      )}
                    >
                      {step.number}
                    </span>
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        step.iconBoxClass,
                      )}
                    >
                      <div className="w-full h-full rounded-[10px] bg-transparent dark:bg-surface flex items-center justify-center">
                        <Icon
                          className={cn("w-6 h-6", step.iconColor)}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </div>

                  <span className="inline-block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">
                    {t(`steps.${step.id}.tag`)}
                  </span>
                  <h3 className="text-xl font-bold text-neutral-50 mb-3">
                    {t(`steps.${step.id}.title`)}
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    {t(`steps.${step.id}.description`)}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-neutral-700/60 dark:border-white/5 flex items-center gap-2 text-xs font-semibold text-neutral-300">
                  <Sparkles
                    className="w-3.5 h-3.5 text-gold-ink dark:text-gold shrink-0"
                    aria-hidden="true"
                  />
                  <span>{t(`steps.${step.id}.footer`)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
