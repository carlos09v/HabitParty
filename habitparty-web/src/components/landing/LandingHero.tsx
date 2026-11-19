import { ArrowRight, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CosmicGalaxyIllustration } from "@/components/ui/CosmicGalaxyIllustration";
import {
  LANDING_ANCHORS,
  LANDING_HERO_HIGHLIGHT_CONFIGS,
} from "@/constants/landing";
import { LandingHeroPreview } from "./LandingHeroPreview";

export function LandingHero() {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Orbes Cósmicos no Fundo */}
      <div className="cosmic-orb absolute -top-20 left-1/2 -translate-x-1/2 w-[900px] h-[550px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.28)_0%,transparent_70%)] pointer-events-none -z-10 opacity-30 dark:opacity-100" />
      <div className="cosmic-orb absolute top-20 -right-10 w-[680px] h-[680px] rounded-full bg-[radial-gradient(circle,rgba(237,43,229,0.2)_0%,transparent_70%)] pointer-events-none -z-10 opacity-25 dark:opacity-100" />
      <div className="cosmic-orb absolute top-40 -left-10 w-[720px] h-[720px] rounded-full bg-[radial-gradient(circle,rgba(64,57,237,0.24)_0%,transparent_70%)] pointer-events-none -z-10 opacity-25 dark:opacity-100" />

      {/* Galáxia Suave no Topo */}
      <div className="absolute top-0 right-0 w-full max-w-[800px] h-[600px] opacity-60 dark:opacity-25 pointer-events-none -z-10 overflow-hidden">
        <CosmicGalaxyIllustration priority />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Coluna Esquerda: Copy & CTAs (Tamanho equilibrado e escaneável) */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-2xl sm:rounded-full bg-card dark:bg-surface/80 border border-neutral-700 dark:border-primary-light/30 shadow-xs dark:shadow-[0_0_15px_color-mix(in_srgb,var(--color-primary)_30%,transparent)] mb-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-gold shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-neutral-200">
                {t("badge")}
              </span>
            </div>

            {/* Headline Principal — Reduzida e balanceada ao lado do card preview */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.15] text-balance text-neutral-50 mb-5">
              {t("titleLine1")}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-dark via-primary-light to-magenta dark:from-gold dark:via-primary-light dark:to-magenta drop-shadow-none dark:drop-shadow-[0_0_35px_rgba(237,229,57,0.35)]">
                {t("titleHighlight")}
              </span>
            </h1>

            {/* Subtítulo persuasivo */}
            <p className="max-w-2xl mx-auto lg:mx-0 text-base sm:text-lg text-neutral-300 font-normal leading-relaxed text-pretty mb-8">
              {t("subtitle")}
            </p>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 sm:gap-4 mb-3">
              <Link
                href="/signUp"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-3.5 rounded-xl bg-gold hover:bg-gold-hover text-on-gold font-bold text-base shadow-sm dark:shadow-glow-gold hover:shadow-md dark:hover:shadow-[0_0_25px_rgba(237,229,57,0.6)] transition-[transform,background-color,box-shadow] duration-300 hover:scale-105 active:scale-95"
              >
                <span>{t("primaryCta")}</span>
                <ArrowRight className="w-5 h-5 text-on-gold" />
              </Link>
              <a
                href={`#${LANDING_ANCHORS.gamification}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-card hover:bg-surface text-neutral-100 hover:text-neutral-50 border border-neutral-700 shadow-sm dark:bg-surface/90 dark:hover:bg-surface-hover dark:text-neutral-200 dark:hover:text-white dark:border-white/10 dark:hover:border-primary-light/40 font-semibold text-base transition-colors duration-200 dark:shadow-card-deep"
              >
                <Trophy className="w-5 h-5 text-amber-600 dark:text-gold" />
                <span>{t("secondaryCta")}</span>
              </a>
            </div>
            <p className="text-xs text-neutral-400 text-center lg:text-left mb-8">
              {t("ctaHint")}
            </p>

            {/* Prova de Valor / Destaques informativos (planos, sem estilo de botão) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-2.5 pt-6 border-t border-neutral-700 dark:border-white/10">
              {LANDING_HERO_HIGHLIGHT_CONFIGS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-center lg:justify-start gap-2 px-2 py-1.5 rounded-lg bg-surface/40 dark:bg-white/[0.03]"
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${item.colorClass}`} />
                    <span className="text-xs font-medium text-neutral-200 leading-tight">
                      {t(`highlights.${item.id}`)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna Direita: Preview Interativo dos Modos Essencial vs. Aventura */}
          <LandingHeroPreview />
        </div>
      </div>
    </section>
  );
}
