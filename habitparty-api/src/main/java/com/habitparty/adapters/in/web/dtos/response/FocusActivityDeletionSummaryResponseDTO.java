package com.habitparty.adapters.in.web.dtos.response;

import java.math.BigDecimal;

import com.habitparty.application.ports.FocusRecordRepository;

public record FocusActivityDeletionSummaryResponseDTO(
    long totalRecordsCount,
    int totalXpEarned,
    BigDecimal totalCoinsEarned) {
  public static FocusActivityDeletionSummaryResponseDTO fromDomain(
      FocusRecordRepository.ActivityDeletionSummary summary) {
    if (summary == null) {
      return new FocusActivityDeletionSummaryResponseDTO(0L, 0, BigDecimal.ZERO);
    }
    return new FocusActivityDeletionSummaryResponseDTO(
        summary.totalRecordsCount(),
        summary.totalXpEarned(),
        summary.totalCoinsEarned() != null ? summary.totalCoinsEarned() : BigDecimal.ZERO);
  }
}
