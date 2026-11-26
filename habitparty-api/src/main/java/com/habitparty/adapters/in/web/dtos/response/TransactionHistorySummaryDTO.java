package com.habitparty.adapters.in.web.dtos.response;

import java.math.BigDecimal;

import com.habitparty.application.ports.TransactionHistoryRepository.TransactionHistorySummary;

public record TransactionHistorySummaryDTO(
    BigDecimal goldEarned,
    BigDecimal goldSpent,
    int xpEarned,
    int xpLost,
    long totalCount
) {
  public static TransactionHistorySummaryDTO fromDomain(TransactionHistorySummary summary) {
    if (summary == null) {
      return new TransactionHistorySummaryDTO(BigDecimal.ZERO, BigDecimal.ZERO, 0, 0, 0L);
    }
    return new TransactionHistorySummaryDTO(
        summary.goldEarned() != null ? summary.goldEarned() : BigDecimal.ZERO,
        summary.goldSpent() != null ? summary.goldSpent() : BigDecimal.ZERO,
        summary.xpEarned(),
        summary.xpLost(),
        summary.totalCount()
    );
  }
}
