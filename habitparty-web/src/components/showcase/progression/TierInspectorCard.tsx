"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useId } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { XpAmount } from "@/components/ui/reward/XpAmount";
import { cn, type LevelProgress, type ProgressionTierView } from "@/utils";
import {
  INSPECTOR_STATUS_BADGE_CLASS,
  INSPECTOR_STATUS_LABEL_KEY,
  type TierStatus,
} from "./tierStatus";

interface TierInspectorCardProps {
  tierView: ProgressionTierView;
  status: TierStatus;
  isGamified: boolean;
  progress: LevelProgress;
  nextRankTitle: string;
  remainingXpToSelected: number;
}

export function TierInspectorCard({
  tierView,
  status,
  isGamified,
  progress,
  nextRankTitle,
  remainingXpToSelected,
}: TierInspectorCardProps) {
  const t = useTranslations("showcase.progression");
  const format = useFormatter();
  const progressLabelId = useId();

  return (
    <section className="rounded-2xl border border-neutral-700 dark:border-primary/30 bg-card dark:bg-surface/65 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {t("inspector.headerTitle")}
          </span>
          <h3
            className={cn(
              "text-lg font-black mt-0.5 truncate",
              tierView.meta.accentTextClass,
            )}
          >
            {tierView.localizedTitle}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            {t("inspector.modeSubtitle", {
              mode: isGamified
                ? t("inspector.essentialModeName")
                : t("inspector.adventureModeName"),
              title: tierView.secondaryTitle,
            })}
          </p>
        </div>

        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-extrabold border shrink-0",
            INSPECTOR_STATUS_BADGE_CLASS[status],
          )}
        >
          {t(`inspector.${INSPECTOR_STATUS_LABEL_KEY[status]}`)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface/70 border border-neutral-700/70 dark:border-white/10 text-xs">
        <span className="font-semibold text-neutral-300">
          {t(`eras.${tierView.meta.era}`)}
        </span>
        <span className="font-bold text-neutral-100 tabular-nums">
          {tierView.nextMinXp !== null
            ? t("inspector.thresholdRange", {
                minXp: format.number(tierView.minXp),
                maxXp: format.number(tierView.nextMinXp - 1),
              })
            : t("inspector.topRankRange", {
                minXp: format.number(tierView.minXp),
              })}
        </span>
      </div>

      {status === "current" ? (
        progress.isMaxLevel ? (
          <p className="text-xs text-amber-700 dark:text-gold font-semibold leading-relaxed">
            {t("inspector.topReachedDesc")}
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span
                id={progressLabelId}
                className="text-neutral-300 font-semibold"
              >
                {t("inspector.tierProgressLabel")}
              </span>
              <span className="font-black text-amber-700 dark:text-gold tabular-nums">
                {progress.percent}%
              </span>
            </div>
            <ProgressBar
              percent={progress.percent}
              className="h-2 bg-neutral-700 dark:bg-neutral-900 border border-neutral-600/50 dark:border-primary/20"
              fillClassName={cn(
                "bg-gradient-to-r transition-transform duration-500",
                tierView.meta.barGradientClass,
              )}
              ariaLabelledBy={progressLabelId}
            />
            <p className="text-xs text-neutral-400">
              {t("inspector.remainingToUnlock", {
                xp: format.number(progress.remainingXp),
                title: nextRankTitle,
              })}
            </p>
          </div>
        )
      ) : status === "unlocked" ? (
        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium leading-relaxed">
          {t("inspector.alreadyReachedDesc")}
        </p>
      ) : (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/35 dark:border-gold/35 bg-amber-500/[0.08] px-3 py-2.5">
          <span className="text-xs font-semibold text-neutral-200">
            {t("inspector.remainingToUnlock", {
              xp: format.number(remainingXpToSelected),
              title: tierView.localizedTitle,
            })}
          </span>
          <XpAmount
            amount={remainingXpToSelected}
            size="sm"
            showSign={false}
            withIcon
          />
        </div>
      )}
    </section>
  );
}
