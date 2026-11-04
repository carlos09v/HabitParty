import {
  ArrowRight,
  CheckCircle2,
  Flame,
  Gift,
  Sparkles,
  Timer,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { CosmicGalaxyIllustration } from "@/components/ui/CosmicGalaxyIllustration";
import { LANDING_HERO_HIGHLIGHT_CONFIGS } from "@/constants/landing";

export function LandingHero() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Orbes Cósmicos no Fundo */}
      <div className="cosmic-orb absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-primary/30 blur-[180px] pointer-events-none -z-10 opacity-25 dark:opacity-100" />
      <div className="cosmic-orb absolute top-40 right-10 w-[450px] h-[450px] rounded-full bg-magenta/20 blur-[200px] pointer-events-none -z-10 opacity-25 dark:opacity-100" />
      <div className="cosmic-orb absolute top-60 left-10 w-[500px] h-[500px] rounded-full bg-blue/25 blur-[200px] pointer-events-none -z-10 opacity-25 dark:opacity-100" />

      {/* Galáxia Suave no Topo */}
      <div className="absolute top-0 right-0 w-full max-w-[800px] h-[600px] opacity-60 dark:opacity-25 pointer-events-none -z-10 overflow-hidden">
        <CosmicGalaxyIllustration priority />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Coluna Esquerda: Copy & CTAs (Tamanho equilibrado e escaneável) */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/80 dark:bg-surface/80 border border-neutral-700 dark:border-primary-light/30 shadow-xs dark:shadow-[0_0_15px_rgba(124,58,237,0.3)] mb-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <Sparkles className="w-4 h-4 text-gold animate-bounce shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-neutral-200">
                {t("badge")}
              </span>
            </div>

            {/* Headline Principal — Reduzida e balanceada ao lado do card preview */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-balance text-neutral-50 mb-5">
              {t("titleLine1")}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-ink via-primary to-magenta dark:from-gold dark:via-primary-light dark:to-magenta drop-shadow-none dark:drop-shadow-[0_0_35px_rgba(237,229,57,0.35)]">
                {t("titleHighlight")}
              </span>
            </h1>

            {/* Subtítulo persuasivo */}
            <p className="max-w-2xl mx-auto lg:mx-0 text-base sm:text-lg text-neutral-300 font-normal leading-relaxed text-pretty mb-8">
              {t("subtitle")}
            </p>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 sm:gap-4 mb-10">
              <Link
                href="/signUp"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-xl bg-gold hover:bg-gold-hover text-on-gold font-bold text-base shadow-sm dark:shadow-glow-gold hover:shadow-md dark:hover:shadow-[0_0_25px_rgba(237,229,57,0.6)] transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <span>{t("primaryCta")}</span>
                <ArrowRight className="w-5 h-5 text-on-gold" />
              </Link>
              <a
                href="#gamificacao"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-card hover:bg-surface text-neutral-100 hover:text-neutral-50 border border-neutral-700 shadow-sm dark:bg-surface/90 dark:hover:bg-surface-hover dark:text-neutral-200 dark:hover:text-white dark:border-white/10 dark:hover:border-primary-light/40 font-semibold text-base transition-all duration-200 dark:shadow-card-deep"
              >
                <Trophy className="w-5 h-5 text-gold" />
                <span>{t("secondaryCta")}</span>
              </a>
            </div>

            {/* Prova de Valor / Destaques */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-6 border-t border-neutral-700 dark:border-white/10">
              {LANDING_HERO_HIGHLIGHT_CONFIGS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-center lg:justify-start gap-2 p-2.5 rounded-lg bg-card/80 dark:bg-surface/40 border border-neutral-700 dark:border-white/5 shadow-xs dark:shadow-none"
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${item.colorClass}`} />
                    <span className="text-xs font-medium text-neutral-200 truncate">
                      {t(`highlights.${item.id}`)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna Direita: Preview Visual dos Cards do Ecossistema */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Glow Cósmico Traseiro */}
              <div className="absolute -inset-3 rounded-3xl bg-gradient-to-tr from-primary/25 via-gold/10 to-magenta/20 blur-2xl -z-10 opacity-75" />

              {/* Painel Principal Flutuante */}
              <div className="rounded-3xl bg-card/95 dark:bg-surface/90 border border-neutral-700/90 dark:border-white/12 p-5 sm:p-6 shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-md space-y-4">
                {/* Topo do Card: Emblema + Modos de Experiência */}
                <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-neutral-700/80 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <Image
                      src="/assets/favicon_io/android-chrome-192x192.png"
                      alt="HabitParty"
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-xs"
                    />
                    <div className="text-left">
                      <span className="text-xs font-extrabold text-neutral-50 tracking-tight block">
                        HabitParty
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium block">
                        Nv. 12 • Aventureiro
                      </span>
                    </div>
                  </div>

                  {/* Pill Dual: Modo Essencial | Modo Aventura */}
                  <div className="inline-flex items-center gap-1 p-1 rounded-full bg-background/80 border border-neutral-700 dark:border-white/10 text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded-full text-cyan-400 bg-cyan-500/10 border border-cyan-500/25 flex items-center gap-1">
                      <CoinIcon size={11} variant="credit" />
                      {t("preview.modeEssential")}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-gold bg-gold/15 border border-gold/30 flex items-center gap-1">
                      <CoinIcon size={11} variant="coin" />
                      {t("preview.modeAdventure")}
                    </span>
                  </div>
                </div>

                {/* Card 1: Tarefa Diária / Quest */}
                <div className="p-3.5 rounded-2xl bg-background/70 dark:bg-background/60 border border-neutral-700/80 dark:border-white/10 flex items-center justify-between gap-3 hover:border-gold/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 text-left">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-magenta">
                          {t("preview.dailyTag")}
                        </span>
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full border border-amber-500/25">
                          {t("preview.streakBadge")}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-neutral-50 truncate">
                        {t("preview.dailyTitle")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[11px] font-extrabold text-info font-mono bg-info/10 px-2 py-0.5 rounded-md border border-info/25">
                      {t("preview.xpReward")}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-gold font-mono bg-gold/10 px-2 py-0.5 rounded-md border border-gold/25">
                      <CoinIcon size={11} variant="coin" />
                      {t("preview.coinReward")}
                    </span>
                  </div>
                </div>

                {/* Card 2: Sessão de Foco Pomodoro */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/15 via-background/70 to-magenta/10 border border-primary-light/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-8 h-8 rounded-xl bg-primary/25 border border-primary-light/40 flex items-center justify-center text-primary-light shrink-0">
                      <Timer className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary-light block">
                        {t("preview.focusTag")}
                      </span>
                      <span className="text-xs font-semibold text-neutral-200">
                        {t("preview.focusStatus")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-gold animate-pulse" />
                    <span className="text-base sm:text-lg font-black font-mono text-neutral-50 tracking-wider">
                      24:59
                    </span>
                  </div>
                </div>

                {/* Card 3: Recompensa / Loja */}
                <div className="p-3.5 rounded-2xl bg-background/70 dark:bg-background/60 border border-neutral-700/80 dark:border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 text-left">
                    <div className="w-8 h-8 rounded-xl bg-gold/15 border border-gold/35 flex items-center justify-center text-gold shrink-0">
                      <Gift className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold block">
                        {t("preview.rewardTag")}
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-neutral-50 truncate">
                        {t("preview.rewardTitle")}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
                    {t("preview.rewardAction")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
