import { Check, Crown, Flame, Shield, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { getFoundersQuotaAction } from "@/actions/paymentActions";
import { LANDING_PLANS } from "@/constants/landing";
import { cn } from "@/utils";

export async function LandingPricing() {
  const quotaRes = await getFoundersQuotaAction();
  const quota = quotaRes.success ? quotaRes.data : null;
  const remainingSlots = quota ? quota.remainingSlots : 30;
  const isAvailable = quota ? quota.isAvailable : true;

  return (
    <section id="planos" className="py-20 md:py-28 relative overflow-hidden">
      {/* Orbe de fundo */}
      <div className="cosmic-orb absolute top-1/2 right-1/4 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-primary/20 blur-[220px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-semibold uppercase tracking-wider mb-3">
            <Crown className="w-3.5 h-3.5" />
            Escolha seu Nível
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-50 tracking-tight">
            Planos desenhados para o seu ritmo.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-300">
            Comece 100% de graça ou garanta uma das{" "}
            <span className="text-gold font-bold">{remainingSlots} vagas</span>{" "}
            de Fundador com acesso completo e insígnia vitalícia no seu perfil.
          </p>

          {/* Banner Chamativo de Promoção de Lançamento */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-gold/15 via-surface dark:via-surface/90 to-gold/15 border-2 border-gold/50 shadow-glow-gold-sm flex flex-col md:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center shrink-0 text-gold shadow-glow-gold-xs">
                <Flame className="w-6 h-6 fill-gold text-neutral-950" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold text-neutral-950 shadow-xs">
                    Special Early Adopter
                  </span>
                  <span className="text-xs font-semibold text-gold">
                    {isAvailable
                      ? `Vagas Restantes: Apenas ${remainingSlots} de 30`
                      : "Lote Promocional Esgotado"}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-50 mt-1">
                  Ganhe o Plano Anual por apenas{" "}
                  <span className="text-gold font-extrabold">R$ 59,90</span> e
                  uma Insígnia Vitalícia de Membro Fundador.
                </h3>
              </div>
            </div>
            <Link
              href="/signUp"
              className="w-full md:w-auto px-5 py-3 rounded-xl bg-gold hover:bg-gold-hover text-neutral-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 shadow-md"
            >
              <Zap className="w-4 h-4 fill-neutral-950" />
              <span>Garantir Minha Vaga</span>
            </Link>
          </div>
        </div>

        {/* Grid de Planos (3 Colunas no Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-7xl mx-auto">
          {LANDING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-3xl p-6 sm:p-9 flex flex-col justify-between transition-all duration-300",
                plan.isFounder
                  ? "bg-card dark:bg-gradient-to-b dark:from-surface dark:via-surface/95 dark:to-background border-2 border-gold shadow-lg dark:shadow-[0_0_45px_rgba(237,229,57,0.3)] hover:shadow-xl dark:hover:shadow-[0_0_60px_rgba(237,229,57,0.45)] sm:scale-[1.02] lg:-translate-y-2 z-10"
                  : plan.highlight
                    ? "bg-card dark:bg-surface/80 border-2 border-primary-light shadow-md"
                    : "bg-card dark:bg-surface/60 border border-neutral-700 dark:border-white/10 hover:border-neutral-500 dark:hover:border-white/20 shadow-sm dark:shadow-card-deep",
              )}
            >
              {/* Badge de Destaque Superior */}
              {plan.isFounder ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold text-neutral-950 font-black text-xs uppercase tracking-wider shadow-glow-gold flex items-center gap-1.5 whitespace-nowrap">
                  <Flame className="w-3.5 h-3.5 fill-neutral-950" />
                  {isAvailable
                    ? `Apenas ${remainingSlots} vagas restantes`
                    : "Lote Esgotado"}
                </div>
              ) : plan.highlight ? (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary-light text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap">
                  <Sparkles className="w-3.5 h-3.5 fill-neutral-950" />
                  Mais Popular
                </div>
              ) : null}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-neutral-50 flex items-center gap-2">
                    {plan.name}
                    {plan.isFounder && (
                      <Crown className="w-5 h-5 text-gold fill-gold" />
                    )}
                  </h3>
                  <span
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border",
                      plan.badgeColor,
                    )}
                  >
                    {plan.badge}
                  </span>
                </div>

                <p className="text-sm text-neutral-300 leading-relaxed mb-6 min-h-[40px]">
                  {plan.description}
                </p>

                {/* Bloco de Preço */}
                <div className="flex flex-col gap-1 mb-6 pb-6 border-b border-neutral-700 dark:border-white/10">
                  {plan.originalPrice && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-neutral-400 line-through font-mono">
                        {plan.originalPrice}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-danger-500/20 text-danger-500 border border-danger-500/30">
                        ~40% OFF
                      </span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl sm:text-5xl font-black text-neutral-50 font-mono">
                      {plan.price}
                    </span>
                    <span className="text-xs sm:text-sm text-neutral-400">
                      / {plan.period}
                    </span>
                  </div>
                </div>

                {/* Box de Insígnia Vitalícia para Membros Fundadores */}
                {plan.isFounder && (
                  <div className="mb-6 p-3.5 rounded-2xl bg-gold/10 border border-gold/40 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center shrink-0 text-gold shadow-glow-gold-xs">
                      <Shield className="w-5 h-5 fill-gold/40" />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-black text-gold uppercase tracking-wider block">
                        Insígnia Vitalícia
                      </span>
                      <span className="text-tiny text-neutral-200">
                        Gravada permanentemente no seu perfil, mesmo após o
                        ciclo anual.
                      </span>
                    </div>
                  </div>
                )}

                {/* Lista de Recursos */}
                <div className="space-y-3 mb-8">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                    O que está incluso:
                  </span>
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5">
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                          plan.isFounder
                            ? "bg-gold/20 text-gold"
                            : plan.highlight
                              ? "bg-primary-light/20 text-primary-light"
                              : "bg-surface text-neutral-300 border border-neutral-700 dark:border-white/10",
                        )}
                      >
                        <Check className="w-3.5 h-3.5" />
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
                  "w-full py-4 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 cursor-pointer text-center",
                  plan.isFounder
                    ? "bg-gold hover:bg-gold-hover text-neutral-950 shadow-sm dark:shadow-glow-gold hover:shadow-md dark:hover:shadow-[0_0_35px_rgba(237,229,57,0.55)]"
                    : plan.highlight
                      ? "bg-primary-light hover:bg-primary text-neutral-950 shadow-sm"
                      : "bg-surface hover:bg-surface-hover text-neutral-50 border border-neutral-700 shadow-xs dark:bg-white/10 dark:hover:bg-white/15 dark:text-neutral-50 dark:border-white/10 dark:shadow-none",
                )}
              >
                {plan.isFounder ? (
                  <>
                    <Zap className="w-4 h-4 fill-neutral-950" />
                    <span>{plan.ctaText}</span>
                  </>
                ) : (
                  <span>{plan.ctaText}</span>
                )}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
