"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type {
  FocusMetrics,
  FocusPeriodTab,
  FocusRecord,
  WeeklyFocusDayData,
} from "@/types/focus";
import { cn } from "@/utils";
import { FocusMetricsGrid } from "./FocusMetricsGrid";
import { FocusRecentRecords } from "./FocusRecentRecords";
import { FocusWeeklyChart } from "./FocusWeeklyChart";

interface FocusSidebarRightProps {
  metrics: FocusMetrics;
  weeklyDays: WeeklyFocusDayData[];
  totalWeekMinutes: number;
  recentRecords: FocusRecord[];
  weekOffset?: number;
  weekLabel?: string;
  weekDateRange?: string;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onResetWeek?: () => void;
  onAddRecord?: () => void;
  onOptionsClick?: () => void;
  onDeleteRecord?: (recordId: string) => void;
  selectedActivityName?: string | null;
  onClearSelectedActivity?: () => void;
  isCompact?: boolean;
  className?: string;
}

export function FocusSidebarRight({
  metrics,
  weeklyDays,
  totalWeekMinutes,
  recentRecords,
  weekOffset = 0,
  weekLabel,
  weekDateRange,
  onPrevWeek,
  onNextWeek,
  onResetWeek,
  onAddRecord,
  onOptionsClick,
  onDeleteRecord,
  selectedActivityName,
  onClearSelectedActivity,
  isCompact = false,
  className,
}: FocusSidebarRightProps) {
  const t = useTranslations("focus.sidebar");
  const resolvedWeekLabel = weekLabel ?? t("thisWeek");
  const [period, setPeriod] = useState<FocusPeriodTab>("HOJE");

  return (
    <aside
      data-panel="sidebar-right"
      className={cn(
        "shrink-0 bg-background dark:bg-primary-dark/20 border-t xl:border-t-0 xl:border-l border-neutral-700 dark:border-primary/30 backdrop-blur-md h-full flex flex-col overflow-y-auto custom-scrollbar transition-all duration-200",
        isCompact
          ? "w-full xl:w-[300px] p-3.5 gap-3"
          : "w-full xl:w-[345px] p-4 gap-4",
        className,
      )}
      aria-label={t("ariaLabel")}
    >
      {/* Indicador de Filtro Ativo */}
      {selectedActivityName && (
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-gold/10 border border-gold/40 text-xs shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-label-g text-neutral-400">
              {t("activityFilterLabel")}
            </span>
            <span className="font-bold text-gold truncate">
              {selectedActivityName}
            </span>
          </div>
          <button
            type="button"
            onClick={onClearSelectedActivity}
            className="flex items-center gap-1 text-neutral-400 hover:text-neutral-100 text-label-g font-semibold px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
            title={t("viewAllActivities")}
          >
            <span>{t("allActivities")}</span>
            <X size={12} />
          </button>
        </div>
      )}

      {/* 1. Visão Geral e Grid de Métricas */}
      <FocusMetricsGrid
        metrics={metrics}
        period={period}
        onPeriodChange={setPeriod}
        isCompact={isCompact}
      />

      <div className="h-px w-full bg-white/10 shrink-0" />

      {/* 2. Gráfico Semanal (Análise de Foco com Navegação de Semanas) */}
      <FocusWeeklyChart
        days={weeklyDays}
        totalWeekMinutes={totalWeekMinutes}
        weekOffset={weekOffset}
        weekLabel={resolvedWeekLabel}
        weekDateRange={weekDateRange}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        onResetWeek={onResetWeek}
        isCompact={isCompact}
      />

      <div className="h-px w-full bg-white/10 shrink-0" />

      {/* 3. Foco em Registro (Histórico Recente com botões + e ...) */}
      <FocusRecentRecords
        records={recentRecords}
        onAddRecord={onAddRecord}
        onOptionsClick={onOptionsClick}
        onDeleteRecord={onDeleteRecord}
        isCompact={isCompact}
      />
    </aside>
  );
}
