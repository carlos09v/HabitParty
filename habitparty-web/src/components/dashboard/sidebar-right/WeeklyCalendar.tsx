"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  RotateCcw,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useMidnightRollover } from "@/hooks/useMidnightRollover";
import type { AppLocale } from "@/i18n/config";
import {
  syncDashboardFilterUrl,
  useDashboardFilterStore,
} from "@/store/dashboardFilterStore";
import { useUserStore } from "@/store/userStore";
import type { WeeklyCalendarProps } from "@/types/dashboard";
import { cn } from "@/utils";
import { buildWeeklyCalendarData } from "@/utils/dashboardMetrics";

/**
 * Rastreador de Ofensiva & Prazos da Semana (WeeklyCalendar - Opção 1).
 * Exibe os 7 dias da semana sempre visíveis com:
 * - Cabeçalho contextual (intervalo da semana + botão rápido "Hoje")
 * - Indicador de ofensiva/atividade concluída nos dias passados/hoje
 * - Indicador de prazos reais (To-Dos com dueDate) sem poluir todos os dias com Diárias repetitivas
 */
export function WeeklyCalendar({
  isCompact = false,
  transactions = [],
  tasks = [],
  onSelectDay,
}: WeeklyCalendarProps) {
  const t = useTranslations("dashboard.sidebarRight.weeklyCalendar");
  const locale = useLocale() as AppLocale;
  const userTimeZone = useUserStore((s) => s.user?.timezone);

  const activeFilter = useDashboardFilterStore((s) => s.activeFilter);
  const urlDate = useDashboardFilterStore((s) => s.selectedDate);
  const setStoreFilter = useDashboardFilterStore((s) => s.setFilter);
  const setStoreSelectedDate = useDashboardFilterStore(
    (s) => s.setSelectedDate,
  );

  const [weekOffset, setWeekOffset] = useState(0);

  const todayIso = useMidnightRollover(userTimeZone);
  // biome-ignore lint/correctness/useExhaustiveDependencies: atualiza a data-base do calendário ao virar o dia
  const baseDate = useMemo(() => new Date(), [todayIso]);

  const { weekRangeLabel, weekDays } = useMemo(
    () =>
      buildWeeklyCalendarData(
        tasks,
        transactions,
        weekOffset,
        todayIso,
        baseDate,
        locale,
        userTimeZone,
      ),
    [tasks, transactions, weekOffset, todayIso, baseDate, locale, userTimeZone],
  );

  const handleDayClick = (isoString: string) => {
    // Se clicar no dia de hoje, mantém o filtro padrão "Hoje" sem exibir pílula avulsa de data
    if (isoString === todayIso) {
      setStoreFilter("today");
      syncDashboardFilterUrl("today", null);
      onSelectDay?.(isoString);
      return;
    }

    if (urlDate === isoString) {
      setStoreSelectedDate(null);
      syncDashboardFilterUrl(activeFilter, null);
    } else {
      setStoreSelectedDate(isoString);
      syncDashboardFilterUrl(activeFilter, isoString);
    }
    onSelectDay?.(isoString);
  };

  const handleResetToToday = () => {
    setWeekOffset(0);
    setStoreFilter("today");
    syncDashboardFilterUrl("today", null);
  };

  const showResetToday = weekOffset !== 0 || Boolean(urlDate);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Header do Widget com Intervalo da Semana e Ação "Hoje" */}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="text-subtitle-s font-bold text-neutral-100 truncate">
            {t("title")}
          </h4>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-white/5 border border-neutral-700 dark:border-white/10 shadow-2xs dark:shadow-none text-tiny font-semibold text-neutral-300 shrink-0">
            <CalendarIcon
              size={11}
              className="text-primary dark:text-gold shrink-0"
            />
            <span>{weekRangeLabel}</span>
          </span>
        </div>

        {showResetToday && (
          <button
            type="button"
            onClick={handleResetToToday}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-800 dark:bg-gold/15 dark:hover:bg-gold/25 dark:border-gold/30 dark:text-gold text-tiny font-bold transition-colors cursor-pointer shrink-0"
            title={t("todayButtonTitle")}
          >
            <RotateCcw size={10} />
            <span>{t("todayButton")}</span>
          </button>
        )}
      </div>

      {/* Navegador Semanal Sempre Visível */}
      <div className="flex items-center justify-between gap-1 w-full">
        <button
          type="button"
          onClick={() => setWeekOffset((prev) => prev - 1)}
          className="p-1 rounded hover:bg-surface dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer shrink-0"
          title={t("prevWeek")}
          aria-label={t("prevWeek")}
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-between">
          {weekDays.map((day) => {
            const isSelected = urlDate === day.isoString;
            return (
              <button
                key={day.isoString}
                type="button"
                onClick={() => handleDayClick(day.isoString)}
                aria-pressed={isSelected}
                title={day.tooltipText}
                className={cn(
                  "flex flex-col items-center justify-between rounded-lg transition-colors flex-1 min-w-0 cursor-pointer relative group/day",
                  isCompact ? "h-12 py-1 px-0.5" : "h-14 py-1.5 px-1",
                  isSelected
                    ? "bg-gold text-on-gold font-bold shadow-glow-gold-xs"
                    : day.isToday
                      ? "border border-amber-500/50 bg-amber-500/10 text-amber-800 hover:bg-amber-500/15 dark:border-gold/60 dark:bg-gold/10 dark:text-gold dark:hover:bg-gold/15"
                      : day.hasStreak
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-neutral-100 hover:border-emerald-600/50 dark:hover:border-emerald-400/50"
                        : "text-neutral-100 hover:bg-surface dark:hover:bg-white/5 border border-transparent hover:border-neutral-700 dark:hover:border-white/10",
                )}
              >
                <span
                  className={cn(
                    "text-label-g font-medium leading-none",
                    isSelected
                      ? "text-on-gold font-semibold"
                      : day.isToday
                        ? "text-amber-700 dark:text-gold font-semibold"
                        : "text-neutral-400",
                  )}
                >
                  {day.shortName}
                </span>

                <span
                  className={cn(
                    "font-bold leading-none my-auto",
                    isCompact ? "text-xs" : "text-body-s",
                    isSelected
                      ? "text-on-gold"
                      : day.isToday
                        ? "text-amber-700 dark:text-gold"
                        : "text-neutral-100",
                  )}
                >
                  {day.dayNumber}
                </span>

                {/* Indicadores Gamificados: Ofensiva (Chama/Esmeralda) e Prazo To-Do ( Ponto Magenta/Âmbar) */}
                <div className="h-2.5 flex items-center justify-center gap-1">
                  {day.hasStreak && (
                    <Flame
                      size={10}
                      className={cn(
                        "shrink-0 transition-transform group-hover/day:scale-110",
                        isSelected
                          ? "text-on-gold fill-on-gold"
                          : "text-emerald-400 fill-emerald-400",
                      )}
                      aria-hidden="true"
                    />
                  )}
                  {day.dueTodosCount > 0 && (
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover/day:scale-125",
                        isSelected
                          ? "bg-on-gold"
                          : "bg-magenta shadow-[0_0_6px_var(--color-magenta)]",
                      )}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setWeekOffset((prev) => prev + 1)}
          className="p-1 rounded hover:bg-surface dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer shrink-0"
          title={t("nextWeek")}
          aria-label={t("nextWeek")}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Micro-legenda de leitura rápida */}
      <div className="flex items-center justify-center gap-4 text-label-g text-neutral-400 pt-0.5">
        <span className="inline-flex items-center gap-1">
          <Flame
            size={11}
            className="text-emerald-400 fill-emerald-400 shrink-0"
            aria-hidden="true"
          />
          <span>{t("legendActiveDay")}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-magenta shrink-0"
            aria-hidden="true"
          />
          <span>{t("legendTodoDue")}</span>
        </span>
      </div>
    </div>
  );
}
