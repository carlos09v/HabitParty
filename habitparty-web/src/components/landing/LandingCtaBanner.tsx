import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function LandingCtaBanner() {
  const t = useTranslations("landing.ctaBanner");

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="relative rounded-3xl p-8 sm:p-12 md:p-16 text-center bg-card dark:bg-gradient-to-b dark:from-surface/90 dark:to-background/90 border border-primary/25 dark:border-primary-light/40 shadow-card-active dark:shadow-[0_0_50px_rgba(124,58,237,0.3)] overflow-hidden">
          {/* Orbes internos */}
          <div className="cosmic-orb absolute -top-36 left-1/2 -translate-x-1/2 w-[560px] h-[420px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(237,229,57,0.18)_0%,transparent_70%)] pointer-events-none opacity-40 dark:opacity-100" />
          <div className="cosmic-orb absolute -bottom-36 -right-4 w-[480px] h-[480px] rounded-full bg-[radial-gradient(circle,rgba(237,43,229,0.22)_0%,transparent_70%)] pointer-events-none opacity-35 dark:opacity-100" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:bg-gold/10 dark:border-gold/30 dark:text-gold text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-4 h-4 fill-amber-500 text-amber-600 dark:fill-gold dark:text-gold" />
              {t("badge")}
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-neutral-50 tracking-tight leading-tight mb-6">
              {t("title")}
            </h2>

            <p className="text-base sm:text-lg text-neutral-300 mb-8 leading-relaxed">
              {t("subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signUp"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gold hover:bg-gold-hover text-on-gold font-extrabold text-base shadow-sm dark:shadow-glow-gold hover:shadow-md dark:hover:shadow-[0_0_30px_rgba(237,229,57,0.6)] transition-[transform,background-color,box-shadow] duration-300 hover:scale-105 active:scale-95"
              >
                <span>{t("primaryCta")}</span>
                <ArrowRight className="w-5 h-5 text-on-gold" />
              </Link>
              <Link
                href="/signIn"
                className="w-full sm:w-auto px-6 py-4 rounded-xl bg-card hover:bg-surface text-neutral-100 hover:text-neutral-50 font-semibold text-base border border-neutral-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-neutral-200 dark:hover:text-white dark:border-white/10 transition-colors"
              >
                {t("secondaryCta")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
