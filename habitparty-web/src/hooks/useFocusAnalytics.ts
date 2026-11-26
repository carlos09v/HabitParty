"use client";

import { useLocale } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import { useDateFormat } from "@/hooks/useDateFormat";
import type { AppLocale } from "@/i18n/config";
import { useUserStore } from "@/store/userStore";
import type {
  FocusActivity,
  FocusMetrics,
  FocusRecord,
  FocusSummaryData,
} from "@/types/focus";
import {
  aggregateFocusRecordsSinglePass,
  buildWeeklyFocusChartData,
  focusSummaryToMetrics,
} from "@/utils/focusMetrics";

interface UseFocusAnalyticsParams {
  initialActivities: FocusActivity[];
  initialRecords: FocusRecord[];
  selectedActivityId: string | null;
  todayDateKey?: string;
  initialTimeZone?: string | null;
  activeSummary?: FocusSummaryData | null;
}

export function useFocusAnalytics({
  initialActivities,
  initialRecords,
  selectedActivityId,
  todayDateKey,
  initialTimeZone = null,
  activeSummary = null,
}: UseFocusAnalyticsParams) {
  const locale = useLocale() as AppLocale;
  const { dateFormat } = useDateFormat();
  const storeTimeZone = useUserStore((s) => s.user?.timezone);
  const effectiveTimeZone = storeTimeZone ?? initialTimeZone;

  // Deslocamento da semana para o gráfico semanal (0 = Esta semana, -1 = semana passada...)
  const [weekOffset, setWeekOffset] = useState(0);

  const handlePrevWeek = useCallback(() => {
    setWeekOffset((prev) => prev - 1);
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekOffset((prev) => Math.min(0, prev + 1));
  }, []);

  const handleResetWeek = useCallback(() => {
    setWeekOffset(0);
  }, []);

  const [paginationState, setPaginationState] = useState<{
    activityId: string | null;
    visibleCount: number;
  }>({
    activityId: selectedActivityId,
    visibleCount: 10,
  });

  const visibleRecordCount =
    paginationState.activityId === selectedActivityId
      ? paginationState.visibleCount
      : 10;

  const showMoreRecords = useCallback(
    (step = 10) => {
      setPaginationState((prev) => {
        const baseCount =
          prev.activityId === selectedActivityId ? prev.visibleCount : 10;
        return {
          activityId: selectedActivityId,
          visibleCount: baseCount + step,
        };
      });
    },
    [selectedActivityId],
  );

  const selectedActivity = useMemo(() => {
    if (!selectedActivityId) return null;
    return initialActivities.find((a) => a.id === selectedActivityId) || null;
  }, [initialActivities, selectedActivityId]);

  const relevantRecords = useMemo(() => {
    if (!selectedActivityId) return initialRecords;
    return initialRecords.filter(
      (r) => r.focusActivityId === selectedActivityId,
    );
  }, [initialRecords, selectedActivityId]);

  const recentRecords = useMemo(
    () => relevantRecords.slice(0, visibleRecordCount),
    [relevantRecords, visibleRecordCount],
  );

  // Agregação única O(N) apenas como fallback caso o resumo agregado do backend não esteja disponível.
  // Completamente desacoplada de `weekOffset` para manter `metrics` estável ao navegar semanas (< >).
  const aggregated = useMemo(() => {
    if (activeSummary) {
      return {
        metrics: focusSummaryToMetrics(activeSummary),
        dayMinutesMap: activeSummary.dailyMinutes,
        globalTodayProductiveMinutes:
          activeSummary.globalTodayProductiveMinutes,
        globalTodayRewardableMinutes:
          activeSummary.globalTodayRewardableMinutes,
        todayDurationByActivityId: activeSummary.todayDurationByActivityId,
      };
    }

    return aggregateFocusRecordsSinglePass(initialRecords, {
      todayStr: todayDateKey,
      timeZone: effectiveTimeZone,
      activityIdFilter: selectedActivityId,
    });
  }, [
    activeSummary,
    initialRecords,
    todayDateKey,
    effectiveTimeZone,
    selectedActivityId,
  ]);

  // Fatia semanal O(7) isolada sobre `dayMinutesMap` (não recalcula `metrics` nem re-renderiza FocusMetricsGrid)
  const weekly = useMemo(() => {
    void todayDateKey;
    return buildWeeklyFocusChartData(
      aggregated.dayMinutesMap,
      weekOffset,
      new Date(),
      locale,
      effectiveTimeZone,
      dateFormat,
    );
  }, [
    aggregated.dayMinutesMap,
    weekOffset,
    locale,
    effectiveTimeZone,
    dateFormat,
    todayDateKey,
  ]);

  const metrics: FocusMetrics = aggregated.metrics;

  return {
    weekOffset,
    handlePrevWeek,
    handleNextWeek,
    handleResetWeek,
    selectedActivity,
    recentRecords,
    relevantRecordsCount: relevantRecords.length,
    showMoreRecords,
    metrics,
    globalTodayProductiveMinutes: aggregated.globalTodayProductiveMinutes,
    globalTodayRewardableMinutes: aggregated.globalTodayRewardableMinutes,
    todayDurationByActivityId: aggregated.todayDurationByActivityId,
    weeklyDays: weekly.weeklyDays,
    totalWeekMinutes: weekly.totalWeekMinutes,
    weekLabel: weekly.weekLabel,
    weekDateRange: weekly.weekDateRange,
  };
}
