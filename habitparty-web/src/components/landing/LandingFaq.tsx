import { ChevronDown, HelpCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LANDING_FAQ_KEYS } from "@/constants/landing";

export async function LandingFaq() {
  const t = await getTranslations("landing.faq");

  return (
    <section id="faq" className="py-20 md:py-28 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-card dark:bg-surface border border-neutral-700 dark:border-white/10 text-neutral-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-info" />
            {t("badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-neutral-50 tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-3 text-base text-neutral-300">{t("subtitle")}</p>
        </div>

        <div className="space-y-4">
          {LANDING_FAQ_KEYS.map((faqKey, idx) => (
            <details
              key={faqKey}
              name="landing-faq"
              open={idx === 0}
              className="group rounded-xl bg-card dark:bg-surface/75 border border-neutral-700 dark:border-white/10 overflow-hidden transition-colors duration-200"
            >
              <summary className="w-full px-6 py-5 flex items-center justify-between text-left text-neutral-100 hover:text-primary dark:hover:text-gold font-semibold text-base transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span>{t(`items.${faqKey}.question`)}</span>
                <ChevronDown className="w-5 h-5 text-neutral-400 transition-transform duration-300 shrink-0 ml-4 group-open:rotate-180 group-open:text-primary dark:group-open:text-gold" />
              </summary>
              <div className="px-6 pb-5 pt-1 text-sm text-neutral-300 leading-relaxed border-t border-neutral-700/60 dark:border-white/5 animate-in fade-in duration-200">
                {t(`items.${faqKey}.answer`)}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
