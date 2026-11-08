import { Check, Crown, Flame, Shield, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getFoundersQuotaAction } from "@/actions/paymentActions";
import { LANDING_PLAN_CONFIGS } from "@/constants/landing";
import { cn } from "@/utils";

export async function LandingPricing() {
  const [quotaRes, t] = await Promise.all([
    getFoundersQuotaAction(),
    getTranslations("landing.pricing"),
  ]);
  const founderPrice = t("founderPrice");
  const founderDiscountBadge = t("founderDiscountBadge");
  const quota = quotaRes.success ? quotaRes.data : null;
  const remainingSlots = quota ? quota.remainingSlots : 30;
  const isAvailable = quota ? quota.isAvailable : true;

  return (
    <section id="planos" className="py-20 md:py-28 relative overflow-hidden">
      {/* Orbe de fundo */}
      <div className="cosmic-orb absolute top-1/2 right-1/4 -translate-y-1/2 w-[750px] h-[750px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.18)_0%,transparent_70%)] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:bg-gold/10 dark:border-gold/30 dark:text-gold text-xs font-semibold uppercase tracking-wider mb-3">
            <Crown className="w-3.5 h-3.5" />
            {t("badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-50 tracking-tight">
            {t("title")}
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-300">
            {t.rich("subtitle", {
              remainingSlots,
              gold: (chunks) => (
                <span className="text-amber-700 dark:text-gold font-bold">
                  {chunks}
                </span>
              ),
            })}
          </p>

          {/* Banner Chamativo de Promoção de Lançamento */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-card to-amber-500/10 dark:from-gold/15 dark:via-surface/90 dark:to-gold/15 border-2 border-amber-500/45 dark:border-gold/50 shadow-sm dark:shadow-glow-gold-sm flex flex-col md:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/35 text-amber-700 dark:bg-gold/20 dark:border-gold/40 flex items-center justify-center shrink-0 dark:text-gold shadow-none dark:shadow-glow-gold-xs">
                <Flame className="w-6 h-6 fill-amber-500 text-amber-700 dark:fill-gold dark:text-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold text-neutral-950 shadow-xs">
                    {t("promoBanner.tag")}
                  </span>
                  <span className="text-xs font-semibold text-amber-800 dark:text-gold">
                    {isAvailable
                      ? t("promoBanner.spotsRemaining", { remainingSlots })
                      : t("promoBanner.soldOut")}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-50 mt-1">
                  {t.rich("promoBanner.headline", {
                    founderPrice,
                    gold: (chunks) => (
                      <span className="text-amber-700 dark:text-gold font-extrabold">
                        {chunks}
                      </span>
                    ),
                  })}
                </h3>
              </div>
            </div>
            <Link
              href="/signUp"
              className="w-full md:w-auto px-5 py-3 rounded-xl bg-gold hover:bg-gold-hover text-neutral-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-[transform,background-color] active:scale-95 shrink-0 shadow-md"
            >
              <Zap className="w-4 h-4 fill-neutral-950" />
              <span>{t("promoBanner.cta")}</span>
            </Link>
          </div>
        </div>

        {/* Grid de Planos (3 Colunas no Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-7xl mx-auto">
          {LANDING_PLAN_CONFIGS.map((plan) => {
            const features = t.raw(`plans.${plan.id}.features`) as string[];
            const originalPriceKey =
              `plans.${plan.id}.originalPrice` as Parameters<typeof t.has>[0];
            const originalPrice =
              plan.hasOriginalPrice && t.has(originalPriceKey)
                ? t(originalPriceKey as Parameters<typeof t>[0])
                : undefined;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative rounded-3xl p-6 sm:p-9 flex flex-col justify-between transition-[transform,border-color,box-shadow] duration-300",
                  plan.isFounder
                    ? "bg-card dark:bg-gradient-to-b dark:from-surface dark:via-surface/95 dark:to-background border-2 border-amber-500/80 dark:border-gold shadow-lg dark:shadow-[0_0_45px_rgba(237,229,57,0.3)] hover:shadow-xl dark:hover:shadow-[0_0_60px_rgba(237,229,57,0.45)] sm:scale-[1.02] lg:-translate-y-2 z-10"
                    : plan.highlight
                      ? "bg-card dark:bg-surface/80 border-2 border-primary-light shadow-md"
                      : "bg-card dark:bg-surface/60 border border-neutral-700 dark:border-white/10 hover:border-neutral-500 dark:hover:border-white/20 shadow-sm dark:shadow-card-deep",
                )}
              >
                {/* Badge de Destaque Superior */}
                {plan.isFounder ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold text-neutral-950 font-black text-xs uppercase tracking-wider shadow-sm dark:shadow-glow-gold flex items-center gap-1.5 whitespace-nowrap">
                    <Flame className="w-3.5 h-3.5 fill-neutral-950" />
                    {isAvailable
                      ? t("cardBadges.spotsLeft", { remainingSlots })
                      : t("cardBadges.soldOut")}
                  </div>
                ) : plan.highlight ? (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary-light text-white dark:text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="w-3.5 h-3.5 fill-white dark:fill-neutral-950" />
                    {t("cardBadges.mostPopular")}
                  </div>
                ) : null}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <h3 className="text-xl sm:text-2xl font-bold text-neutral-50 flex items-center gap-2 min-w-0">
                      <span className="truncate">
                        {t(`plans.${plan.id}.name`)}
                      </span>
                      {plan.isFounder && (
                        <Crown className="w-5 h-5 text-gold fill-gold shrink-0" />
                      )}
                    </h3>
                    <span
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border whitespace-nowrap shrink-0",
                        plan.badgeColor,
                      )}
                    >
                      {t(`plans.${plan.id}.badge`)}
                    </span>
                  </div>

                  <p className="text-sm text-neutral-300 leading-relaxed mb-6 min-h-[40px]">
                    {t(`plans.${plan.id}.description`)}
                  </p>

                  {/* Bloco de Preço */}
                  <div className="flex flex-col gap-1 mb-6 pb-6 border-b border-neutral-700 dark:border-white/10">
                    {originalPrice && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm text-neutral-400 line-through font-mono whitespace-nowrap">
                          {originalPrice}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-danger-500/20 text-danger-500 border border-danger-500/30 whitespace-nowrap">
                          {founderDiscountBadge}
                        </span>
                      </div>
                    )}
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-3xl sm:text-4xl xl:text-5xl font-black text-neutral-50 font-mono whitespace-nowrap shrink-0">
                        {t(`plans.${plan.id}.price`)}
                      </span>
                      <span className="text-xs sm:text-sm text-neutral-400">
                        / {t(`plans.${plan.id}.period`)}
                      </span>
                    </div>
                  </div>

                  {/* Box de Insígnia Vitalícia para Membros Fundadores */}
                  {plan.isFounder && (
                    <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/35 dark:bg-gold/10 dark:border-gold/40 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-700 dark:bg-gold/20 dark:border-gold/40 flex items-center justify-center shrink-0 dark:text-gold shadow-none dark:shadow-glow-gold-xs">
                        <Shield className="w-5 h-5 fill-amber-500/25 dark:fill-gold/40" />
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-black text-amber-800 dark:text-gold uppercase tracking-wider block">
                          {t("lifetimeBadge.title")}
                        </span>
                        <span className="text-tiny text-neutral-200">
                          {t("lifetimeBadge.description")}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Lista de Recursos */}
                  <div className="space-y-3 mb-8">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                      {t("includedLabel")}
                    </span>
                    {features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                            plan.isFounder
                              ? "bg-amber-500/15 text-amber-700 dark:bg-gold/20 dark:text-gold"
                              : plan.id === "guardian"
                                ? "bg-primary/15 text-primary dark:bg-primary-light/20 dark:text-primary-light"
                                : "bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400",
                          )}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                        <span className="text-xs sm:text-sm text-neutral-200 leading-tight">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botão de Ação */}
                <Link
                  href={plan.ctaLink}
                  className={cn(
                    "w-full py-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-[transform,background-color,border-color,color,box-shadow] duration-300 active:scale-95 cursor-pointer text-center",
                    plan.isFounder
                      ? "bg-gold hover:bg-gold-hover text-neutral-950 shadow-sm dark:shadow-glow-gold hover:shadow-md dark:hover:shadow-[0_0_35px_rgba(237,229,57,0.55)]"
                      : plan.highlight
                        ? "bg-primary-light hover:bg-primary text-white dark:text-neutral-950 shadow-sm"
                        : "bg-surface hover:bg-surface-hover text-neutral-50 border border-neutral-700 shadow-xs dark:bg-white/10 dark:hover:bg-white/15 dark:text-neutral-50 dark:border-white/10 dark:shadow-none",
                  )}
                >
                  {plan.isFounder ? (
                    <>
                      <Zap className="w-4 h-4 fill-neutral-950" />
                      <span>{t(`plans.${plan.id}.ctaText`)}</span>
                    </>
                  ) : (
                    <span>{t(`plans.${plan.id}.ctaText`)}</span>
                  )}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Faixa de Segurança e Métodos de Pagamento */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-neutral-300 text-center">
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-gold shrink-0" />
            <span>{t("securityStrip.stripe")}</span>
          </span>
          <span className="hidden sm:inline text-neutral-400 dark:text-neutral-600">
            •
          </span>
          <span>
            {t.rich("securityStrip.methods", {
              card: (chunks) => (
                <strong className="text-neutral-100">{chunks}</strong>
              ),
              pix: (chunks) => <strong className="text-gold">{chunks}</strong>,
            })}
          </span>
          <span className="hidden sm:inline text-neutral-400 dark:text-neutral-600">
            •
          </span>
          <span>{t("securityStrip.cancel")}</span>
        </div>
      </div>
    </section>
  );
}
