import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  FocusMetrics,
  FocusRecord,
  WeeklyFocusDayData,
} from "@/types/focus";
import { cn } from "@/utils";
import { FocusMetricsGrid } from "./FocusMetricsGrid";
import { FocusRecentRecords } from "./FocusRecentRecords";
import { FocusWeeklyChart } from "./FocusWeeklyChart";

interface FocusSidebarRightProps {
  metrics: FocusMetrics;
  todayProductiveMinutes?: number;
  todayRewardableMinutes?: number;
  dailyFocusGoalMinutes?: number | null;
  weeklyDays: WeeklyFocusDayData[];
  totalWeekMinutes: number;
  recentRecords: FocusRecord[];
  totalRecordsCount?: number;
  hasMoreRecords?: boolean;
  isLoadingMoreRecords?: boolean;
  onShowMoreRecords?: () => void;
  weekOffset?: number;
  weekLabel?: string;
  weekDateRange?: string;
  onPrevWeek?: () => void;
  onNextWeek?: () => void;
  onResetWeek?: () => void;
  onAddRecord?: () => void;
  onOptionsClick?: () => void;
  onEditRecord?: (record: FocusRecord) => void;
  onDeleteRecord?: (
    recordId: string,
    deleteHistory: boolean,
  ) => void | Promise<void>;
  onRecordUpdated?: (updatedRecord: FocusRecord) => void;
  selectedActivityName?: string | null;
  onClearSelectedActivity?: () => void;
  className?: string;
}

export function FocusSidebarRight({
  metrics,
  todayProductiveMinutes,
  todayRewardableMinutes,
  dailyFocusGoalMinutes,
  weeklyDays,
  totalWeekMinutes,
  recentRecords,
  totalRecordsCount,
  hasMoreRecords = false,
  isLoadingMoreRecords = false,
  onShowMoreRecords,
  weekOffset = 0,
  weekLabel,
  weekDateRange,
  onPrevWeek,
  onNextWeek,
  onResetWeek,
  onAddRecord,
  onOptionsClick,
  onEditRecord,
  onDeleteRecord,
  onRecordUpdated,
  selectedActivityName,
  onClearSelectedActivity,
  className,
}: FocusSidebarRightProps) {
  const t = useTranslations("focus.sidebar");
  const resolvedWeekLabel = weekLabel ?? t("thisWeek");

  return (
    <aside
      data-panel="sidebar-right"
      className={cn(
        "shrink-0 bg-background dark:bg-primary-dark/25 border-t xl:border-t-0 xl:border-l border-neutral-700 dark:border-primary/30 h-full flex flex-col overflow-y-auto overscroll-contain [scrollbar-gutter:stable] custom-scrollbar w-full xl:w-[345px] p-4 gap-4",
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
        todayProductiveMinutes={todayProductiveMinutes}
        todayRewardableMinutes={todayRewardableMinutes}
        dailyFocusGoalMinutes={dailyFocusGoalMinutes}
        totalRecordsCount={totalRecordsCount}
      />

      <div className="h-px w-full bg-neutral-700 dark:bg-white/10 shrink-0" />

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
      />

      <div className="h-px w-full bg-neutral-700 dark:bg-white/10 shrink-0" />

      {/* 3. Foco em Registro (Histórico Recente com botões + e ...) */}
      <FocusRecentRecords
        records={recentRecords}
        totalRecordsCount={totalRecordsCount}
        hasMoreRecords={hasMoreRecords}
        isLoadingMore={isLoadingMoreRecords}
        onShowMore={onShowMoreRecords}
        onAddRecord={onAddRecord}
        onOptionsClick={onOptionsClick}
        onEditRecord={onEditRecord}
        onDeleteRecord={onDeleteRecord}
        onRecordUpdated={onRecordUpdated}
      />
    </aside>
  );
}
