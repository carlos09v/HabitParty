"use client";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Flame,
  RotateCcw,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useCompactMode } from "@/hooks/useCompactMode";
import type { WeeklyCalendarProps } from "@/types/dashboard";
import { cn } from "@/utils";
import {
  buildWeeklyCalendarData,
  getTodayDateString,
} from "@/utils/dashboardMetrics";

/**
 * Rastreador de Ofensiva & Prazos da Semana (WeeklyCalendar - Opção 1).
 * Exibe os 7 dias da semana sempre visíveis com:
 * - Cabeçalho contextual (intervalo da semana + botão rápido "Hoje")
 * - Indicador de ofensiva/atividade concluída nos dias passados/hoje
 * - Indicador de prazos reais (To-Dos com dueDate) sem poluir todos os dias com Diárias repetitivas
 */
export function WeeklyCalendar({
  isCompact: propIsCompact,
  transactions = [],
  tasks = [],
  onSelectDay,
}: WeeklyCalendarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isCompact: hookIsCompact } = useCompactMode();
  const isCompact = propIsCompact ?? hookIsCompact;

  const urlDate = searchParams.get("date");
  const [weekOffset, setWeekOffset] = useState(0);

  const todayIso = useMemo(() => getTodayDateString(), []);

  const { weekRangeLabel, weekDays } = useMemo(
    () => buildWeeklyCalendarData(tasks, transactions, weekOffset, todayIso),
    [tasks, transactions, weekOffset, todayIso],
  );

  const handleDayClick = (isoString: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("date") === isoString) {
      params.delete("date");
    } else {
      params.set("date", isoString);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
    onSelectDay?.(isoString);
  };

  const handleResetToToday = () => {
    setWeekOffset(0);
    if (urlDate) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("date");
      params.set("page", "1");
      router.push(`?${params.toString()}`, { scroll: false });
    }
  };

  const showResetToday = weekOffset !== 0 || Boolean(urlDate);

  return (
    <div className="flex flex-col gap-2.5 w-full">
      {/* Header do Widget com Intervalo da Semana e Ação "Hoje" */}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2 min-w-0">
          <h4 className="text-subtitle-s font-bold text-neutral-100 truncate">
            Semana
          </h4>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-tiny font-semibold text-neutral-300 shrink-0">
            <CalendarIcon size={11} className="text-gold shrink-0" />
            <span>{weekRangeLabel}</span>
          </span>
        </div>

        {showResetToday && (
          <button
            type="button"
            onClick={handleResetToToday}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gold/15 hover:bg-gold/25 border border-gold/30 text-gold text-tiny font-bold transition-colors cursor-pointer shrink-0"
            title="Voltar para a semana atual e limpar filtro de dia"
          >
            <RotateCcw size={10} />
            <span>Hoje</span>
          </button>
        )}
      </div>

      {/* Navegador Semanal Sempre Visível */}
      <div className="flex items-center justify-between gap-1 w-full">
        <button
          type="button"
          onClick={() => setWeekOffset((prev) => prev - 1)}
          className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer shrink-0"
          title="Semana anterior"
          aria-label="Semana anterior"
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
                  "flex flex-col items-center justify-between rounded-lg transition-all flex-1 min-w-0 cursor-pointer relative group/day",
                  isCompact ? "h-12 py-1 px-0.5" : "h-14 py-1.5 px-1",
                  isSelected
                    ? "bg-gold text-neutral-900 font-bold shadow-glow-gold-xs"
                    : day.isToday
                      ? "border border-gold/60 bg-gold/10 text-gold hover:bg-gold/15"
                      : day.hasStreak
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-neutral-100 hover:border-emerald-400/50"
                        : "text-neutral-100 hover:bg-white/5 border border-transparent hover:border-white/10",
                )}
              >
                <span
                  className={cn(
                    "text-label-g font-medium leading-none",
                    isSelected
                      ? "text-neutral-900 font-semibold"
                      : day.isToday
                        ? "text-gold font-semibold"
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
                      ? "text-neutral-900"
                      : day.isToday
                        ? "text-gold"
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
                          ? "text-neutral-900 fill-neutral-900"
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
                          ? "bg-neutral-900"
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
          className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer shrink-0"
          title="Próxima semana"
          aria-label="Próxima semana"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Micro-legenda de leitura rápida */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-neutral-400 pt-0.5">
        <span className="inline-flex items-center gap-1">
          <Flame
            size={11}
            className="text-emerald-400 fill-emerald-400 shrink-0"
            aria-hidden="true"
          />
          <span>Dia ativo</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full bg-magenta shrink-0"
            aria-hidden="true"
          />
          <span>Prazo (To-Do)</span>
        </span>
      </div>
    </div>
  );
}
