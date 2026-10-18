import { ArrowRight, Sparkles, Trophy } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { LANDING_HERO_HIGHLIGHTS } from "@/constants/landing";

export function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Orbes Cósmicos no Fundo */}
      <div className="cosmic-orb absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-primary/30 blur-[180px] pointer-events-none -z-10 opacity-25 dark:opacity-100" />
      <div className="cosmic-orb absolute top-40 right-10 w-[450px] h-[450px] rounded-full bg-magenta/20 blur-[200px] pointer-events-none -z-10 opacity-25 dark:opacity-100" />
      <div className="cosmic-orb absolute top-60 left-10 w-[500px] h-[500px] rounded-full bg-blue/25 blur-[200px] pointer-events-none -z-10 opacity-25 dark:opacity-100" />

      {/* Galáxia Suave no Topo */}
      <div className="absolute top-0 right-0 w-full max-w-[800px] h-[600px] opacity-15 dark:opacity-25 pointer-events-none -z-10 overflow-hidden">
        <Image
          src="/assets/Galaxia.svg"
          alt=""
          fill
          className="object-contain object-top-right select-none"
          priority
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/80 dark:bg-surface/80 border border-neutral-700 dark:border-primary-light/30 shadow-xs dark:shadow-[0_0_15px_rgba(124,58,237,0.3)] mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <Sparkles className="w-4 h-4 text-gold animate-bounce" />
          <span className="text-xs sm:text-sm font-semibold text-neutral-200">
            Gamificação Cósmica 2.0 • Transforme foco e hábitos em um jogo
          </span>
        </div>

        {/* Headline Principal */}
        <h1 className="max-w-4xl mx-auto text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.15] text-neutral-50 mb-6">
          Sua rotina não precisa ser um fardo.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-primary-light to-magenta drop-shadow-none dark:drop-shadow-[0_0_35px_rgba(237,229,57,0.35)]">
            Torne-a lendária.
          </span>
        </h1>

        {/* Subtítulo persuasivo */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-neutral-300 font-normal leading-relaxed mb-10">
          Organize tarefas, mantenha sequências de hábitos e vença a
          procrastinação com o Modo Hiperfoco. Ganhe XP, acumule moedas de ouro
          e troque seu esforço por recompensas reais que você mesmo define.
        </p>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5 mb-14">
          <Link
            href="/signUp"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gold hover:bg-gold-hover text-neutral-900 font-bold text-base shadow-sm dark:shadow-glow-gold hover:shadow-md dark:hover:shadow-[0_0_25px_rgba(237,229,57,0.6)] transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span>Começar Gratuitamente</span>
            <ArrowRight className="w-5 h-5 text-neutral-900" />
          </Link>
          <a
            href="#gamificacao"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-card hover:bg-surface text-neutral-100 hover:text-neutral-50 border border-neutral-700 shadow-sm dark:bg-surface/90 dark:hover:bg-surface-hover dark:text-neutral-200 dark:hover:text-white dark:border-white/10 dark:hover:border-primary-light/40 font-semibold text-base transition-all duration-200 dark:shadow-card-deep"
          >
            <Trophy className="w-5 h-5 text-gold" />
            <span>Testar Gamificação ao Vivo</span>
          </a>
        </div>

        {/* Prova de Valor / Destaques */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-6 border-t border-neutral-700 dark:border-white/10">
          {LANDING_HERO_HIGHLIGHTS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-center sm:justify-start gap-2.5 p-3 rounded-lg bg-card/80 dark:bg-surface/40 border border-neutral-700 dark:border-white/5 shadow-xs dark:shadow-none"
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.colorClass}`} />
                <span className="text-xs sm:text-sm font-medium text-neutral-200">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
