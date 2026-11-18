package com.habitparty.adapters.in.web.dtos.response.admin;

import java.math.BigDecimal;

import com.habitparty.application.usecases.admin.RecalculateFocusRewardsUseCase;

public record FocusRewardRecalculationResponseDTO(
    boolean dryRun,
    long recordsTimestampSynced,
    long recordsRewardUpgraded,
    long usersAffected,
    int totalXpAdded,
    BigDecimal totalCoinsAdded) {
  public static FocusRewardRecalculationResponseDTO fromResult(
      RecalculateFocusRewardsUseCase.RecalculationResult result) {
    return new FocusRewardRecalculationResponseDTO(
        result.dryRun(),
        result.recordsTimestampSynced(),
        result.recordsRewardUpgraded(),
        result.usersAffected(),
        result.totalXpAdded(),
        result.totalCoinsAdded());
  }
}
