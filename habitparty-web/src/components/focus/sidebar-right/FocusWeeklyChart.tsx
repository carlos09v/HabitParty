import { BarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
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
}

export function FocusWeeklyChart({
  days,
  totalWeekMinutes,
  weekOffset = 0,
  weekLabel,
  weekDateRange,
  onPrevWeek,
  onNextWeek,
  onResetWeek,
}: FocusWeeklyChartProps) {
  const t = useTranslations("focus.weeklyChart");
  const resolvedWeekLabel = weekLabel ?? t("thisWeek");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [weekAnnouncement, setWeekAnnouncement] = useState("");
  const prevWeekOffsetRef = useRef(weekOffset);

  // Reseta tooltip travado ao trocar de semana e anuncia a mudança via região polite
  useEffect(() => {
    setHoveredIndex(null);
    if (prevWeekOffsetRef.current !== weekOffset) {
      prevWeekOffsetRef.current = weekOffset;
      setWeekAnnouncement(
        `${resolvedWeekLabel}: ${formatFocusMinutes(totalWeekMinutes)}`,
      );
    }
  }, [weekOffset, resolvedWeekLabel, totalWeekMinutes]);

  // Clique-fora fecha tooltip fixado no toque (mobile/tablet)
  useClickOutside(chartContainerRef, () => setHoveredIndex(null), {
    enabled: hoveredIndex !== null,
  });

  const activeHovered = hoveredIndex !== null ? days[hoveredIndex] : null;

  return (
    <div
      ref={chartContainerRef}
      className="rounded-2xl border border-neutral-700 dark:border-primary/25 bg-card dark:bg-surface/50 shadow-2xs dark:shadow-none flex flex-col w-full transition-colors p-4 gap-3"
    >
      <output aria-live="polite" aria-atomic="true" className="sr-only">
        {weekAnnouncement}
      </output>

      {/* Header com Título (<h3>) e Navegador de Semanas */}
      <div className="flex items-center justify-between gap-2 w-full min-w-0">
        <div className="flex items-center gap-1.5 text-neutral-300 shrink-0">
          <BarChart2
            size={15}
            aria-hidden="true"
            className="text-primary dark:text-primary-light"
          />
          <h3 className="text-body-s font-bold text-neutral-100 whitespace-nowrap">
            {t("title")}
          </h3>
        </div>

        {/* Navegador Semanal (< Esta Semana >) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onPrevWeek}
            className="min-w-7 min-h-7 pointer-coarse:min-w-9 pointer-coarse:min-h-9 p-1 rounded-md hover:bg-surface dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer shrink-0 flex items-center justify-center"
            title={t("prevWeek")}
            aria-label={t("prevWeek")}
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>

          {weekOffset !== 0 ? (
            <button
              type="button"
              onClick={onResetWeek}
              className="min-h-7 pointer-coarse:min-h-9 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary-dark/40 text-primary dark:text-primary-light hover:text-amber-700 dark:hover:text-gold hover:border-amber-500/50 dark:hover:border-gold/50 hover:bg-amber-500/10 dark:hover:bg-gold/10 border border-primary/25 dark:border-primary/30 truncate max-w-[96px] text-center transition-[color,background-color,border-color,transform] cursor-pointer shadow-xs active:scale-95"
              title={t("resetWeekTitle")}
              aria-label={`${resolvedWeekLabel} — ${t("resetWeekAria")}`}
            >
              {resolvedWeekLabel}
            </button>
          ) : (
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary-dark/40 text-primary dark:text-primary-light border border-primary/25 dark:border-primary/30 truncate max-w-[96px] text-center"
              title={weekDateRange || resolvedWeekLabel}
            >
              {resolvedWeekLabel}
            </span>
          )}

          <button
            type="button"
            onClick={onNextWeek}
            disabled={weekOffset >= 0}
            className="min-w-7 min-h-7 pointer-coarse:min-w-9 pointer-coarse:min-h-9 p-1 rounded-md hover:bg-surface dark:hover:bg-white/10 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
            title={t("nextWeek")}
            aria-label={t("nextWeek")}
          >
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Tempo Destaque e Intervalo de Datas */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-subtitle-s font-bold text-neutral-50 tabular-nums">
            {formatFocusMinutes(totalWeekMinutes)}
          </span>
          <span className="text-tiny text-neutral-400">
            {weekOffset === 0 ? t("inThisWeek") : t("inSelectedWeek")}
          </span>
        </div>

        {activeHovered ? (
          <span className="text-tiny text-amber-700 dark:text-gold font-semibold animate-in fade-in tabular-nums">
            {activeHovered.dayLabel}:{" "}
            {formatFocusMinutes(activeHovered.minutes)}
          </span>
        ) : weekDateRange ? (
          <span className="text-tiny text-neutral-400 font-medium tabular-nums">
            {weekDateRange}
          </span>
        ) : null}
      </div>

      {/* Gráfico de Barras dos 7 Dias da Semana */}
      <figure className="m-0 w-full">
        <figcaption className="sr-only">{t("chartAriaLabel")}</figcaption>
        <div className="w-full flex items-end justify-between gap-2 pt-4 px-1 border-b border-neutral-700 dark:border-white/10 relative">
          {days.map((item, index) => {
            const isHovered = hoveredIndex === index;
            const heightClamped = Math.max(item.heightPercent, 6);
            const isFirst = index === 0;
            const isLast = index === days.length - 1;
            const barLabel = `${item.dayLabel} (${item.fullDate}): ${formatFocusMinutes(item.minutes)}`;

            return (
              <button
                type="button"
                key={item.fullDate}
                aria-label={barLabel}
                aria-pressed={isHovered}
                onClick={() =>
                  setHoveredIndex((prev) => (prev === index ? null : index))
                }
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                className="flex-1 flex flex-col items-center gap-1 justify-end group/bar relative cursor-pointer bg-transparent border-0 p-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                title={barLabel}
              >
                {/* Tooltip ancorado com clamping nas bordas (Domingo à esquerda, Sábado à direita) */}
                {isHovered && (
                  <div
                    className={cn(
                      "tooltip-dark absolute -top-7 px-1.5 py-0.5 rounded-md border border-gold/70 text-gold text-tiny font-bold shadow-glow-gold-xs pointer-events-none whitespace-nowrap z-30 -translate-y-1 tabular-nums",
                      isFirst
                        ? "left-0"
                        : isLast
                          ? "right-0"
                          : "left-1/2 -translate-x-1/2",
                    )}
                  >
                    {formatFocusMinutes(item.minutes)}
                  </div>
                )}

                <div className="w-full h-20 flex items-end">
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-[transform,scale,background-color] duration-300 ease-out origin-bottom",
                      item.isToday
                        ? "bg-gold shadow-glow-gold-xs"
                        : item.minutes > 0
                          ? "bg-primary/65 dark:bg-primary-light/60 group-hover/bar:bg-primary dark:group-hover/bar:bg-primary-light"
                          : "bg-neutral-700/80 dark:bg-white/10",
                      isHovered && "scale-y-[1.05] bg-gold-hover dark:bg-gold",
                    )}
                    style={{ height: `${heightClamped}%` }}
                  />
                </div>

                <span
                  className={cn(
                    "text-tiny leading-tight transition-colors",
                    item.isToday
                      ? "text-amber-700 dark:text-gold font-bold"
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

        {totalWeekMinutes === 0 && (
          <p className="mt-2 text-center text-[11px] text-neutral-400">
            {t("emptyWeekHint")}
          </p>
        )}
      </figure>
    </div>
  );
}
