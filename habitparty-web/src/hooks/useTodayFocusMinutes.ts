"use client";

import { useMemo } from "react";
import { useUserStore } from "@/store/userStore";
import type { DashboardFocusRecordSummary } from "@/types/dashboard";
import { calculateProductiveMinutesForDate } from "@/utils/focusDailyYield";

/**
 * Calcula os minutos produtivos de foco na data `todayDateStr`, reconciliando os registros
 * do servidor com o delta em tempo real mantido em `useUserStore`.
 */
export function useTodayFocusMinutes(
  focusRecords: DashboardFocusRecordSummary[],
  todayDateStr: string,
  timeZone?: string | null,
): {
  recordsMinutesToday: number;
  storeMinutesToday: number;
  effectiveFocusMinutesToday: number;
} {
  const storeTodayFocusMinutes = useUserStore((s) => s.todayFocusMinutes);
  const storeTodayMetricsDate = useUserStore((s) => s.todayMetricsDate);

  const recordsMinutesToday = useMemo(
    () =>
      calculateProductiveMinutesForDate(
        focusRecords,
        todayDateStr,
        timeZone,
        "endTime",
      ),
    [focusRecords, todayDateStr, timeZone],
  );

  const storeMinutesToday =
    storeTodayMetricsDate === todayDateStr ? storeTodayFocusMinutes : 0;

  return {
    recordsMinutesToday,
    storeMinutesToday,
    effectiveFocusMinutesToday: Math.max(
      recordsMinutesToday,
      storeMinutesToday,
    ),
  };
}
