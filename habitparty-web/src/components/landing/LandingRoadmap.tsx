import {
  ArrowRight,
  Bug,
  Check,
  CheckCircle2,
  ChevronDown,
  Compass,
  Crown,
  Mail,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { LandingSectionHeader } from "@/components/landing/LandingSectionHeader";
import {
  LANDING_ANCHORS,
  LANDING_ROADMAP_CONFIGS,
  ROADMAP_STATUS_STYLES,
  SUPPORT_LINKS,
} from "@/constants/landing";
import { getFoundersQuota } from "@/services/paymentService";
import type { FoundersQuotaDTO } from "@/types/payment";
import { cn } from "@/utils";

interface LandingRoadmapProps {
  quota?: FoundersQuotaDTO;
}

export async function LandingRoadmap({
  quota: providedQuota,
}: LandingRoadmapProps = {}) {
  const [quota, t] = await Promise.all([
    providedQuota ? Promise.resolve(providedQuota) : getFoundersQuota(),
    getTranslations("landing.roadmap"),
  ]);

  const completedItems = LANDING_ROADMAP_CONFIGS.filter(
    (item) => item.status === "completed",
  );
  const upcomingItems = LANDING_ROADMAP_CONFIGS.filter(
    (item) => item.status !== "completed",
  );

  return (
    <section
      id={LANDING_ANCHORS.roadmap}
      className="landing-section-deferred py-20 md:py-28 relative overflow-hidden scroll-mt-20"
    >
      {/* Orbe cósmico de fundo */}
      <div
        aria-hidden="true"
        className="cosmic-orb absolute top-1/3 left-1/2 -translate-x-1/2 w-[780px] h-[780px] rounded-full bg-[radial-gradient(circle,rgba(73,22,166,0.18)_0%,transparent_70%)] pointer-events-none -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Seção */}
        <div className="max-w-3xl mx-auto mb-12 sm:mb-14">
          <LandingSectionHeader
            badge={t("badge")}
            badgeIcon={
              <Compass className="w-3.5 h-3.5 text-info" aria-hidden="true" />
            }
            title={t("title")}
            subtitle={t("subtitle")}
            className="mb-8 sm:mb-8"
          />

          {/* Banner de Conexão com Membros Fundadores (Quota Dinâmica) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-card to-amber-500/10 dark:from-gold/10 dark:via-card dark:to-gold/10 border border-amber-500/35 dark:border-gold/40 shadow-xs dark:shadow-glow-gold-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/35 text-gold-ink dark:bg-gold/20 dark:border-gold/40 flex items-center justify-center shrink-0 dark:text-gold shadow-none dark:shadow-glow-gold-xs">
                <Crown
                  className="w-5 h-5 fill-amber-500/30 dark:fill-gold"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-50 flex items-center flex-wrap gap-1.5">
                  <span>{t("founderBanner.title")}</span>
                  <span
                    className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider whitespace-nowrap shrink-0",
                      quota.isAvailable
                        ? "bg-gold text-on-gold"
                        : "bg-surface border border-neutral-700 dark:border-white/15 text-neutral-200",
                    )}
                  >
                    {quota.isAvailable
                      ? t("founderBanner.spotsBadge", {
                          remainingSlots: quota.remainingSlots,
                        })
                      : t("founderBanner.soldOutBadge")}
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 mt-0.5">
                  {quota.isAvailable
                    ? t("founderBanner.description")
                    : t("founderBanner.soldOutDescription")}
                </p>
              </div>
            </div>
            <a
              href={`#${LANDING_ANCHORS.pricing}`}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-on-gold font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-[transform,background-color] active:scale-95 shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
            >
              <span>
                {quota.isAvailable
                  ? t("founderBanner.cta")
                  : t("founderBanner.soldOutCta")}
              </span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Bloco Compacto Expansível: Versões Já Entregues (v1.1 – v1.4) */}
        <details className="details-accordion group mb-10 rounded-3xl bg-gradient-to-b from-success-500/[0.06] via-card to-card dark:from-emerald-950/25 dark:via-surface/65 dark:to-surface/45 border border-success-500/30 dark:border-success-500/35 overflow-hidden">
          <summary className="w-full px-5 sm:px-8 py-5 sm:py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring">
            <div className="space-y-2 text-left min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-success-500/15 text-success-400 border border-success-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t("deliveredGroup.badge")}</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {completedItems.map((item) => (
                    <span
                      key={item.id}
                      className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-success-500/10 text-success-400 border border-success-500/20"
                    >
                      {t(`items.${item.id}.releaseLabel`)}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold text-neutral-50">
                {t("deliveredGroup.title")}
              </p>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-3xl">
                {t("deliveredGroup.subtitle")}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-xs font-bold text-success-400 shrink-0 self-start lg:self-center px-3.5 py-2 rounded-xl bg-success-500/10 border border-success-500/25">
              <span>{t("deliveredGroup.toggleLabel")}</span>
              <ChevronDown
                className="w-4 h-4 transition-transform duration-300 group-open:rotate-180 shrink-0"
                aria-hidden="true"
              />
            </div>
          </summary>

          <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-2 border-t border-success-500/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 pt-4">
              {completedItems.map((item) => {
                const Icon = item.icon;
                const styles = ROADMAP_STATUS_STYLES[item.status];
                const features = t.raw(`items.${item.id}.features`) as string[];
                const extrasKey = `items.${item.id}.extras` as Parameters<
                  typeof t.has
                >[0];
                const extras =
                  item.hasExtras && t.has(extrasKey)
                    ? (t.raw(
                        extrasKey as Parameters<typeof t.raw>[0],
                      ) as string[])
                    : undefined;

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl p-5 bg-card/90 dark:bg-background/50 border border-success-500/25 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-success-500/12 text-success-400">
                          <Check
                            className="w-3.5 h-3.5 stroke-3"
                            aria-hidden="true"
                          />
                          <span>{t(`items.${item.id}.releaseLabel`)}</span>
                        </span>
                        <span
                          className={cn(
                            "text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                            styles.statusBadgeColor,
                          )}
                        >
                          {t(`items.${item.id}.statusLabel`)}
                        </span>
                      </div>

                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0",
                            styles.iconBoxColor,
                          )}
                        >
                          <Icon className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-neutral-50 leading-snug">
                            {t(`items.${item.id}.title`)}
                          </h3>
                          <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                            {t(`items.${item.id}.tagline`)}
                          </p>
                        </div>
                      </div>

                      <ul className="space-y-2 pt-3 border-t border-neutral-700/50 dark:border-white/10">
                        {features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2 text-xs text-neutral-200 leading-snug"
                          >
                            <CheckCircle2
                              className={cn(
                                "w-3.5 h-3.5 shrink-0 mt-0.5",
                                styles.checkColor,
                              )}
                              aria-hidden="true"
                            />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {extras && extras.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-neutral-700/40 dark:border-white/10 space-y-1.5">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-success-400">
                            <PlusCircle
                              className="w-3 h-3"
                              aria-hidden="true"
                            />
                            <span>{t("extrasLabel")}</span>
                          </span>
                          {extras.map((extra) => (
                            <p
                              key={extra}
                              className="text-xs text-neutral-300 leading-snug"
                            >
                              {extra}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </details>

        {/* Próximos Capítulos (Em Destaque) */}
        <div className="mb-5 flex items-center gap-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200">
            {t("upcomingHeading")}
          </h3>
          <div
            aria-hidden="true"
            className="h-px flex-1 bg-neutral-700/70 dark:bg-white/10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {upcomingItems.map((item, idx) => {
            const Icon = item.icon;
            const styles = ROADMAP_STATUS_STYLES[item.status];
            const features = t.raw(`items.${item.id}.features`) as string[];
            const phaseIndex = completedItems.length + idx + 1;
            const isFullWidth = idx === upcomingItems.length - 1;

            return (
              <article
                key={item.id}
                className={cn(
                  "relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between bg-card/90 dark:bg-surface/55 border border-neutral-700/80 dark:border-white/10 shadow-none",
                  isFullWidth && "md:col-span-2",
                )}
              >
                {/* Linha Decorativa do Topo */}
                <div
                  aria-hidden="true"
                  className={cn(
                    "absolute top-0 left-8 right-8 h-1 rounded-t-full bg-gradient-to-r opacity-85",
                    styles.accentColor,
                  )}
                />

                <div>
                  {/* Cabeçalho do Card: Versão e Status */}
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-surface/80 dark:bg-white/5 text-neutral-200 whitespace-nowrap">
                        {t(`items.${item.id}.releaseLabel`)}
                      </span>
                      <span className="text-xs text-neutral-400 font-mono">
                        {t("phaseLabel", { index: phaseIndex })}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md inline-flex items-center gap-1.5 whitespace-nowrap",
                        styles.statusBadgeColor,
                      )}
                    >
                      {t(`items.${item.id}.statusLabel`)}
                    </span>
                  </div>

                  {/* Ícone e Título da Release */}
                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0",
                        styles.iconBoxColor,
                      )}
                    >
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h4 className="text-xl sm:text-2xl font-bold text-neutral-50 leading-snug">
                        {t(`items.${item.id}.title`)}
                      </h4>
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
                    <ul
                      className={cn(
                        "space-y-3",
                        isFullWidth &&
                          "md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-3 md:space-y-0",
                      )}
                    >
                      {features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <CheckCircle2
                            className={cn(
                              "w-4 h-4 shrink-0 mt-0.5",
                              styles.checkColor,
                            )}
                            aria-hidden="true"
                          />
                          <span className="text-xs sm:text-sm text-neutral-200 leading-tight">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Rodapé do Card */}
                <div className="mt-8 pt-4 border-t border-neutral-700/40 dark:border-white/5 flex items-center justify-between flex-wrap gap-2 text-tiny text-neutral-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles
                      className="w-3.5 h-3.5 text-gold-ink dark:text-gold shrink-0"
                      aria-hidden="true"
                    />
                    <span>{t("cardFooter")}</span>
                  </span>
                  <span className="uppercase font-semibold tracking-wider text-[10px] text-neutral-400">
                    {t("cardFooterPlannedTag")}
                  </span>
                </div>
              </article>
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
              className="inline-flex items-center justify-center text-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-surface dark:bg-surface/80 dark:hover:bg-surface border border-neutral-700 dark:border-white/15 hover:border-primary/40 dark:hover:border-gold/40 text-xs font-semibold text-neutral-200 hover:text-primary dark:hover:text-gold shadow-2xs dark:shadow-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <Bug
                className="w-3.5 h-3.5 text-gold-ink dark:text-gold shrink-0"
                aria-hidden="true"
              />
              <span>{t("reportBugCta")}</span>
            </a>
            <a
              href={SUPPORT_LINKS.contactMailto}
              className="inline-flex items-center justify-center text-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-surface dark:bg-surface/80 dark:hover:bg-surface border border-neutral-700 dark:border-white/15 hover:border-primary/40 dark:hover:border-gold/40 text-xs font-semibold text-neutral-200 hover:text-primary dark:hover:text-gold shadow-2xs dark:shadow-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <Mail
                className="w-3.5 h-3.5 text-info shrink-0"
                aria-hidden="true"
              />
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
