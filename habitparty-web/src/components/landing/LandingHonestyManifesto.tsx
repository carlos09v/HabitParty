import { ShieldCheck, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";

export function LandingHonestyManifesto() {
  const t = useTranslations("landing.manifesto");

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Glow cósmico sutil */}
      <div className="cosmic-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[420px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(237,229,57,0.14)_0%,transparent_70%)] pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl p-8 sm:p-12 md:p-14 bg-card dark:bg-surface/95 border border-amber-500/35 dark:border-gold/40 shadow-sm dark:shadow-[0_0_40px_rgba(237,229,57,0.15)] text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 dark:bg-gold/10 border border-amber-500/30 dark:border-gold/30 text-amber-800 dark:text-gold text-xs font-bold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-gold" />
            <span>{t("badge")}</span>
          </div>

          {/* Frase Central em Destaque */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-neutral-50 tracking-tight leading-snug max-w-3xl mx-auto mb-6">
            {t("quoteStart")}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 dark:from-gold dark:via-yellow-200 dark:to-gold">
              {t("quoteHighlight")}
            </span>
            {t("quoteEnd")}
          </h2>

          {/* Manifesto / Explicação */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-neutral-300 leading-relaxed mb-8">
            {t("description")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-neutral-700 dark:border-white/10 text-xs font-semibold text-neutral-200">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold shrink-0" />
              <span>{t("pillars.p1")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold shrink-0" />
              <span>{t("pillars.p2")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold shrink-0" />
              <span>{t("pillars.p3")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
