"use client";

import { Calendar, Flame, Sparkles, Target } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { type AppLocale, toIntlLocale } from "@/i18n/config";
import type { DashboardDailyBriefingProps } from "@/types/dashboard";
import { cn } from "@/utils";
import {
  getCurrentHourInTimeZone,
  getGreeting,
  getTodayDateString,
  getTodayTasks,
  getTodayXp,
  hasAnyTaskCompletedOnDate,
  hasCompletedTaskInTransactionsToday,
  isTaskCompletedOnDate,
} from "@/utils/dashboardMetrics";
import { isValidIanaTimeZone } from "@/utils/date";

/**
 * Painel de Resumo Diário do Jogador (Client Component).
 * Calcula a saudação, a data por extenso e as métricas diárias usando o relógio
 * e fuso horário local do dispositivo/navegador do usuário (evitando desvio UTC do servidor).
 */
export function DashboardDailyBriefing({
  firstName,
  streak,
  tasks,
  transactions,
  timezone,
}: DashboardDailyBriefingProps) {
  const t = useTranslations("dashboard.dailyBriefing");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const [now, setNow] = useState<Date>(() => new Date());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setNow(new Date());
    setIsHydrated(true);
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const resolvedTimeZone = isValidIanaTimeZone(timezone)
    ? timezone.trim()
    : undefined;
  const tzRenderKey = resolvedTimeZone ?? (isHydrated ? "local-tz" : "ssr-tz");
  const greeting = getGreeting(now, locale, resolvedTimeZone);

  const todayDateStr = getTodayDateString(now, resolvedTimeZone);
  const localTodayTasks = useMemo(
    () => getTodayTasks(tasks, todayDateStr),
    [tasks, todayDateStr],
  );
  const completedTodayTasks = useMemo(
    () =>
      localTodayTasks.filter((t) =>
        isTaskCompletedOnDate(t, todayDateStr, resolvedTimeZone),
      ).length,
    [localTodayTasks, todayDateStr, resolvedTimeZone],
  );
  const totalTodayTasks = localTodayTasks.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: todayDateStr representa a janela diária efetiva de now no fuso
  const todayXp = useMemo(
    () => getTodayXp(transactions, now, resolvedTimeZone),
    [transactions, todayDateStr, resolvedTimeZone],
  );

  const completionPercent =
    totalTodayTasks > 0
      ? Math.round((completedTodayTasks / totalTodayTasks) * 100)
      : 0;

  const isAllCompleted =
    totalTodayTasks > 0 && completedTodayTasks === totalTodayTasks;

  const currentHour = getCurrentHourInTimeZone(now, resolvedTimeZone);
  const isAfterNoon = currentHour >= 12;
  const hoursLeft = Math.max(1, 24 - currentHour);

  // biome-ignore lint/correctness/useExhaustiveDependencies: todayDateStr representa a janela diária efetiva de now no fuso
  const hasCompletedTxToday = useMemo(
    () =>
      hasCompletedTaskInTransactionsToday(transactions, now, resolvedTimeZone),
    [transactions, todayDateStr, resolvedTimeZone],
  );
  const hasCompletedAnyTaskToday =
    completedTodayTasks > 0 ||
    hasCompletedTxToday ||
    hasAnyTaskCompletedOnDate(tasks, todayDateStr, resolvedTimeZone);

  let streakBadgeText: string;
  let streakBadgeClass =
    "text-xs font-semibold text-orange-700 dark:text-orange-400 truncate";

  if (hasCompletedAnyTaskToday) {
    streakBadgeText = t("streakSecuredBadge");
  } else if (isHydrated && isAfterNoon) {
    streakBadgeText = t("streakRemainingHours", { hours: hoursLeft });
    streakBadgeClass =
      "text-xs font-semibold text-amber-700 dark:text-amber-400 truncate";
  } else {
    streakBadgeText =
      streak > 0 ? t("streakActiveBadge") : t("streakStartBadge");
  }

  const streakBadgeTitle =
    isHydrated && isAfterNoon && !hasCompletedAnyTaskToday
      ? t("streakRemainingHours", { hours: hoursLeft })
      : streak > 0
        ? t("streakActiveTitle")
        : t("streakStartTitle");

  // Frase de motivação contextual e limpa
  const motivationalMessage = (() => {
    if (totalTodayTasks === 0) {
      return t("motivationalEmpty");
    }
    if (isAllCompleted) {
      return t("motivationalCompleted");
    }
    return isGamified
      ? t("motivationalActiveGamified")
      : t("motivationalActiveProductivity");
  })();

  // Data formatada para o cabeçalho no fuso local do navegador (ex: Terça-feira, 20 de out.)
  const formattedDay = now.toLocaleDateString(toIntlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "short",
    ...(resolvedTimeZone ? { timeZone: resolvedTimeZone } : {}),
  });
  const capitalizedDay =
    formattedDay.charAt(0).toUpperCase() + formattedDay.slice(1);

  return (
    <section
      aria-label={t("ariaLabel")}
      className="w-full shrink-0 min-h-fit rounded-2xl border border-neutral-700 dark:border-primary/35 bg-linear-to-br from-purple-500/[0.04] via-white to-amber-500/[0.03] dark:from-primary-dark/50 dark:via-surface/80 dark:to-primary-dark/35 shadow-xs dark:shadow-[0_0_20px_rgba(124,58,237,0.1)] relative overflow-hidden flex flex-col p-3.5 @lg:p-4 gap-3 @lg:gap-3.5"
    >
      {/* Bloco Superior: Saudação e Mensagem Contextual */}
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
          <Calendar
            size={14}
            className="text-primary dark:text-gold shrink-0"
            aria-hidden="true"
          />
          <span
            key={`day-${tzRenderKey}`}
            className="capitalize"
            suppressHydrationWarning
          >
            {capitalizedDay}
          </span>
        </div>

        <h2
          key={`greeting-${tzRenderKey}`}
          className="font-extrabold text-neutral-50 tracking-tight text-xl sm:text-2xl"
          suppressHydrationWarning
        >
          {greeting},{" "}
          <span className="text-primary dark:text-gold">{firstName}</span>!{" "}
          <span className="font-normal not-italic inline-block">👋</span>
        </h2>

        <p
          key={`motivation-${tzRenderKey}`}
          className="text-body-s text-neutral-300 font-medium leading-snug"
          suppressHydrationWarning
        >
          {motivationalMessage}
        </p>
      </div>

      {/* Bloco Inferior: 3 Cards de Indicadores Chave em Largura Total (w-full) */}
      <div className="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3 gap-2.5 w-full">
        {/* Card 1: Ofensiva */}
        <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-white dark:bg-white/5 border border-neutral-700 dark:border-white/10 shadow-xs dark:shadow-none hover:border-orange-500/30 transition-colors min-w-0">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 dark:bg-orange-500/15 border border-orange-500/20 dark:border-orange-500/30 flex items-center justify-center text-orange-700 dark:text-orange-400 shrink-0">
            <Flame size={20} aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-tiny font-bold text-neutral-400 uppercase tracking-wider">
              {t("streakLabel")}
            </span>
            <span
              className={cn(
                "font-extrabold truncate leading-tight",
                streak > 0
                  ? "text-base sm:text-lg text-neutral-100"
                  : "text-sm sm:text-base text-neutral-200",
              )}
            >
              {streak > 0
                ? t("streakCount", { count: streak })
                : t("streakEmptyValue")}
            </span>
            <span className={streakBadgeClass} title={streakBadgeTitle}>
              {streakBadgeText}
            </span>
          </div>
        </div>

        {/* Card 2: Meta Diária */}
        <div
          className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-white dark:bg-white/5 border border-neutral-700 dark:border-white/10 shadow-xs dark:shadow-none hover:border-indigo-500/30 dark:hover:border-emerald-500/30 transition-colors min-w-0"
          title={
            totalTodayTasks === 0
              ? t("noTasksTodayTitle")
              : isAllCompleted
                ? t("allCompletedTitle")
                : t("pendingCountTitle", {
                    count: totalTodayTasks - completedTodayTasks,
                  })
          }
        >
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
              isAllCompleted
                ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : "bg-indigo-500/10 dark:bg-blue-500/15 border-indigo-500/20 dark:border-blue-500/30 text-indigo-700 dark:text-blue-400",
            )}
          >
            <Target size={20} aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-tiny font-bold text-neutral-400 uppercase tracking-wider">
              {t("dailyTasksLabel")}
            </span>
            <span
              className={cn(
                "text-base sm:text-lg font-extrabold truncate leading-tight",
                totalTodayTasks > 0 ? "text-neutral-100" : "text-neutral-400",
              )}
              suppressHydrationWarning
            >
              {totalTodayTasks > 0
                ? t("completedCount", {
                    completed: completedTodayTasks,
                    total: totalTodayTasks,
                  })
                : "—"}
            </span>
            {totalTodayTasks > 0 ? (
              <div className="flex items-center gap-2 mt-1 min-w-0">
                <ProgressBar
                  percent={completionPercent}
                  className="h-1.5 flex-1 bg-neutral-700 dark:bg-white/10"
                  fillClassName={cn(
                    "transition-transform duration-500 ease-out",
                    isAllCompleted
                      ? "bg-linear-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                      : "bg-linear-to-r from-gold to-amber-400 shadow-glow-gold-xs",
                  )}
                  ariaValueNow={completedTodayTasks}
                  ariaValueMin={0}
                  ariaValueMax={totalTodayTasks}
                  ariaLabel={t("progressAriaLabel", {
                    percent: completionPercent,
                  })}
                />
                <span
                  key={`goal-${tzRenderKey}`}
                  className={cn(
                    "text-tiny font-bold tabular-nums shrink-0",
                    isAllCompleted
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-amber-700 dark:text-gold",
                  )}
                  suppressHydrationWarning
                >
                  {completionPercent}%
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold truncate text-neutral-400">
                {t("noTasksTodayBadge")}
              </span>
            )}
          </div>
        </div>

        {/* Card 3: XP / Pontos Acumulados Hoje */}
        <div className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-white dark:bg-white/5 border border-neutral-700 dark:border-white/10 shadow-xs dark:shadow-none hover:border-amber-500/30 dark:hover:border-gold/30 transition-colors min-w-0 @md:col-span-2 @2xl:col-span-1">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 dark:bg-gold/15 border border-amber-500/20 dark:border-gold/30 flex items-center justify-center text-amber-700 dark:text-gold shrink-0">
            <Sparkles size={20} aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-tiny font-bold text-neutral-400 uppercase tracking-wider">
              {isGamified
                ? t("xpEarnedLabelGamified")
                : t("xpEarnedLabelProductivity")}
            </span>
            <span
              className={cn(
                "text-base sm:text-lg font-extrabold truncate leading-tight",
                todayXp > 0
                  ? "text-amber-700 dark:text-gold"
                  : "text-neutral-400",
              )}
              suppressHydrationWarning
            >
              {todayXp > 0 ? `+${todayXp} ${isGamified ? "XP" : "pts"}` : "—"}
            </span>
            <span
              className="text-xs font-semibold text-neutral-300 truncate"
              title={t("todayGainsTitle")}
            >
              {isGamified
                ? t("todayGainsBadgeGamified")
                : t("todayGainsBadgeProductivity")}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
