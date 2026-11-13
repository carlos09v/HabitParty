"use client";

import { Award, Flame, ListChecks, Timer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type { FocusMetrics, FocusPeriodTab } from "@/types/focus";
import { cn, formatCoins } from "@/utils";
import { formatFocusMinutes } from "@/utils/focusFormatters";

interface FocusMetricsGridProps {
  metrics: FocusMetrics;
  period: FocusPeriodTab;
  onPeriodChange: (p: FocusPeriodTab) => void;
  isCompact?: boolean;
}

export function FocusMetricsGrid({
  metrics,
  period,
  onPeriodChange,
  isCompact = false,
}: FocusMetricsGridProps) {
  const t = useTranslations("focus.metrics");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const isToday = period === "HOJE";

  const recordsCount = isToday
    ? metrics.todayRecordsCount
    : metrics.totalRecordsCount;
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

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Header com Título e Seletor Hoje / Total */}
      <div className="flex items-center justify-between w-full">
        <h3
          className={cn(
            "font-bold text-neutral-100",
            isCompact ? "text-body-m" : "text-subtitle-s",
          )}
        >
          {t("title")}
        </h3>

        <div className="flex items-center rounded-lg bg-white dark:bg-surface/80 p-0.5 border border-neutral-700 dark:border-primary/30">
          <button
            type="button"
            onClick={() => onPeriodChange("HOJE")}
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
            onClick={() => onPeriodChange("TOTAL")}
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

      {/* 1. Hero Card: Tempo Total de Foco */}
      <div
        className={cn(
          "w-full rounded-xl border border-amber-500/25 dark:border-gold/30 bg-linear-to-br from-amber-500/[0.08] via-white to-amber-500/[0.03] dark:from-gold/10 dark:via-surface/60 dark:to-primary-dark/30 flex items-center justify-between transition-colors hover:border-amber-500/45 dark:hover:border-gold/50 shadow-xs relative overflow-hidden",
          isCompact ? "p-2.5" : "p-3",
        )}
      >
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 text-neutral-400 mb-0.5">
            <Timer
              size={13}
              className="text-amber-600 dark:text-gold shrink-0"
            />
            <span className="text-tiny font-bold uppercase tracking-wider text-neutral-300">
              {isToday ? t("focusedTodayLabel") : t("totalFocusTimeLabel")}
            </span>
          </div>
          <span
            className={cn(
              "font-extrabold text-amber-700 dark:text-gold tracking-tight",
              isCompact ? "text-xl" : "text-2xl",
            )}
          >
            {formatFocusMinutes(focusTime)}
          </span>
          <span className="text-label-g text-neutral-400 font-medium">
            {isToday
              ? focusTime > 0
                ? t("dedicatedToday")
                : t("noFocusToday")
              : t("accumulatedTotal", { time: formatFocusMinutes(focusTime) })}
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 border border-amber-500/25 dark:bg-gold/15 dark:border-gold/30 dark:text-gold flex items-center justify-center shrink-0 dark:shadow-glow-gold-xs">
          <Timer size={20} />
        </div>
      </div>

      {/* 2. Grid 2x2 com Indicadores Complementares de Foco */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {/* Sessões / Registros */}
        <div
          className={cn(
            "rounded-xl border border-neutral-700 dark:border-primary/25 bg-white dark:bg-surface/50 shadow-2xs dark:shadow-none flex flex-col justify-between transition-colors hover:border-primary/40 dark:hover:border-gold/30",
            isCompact ? "p-2 gap-1" : "p-2.5 gap-1.5",
          )}
        >
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
        <div
          className={cn(
            "rounded-xl border border-neutral-700 dark:border-primary/25 bg-white dark:bg-surface/50 shadow-2xs dark:shadow-none flex flex-col justify-between transition-colors hover:border-primary/40 dark:hover:border-gold/30",
            isCompact ? "p-2 gap-1" : "p-2.5 gap-1.5",
          )}
        >
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
          className={cn(
            "rounded-xl border border-neutral-700 dark:border-primary/25 bg-white dark:bg-surface/50 shadow-2xs dark:shadow-none flex flex-col justify-between transition-colors hover:border-primary/40 dark:hover:border-gold/30",
            isCompact ? "p-2 gap-1" : "p-2.5 gap-1.5",
          )}
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
              className="text-primary dark:text-purple-400 shrink-0"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-body-m font-bold text-primary dark:text-neutral-100">
              +{xpCount} {isGamified ? "" : "pts"}
            </span>
            <span className="text-tiny text-neutral-400 truncate">
              {t("focusActivitiesSub")}
            </span>
          </div>
        </div>

        {/* Ganho de Ouro / Créditos */}
        <div
          className={cn(
            "rounded-xl border border-neutral-700 dark:border-primary/25 bg-white dark:bg-surface/50 shadow-2xs dark:shadow-none flex flex-col justify-between transition-colors hover:border-primary/40 dark:hover:border-gold/30",
            isCompact ? "p-2 gap-1" : "p-2.5 gap-1.5",
          )}
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
                  ? "text-amber-600 dark:text-gold"
                  : "text-sky-600 dark:text-sky-400",
              )}
            >
              +{formatCoins(goldCount, { locale })}
            </span>
            <span className="text-tiny text-neutral-400 truncate">
              {t("focusActivitiesSub")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
