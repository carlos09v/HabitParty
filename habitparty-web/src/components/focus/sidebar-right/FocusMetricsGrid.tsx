"use client";

import {
  Award,
  Flame,
  Info,
  ListChecks,
  Target,
  Timer,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type { FocusMetrics, FocusPeriodTab } from "@/types/focus";
import { cn, formatCoins } from "@/utils";
import {
  type DailyFocusYieldInfo,
  getDailyFocusYieldInfo,
} from "@/utils/focusDailyYield";
import { formatFocusMinutes } from "@/utils/focusFormatters";

const YIELD_TIER_BADGE_STYLES: Record<0 | 25 | 50 | 100, string> = {
  100: "bg-emerald-500/12 border-emerald-500/35 text-emerald-700 dark:text-emerald-300",
  50: "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300",
  25: "bg-orange-500/15 border-orange-500/40 text-orange-700 dark:text-orange-300",
  0: "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300",
};

function computeSegmentFill(
  loggedMinutes: number,
  startMinutes: number,
  endMinutes: number,
): number {
  const span = Math.max(1, endMinutes - startMinutes);
  return Math.min(
    100,
    Math.max(0, Math.round(((loggedMinutes - startMinutes) / span) * 100)),
  );
}

function getYieldProgressSegments(yieldInfo: DailyFocusYieldInfo) {
  return {
    seg1Fill: computeSegmentFill(
      yieldInfo.loggedMinutesToday,
      0,
      yieldInfo.tier1CapMinutes,
    ),
    seg2Fill: computeSegmentFill(
      yieldInfo.loggedMinutesToday,
      yieldInfo.tier1CapMinutes,
      yieldInfo.tier2CapMinutes,
    ),
    seg3Fill: computeSegmentFill(
      yieldInfo.loggedMinutesToday,
      yieldInfo.tier2CapMinutes,
      yieldInfo.hardCapMinutes,
    ),
  };
}

interface FocusMetricsGridProps {
  metrics: FocusMetrics;
  todayProductiveMinutes?: number;
  todayRewardableMinutes?: number;
  dailyFocusGoalMinutes?: number | null;
  totalRecordsCount?: number;
  period?: FocusPeriodTab;
  onPeriodChange?: (p: FocusPeriodTab) => void;
}

export function FocusMetricsGrid({
  metrics,
  todayProductiveMinutes,
  todayRewardableMinutes,
  dailyFocusGoalMinutes,
  totalRecordsCount,
  period: controlledPeriod,
  onPeriodChange,
}: FocusMetricsGridProps) {
  const t = useTranslations("focus.metrics");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const storeDailyGoalMinutes = useUserStore(
    (s) => s.user?.dailyFocusGoalMinutes,
  );
  const [internalPeriod, setInternalPeriod] = useState<FocusPeriodTab>("HOJE");
  const period = controlledPeriod ?? internalPeriod;
  const handlePeriodChange = (next: FocusPeriodTab) => {
    setInternalPeriod(next);
    onPeriodChange?.(next);
  };
  const isToday = period === "HOJE";

  const recordsCount = isToday
    ? metrics.todayRecordsCount
    : Math.max(metrics.totalRecordsCount, totalRecordsCount ?? 0);
  const streakDays = isToday
    ? metrics.activeStreakDays
    : metrics.totalActiveDays;
  const xpCount = isToday ? metrics.todayXp : metrics.totalXp;
  const goldCount = isToday ? metrics.todayGold : metrics.totalGold;
  const focusTime = isToday
    ? metrics.todayFocusMinutes
    : metrics.totalFocusMinutes;
  const pomosCount = isToday
    ? metrics.todayPomosCount
    : metrics.totalPomosCount;

  const todayMinutesForGoal =
    todayProductiveMinutes ?? metrics.todayFocusMinutes;
  const todayYieldMinutes = todayRewardableMinutes ?? todayMinutesForGoal;
  const resolvedDailyGoalMinutes =
    storeDailyGoalMinutes ?? dailyFocusGoalMinutes ?? null;
  const hasDailyGoal =
    typeof resolvedDailyGoalMinutes === "number" &&
    resolvedDailyGoalMinutes > 0;
  const dailyGoalPercent = hasDailyGoal
    ? Math.min(
        100,
        Math.round((todayMinutesForGoal / resolvedDailyGoalMinutes) * 100),
      )
    : 0;
  const isDailyGoalReached =
    hasDailyGoal && todayMinutesForGoal >= resolvedDailyGoalMinutes;

  const yieldInfo = getDailyFocusYieldInfo(todayYieldMinutes);
  const { seg1Fill, seg2Fill, seg3Fill } = getYieldProgressSegments(yieldInfo);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header com Título e Seletor Hoje / Total */}
      <div className="flex items-center justify-between w-full">
        <h3 className="font-bold text-neutral-100 text-subtitle-s">
          {t("title")}
        </h3>

        <div className="flex items-center rounded-lg bg-card dark:bg-surface/80 p-0.5 border border-neutral-700 dark:border-primary/30">
          <button
            type="button"
            onClick={() => handlePeriodChange("HOJE")}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer",
              isToday
                ? "bg-gold text-on-gold shadow-glow-gold-xs font-bold"
                : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            {t("todayTab")}
          </button>
          <button
            type="button"
            onClick={() => handlePeriodChange("TOTAL")}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer",
              !isToday
                ? "bg-gold text-on-gold shadow-glow-gold-xs font-bold"
                : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            {t("totalTab")}
          </button>
        </div>
      </div>

      {/* 1. Hero Card: Tempo Total de Foco + Indicador de Rendimento Diário (Modo Aventura) */}
      <div className="w-full rounded-xl border border-amber-500/25 dark:border-gold/30 bg-linear-to-br from-amber-500/[0.08] via-card to-amber-500/[0.03] dark:from-gold/10 dark:via-surface/60 dark:to-primary-dark/30 flex flex-col gap-2.5 transition-colors hover:border-amber-500/45 dark:hover:border-gold/50 shadow-xs relative overflow-hidden p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-neutral-400 mb-0.5">
              <Timer
                size={13}
                className="text-amber-800 dark:text-gold shrink-0"
              />
              <span className="text-tiny font-bold uppercase tracking-wider text-neutral-300">
                {isToday ? t("focusedTodayLabel") : t("totalFocusTimeLabel")}
              </span>
            </div>
            <span className="font-extrabold text-amber-800 dark:text-gold tracking-tight text-2xl">
              {formatFocusMinutes(focusTime)}
            </span>
            <span className="text-label-g text-neutral-400 font-medium">
              {isToday
                ? focusTime > 0
                  ? t("dedicatedToday")
                  : t("noFocusToday")
                : t("accumulatedTotal", {
                    time: formatFocusMinutes(focusTime),
                  })}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-800 border border-amber-500/25 dark:bg-gold/15 dark:border-gold/30 dark:text-gold flex items-center justify-center shrink-0 dark:shadow-glow-gold-xs">
            <Timer size={20} />
          </div>
        </div>

        {isToday && hasDailyGoal && resolvedDailyGoalMinutes && (
          <div className="pt-2 border-t border-neutral-700/60 dark:border-white/10 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-bold leading-none",
                  isDailyGoalReached
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-amber-700 dark:text-gold",
                )}
              >
                <Target size={11} className="shrink-0" aria-hidden="true" />
                <span>
                  {isDailyGoalReached
                    ? t("dailyGoalReachedLabel")
                    : t("dailyGoalLabel")}
                </span>
              </span>
              <span className="text-[10px] font-semibold text-neutral-300 tabular-nums shrink-0">
                {`${formatFocusMinutes(todayMinutesForGoal)} / ${formatFocusMinutes(resolvedDailyGoalMinutes)} (${dailyGoalPercent}%)`}
              </span>
            </div>
            <ProgressBar
              percent={dailyGoalPercent}
              className="h-1.5 bg-neutral-800/80 dark:bg-white/10"
              fillClassName={cn(
                "transition-transform duration-300",
                isDailyGoalReached ? "bg-emerald-500" : "bg-gold",
              )}
              ariaValueNow={todayMinutesForGoal}
              ariaValueMin={0}
              ariaValueMax={resolvedDailyGoalMinutes}
              ariaLabel={t("dailyGoalProgressAria", {
                percent: dailyGoalPercent,
              })}
            />
          </div>
        )}

        {isToday && (
          <div className="pt-2 border-t border-neutral-700/60 dark:border-white/10 flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold leading-none",
                    YIELD_TIER_BADGE_STYLES[yieldInfo.tierPercent],
                  )}
                >
                  <Zap size={11} className="shrink-0" aria-hidden="true" />
                  <span>
                    {yieldInfo.tierPercent === 0
                      ? isGamified
                        ? t("dailyYieldCappedLabel")
                        : t("dailyYieldCappedLabelProductivity")
                      : isGamified
                        ? t("dailyYieldRateLabel", {
                            percent: yieldInfo.tierPercent,
                          })
                        : t("dailyYieldRateLabelProductivity", {
                            percent: yieldInfo.tierPercent,
                          })}
                  </span>
                </span>
                <InfoTooltip
                  title={
                    isGamified
                      ? t("dailyYieldTooltipTitle")
                      : t("dailyYieldTooltipTitleProductivity")
                  }
                  icon={
                    <Info
                      size={12}
                      className="text-neutral-400 hover:text-gold shrink-0"
                    />
                  }
                  size={12}
                  align="left"
                  side="top"
                  ariaLabel={
                    isGamified
                      ? t("dailyYieldTooltipAria")
                      : t("dailyYieldTooltipAriaProductivity")
                  }
                >
                  <p className="text-label-g text-neutral-300 leading-relaxed">
                    {isGamified
                      ? t("dailyYieldTooltipIntro")
                      : t("dailyYieldTooltipIntroProductivity")}
                  </p>
                  <ul className="flex flex-col gap-0.5 text-label-g text-neutral-200 py-0.5 tabular-nums">
                    <li>
                      •{" "}
                      {isGamified
                        ? t("dailyYieldTier100")
                        : t("dailyYieldTier100Productivity")}
                    </li>
                    <li>
                      •{" "}
                      {isGamified
                        ? t("dailyYieldTier50")
                        : t("dailyYieldTier50Productivity")}
                    </li>
                    <li>
                      •{" "}
                      {isGamified
                        ? t("dailyYieldTier25")
                        : t("dailyYieldTier25Productivity")}
                    </li>
                    <li>
                      •{" "}
                      {isGamified
                        ? t("dailyYieldTier0")
                        : t("dailyYieldTier0Productivity")}
                    </li>
                  </ul>
                  <p className="text-tiny text-neutral-400">
                    {yieldInfo.tierPercent === 0
                      ? isGamified
                        ? t("dailyYieldZeroReachedHint")
                        : t("dailyYieldZeroReachedHintProductivity")
                      : t(
                          isGamified
                            ? "dailyYieldRemainingHint"
                            : "dailyYieldRemainingHintProductivity",
                          {
                            remaining: formatFocusMinutes(
                              yieldInfo.currentTierMinutesRemaining,
                            ),
                            untilCap: formatFocusMinutes(
                              yieldInfo.minutesUntilZero,
                            ),
                          },
                        )}
                  </p>
                </InfoTooltip>
              </div>
              <span className="text-[10px] font-semibold text-neutral-400 tabular-nums shrink-0">
                {formatFocusMinutes(yieldInfo.loggedMinutesToday)} /{" "}
                {formatFocusMinutes(yieldInfo.hardCapMinutes)}
              </span>
            </div>

            <div
              className="flex items-center gap-0.5 h-1.5 w-full"
              aria-hidden="true"
            >
              <div className="flex-[2] h-full rounded-l-full bg-neutral-800/80 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-emerald-500/85 transition-[width] duration-300"
                  style={{ width: `${seg1Fill}%` }}
                />
              </div>
              <div className="flex-1 h-full bg-neutral-800/80 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-amber-500/85 transition-[width] duration-300"
                  style={{ width: `${seg2Fill}%` }}
                />
              </div>
              <div className="flex-1 h-full rounded-r-full bg-neutral-800/80 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-orange-500/85 transition-[width] duration-300"
                  style={{ width: `${seg3Fill}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Grid 2x2 com Indicadores Complementares de Foco */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {/* Sessões / Registros */}
        <div className="rounded-xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/50 shadow-2xs dark:shadow-none flex flex-col justify-between transition-colors hover:border-primary/40 dark:hover:border-gold/30 p-2.5 gap-1.5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-tiny font-medium truncate">
              {isToday ? t("sessionsTodayLabel") : t("totalSessionsLabel")}
            </span>
            <ListChecks
              size={13}
              className="text-primary dark:text-primary-light shrink-0"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-body-m font-bold text-neutral-50 dark:text-neutral-100">
              {recordsCount}
            </span>
            <span className="text-tiny text-neutral-400 truncate">
              {pomosCount > 0
                ? t("pomosCount", { count: pomosCount })
                : t("recordsCount", { count: recordsCount })}
            </span>
          </div>
        </div>

        {/* Constância / Dias Ativos */}
        <div className="rounded-xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/50 shadow-2xs dark:shadow-none flex flex-col justify-between transition-colors hover:border-primary/40 dark:hover:border-gold/30 p-2.5 gap-1.5">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-tiny font-medium truncate">
              {isToday ? t("consistencyLabel") : t("activeDaysLabel")}
            </span>
            <Flame
              size={13}
              className="text-orange-700 dark:text-amber-400 shrink-0"
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-body-m font-bold text-neutral-50 dark:text-neutral-100">
                {streakDays}
              </span>
              <Flame
                size={14}
                className="text-orange-700 fill-orange-500/20 dark:text-amber-400 dark:fill-amber-400/20"
              />
            </div>
            <span className="text-tiny text-neutral-400 truncate">
              {isToday
                ? streakDays > 0
                  ? t("streakDaysSub")
                  : t("startTodaySub")
                : t("daysWithFocusSub")}
            </span>
          </div>
        </div>

        {/* Ganho de XP / Pontos */}
        <div
          className="rounded-xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/50 shadow-2xs dark:shadow-none flex flex-col justify-between transition-colors hover:border-primary/40 dark:hover:border-gold/30 p-2.5 gap-1.5"
          title={isGamified ? t("xpTooltip") : t("pointsTooltip")}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-tiny font-medium truncate">
              {isToday
                ? isGamified
                  ? t("focusXpLabel")
                  : t("focusPointsLabel")
                : isGamified
                  ? t("totalXpLabel")
                  : t("totalPointsLabel")}
            </span>
            <Award
              size={13}
              className="text-primary dark:text-primary-light shrink-0"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-body-m font-bold text-primary dark:text-neutral-100">
              +{xpCount} {isGamified ? "XP" : "pts"}
            </span>
            <span className="text-tiny text-neutral-400 truncate">
              {isToday
                ? t(
                    isGamified
                      ? "activeYieldRateSub"
                      : "activeYieldRateSubProductivity",
                    { percent: yieldInfo.tierPercent },
                  )
                : t("focusActivitiesSub")}
            </span>
          </div>
        </div>

        {/* Ganho de Ouro / Créditos */}
        <div
          className="rounded-xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/50 shadow-2xs dark:shadow-none flex flex-col justify-between transition-colors hover:border-primary/40 dark:hover:border-gold/30 p-2.5 gap-1.5"
          title={isGamified ? t("goldTooltip") : t("creditsTooltip")}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-tiny font-medium truncate">
              {isToday
                ? isGamified
                  ? t("goldEarnedLabel")
                  : t("creditsEarnedLabel")
                : isGamified
                  ? t("totalGoldLabel")
                  : t("totalCreditsLabel")}
            </span>
            <CoinIcon size={13} />
          </div>
          <div className="flex flex-col">
            <span
              className={cn(
                "text-body-m font-bold",
                isGamified
                  ? "text-amber-800 dark:text-gold"
                  : "text-sky-700 dark:text-sky-400",
              )}
            >
              +{formatCoins(goldCount, { locale })}
            </span>
            <span className="text-tiny text-neutral-400 truncate">
              {isToday
                ? t(
                    isGamified
                      ? "activeYieldRateSub"
                      : "activeYieldRateSubProductivity",
                    { percent: yieldInfo.tierPercent },
                  )
                : t("focusActivitiesSub")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
