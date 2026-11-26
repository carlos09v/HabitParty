"use client";

import { Check, CheckCircle2, Flame, Gift, Timer } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  type LandingExperienceMode,
  LandingModeSwitcher,
} from "@/components/landing/LandingModeSwitcher";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { cn } from "@/utils";

/**
 * Cartão interativo de pré-visualização no Hero da Landing Page.
 * Permite alternar ao vivo entre Modo Essencial e Modo Aventura enquanto mantém os cards internos puramente demonstrativos.
 */
export function LandingHeroPreview() {
  const t = useTranslations("landing.hero");
  const [mode, setMode] = useState<LandingExperienceMode>("adventure");
  const isEssential = mode === "essential";

  return (
    <div className="lg:col-span-5 relative">
      <div className="relative mx-auto max-w-md lg:max-w-none">
        {/* Glow Cósmico Traseiro */}
        <div
          aria-hidden="true"
          className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.16)_0%,rgba(237,43,229,0.08)_45%,transparent_72%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.28)_0%,rgba(237,229,57,0.1)_42%,rgba(237,43,229,0.18)_58%,transparent_75%)] -z-10 pointer-events-none"
        />

        {/* Painel Principal */}
        <div className="rounded-3xl bg-card dark:bg-surface/95 border border-neutral-700/90 dark:border-white/12 p-5 sm:p-6 shadow-xl dark:shadow-[0_20px_60px_rgba(0,0,0,0.55)] space-y-4">
          {/* Topo do Card: Identidade + Seletor Interativo de Modo */}
          <div className="flex items-center justify-between flex-wrap gap-2.5 pb-3.5 border-b border-neutral-700/80 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <Image
                src="/assets/favicon_io/android-chrome-192x192.png"
                alt=""
                aria-hidden="true"
                width={36}
                height={36}
                sizes="36px"
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

            <LandingModeSwitcher
              mode={mode}
              onChange={setMode}
              ariaLabel={t("preview.modeSwitcherLabel")}
              essentialLabel={t("preview.modeEssential")}
              adventureLabel={t("preview.modeAdventure")}
              showIcons
            />
          </div>

          {/* Card 1: Tarefa Diária / Rotina */}
          <div className="p-3.5 rounded-2xl bg-background/70 dark:bg-background/60 border border-neutral-700/80 dark:border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 text-left">
              <div className="w-8 h-8 rounded-xl bg-success-500/15 border border-success-500/40 flex items-center justify-center text-success-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider",
                      isEssential
                        ? "text-info"
                        : "text-magenta dark:text-fuchsia-300",
                    )}
                  >
                    {isEssential
                      ? t("preview.dailyTagEssential")
                      : t("preview.dailyTag")}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gold-ink bg-amber-500/12 dark:text-amber-300 dark:bg-amber-500/15 px-1.5 py-0.5 rounded-md">
                    <Flame className="w-2.5 h-2.5" aria-hidden="true" />
                    {t("preview.streakBadge")}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-neutral-50 truncate">
                  {t("preview.dailyTitle")}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[11px] font-extrabold text-info font-mono bg-info/10 px-2 py-0.5 rounded-md">
                {isEssential
                  ? t("preview.pointsReward")
                  : t("preview.xpReward")}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-extrabold font-mono px-2 py-0.5 rounded-md",
                  isEssential
                    ? "text-info bg-info/12"
                    : "text-gold-ink bg-amber-500/12 dark:text-gold dark:bg-gold/12",
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
              <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary-light/40 flex items-center justify-center text-primary dark:text-primary-light shrink-0">
                <Timer className="w-4 h-4" aria-hidden="true" />
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
              <Flame
                className="w-4 h-4 text-gold-ink dark:text-gold motion-safe:animate-pulse"
                aria-hidden="true"
              />
              <span className="text-base sm:text-lg font-black font-mono tabular-nums text-neutral-50 tracking-wider">
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
                    ? "bg-info/12 border-info/30 text-info"
                    : "bg-amber-500/15 border-amber-500/35 text-gold-ink dark:bg-gold/15 dark:border-gold/35 dark:text-gold",
                )}
              >
                <Gift className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider block",
                    isEssential ? "text-info" : "text-gold-ink dark:text-gold",
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
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-success-400 bg-success-500/12 px-2.5 py-1 rounded-md whitespace-nowrap shrink-0">
              <Check className="w-3 h-3" aria-hidden="true" />
              {isEssential
                ? t("preview.rewardActionEssential")
                : t("preview.rewardAction")}
            </span>
          </div>

          {/* Nota de equilíbrio sem jargão repetitivo */}
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
