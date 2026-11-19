import { Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { LANDING_ANCHORS, LANDING_FEATURE_CONFIGS } from "@/constants/landing";
import { cn } from "@/utils";

export function LandingFeaturesGrid() {
  const t = useTranslations("landing.features");

  return (
    <section id={LANDING_ANCHORS.features} className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-card dark:bg-surface border border-neutral-700 dark:border-white/10 text-neutral-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <Award className="w-3.5 h-3.5 text-gold" />
            {t("badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-50 tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-300">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {LANDING_FEATURE_CONFIGS.map((item) => {
            const Icon = item.icon;
            const isFullWidth = item.id === "partyGuild";
            return (
              <div
                key={item.id}
                className={cn(
                  "p-6 sm:p-7 rounded-2xl bg-card/85 dark:bg-surface/65 border border-neutral-700/80 dark:border-white/10 shadow-none",
                  isFullWidth &&
                    "md:col-span-2 lg:col-span-3 lg:flex lg:items-center lg:justify-between lg:gap-8",
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-between flex-wrap gap-2 mb-4",
                    isFullWidth &&
                      "lg:mb-0 lg:shrink-0 lg:flex-col lg:items-start",
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl border flex items-center justify-center",
                      item.iconBoxColor,
                    )}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md",
                      item.badgeColor,
                    )}
                  >
                    {t(`items.${item.id}.badge`)}
                  </span>
                </div>
                <div className={cn(isFullWidth && "lg:flex-1")}>
                  <h3 className="text-lg font-bold text-neutral-50 mb-2">
                    {t(`items.${item.id}.title`)}
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">
                    {t(`items.${item.id}.description`)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
