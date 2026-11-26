import { Award, Flame, ListChecks, Timer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type { FocusMetrics, FocusPeriodTab } from "@/types/focus";
import { cn, formatCoins } from "@/utils";
import { getDailyFocusYieldInfo } from "@/utils/focusDailyYield";
import { formatFocusMinutes } from "@/utils/focusFormatters";
import { FocusDailyGoalEditor } from "./FocusDailyGoalEditor";
import { FocusDailyYieldMeter } from "./FocusDailyYieldMeter";
import { FocusStatCard } from "./FocusStatCard";

interface FocusMetricsGridProps {
  metrics: FocusMetrics;
  todayProductiveMinutes?: number;
  todayRewardableMinutes?: number;
  dailyFocusGoalMinutes?: number | null;
  isPartialTotalWindow?: boolean;
  isFilteredByActivity?: boolean;
  period?: FocusPeriodTab;
  onPeriodChange?: (p: FocusPeriodTab) => void;
}

export function FocusMetricsGrid({
  metrics,
  todayProductiveMinutes,
  todayRewardableMinutes,
  dailyFocusGoalMinutes,
  isPartialTotalWindow = false,
  isFilteredByActivity = false,
  period: controlledPeriod,
  onPeriodChange,
}: FocusMetricsGridProps) {
  const t = useTranslations("focus.metrics");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const [internalPeriod, setInternalPeriod] = useState<FocusPeriodTab>("HOJE");
  const tabRefs = useRef<
    Partial<Record<FocusPeriodTab, HTMLButtonElement | null>>
  >({});

  const period = controlledPeriod ?? internalPeriod;
  const handlePeriodChange = (next: FocusPeriodTab) => {
    setInternalPeriod(next);
    onPeriodChange?.(next);
  };
  const isToday = period === "HOJE";

  const handleTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const order: readonly FocusPeriodTab[] = ["HOJE", "TOTAL"];
    const currentIdx = order.indexOf(period);
    let nextIdx = -1;
    if (e.key === "ArrowRight") {
      nextIdx = (currentIdx + 1) % order.length;
    } else if (e.key === "ArrowLeft") {
      nextIdx = (currentIdx - 1 + order.length) % order.length;
    } else if (e.key === "Home") {
      nextIdx = 0;
    } else if (e.key === "End") {
      nextIdx = order.length - 1;
    }
    if (nextIdx === -1) return;
    e.preventDefault();
    const nextTab = order[nextIdx];
    handlePeriodChange(nextTab);
    tabRefs.current[nextTab]?.focus();
  };

  const recordsCount = isToday
    ? metrics.todayRecordsCount
    : metrics.totalRecordsCount;
  const showPartialPlus = !isToday && isPartialTotalWindow;
  const partialSuffix = showPartialPlus ? "+" : "";
  const partialHint = showPartialPlus ? t("partialTotalWindowHint") : undefined;

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
  const yieldInfo = getDailyFocusYieldInfo(todayYieldMinutes);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header com Título (<h2>) e Abas Hoje / Total acessíveis */}
      <div className="flex items-center justify-between w-full">
        <h2 className="font-bold text-neutral-100 text-subtitle-s">
          {t("title")}
        </h2>

        <div
          role="tablist"
          aria-label={t("periodTabsAria")}
          onKeyDown={handleTabKeyDown}
          className="flex items-center rounded-lg bg-card dark:bg-surface/80 p-0.5 border border-neutral-700 dark:border-primary/30"
        >
          <button
            ref={(el) => {
              tabRefs.current.HOJE = el;
            }}
            type="button"
            role="tab"
            aria-selected={isToday}
            tabIndex={isToday ? 0 : -1}
            onClick={() => handlePeriodChange("HOJE")}
            className={cn(
              "relative min-h-7 pointer-coarse:min-h-9 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer",
              isToday
                ? "bg-gold text-on-gold shadow-glow-gold-xs font-bold after:content-[''] after:absolute after:inset-x-2 after:bottom-0.5 after:border-b-2 after:border-on-gold/60"
                : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            {t("todayTab")}
          </button>
          <button
            ref={(el) => {
              tabRefs.current.TOTAL = el;
            }}
            type="button"
            role="tab"
            aria-selected={!isToday}
            tabIndex={!isToday ? 0 : -1}
            onClick={() => handlePeriodChange("TOTAL")}
            className={cn(
              "relative min-h-7 pointer-coarse:min-h-9 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer",
              !isToday
                ? "bg-gold text-on-gold shadow-glow-gold-xs font-bold after:content-[''] after:absolute after:inset-x-2 after:bottom-0.5 after:border-b-2 after:border-on-gold/60"
                : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            {t("totalTab")}
          </button>
        </div>
      </div>

      {/* 1. Hero Card: Tempo Total de Foco + Meta Diária + Rendimento Diário */}
      <div
        title={partialHint}
        className="w-full rounded-xl border border-amber-500/25 dark:border-gold/30 bg-linear-to-br from-amber-500/[0.08] via-card to-amber-500/[0.03] dark:from-gold/10 dark:via-surface/60 dark:to-primary-dark/30 flex flex-col gap-2.5 transition-colors hover:border-amber-500/45 dark:hover:border-gold/50 shadow-xs relative overflow-hidden p-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-neutral-400 mb-0.5">
              <Timer
                size={13}
                aria-hidden="true"
                className="text-amber-800 dark:text-gold shrink-0"
              />
              <span className="text-tiny font-bold uppercase tracking-wider text-neutral-300">
                {isToday ? t("focusedTodayLabel") : t("totalFocusTimeLabel")}
              </span>
            </div>
            <span className="font-extrabold text-amber-800 dark:text-gold tracking-tight text-2xl tabular-nums">
              {formatFocusMinutes(focusTime)}
              {partialSuffix}
            </span>
            <span className="text-[11px] text-neutral-400 font-medium">
              {isToday
                ? focusTime > 0
                  ? t("dedicatedToday")
                  : t("noFocusToday")
                : t("accumulatedTotal", {
                    time: `${formatFocusMinutes(focusTime)}${partialSuffix}`,
                  })}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-800 border border-amber-500/25 dark:bg-gold/15 dark:border-gold/30 dark:text-gold flex items-center justify-center shrink-0 dark:shadow-glow-gold-xs">
            <Timer size={20} aria-hidden="true" />
          </div>
        </div>

        {isToday && (
          <FocusDailyGoalEditor
            todayMinutesForGoal={todayMinutesForGoal}
            dailyFocusGoalMinutes={dailyFocusGoalMinutes}
            isFilteredByActivity={isFilteredByActivity}
          />
        )}

        {isToday && (
          <FocusDailyYieldMeter
            yieldInfo={yieldInfo}
            isGamified={isGamified}
            isFilteredByActivity={isFilteredByActivity}
          />
        )}
      </div>

      {/* 2. Grid 2x2 com Indicadores Complementares */}
      <div className="grid grid-cols-2 gap-2 w-full">
        <FocusStatCard
          label={isToday ? t("sessionsTodayLabel") : t("totalSessionsLabel")}
          icon={
            <ListChecks
              size={13}
              aria-hidden="true"
              className="text-primary dark:text-primary-light shrink-0"
            />
          }
          value={`${recordsCount}${partialSuffix}`}
          subtitle={
            pomosCount > 0
              ? t("pomosCount", { count: pomosCount })
              : t("recordsCount", { count: recordsCount })
          }
          tooltip={partialHint}
        />

        <FocusStatCard
          label={isToday ? t("consistencyLabel") : t("activeDaysLabel")}
          icon={
            <Flame
              size={13}
              aria-hidden="true"
              className="text-orange-700 dark:text-amber-400 shrink-0"
            />
          }
          value={
            <span className="inline-flex items-center gap-1">
              <span>
                {streakDays}
                {partialSuffix}
              </span>
              <Flame
                size={14}
                aria-hidden="true"
                className="text-orange-700 fill-orange-500/20 dark:text-amber-400 dark:fill-amber-400/20"
              />
            </span>
          }
          subtitle={
            isToday
              ? streakDays > 0
                ? t("streakDaysSub")
                : t("startTodaySub")
              : t("daysWithFocusSub")
          }
          tooltip={partialHint}
        />

        <FocusStatCard
          label={
            isToday
              ? isGamified
                ? t("focusXpLabel")
                : t("focusPointsLabel")
              : isGamified
                ? t("totalXpLabel")
                : t("totalPointsLabel")
          }
          icon={
            <Award
              size={13}
              aria-hidden="true"
              className="text-primary dark:text-primary-light shrink-0"
            />
          }
          value={`+${xpCount}${partialSuffix} ${isGamified ? "XP" : "pts"}`}
          valueClassName="text-primary dark:text-neutral-100"
          subtitle={
            isToday
              ? t(
                  isGamified
                    ? "activeYieldRateSub"
                    : "activeYieldRateSubProductivity",
                  { percent: yieldInfo.tierPercent },
                )
              : t("focusActivitiesSub")
          }
          tooltip={
            partialHint ?? (isGamified ? t("xpTooltip") : t("pointsTooltip"))
          }
        />

        <FocusStatCard
          label={
            isToday
              ? isGamified
                ? t("goldEarnedLabel")
                : t("creditsEarnedLabel")
              : isGamified
                ? t("totalGoldLabel")
                : t("totalCreditsLabel")
          }
          icon={<CoinIcon size={13} />}
          value={`+${formatCoins(goldCount, { locale })}${partialSuffix}`}
          valueClassName={
            isGamified
              ? "text-amber-800 dark:text-gold"
              : "text-sky-700 dark:text-sky-400"
          }
          subtitle={
            isToday
              ? t(
                  isGamified
                    ? "activeYieldRateSub"
                    : "activeYieldRateSubProductivity",
                  { percent: yieldInfo.tierPercent },
                )
              : t("focusActivitiesSub")
          }
          tooltip={
            partialHint ?? (isGamified ? t("goldTooltip") : t("creditsTooltip"))
          }
        />
      </div>
    </div>
  );
}
