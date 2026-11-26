import { Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { HELP_PRODUCTIVITY_STEPS } from "@/constants/helpConfig";

export async function HelpProductivityCycle() {
  const t = await getTranslations("help.cycle");

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles
          className="text-gold-ink dark:text-gold shrink-0"
          size={20}
          aria-hidden="true"
        />
        <h2 className="text-body-m sm:text-subtitle-s font-bold text-neutral-100">
          {t("title")}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {HELP_PRODUCTIVITY_STEPS.map((stepItem) => (
          <div
            key={stepItem.step}
            className="rounded-xl bg-card dark:bg-surface/40 border border-neutral-700 dark:border-primary/25 shadow-xs dark:shadow-none p-4 flex flex-col gap-2"
          >
            <div
              className={`w-8 h-8 text-sm rounded-lg border flex items-center justify-center font-bold ${stepItem.badgeClassName}`}
            >
              {stepItem.step}
            </div>
            <h3 className="text-body-s font-bold text-neutral-100">
              {t(`steps.${stepItem.step}.title` as "steps.1.title")}
            </h3>
            <p className="text-tiny text-neutral-300 leading-relaxed">
              {t(`steps.${stepItem.step}.description` as "steps.1.description")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
