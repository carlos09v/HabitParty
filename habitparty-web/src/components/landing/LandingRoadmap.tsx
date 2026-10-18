import {
  ArrowRight,
  CheckCircle2,
  Compass,
  Crown,
  Sparkles,
} from "lucide-react";
import { LANDING_ROADMAP_ITEMS } from "@/constants/landing";
import { cn } from "@/utils";

export function LandingRoadmap() {
  return (
    <section id="roadmap" className="py-20 md:py-28 relative overflow-hidden">
      {/* Orbe cósmico de fundo */}
      <div className="cosmic-orb absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary-dark/25 blur-[220px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Seção */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-card dark:bg-surface border border-neutral-700 dark:border-white/10 text-neutral-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <Compass className="w-3.5 h-3.5 text-info" />
            Mapa da Jornada
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-50 tracking-tight">
            Da Jornada Individual ao MMO Social.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-neutral-300">
            Conheça os próximos capítulos da evolução do HabitParty. Cada
            atualização adiciona mais imersão, cooperação e ferramentas para
            turbinar sua consistência.
          </p>

          {/* Banner Chamativo de Conexão com Membros Fundadores */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-gold/10 via-card to-gold/10 border border-gold/40 shadow-glow-gold-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/20 border border-gold/40 flex items-center justify-center shrink-0 text-gold shadow-glow-gold-xs">
                <Crown className="w-5 h-5 fill-gold" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-neutral-50 flex items-center gap-1.5">
                  Acesso Antecipado para Membros Fundadores
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold text-neutral-950 font-black uppercase tracking-wider">
                    30 Vagas
                  </span>
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300">
                  Assinantes pioneiros testam cada fase antes de todos e ganham
                  uma insígnia vitalícia de prestígio no perfil.
                </p>
              </div>
            </div>
            <a
              href="#planos"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-neutral-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-sm"
            >
              <span>Ver Oferta</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Grid de Releases / Linha de Evolução */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {LANDING_ROADMAP_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.release}
                className={cn(
                  "relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 group",
                  "bg-card/90 dark:bg-surface/60 border border-neutral-700/80 dark:border-white/10 hover:border-neutral-500 dark:hover:border-white/25 shadow-sm dark:shadow-card-deep hover:-translate-y-1",
                  item.borderGlowColor,
                  index === 4 && "md:col-span-2",
                )}
              >
                {/* Linha Decorativa do Topo */}
                <div
                  className={cn(
                    "absolute top-0 left-8 right-8 h-1 rounded-t-full bg-gradient-to-r opacity-60 group-hover:opacity-100 transition-opacity",
                    item.accentColor,
                  )}
                />

                <div>
                  {/* Cabeçalho do Card: Versão e Status */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-200">
                        {item.release}
                      </span>
                      <span className="text-xs text-neutral-400 font-mono">
                        Fase 0{index + 1}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border",
                        item.statusBadgeColor,
                      )}
                    >
                      {item.statusLabel}
                    </span>
                  </div>

                  {/* Ícone e Título da Release */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface dark:bg-card border border-neutral-700 dark:border-white/15 flex items-center justify-center shrink-0 text-gold group-hover:scale-105 transition-transform shadow-xs">
                      <Icon className="w-6 h-6 text-neutral-50" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-neutral-50 group-hover:text-gold transition-colors leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-300 mt-1 leading-relaxed">
                        {item.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Lista de Recursos da Release */}
                  <div className="mt-6 pt-5 border-t border-neutral-700/70 dark:border-white/10 space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                      Destaques desta versão:
                    </span>
                    <div
                      className={cn(
                        "space-y-3",
                        index === 4 &&
                          "md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-3 md:space-y-0",
                      )}
                    >
                      {item.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                          <span className="text-xs sm:text-sm text-neutral-200 leading-tight">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card com Micro-Efeito */}
                <div className="mt-8 pt-4 border-t border-neutral-700/40 dark:border-white/5 flex items-center justify-between text-tiny text-neutral-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-gold/80" />
                    Entrega contínua no ecossistema
                  </span>
                  <span className="uppercase font-semibold tracking-wider text-[10px]">
                    RPG System
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chamada Final da Seção */}
        <div className="mt-12 text-center">
          <p className="text-sm text-neutral-400">
            Tem sugestões para as próximas versões? Participe da comunidade e
            vote nas próximas mecânicas.
          </p>
        </div>
      </div>
    </section>
  );
}
