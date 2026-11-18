"use client";

import { Crown, type LucideIcon, Sparkles, Target } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { XpAmount } from "@/components/ui/reward/XpAmount";
import { cn, USER_LEVELS } from "@/utils";

type SummaryCardTone = "gold" | "neutral";

const CARD_TONE_CLASSES: Record<SummaryCardTone, string> = {
  gold: "border-amber-500/35 dark:border-gold/40 bg-amber-500/[0.08] dark:bg-gradient-to-br dark:from-gold/15 dark:to-transparent",
  neutral: "border-neutral-700 dark:border-primary/25 bg-surface/60",
};

interface SummaryStatCardProps {
  icon: LucideIcon;
  iconBoxClassName: string;
  tone?: SummaryCardTone;
  label: string;
  children: ReactNode;
}

function SummaryStatCard({
  icon: Icon,
  iconBoxClassName,
  tone = "neutral",
  label,
  children,
}: SummaryStatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3.5 flex items-center gap-3",
        CARD_TONE_CLASSES[tone],
      )}
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl border flex items-center justify-center shrink-0",
          iconBoxClassName,
        )}
      >
        <Icon size={19} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
          {label}
        </span>
        {children}
      </div>
    </div>
  );
}

interface ProgressionSummaryCardsProps {
  currentRankTitle: string;
  currentRankOrder: number;
  currentXp: number;
  nextRankTitle: string;
  isMaxLevel: boolean;
  remainingXp: number;
}

export function ProgressionSummaryCards({
  currentRankTitle,
  currentRankOrder,
  currentXp,
  nextRankTitle,
  isMaxLevel,
  remainingXp,
}: ProgressionSummaryCardsProps) {
  const t = useTranslations("showcase.progression.summaryCards");
  const format = useFormatter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
      <SummaryStatCard
        icon={Crown}
        tone="gold"
        iconBoxClassName="bg-amber-500/20 dark:bg-gold/20 border-amber-500/40 dark:border-gold/45 text-amber-700 dark:text-gold"
        label={t("currentRankLabel")}
      >
        <p className="text-sm font-black text-neutral-100 truncate">
          {currentRankTitle}
        </p>
        <span className="text-[11px] font-semibold text-amber-700 dark:text-gold">
          {t("unlockedTiersLabel", {
            unlocked: currentRankOrder,
            total: USER_LEVELS.length,
          })}
        </span>
      </SummaryStatCard>

      <SummaryStatCard
        icon={Sparkles}
        iconBoxClassName="bg-magenta/15 border-magenta/35 text-magenta"
        label={t("totalXpLabel")}
      >
        <XpAmount
          amount={currentXp}
          size="md"
          showSign={false}
          withIcon
          className="text-neutral-100"
        />
      </SummaryStatCard>

      <SummaryStatCard
        icon={Target}
        iconBoxClassName="bg-sky-500/15 border-sky-500/35 text-sky-700 dark:text-sky-300"
        label={t("nextMilestoneLabel")}
      >
        <p className="text-sm font-black text-neutral-100 truncate">
          {isMaxLevel ? t("nextMilestoneMax") : nextRankTitle}
        </p>
        {!isMaxLevel && (
          <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 tabular-nums">
            {t("remainingXpHint", {
              xp: format.number(remainingXp),
            })}
          </span>
        )}
      </SummaryStatCard>
    </div>
  );
}
