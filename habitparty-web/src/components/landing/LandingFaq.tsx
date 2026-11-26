import { ChevronDown, HelpCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LandingSectionHeader } from "@/components/landing/LandingSectionHeader";
import { LANDING_ANCHORS, LANDING_FAQ_KEYS } from "@/constants/landing";

export async function LandingFaq() {
  const t = await getTranslations("landing.faq");

  return (
    <section
      id={LANDING_ANCHORS.faq}
      className="landing-section-deferred py-20 md:py-28 relative scroll-mt-20"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <LandingSectionHeader
          badge={t("badge")}
          badgeIcon={
            <HelpCircle className="w-3.5 h-3.5 text-info" aria-hidden="true" />
          }
          title={t("title")}
          subtitle={t("subtitle")}
          titleClassName="text-3xl sm:text-4xl"
          className="mb-14 sm:mb-14"
        />

        <div className="space-y-4">
          {LANDING_FAQ_KEYS.map((faqKey, idx) => (
            <details
              key={faqKey}
              open={idx === 0}
              className="details-accordion group rounded-xl bg-card dark:bg-surface/75 border border-neutral-700 dark:border-white/10 overflow-hidden transition-colors duration-200"
            >
              <summary className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3 text-left text-neutral-100 hover:text-primary dark:hover:text-gold font-semibold text-base transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring">
                <span>{t(`items.${faqKey}.question`)}</span>
                <ChevronDown
                  className="w-5 h-5 text-neutral-400 transition-transform duration-300 shrink-0 ml-4 group-open:rotate-180 group-open:text-primary dark:group-open:text-gold"
                  aria-hidden="true"
                />
              </summary>
              <div className="px-4 sm:px-6 pb-4 sm:pb-5 pt-2 text-sm text-neutral-300 leading-relaxed border-t border-neutral-700/60 dark:border-white/5">
                {t(`items.${faqKey}.answer`)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
