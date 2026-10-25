"use client";

import { Award, Coins, Flame, ListChecks, Timer } from "lucide-react";
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
          Visão Geral
        </h3>

        <div className="flex items-center rounded-lg bg-surface/80 p-0.5 border border-primary/30">
          <button
            type="button"
            onClick={() => onPeriodChange("HOJE")}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
              isToday
                ? "bg-gold text-neutral-900 shadow-glow-gold-xs font-bold"
                : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => onPeriodChange("TOTAL")}
            className={cn(
              "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer",
              !isToday
                ? "bg-gold text-neutral-900 shadow-glow-gold-xs font-bold"
                : "text-neutral-400 hover:text-neutral-200",
            )}
          >
            Total
          </button>
        </div>
      </div>

      {/* 1. Hero Card: Tempo Total de Foco */}
      <div
        className={cn(
          "w-full rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 via-surface/60 to-primary-dark/30 flex items-center justify-between transition-all hover:border-gold/50 shadow-xs relative overflow-hidden",
          isCompact ? "p-2.5" : "p-3",
        )}
      >
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 text-neutral-400 mb-0.5">
            <Timer size={13} className="text-gold shrink-0" />
            <span className="text-tiny font-bold uppercase tracking-wider text-neutral-300">
              {isToday ? "Tempo Focado Hoje" : "Tempo Total em Foco"}
            </span>
          </div>
          <span
            className={cn(
              "font-extrabold text-gold tracking-tight",
              isCompact ? "text-xl" : "text-2xl",
            )}
          >
            {formatFocusMinutes(focusTime)}
          </span>
          <span className="text-label-g text-neutral-400 font-medium">
            {isToday
              ? focusTime > 0
                ? "tempo dedicado hoje 🎯"
                : "nenhum foco registrado hoje"
              : `${formatFocusMinutes(focusTime)} acumulados no total`}
          </span>
        </div>
        <div className="w-10 h-10 rounded-xl bg-gold/15 border border-gold/30 flex items-center justify-center text-gold shrink-0 shadow-glow-gold-xs">
          <Timer size={20} />
        </div>
      </div>

      {/* 2. Grid 2x2 com Indicadores Complementares de Foco */}
      <div className="grid grid-cols-2 gap-2 w-full">
        {/* Sessões / Registros */}
        <div
          className={cn(
            "rounded-xl border border-primary/25 bg-surface/50 flex flex-col justify-between transition-all hover:border-gold/30",
            isCompact ? "p-2 gap-1" : "p-2.5 gap-1.5",
          )}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-tiny font-medium truncate">
              {isToday ? "Sessões (Hoje)" : "Total Sessões"}
            </span>
            <ListChecks size={13} className="text-primary-light shrink-0" />
          </div>
          <div className="flex flex-col">
            <span className="text-body-m font-bold text-neutral-100">
              {recordsCount}
            </span>
            <span className="text-tiny text-neutral-400 truncate">
              {pomosCount > 0
                ? `${pomosCount} pomo${pomosCount > 1 ? "s" : ""}`
                : recordsCount === 1
                  ? "1 registro"
                  : `${recordsCount} registros`}
            </span>
          </div>
        </div>

        {/* Constância / Dias Ativos */}
        <div
          className={cn(
            "rounded-xl border border-primary/25 bg-surface/50 flex flex-col justify-between transition-all hover:border-gold/30",
            isCompact ? "p-2 gap-1" : "p-2.5 gap-1.5",
          )}
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-tiny font-medium truncate">
              {isToday ? "Constância" : "Dias Ativos"}
            </span>
            <Flame size={13} className="text-amber-400 shrink-0" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-body-m font-bold text-neutral-100">
                {streakDays}
              </span>
              <Flame size={14} className="text-amber-400 fill-amber-400/20" />
            </div>
            <span className="text-tiny text-neutral-400 truncate">
              {isToday
                ? streakDays > 0
                  ? "dias seguidos 🔥"
                  : "inicie hoje!"
                : "dias com foco"}
            </span>
          </div>
        </div>

        {/* Ganho de XP */}
        <div
          className={cn(
            "rounded-xl border border-primary/25 bg-surface/50 flex flex-col justify-between transition-all hover:border-gold/30",
            isCompact ? "p-2 gap-1" : "p-2.5 gap-1.5",
          )}
          title="Ganhos de XP obtidos em atividades de foco. Mochila de lazer não gera XP."
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-tiny font-medium truncate">
              {isToday ? "XP em Foco" : "XP Total"}
            </span>
            <Award size={13} className="text-purple-400 shrink-0" />
          </div>
          <div className="flex flex-col">
            <span className="text-body-m font-bold text-neutral-100">
              +{xpCount}
            </span>
            <span className="text-tiny text-neutral-400 truncate">
              atividades de foco
            </span>
          </div>
        </div>

        {/* Ganho de Ouro */}
        <div
          className={cn(
            "rounded-xl border border-primary/25 bg-surface/50 flex flex-col justify-between transition-all hover:border-gold/30",
            isCompact ? "p-2 gap-1" : "p-2.5 gap-1.5",
          )}
          title="Moedas ganhas em atividades de foco. Mochila de lazer não gera moedas."
        >
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-tiny font-medium truncate">
              {isToday ? "Ouro Ganho" : "Ouro Total"}
            </span>
            <Coins size={13} className="text-gold shrink-0" />
          </div>
          <div className="flex flex-col">
            <span className="text-body-m font-bold text-gold">
              +{formatCoins(goldCount)}
            </span>
            <span className="text-tiny text-neutral-400 truncate">
              atividades de foco
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
