"use client";

import { Calendar, Flame, Sparkles, Target } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useExperienceMode } from "@/hooks/useExperienceMode";
import type { AppLocale } from "@/i18n/config";
import type { DashboardDailyBriefingProps } from "@/types/dashboard";
import { cn } from "@/utils";
import {
  getGreeting,
  getTodayDateString,
  getTodayTasks,
  getTodayXp,
} from "@/utils/dashboardMetrics";

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
}: DashboardDailyBriefingProps) {
  const t = useTranslations("dashboard.dailyBriefing");
  const { isGamified } = useExperienceMode();
  const locale = useLocale() as AppLocale;
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const greeting = getGreeting(now, locale);

  const todayDateStr = getTodayDateString(now);
  const localTodayTasks = getTodayTasks(tasks, todayDateStr);
  const completedTodayTasks = localTodayTasks.filter((t) => t.completed).length;
  const totalTodayTasks = localTodayTasks.length;
  const todayXp = getTodayXp(transactions, now);

  const completionPercent =
    totalTodayTasks > 0
      ? Math.round((completedTodayTasks / totalTodayTasks) * 100)
      : 0;

  const isAllCompleted =
    totalTodayTasks > 0 && completedTodayTasks === totalTodayTasks;

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
  const formattedDay = now.toLocaleDateString(
    locale === "en" ? "en-US" : "pt-BR",
    {
      weekday: "long",
      day: "numeric",
      month: "short",
    },
  );
  const capitalizedDay =
    formattedDay.charAt(0).toUpperCase() + formattedDay.slice(1);

  return (
    <section
      aria-label={t("ariaLabel")}
      className="w-full shrink-0 min-h-fit rounded-2xl border border-primary/35 bg-linear-to-br from-primary-dark/40 via-surface/60 to-primary-dark/25 shadow-[0_0_20px_rgba(124,58,237,0.1)] backdrop-blur-md transition-all duration-200 relative overflow-hidden flex flex-col p-5 sm:p-6 gap-5"
    >
      {/* Bloco Superior: Saudação, Mensagem Contextual e Progresso Diário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
            <Calendar
              size={14}
              className="text-gold shrink-0"
              aria-hidden="true"
            />
            <span className="capitalize" suppressHydrationWarning>
              {capitalizedDay}
            </span>
          </div>

          <h2
            className="font-extrabold text-neutral-50 tracking-tight text-2xl sm:text-3xl"
            suppressHydrationWarning
          >
            {greeting}, <span className="text-gold">{firstName}</span>! 👋
          </h2>

          <p
            className="text-body-s text-neutral-300 font-medium leading-relaxed"
            suppressHydrationWarning
          >
            {motivationalMessage}
          </p>
        </div>

        {/* Progresso Diário no Topo Direito (se houver tarefas agendadas hoje) */}
        {totalTodayTasks > 0 && (
          <div className="flex flex-col gap-1.5 sm:w-64 shrink-0 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium">
                {t("todayGoal")}
              </span>
              <span
                className={cn(
                  "font-bold",
                  isAllCompleted ? "text-emerald-400" : "text-gold",
                )}
                suppressHydrationWarning
              >
                {completedTodayTasks}/{totalTodayTasks} ({completionPercent}%)
              </span>
            </div>
            <div
              className="h-2 w-full rounded-full bg-white/10 overflow-hidden"
              role="progressbar"
              aria-valuenow={completedTodayTasks}
              aria-valuemin={0}
              aria-valuemax={totalTodayTasks}
              aria-label={t("progressAriaLabel", {
                percent: completionPercent,
              })}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500 ease-out",
                  isAllCompleted
                    ? "bg-linear-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    : "bg-linear-to-r from-gold to-amber-400 shadow-glow-gold-xs",
                )}
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bloco Inferior: 3 Cards de Indicadores Chave em Largura Total (w-full) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
        {/* Card 1: Ofensiva */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-orange-500/30 transition-colors backdrop-blur-xs min-w-0">
          <div className="w-11 h-11 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
            <Flame size={22} aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-tiny font-bold text-neutral-400 uppercase tracking-wider">
              {t("streakLabel")}
            </span>
            <span className="text-base sm:text-lg font-extrabold text-neutral-100 truncate">
              {t("streakCount", { count: streak })}
            </span>
            <span
              className="text-xs font-semibold text-orange-400 whitespace-nowrap overflow-visible"
              title={
                streak > 0 ? t("streakActiveTitle") : t("streakStartTitle")
              }
            >
              {streak > 0 ? t("streakActiveBadge") : t("streakStartBadge")}
            </span>
          </div>
        </div>

        {/* Card 2: Meta Diária */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-colors backdrop-blur-xs min-w-0">
          <div
            className={cn(
              "w-11 h-11 rounded-lg flex items-center justify-center shrink-0 border",
              isAllCompleted
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-blue-500/15 border-blue-500/30 text-blue-400",
            )}
          >
            <Target size={22} aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-tiny font-bold text-neutral-400 uppercase tracking-wider">
              {t("dailyTasksLabel")}
            </span>
            <span
              className="text-base sm:text-lg font-extrabold text-neutral-100 truncate"
              suppressHydrationWarning
            >
              {t("completedCount", {
                completed: completedTodayTasks,
                total: totalTodayTasks,
              })}
            </span>
            <span
              className={cn(
                "text-xs font-semibold whitespace-nowrap overflow-visible",
                isAllCompleted ? "text-emerald-400" : "text-neutral-300",
              )}
              title={
                isAllCompleted
                  ? t("allCompletedTitle")
                  : t("pendingCountTitle", {
                      count: totalTodayTasks - completedTodayTasks,
                    })
              }
              suppressHydrationWarning
            >
              {isAllCompleted
                ? t("goalMetBadge")
                : t("pendingCountBadge", {
                    count: totalTodayTasks - completedTodayTasks,
                  })}
            </span>
          </div>
        </div>

        {/* Card 3: XP / Pontos Acumulados Hoje */}
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-gold/30 transition-colors backdrop-blur-xs min-w-0">
          <div className="w-11 h-11 rounded-lg bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0">
            <Sparkles size={22} aria-hidden="true" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-tiny font-bold text-neutral-400 uppercase tracking-wider">
              {isGamified
                ? t("xpEarnedLabelGamified")
                : t("xpEarnedLabelProductivity")}
            </span>
            <span
              className="text-base sm:text-lg font-extrabold text-gold truncate"
              suppressHydrationWarning
            >
              +{todayXp} {isGamified ? "XP" : "pts"}
            </span>
            <span
              className="text-xs font-semibold text-neutral-300 whitespace-nowrap overflow-visible"
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
