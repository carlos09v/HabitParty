"use client";

import { CheckCircle2, Flame, Gift, Timer } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { cn } from "@/utils";

type PreviewExperienceMode = "essential" | "adventure";

/**
 * Cartão interativo de pré-visualização no Hero da Landing Page.
 * Permite alternar ao vivo entre Modo Essencial e Modo Aventura enquanto mantém os cards internos puramente demonstrativos.
 */
export function LandingHeroPreview() {
  const t = useTranslations("landing.hero");
  const [mode, setMode] = useState<PreviewExperienceMode>("adventure");
  const isEssential = mode === "essential";

  return (
    <div className="lg:col-span-5 relative">
      <div className="relative mx-auto max-w-md lg:max-w-none">
        {/* Glow Cósmico Traseiro */}
        <div className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.16)_0%,rgba(237,43,229,0.08)_45%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.28)_0%,rgba(237,229,57,0.1)_42%,rgba(237,43,229,0.18)_58%,transparent_75%)] -z-10 pointer-events-none" />

        {/* Painel Principal */}
        <div className="rounded-3xl bg-card dark:bg-surface/95 border border-neutral-700/90 dark:border-white/12 p-5 sm:p-6 shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.55)] space-y-4">
          {/* Topo do Card: Identidade + Seletor Interativo de Modo */}
          <div className="flex items-center justify-between flex-wrap gap-2.5 pb-3.5 border-b border-neutral-700/80 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <Image
                src="/assets/favicon_io/android-chrome-192x192.png"
                alt="HabitParty"
                width={36}
                height={36}
                className="w-9 h-9 object-contain shrink-0 drop-shadow-xs"
              />
              <div className="text-left">
                <span className="text-xs font-extrabold text-neutral-50 tracking-tight block">
                  HabitParty
                </span>
                <span className="text-[10px] text-neutral-400 font-medium block">
                  {isEssential
                    ? t("preview.levelEssential")
                    : t("preview.levelAdventure")}
                </span>
              </div>
            </div>

            {/* Alternador real: Modo Essencial | Modo Aventura */}
            <div
              role="tablist"
              aria-label={t("preview.modeSwitcherLabel")}
              className="inline-flex items-center gap-1 p-1 rounded-full bg-background/80 border border-neutral-700 dark:border-white/10 text-[10px] font-bold shrink-0"
            >
              <button
                type="button"
                role="tab"
                aria-selected={isEssential}
                onClick={() => setMode("essential")}
                className={cn(
                  "px-2.5 py-1 rounded-full flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer",
                  isEssential
                    ? "text-cyan-700 dark:text-cyan-300 bg-cyan-500/15 border border-cyan-500/35"
                    : "text-neutral-400 hover:text-neutral-200 border border-transparent",
                )}
              >
                <CoinIcon size={11} variant="credit" />
                {t("preview.modeEssential")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={!isEssential}
                onClick={() => setMode("adventure")}
                className={cn(
                  "px-2.5 py-1 rounded-full flex items-center gap-1 whitespace-nowrap transition-colors cursor-pointer",
                  !isEssential
                    ? "text-amber-800 bg-amber-500/15 border border-amber-500/35 dark:text-gold dark:bg-gold/15 dark:border-gold/30"
                    : "text-neutral-400 hover:text-neutral-200 border border-transparent",
                )}
              >
                <CoinIcon size={11} variant="coin" />
                {t("preview.modeAdventure")}
              </button>
            </div>
          </div>

          {/* Card 1: Tarefa Diária / Rotina (estático) */}
          <div className="p-3.5 rounded-2xl bg-background/70 dark:bg-background/60 border border-neutral-700/80 dark:border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 text-left">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      isEssential
                        ? "text-primary dark:text-cyan-400"
                        : "text-magenta dark:text-fuchsia-300",
                    )}
                  >
                    {isEssential
                      ? t("preview.dailyTagEssential")
                      : t("preview.dailyTag")}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-500/10 dark:text-amber-300 px-1.5 py-0.5 rounded-md">
                    {t("preview.streakBadge")}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-neutral-50 truncate">
                  {t("preview.dailyTitle")}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[11px] font-extrabold text-sky-700 dark:text-info font-mono bg-info/10 px-2 py-0.5 rounded-md">
                {isEssential
                  ? t("preview.pointsReward")
                  : t("preview.xpReward")}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-extrabold font-mono px-2 py-0.5 rounded-md",
                  isEssential
                    ? "text-cyan-700 dark:text-cyan-300 bg-cyan-500/12"
                    : "text-amber-800 bg-amber-500/12 dark:text-gold dark:bg-gold/12",
                )}
              >
                <CoinIcon size={11} variant={isEssential ? "credit" : "coin"} />
                {isEssential
                  ? t("preview.creditsReward")
                  : t("preview.coinReward")}
              </span>
            </div>
          </div>

          {/* Card 2: Sessão de Foco Pomodoro */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/15 via-background/70 to-magenta/10 border border-primary-light/30 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 min-w-0 text-left">
              <div className="w-8 h-8 rounded-xl bg-primary/25 border border-primary-light/40 flex items-center justify-center text-primary dark:text-primary-light shrink-0">
                <Timer className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary dark:text-primary-light block">
                  {t("preview.focusTag")}
                </span>
                <span className="text-xs font-semibold text-neutral-200">
                  {t("preview.focusStatus")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-800 dark:text-gold animate-pulse" />
              <span className="text-base sm:text-lg font-black font-mono text-neutral-50 tracking-wider">
                24:59
              </span>
            </div>
          </div>

          {/* Card 3: Recompensa / Loja */}
          <div className="p-3.5 rounded-2xl bg-background/70 dark:bg-background/60 border border-neutral-700/80 dark:border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 text-left">
              <div
                className={cn(
                  "w-8 h-8 rounded-xl border flex items-center justify-center shrink-0",
                  isEssential
                    ? "bg-cyan-500/12 border-cyan-500/30 text-cyan-700 dark:text-cyan-300"
                    : "bg-amber-500/15 border-amber-500/35 text-amber-700 dark:bg-gold/15 dark:border-gold/35 dark:text-gold",
                )}
              >
                <Gift className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider block",
                    isEssential
                      ? "text-cyan-700 dark:text-cyan-300"
                      : "text-amber-800 dark:text-gold",
                  )}
                >
                  {isEssential
                    ? t("preview.rewardTagEssential")
                    : t("preview.rewardTag")}
                </span>
                <p className="text-xs sm:text-sm font-bold text-neutral-50 truncate">
                  {t("preview.rewardTitle")}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/12 px-2.5 py-1 rounded-md whitespace-nowrap shrink-0">
              {isEssential
                ? t("preview.rewardActionEssential")
                : t("preview.rewardAction")}
            </span>
          </div>

          {/* Nota de proporção justa 3:1–4:1 */}
          <p className="text-[11px] text-center text-neutral-400 font-medium pt-0.5">
            {isEssential
              ? t("preview.ratioNoteEssential")
              : t("preview.ratioNoteAdventure")}
          </p>
        </div>
      </div>
    </div>
  );
}
