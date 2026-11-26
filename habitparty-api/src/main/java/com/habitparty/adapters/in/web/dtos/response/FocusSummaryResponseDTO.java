package com.habitparty.adapters.in.web.dtos.response;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import com.habitparty.application.usecases.focus.GetFocusSummaryUseCase.FocusSummaryResult;

public record FocusSummaryResponseDTO(
    int todayRecordsCount,
    int totalRecordsCount,
    int activeStreakDays,
    int totalActiveDays,
    int todayXp,
    int totalXp,
    BigDecimal todayGold,
    BigDecimal totalGold,
    int todayFocusMinutes,
    int totalFocusMinutes,
    int todayPomosCount,
    int totalPomosCount,
    int todayAverageMinutes,
    int totalAverageMinutes,
    int globalTodayProductiveMinutes,
    int globalTodayRewardableMinutes,
    Map<UUID, Integer> todayDurationByActivityId,
    Map<String, Integer> dailyMinutes) {

  public static FocusSummaryResponseDTO fromResult(FocusSummaryResult result) {
    return new FocusSummaryResponseDTO(
        result.todayRecordsCount(),
        result.totalRecordsCount(),
        result.activeStreakDays(),
        result.totalActiveDays(),
        result.todayXp(),
        result.totalXp(),
        result.todayGold(),
        result.totalGold(),
        result.todayFocusMinutes(),
        result.totalFocusMinutes(),
        result.todayPomosCount(),
        result.totalPomosCount(),
        result.todayAverageMinutes(),
        result.totalAverageMinutes(),
        result.globalTodayProductiveMinutes(),
        result.globalTodayRewardableMinutes(),
        result.todayDurationByActivityId(),
        result.dailyMinutes());
  }
}
