"use client";

import { useLocale } from "next-intl";
import { useCallback, useMemo, useState } from "react";
import type { AppLocale } from "@/i18n/config";
import type { FocusActivity, FocusRecord } from "@/types/focus";
import { calculateFocusMetrics } from "@/utils/focusMetrics";

interface UseFocusAnalyticsParams {
  initialActivities: FocusActivity[];
  initialRecords: FocusRecord[];
  selectedActivityId: string | null;
}

export function useFocusAnalytics({
  initialActivities,
  initialRecords,
  selectedActivityId,
}: UseFocusAnalyticsParams) {
  const locale = useLocale() as AppLocale;

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
    () => relevantRecords.slice(0, 10),
    [relevantRecords],
  );

  const { metrics, weeklyDays, totalWeekMinutes, weekLabel, weekDateRange } =
    useMemo(() => {
      return calculateFocusMetrics(
        relevantRecords,
        weekOffset,
        undefined,
        locale,
      );
    }, [relevantRecords, weekOffset, locale]);

  return {
    weekOffset,
    handlePrevWeek,
    handleNextWeek,
    handleResetWeek,
    selectedActivity,
    recentRecords,
    metrics,
    weeklyDays,
    totalWeekMinutes,
    weekLabel,
    weekDateRange,
  };
}
