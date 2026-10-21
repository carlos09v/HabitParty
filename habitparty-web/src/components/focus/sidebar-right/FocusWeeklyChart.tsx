"use client";

import { BarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { WeeklyFocusDayData } from "@/types/focus";
import { cn } from "@/utils";
import { formatFocusMinutes } from "@/utils/focusFormatters";

interface FocusWeeklyChartProps {
  days: WeeklyFocusDayData[];
  totalWeekMinutes: number;
  weekOffset?: number;
  weekLabel?: string;
  weekDateRange?: string;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onResetWeek?: () => void;
  isCompact?: boolean;
}

export function FocusWeeklyChart({
  days,
  totalWeekMinutes,
  weekOffset = 0,
  weekLabel = "Esta semana",
  weekDateRange,
  onPrevWeek,
  onNextWeek,
  onResetWeek,
  isCompact = false,
}: FocusWeeklyChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const activeHovered = hoveredIndex !== null ? days[hoveredIndex] : null;

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/25 bg-surface/50 flex flex-col w-full transition-all",
        isCompact ? "p-3 gap-2.5" : "p-4 gap-3",
      )}
    >
      {/* Header com Título e Navegador de Semanas */}
      <div className="flex items-center justify-between gap-2 w-full min-w-0">
        <div className="flex items-center gap-1.5 text-neutral-300 shrink-0">
          <BarChart2 size={15} className="text-primary-light" />
          <h4 className="text-body-s font-bold text-neutral-100 whitespace-nowrap">
            Análise de Foco
          </h4>
        </div>

        {/* Navegador Semanal (< Esta Semana >) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onPrevWeek}
            className="p-1 rounded-md hover:bg-white/10 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer shrink-0"
            title="Semana anterior"
            aria-label="Semana anterior"
          >
            <ChevronLeft size={14} />
          </button>

          {weekOffset !== 0 ? (
            <button
              type="button"
              onClick={onResetWeek}
              className="text-label-g font-semibold px-2 py-0.5 rounded-full bg-primary-dark/40 text-primary-light hover:text-gold hover:border-gold/50 hover:bg-gold/10 border border-primary/30 truncate max-w-[90px] text-center transition-all cursor-pointer shadow-xs active:scale-95"
              title="Clique para voltar para a semana atual"
              aria-label="Voltar para a semana atual"
            >
              {weekLabel}
            </button>
          ) : (
            <span
              className="text-label-g font-semibold px-2 py-0.5 rounded-full bg-primary-dark/40 text-primary-light border border-primary/30 truncate max-w-[90px] text-center"
              title={weekDateRange || weekLabel}
            >
              {weekLabel}
            </span>
          )}

          <button
            type="button"
            onClick={onNextWeek}
            disabled={weekOffset >= 0}
            className="p-1 rounded-md hover:bg-white/10 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Próxima semana"
            aria-label="Próxima semana"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Tempo Destaque e Intervalo de Datas */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-subtitle-s font-bold text-neutral-50">
            {formatFocusMinutes(totalWeekMinutes)}
          </span>
          <span className="text-tiny text-neutral-400">
            {weekOffset === 0 ? "nesta semana" : "na semana"}
          </span>
        </div>

        {activeHovered ? (
          <span className="text-tiny text-gold font-semibold animate-in fade-in">
            {activeHovered.dayLabel}:{" "}
            {formatFocusMinutes(activeHovered.minutes)}
          </span>
        ) : weekDateRange ? (
          <span className="text-tiny text-neutral-400 font-medium">
            {weekDateRange}
          </span>
        ) : null}
      </div>

      {/* Gráfico de Barras dos 7 Dias da Semana */}
      <div
        className={cn(
          "w-full flex items-end justify-between gap-2 pt-4 px-1 border-b border-white/10 relative",
          isCompact ? "h-24" : "h-28",
        )}
        role="img"
        aria-label="Gráfico semanal de minutos focados"
      >
        {days.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const heightClamped = Math.max(item.heightPercent, 6);

          return (
            <button
              type="button"
              key={item.dayLabel}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              className="flex-1 flex flex-col items-center gap-1 h-full justify-end group/bar relative cursor-pointer bg-transparent border-0 p-0 focus:outline-none"
              title={`${item.dayLabel} (${item.fullDate}): ${formatFocusMinutes(item.minutes)}`}
            >
              {/* Tooltip flutuante */}
              {isHovered && (
                <div className="absolute -top-7 px-1.5 py-0.5 rounded-md bg-neutral-900 border border-gold/70 text-gold text-tiny font-bold shadow-glow-gold-xs pointer-events-none whitespace-nowrap z-30 transition-all transform -translate-y-1">
                  {formatFocusMinutes(item.minutes)}
                </div>
              )}

              {/* Barra */}
              <div
                className={cn(
                  "w-full rounded-t-md transition-all duration-300 ease-out origin-bottom",
                  item.isToday
                    ? "bg-gold shadow-glow-gold-xs"
                    : item.minutes > 0
                      ? "bg-primary-light/60 group-hover/bar:bg-primary-light"
                      : "bg-white/10",
                  isHovered && "brightness-125 scale-y-[1.05] bg-gold",
                )}
                style={{ height: `${heightClamped}%` }}
              />

              {/* Rótulo do Dia */}
              <span
                className={cn(
                  "text-tiny leading-tight transition-colors",
                  item.isToday
                    ? "text-gold font-bold"
                    : isHovered
                      ? "text-neutral-100 font-semibold"
                      : "text-neutral-400 font-medium",
                )}
              >
                {item.dayLabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
