"use client";

import {
  AlertTriangle,
  Calendar,
  Flame,
  Plus,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { CoinIcon } from "@/components/ui/CoinIcon";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { FOCUS_REWARD_RULES } from "@/constants/focusRules";
import { isTodoTaskOverdue } from "@/hooks/useDashboardTaskFilters";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import { useIsClient } from "@/hooks/useIsClient";
import { useMidnightRollover } from "@/hooks/useMidnightRollover";
import { useMinuteTicker } from "@/hooks/useMinuteTicker";
import { useTodayFocusMinutes } from "@/hooks/useTodayFocusMinutes";
import { type AppLocale, toIntlLocale } from "@/i18n/config";
import {
  syncDashboardFilterUrl,
  useDashboardFilterStore,
} from "@/store/dashboardFilterStore";
import { useOptimisticDashboardStore } from "@/store/optimisticDashboardStore";
import { useUserStore } from "@/store/userStore";
import type { DashboardDailyBriefingProps } from "@/types/dashboard";
import { cn, formatCoins } from "@/utils";
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
import { scrollToDashboardTasksPanel } from "@/utils/dashboardScroll";
import { isValidIanaTimeZone } from "@/utils/date";
import { formatFocusMinutes } from "@/utils/focusFormatters";
import { getLevelProgress } from "@/utils/levels";

/**
 * Painel de Resumo Diário do Jogador (Client Component).
 * - Usa `useMinuteTicker(true)` compartilhado (sem setInterval próprio).
 * - Exibe 4 KPIs clicáveis (Ofensiva, Tarefas do Dia, Foco Hoje vs Meta, XP/Pontos Hoje),
 *   alerta de tarefas atrasadas, CTAs rápidos e micro-strip de progressão mobile (< lg).
 */
export function DashboardDailyBriefing({
  userId,
  firstName,
  streak: initialStreak,
  tasks,
  transactions,
  focusRecords = [],
  timezone,
  dailyFocusGoalMinutes: initialDailyFocusGoalMinutes = null,
  userXp: initialUserXp = 0,
  userCoins: initialUserCoins = 0,
  onQuickCreateTask,
  canQuickCreateTask = true,
}: DashboardDailyBriefingProps) {
  const t = useTranslations("dashboard.dailyBriefing");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const isHydrated = useIsClient();
  const resolvedTimeZone = isValidIanaTimeZone(timezone)
    ? timezone.trim()
    : undefined;
  const rolloverIso = useMidnightRollover(resolvedTimeZone);
  const hasTimedUncompletedTask = useMemo(
    () =>
      tasks.some(
        (task) =>
          !task.completed &&
          !task.isAllDay &&
          Boolean(task.dueTime || task.startTime || task.dueEndTime),
      ),
    [tasks],
  );
  const minuteTick = useMinuteTicker(hasTimedUncompletedTask);

  // Seletores granulares de progressão isolados neste leaf (mudanças de XP/moedas/streak não re-renderizam o Dashboard inteiro)
  const isSameStoreUser = useUserStore((s) =>
    Boolean(s.user?.id && userId && s.user.id === userId),
  );
  const storeStreak = useUserStore((s) => s.user?.currentStreak);
  const storeDailyFocusGoalMinutes = useUserStore(
    (s) => s.user?.dailyFocusGoalMinutes,
  );
  const storeTotalXp = useUserStore((s) => s.user?.totalXp);
  const storeCoins = useUserStore((s) => s.user?.currentCoins);

  const streak = isSameStoreUser ? (storeStreak ?? 0) : initialStreak;
  const dailyFocusGoalMinutes = isSameStoreUser
    ? (storeDailyFocusGoalMinutes ?? initialDailyFocusGoalMinutes)
    : initialDailyFocusGoalMinutes;
  const userXp = isSameStoreUser
    ? (storeTotalXp ?? initialUserXp)
    : initialUserXp;
  const userCoins = isSameStoreUser
    ? (storeCoins ?? initialUserCoins)
    : initialUserCoins;

  const streakRevertedDate = useOptimisticDashboardStore(
    (s) => s.streakRevertedDate,
  );
  const setStoreFilter = useDashboardFilterStore((s) => s.setFilter);
  const setSearchQuery = useDashboardFilterStore((s) => s.setSearchQuery);
  const resetAdvancedFilters = useDashboardFilterStore(
    (s) => s.resetAdvancedFilters,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: sincroniza relógio com o rollover e o ticker condicional de 1 minuto
  const now = useMemo(() => new Date(), [minuteTick, rolloverIso, isHydrated]);

  const tzRenderKey = resolvedTimeZone ?? (isHydrated ? "local-tz" : "ssr-tz");
  const greeting = getGreeting(now, locale, resolvedTimeZone);

  const todayDateStr = getTodayDateString(now, resolvedTimeZone);
  const localTodayTasks = useMemo(
    () => getTodayTasks(tasks, todayDateStr),
    [tasks, todayDateStr],
  );
  const completedTodayTasks = useMemo(
    () =>
      localTodayTasks.filter((task) =>
        isTaskCompletedOnDate(task, todayDateStr, resolvedTimeZone),
      ).length,
    [localTodayTasks, todayDateStr, resolvedTimeZone],
  );
  const totalTodayTasks = localTodayTasks.length;

  const overdueCount = useMemo(
    () =>
      tasks.filter((task) =>
        isTodoTaskOverdue(task, todayDateStr, now, resolvedTimeZone),
      ).length,
    [tasks, todayDateStr, now, resolvedTimeZone],
  );

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
      streakRevertedDate !== todayDateStr &&
      hasCompletedTaskInTransactionsToday(transactions, now, resolvedTimeZone),
    [transactions, todayDateStr, resolvedTimeZone, streakRevertedDate],
  );
  const hasCompletedAnyTaskToday =
    streakRevertedDate !== todayDateStr &&
    (hasCompletedTxToday ||
      hasAnyTaskCompletedOnDate(tasks, todayDateStr, resolvedTimeZone));

  const minStreakFocus = FOCUS_REWARD_RULES.MIN_DAILY_STREAK_FOCUS_MINUTES;
  const { effectiveFocusMinutesToday: focusMinutesToday } =
    useTodayFocusMinutes(focusRecords, todayDateStr, resolvedTimeZone);
  const hasMetFocusGoalToday = focusMinutesToday >= minStreakFocus;
  const isStreakSecuredToday = hasCompletedAnyTaskToday || hasMetFocusGoalToday;

  const effectiveFocusGoal =
    dailyFocusGoalMinutes && dailyFocusGoalMinutes > 0
      ? dailyFocusGoalMinutes
      : null;
  const focusGoalPercent = effectiveFocusGoal
    ? Math.min(100, Math.round((focusMinutesToday / effectiveFocusGoal) * 100))
    : 0;
  const isFocusGoalMet = Boolean(
    effectiveFocusGoal && focusMinutesToday >= effectiveFocusGoal,
  );

  const levelProgress = useMemo(() => getLevelProgress(userXp), [userXp]);

  let streakBadgeText: string;
  let streakBadgeClass =
    "text-xs font-semibold text-orange-700 dark:text-orange-400 truncate";

  if (isStreakSecuredToday) {
    streakBadgeText = t("streakSecuredBadge");
  } else if (isHydrated && isAfterNoon) {
    streakBadgeText = t("streakRemainingHours", { hours: hoursLeft });
    streakBadgeClass =
      "text-xs font-semibold text-amber-700 dark:text-amber-400 truncate";
  } else {
    streakBadgeText =
      streak > 0 ? t("streakActiveBadge") : t("streakStartBadge");
  }

  const streakBadgeTitle = isStreakSecuredToday
    ? t("streakSecuredBadge")
    : isHydrated && isAfterNoon
      ? t("streakRemainingHours", { hours: hoursLeft })
      : streak > 0
        ? t("streakActiveTitle")
        : t("streakStartTitle");

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

  const formattedDay = now.toLocaleDateString(toIntlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "short",
    ...(resolvedTimeZone ? { timeZone: resolvedTimeZone } : {}),
  });
  const capitalizedDay =
    formattedDay.charAt(0).toUpperCase() + formattedDay.slice(1);

  const handleJumpToOverdue = () => {
    setSearchQuery("");
    resetAdvancedFilters();
    setStoreFilter("overdue");
    syncDashboardFilterUrl("overdue", null);
    scrollToDashboardTasksPanel();
  };

  const handleJumpToToday = () => {
    setSearchQuery("");
    resetAdvancedFilters();
    setStoreFilter("today");
    syncDashboardFilterUrl("today", null);
    scrollToDashboardTasksPanel();
  };

  const handleJumpToWeeklyCalendar = () => {
    const calendarEl = document.getElementById("dashboard-weekly-calendar");
    if (calendarEl && calendarEl.offsetParent !== null) {
      calendarEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    window.dispatchEvent(new CustomEvent("habitparty:open-dashboard-rail"));
  };

  return (
    <section
      aria-label={t("ariaLabel")}
      className="w-full shrink-0 min-h-fit rounded-2xl border border-neutral-700 dark:border-primary/35 bg-linear-to-br from-primary/[0.05] via-card to-amber-500/[0.03] dark:from-primary-dark/50 dark:via-surface/80 dark:to-primary-dark/35 shadow-xs dark:shadow-[0_0_20px_color-mix(in_srgb,var(--color-primary)_14%,transparent)] relative overflow-hidden flex flex-col p-3.5 @lg:p-4 gap-3 @lg:gap-3.5"
    >
      {/* Bloco Superior: Saudação, Alerta Crítico e CTAs Rápidos */}
      <div className="flex flex-col @xl:flex-row @xl:items-start justify-between gap-3 min-w-0">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
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
            </span>

            {overdueCount > 0 && (
              <button
                type="button"
                onClick={handleJumpToOverdue}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger-500/15 hover:bg-danger-500/25 border border-danger-500/35 text-danger-600 dark:text-danger-300 text-tiny font-bold transition-colors cursor-pointer"
                title={t("overdueAlertTitle", { count: overdueCount })}
              >
                <AlertTriangle size={11} aria-hidden="true" />
                <span>{t("overdueAlertBadge", { count: overdueCount })}</span>
              </button>
            )}
          </div>

          <h1
            key={`greeting-${tzRenderKey}`}
            className="font-extrabold text-neutral-50 tracking-tight text-xl sm:text-2xl"
            suppressHydrationWarning
          >
            {greeting},{" "}
            <span className="text-primary dark:text-gold">{firstName}</span>!{" "}
            <span
              className="font-normal not-italic inline-block"
              aria-hidden="true"
            >
              👋
            </span>
          </h1>

          <p
            key={`motivation-${tzRenderKey}`}
            className="text-body-s text-neutral-300 font-medium leading-snug"
            suppressHydrationWarning
          >
            {motivationalMessage}
          </p>
        </div>

        {/* CTAs rápidos do Dashboard */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {onQuickCreateTask && canQuickCreateTask && (
            <button
              type="button"
              onClick={onQuickCreateTask}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold hover:bg-gold-hover text-on-gold font-bold text-xs shadow-xs hover:shadow-glow-gold-xs active:scale-95 transition-[background-color,box-shadow,transform] cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} aria-hidden="true" />
              <span>{t("quickAddTaskCta")}</span>
            </button>
          )}
          <Link
            href="/focus?from=dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface/80 hover:bg-surface-hover dark:bg-white/8 dark:hover:bg-white/14 border border-neutral-700 dark:border-primary/35 text-neutral-100 hover:text-primary dark:hover:text-gold font-semibold text-xs transition-colors"
          >
            <Timer size={14} aria-hidden="true" />
            <span>{t("quickFocusCta")}</span>
          </Link>
        </div>
      </div>

      {/* Micro-strip Mobile (< lg): Progressão de Nível + Moedas (espelha o HUD da Sidebar desktop) */}
      <div className="flex lg:hidden items-center justify-between gap-3 px-2.5 py-1.5 rounded-xl bg-surface/70 dark:bg-white/5 border border-neutral-700/70 dark:border-white/10">
        <Link
          href="/profile"
          className="flex items-center gap-2 min-w-0 flex-1 group"
        >
          <span className="px-1.5 py-0.5 rounded-md bg-primary/15 dark:bg-gold/15 border border-primary/30 dark:border-gold/30 text-tiny font-extrabold text-primary dark:text-gold shrink-0 tabular-nums">
            {isGamified
              ? t("levelShort", { level: levelProgress.currentLevel.tier })
              : `${userXp} pts`}
          </span>
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <ProgressBar
              decorative
              percent={levelProgress.percent}
              className="h-1.5 flex-1 bg-neutral-700 dark:bg-white/10"
              fillClassName="bg-linear-to-r from-primary to-gold"
            />
            <span className="text-tiny font-bold text-neutral-400 tabular-nums shrink-0">
              {levelProgress.percent}%
            </span>
          </div>
        </Link>

        <Link
          href="/history"
          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/12 dark:bg-gold/15 border border-amber-500/30 dark:border-gold/30 shrink-0"
        >
          <CoinIcon size={12} withGlow={isGamified} />
          <span className="text-tiny font-bold text-amber-800 dark:text-gold tabular-nums">
            {formatCoins(userCoins, { locale })}
          </span>
        </Link>
      </div>

      {/* Bloco Inferior: 4 Cards de Indicadores Chave Interativos */}
      <div className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-4 gap-2.5 w-full">
        {/* Card 1: Ofensiva (clicável → calendário semanal / abre drawer no mobile) */}
        <button
          type="button"
          onClick={handleJumpToWeeklyCalendar}
          className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-card dark:bg-white/5 border border-neutral-700 dark:border-white/10 shadow-xs dark:shadow-none hover:border-orange-500/40 transition-colors min-w-0 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          title={`${streakBadgeTitle} • ${t("streakCardJumpTitle")}`}
        >
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
            <span className={streakBadgeClass}>{streakBadgeText}</span>
          </div>
        </button>

        {/* Card 2: Meta Diária (clicável → filtra "Hoje" e rola até tarefas) */}
        <button
          type="button"
          onClick={handleJumpToToday}
          className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-card dark:bg-white/5 border border-neutral-700 dark:border-white/10 shadow-xs dark:shadow-none hover:border-indigo-500/40 dark:hover:border-emerald-500/40 transition-colors min-w-0 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
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
        </button>

        {/* Card 3: Foco Hoje vs Meta Diária (clicável → /focus) */}
        <Link
          href="/focus?from=dashboard"
          className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-card dark:bg-white/5 border border-neutral-700 dark:border-white/10 shadow-xs dark:shadow-none hover:border-sky-500/40 dark:hover:border-sky-400/40 transition-colors min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          title={
            effectiveFocusGoal
              ? t("focusGoalProgressTitle", {
                  current: formatFocusMinutes(focusMinutesToday),
                  goal: formatFocusMinutes(effectiveFocusGoal),
                })
              : t("focusCardTitle")
          }
        >
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border",
              isFocusGoalMet
                ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/20 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : "bg-sky-500/10 dark:bg-sky-500/15 border-sky-500/20 dark:border-sky-400/30 text-sky-700 dark:text-sky-300",
            )}
          >
            <Timer size={20} aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-tiny font-bold text-neutral-400 uppercase tracking-wider">
              {t("focusTodayLabel")}
            </span>
            <span
              className={cn(
                "text-base sm:text-lg font-extrabold truncate leading-tight tabular-nums",
                focusMinutesToday > 0 ? "text-neutral-100" : "text-neutral-400",
              )}
              suppressHydrationWarning
            >
              {focusMinutesToday > 0
                ? formatFocusMinutes(focusMinutesToday)
                : "0m"}
              {effectiveFocusGoal && (
                <span className="text-xs font-semibold text-neutral-400">
                  {" "}
                  / {formatFocusMinutes(effectiveFocusGoal)}
                </span>
              )}
            </span>
            {effectiveFocusGoal ? (
              <div className="flex items-center gap-2 mt-1 min-w-0">
                <ProgressBar
                  percent={focusGoalPercent}
                  className="h-1.5 flex-1 bg-neutral-700 dark:bg-white/10"
                  fillClassName={cn(
                    "transition-transform duration-500 ease-out",
                    isFocusGoalMet
                      ? "bg-linear-to-r from-emerald-500 to-emerald-400"
                      : "bg-linear-to-r from-sky-500 to-cyan-400",
                  )}
                  ariaValueNow={focusMinutesToday}
                  ariaValueMin={0}
                  ariaValueMax={effectiveFocusGoal}
                  ariaLabel={t("focusGoalAriaLabel", {
                    percent: focusGoalPercent,
                  })}
                />
                <span
                  className={cn(
                    "text-tiny font-bold tabular-nums shrink-0",
                    isFocusGoalMet
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-sky-700 dark:text-sky-300",
                  )}
                >
                  {focusGoalPercent}%
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-neutral-400 truncate">
                {focusMinutesToday > 0
                  ? t("focusActiveBadge")
                  : t("focusStartBadge")}
              </span>
            )}
          </div>
        </Link>

        {/* Card 4: XP / Pontos Acumulados Hoje (clicável → /history) */}
        <Link
          href="/history"
          className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-card dark:bg-white/5 border border-neutral-700 dark:border-white/10 shadow-xs dark:shadow-none hover:border-amber-500/40 dark:hover:border-gold/40 transition-colors min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          title={t("todayGainsTitle")}
        >
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
                "text-base sm:text-lg font-extrabold truncate leading-tight tabular-nums",
                todayXp > 0
                  ? "text-amber-700 dark:text-gold"
                  : "text-neutral-400",
              )}
              suppressHydrationWarning
            >
              {todayXp > 0 ? `+${todayXp} ${isGamified ? "XP" : "pts"}` : "—"}
            </span>
            <span className="text-xs font-semibold text-neutral-300 truncate">
              {isGamified
                ? t("todayGainsBadgeGamified")
                : t("todayGainsBadgeProductivity")}
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}
