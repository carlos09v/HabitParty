import {
  ArrowRight,
  Bug,
  Check,
  CheckCircle2,
  Compass,
  Crown,
  Mail,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { LANDING_ROADMAP_CONFIGS, SUPPORT_LINKS } from "@/constants/landing";
import { cn } from "@/utils";

export function LandingRoadmap() {
  const t = useTranslations("landing.roadmap");

  return (
    <section id="roadmap" className="py-20 md:py-28 relative overflow-hidden">
      {/* Orbe cósmico de fundo */}
      <div className="cosmic-orb absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary-dark/25 blur-[220px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-card dark:bg-surface border border-neutral-700 dark:border-white/10 text-neutral-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <Compass className="w-3.5 h-3.5 text-info" />
            {t("badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-50 tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-300">
            {t("subtitle")}
          </p>

          {/* Banner Chamativo de Conexão com Membros Fundadores */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-gold/10 via-card to-gold/10 border border-gold/40 shadow-glow-gold-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center shrink-0 text-gold shadow-glow-gold-xs">
                <Crown className="w-5 h-5 fill-gold" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-50 flex items-center gap-1.5">
                  {t("founderBanner.title")}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold text-neutral-950 font-black uppercase tracking-wider">
                    {t("founderBanner.spotsBadge")}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300">
                  {t("founderBanner.description")}
                </p>
              </div>
            </div>
            <a
              href="#planos"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <span>{t("founderBanner.cta")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Grid de Releases / Linha de Evolução */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {LANDING_ROADMAP_CONFIGS.map((item, index) => {
            const Icon = item.icon;
            const features = t.raw(`items.${item.id}.features`) as string[];
            const extrasKey = `items.${item.id}.extras` as Parameters<
              typeof t.has
            >[0];
            const extras =
              item.hasExtras && t.has(extrasKey)
                ? (t.raw(extrasKey as Parameters<typeof t.raw>[0]) as string[])
                : undefined;
            const isCompleted = item.status === "completed";

            return (
              <div
                key={item.id}
                className={cn(
                  "relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 group",
                  isCompleted
                    ? "bg-gradient-to-b from-emerald-500/[0.06] via-card to-card dark:from-emerald-950/30 dark:via-surface/70 dark:to-surface/50 border border-emerald-500/30 dark:border-emerald-500/40 hover:border-emerald-500/60 dark:hover:border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.06)] hover:shadow-[0_0_35px_rgba(16,185,129,0.16)] hover:-translate-y-1"
                    : "bg-card/95 dark:bg-surface/60 border border-neutral-700/80 dark:border-white/10 hover:border-neutral-500 dark:hover:border-white/25 shadow-sm dark:shadow-card-deep hover:-translate-y-1",
                  item.borderGlowColor,
                  index === 4 && "md:col-span-2",
                )}
              >
                {/* Linha Decorativa do Topo */}
                <div
                  className={cn(
                    "absolute top-0 left-8 right-8 h-1 rounded-t-full bg-gradient-to-r transition-opacity",
                    isCompleted
                      ? "opacity-100 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                      : "opacity-60 group-hover:opacity-100",
                    item.accentColor,
                  )}
                />

                <div>
                  {/* Cabeçalho do Card: Versão e Status */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1.5",
                          isCompleted
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-surface dark:bg-white/5 border-neutral-700 dark:border-white/10 text-neutral-200",
                        )}
                      >
                        {isCompleted && (
                          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-3" />
                        )}
                        <span>{item.release}</span>
                      </span>
                      <span className="text-xs text-neutral-400 font-mono">
                        {t("phaseLabel", { index: index + 1 })}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border inline-flex items-center gap-1.5",
                        item.statusBadgeColor,
                      )}
                    >
                      {isCompleted && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                      <span>{t(`items.${item.id}.statusLabel`)}</span>
                    </span>
                  </div>

                  {/* Ícone e Título da Release */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs",
                        item.iconBoxColor,
                      )}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3
                        className={cn(
                          "text-xl sm:text-2xl font-bold transition-colors leading-snug flex items-center gap-2",
                          isCompleted
                            ? "text-neutral-50 group-hover:text-emerald-400"
                            : "text-neutral-50 group-hover:text-gold",
                        )}
                      >
                        <span>{t(`items.${item.id}.title`)}</span>
                        {isCompleted && (
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0"
                            title={t(`items.${item.id}.statusLabel`)}
                          >
                            ✓
                          </span>
                        )}
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-300 mt-1 leading-relaxed">
                        {t(`items.${item.id}.tagline`)}
                      </p>
                    </div>
                  </div>

                  {/* Lista de Recursos da Release */}
                  <div className="mt-6 pt-5 border-t border-neutral-700/70 dark:border-white/10 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                      {t("highlightsLabel")}
                    </span>
                    <div
                      className={cn(
                        "space-y-3",
                        index === 4 &&
                          "md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-3 md:space-y-0",
                      )}
                    >
                      {features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2.5">
                          <CheckCircle2
                            className={cn(
                              "w-4 h-4 shrink-0 mt-0.5",
                              item.checkColor,
                            )}
                          />
                          <span className="text-xs sm:text-sm text-neutral-200 leading-tight">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {extras && extras.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-neutral-700/70 dark:border-white/10 space-y-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                            isCompleted
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "text-gold bg-gold/10 border-gold/30",
                          )}
                        >
                          <PlusCircle className="w-3 h-3" />
                          {t("extrasLabel")}
                        </span>
                        <div className="space-y-2 pt-1">
                          {extras.map((extra) => (
                            <div
                              key={extra}
                              className="flex items-start gap-2.5"
                            >
                              <Sparkles
                                className={cn(
                                  "w-3.5 h-3.5 shrink-0 mt-0.5",
                                  isCompleted
                                    ? "text-emerald-400"
                                    : "text-info",
                                )}
                              />
                              <span className="text-xs text-neutral-300 leading-tight">
                                {extra}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rodapé do Card com Micro-Efeito */}
                <div className="mt-8 pt-4 border-t border-neutral-700/40 dark:border-white/5 flex items-center justify-between text-tiny text-neutral-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-emerald-400 font-semibold">
                          {t("cardFooterCompleted")}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-gold/80 shrink-0" />
                        <span>{t("cardFooter")}</span>
                      </>
                    )}
                  </span>
                  <span
                    className={cn(
                      "uppercase font-semibold tracking-wider text-[10px]",
                      isCompleted
                        ? "text-emerald-400/90 font-bold"
                        : "text-neutral-400",
                    )}
                  >
                    {isCompleted ? "Disponível v1.1" : "Gamification System"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chamada Final da Seção com Links de Sugestão e Report */}
        <div className="mt-12 text-center flex flex-col items-center gap-4">
          <p className="text-sm text-neutral-300">{t("feedbackPrompt")}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={SUPPORT_LINKS.githubIssues}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-surface dark:bg-surface/80 dark:hover:bg-surface border border-neutral-700 dark:border-white/15 hover:border-gold/40 text-xs font-semibold text-neutral-200 hover:text-gold shadow-2xs dark:shadow-none transition-all"
            >
              <Bug className="w-3.5 h-3.5 text-gold" />
              <span>{t("reportBugCta")}</span>
            </a>
            <a
              href={SUPPORT_LINKS.contactMailto}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-surface dark:bg-surface/80 dark:hover:bg-surface border border-neutral-700 dark:border-white/15 hover:border-gold/40 text-xs font-semibold text-neutral-200 hover:text-gold shadow-2xs dark:shadow-none transition-all"
            >
              <Mail className="w-3.5 h-3.5 text-info" />
              <span>
                {t("contactCreatorCta", { email: SUPPORT_LINKS.contactEmail })}
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
