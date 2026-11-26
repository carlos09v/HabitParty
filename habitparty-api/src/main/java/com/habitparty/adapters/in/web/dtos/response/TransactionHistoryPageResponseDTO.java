package com.habitparty.adapters.in.web.dtos.response;

import java.time.ZoneId;
import java.util.List;

import org.springframework.data.domain.Page;

import com.habitparty.application.ports.TransactionHistoryRepository.TransactionHistorySummary;
import com.habitparty.core.domain.entities.TransactionHistory;

public record TransactionHistoryPageResponseDTO(
    List<TransactionHistoryResponseDTO> content,
    long totalElements,
    int totalPages,
    int number,
    int size,
    int numberOfElements,
    boolean first,
    boolean last,
    boolean empty,
    TransactionHistorySummaryDTO summary
) {
  public static TransactionHistoryPageResponseDTO fromDomain(
      Page<TransactionHistory> page,
      TransactionHistorySummary summary,
      ZoneId userZone) {
    List<TransactionHistoryResponseDTO> items = page.getContent().stream()
        .map(tx -> TransactionHistoryResponseDTO.fromDomain(tx, userZone))
        .toList();
    return new TransactionHistoryPageResponseDTO(
        items,
        page.getTotalElements(),
        page.getTotalPages(),
        page.getNumber(),
        page.getSize(),
        page.getNumberOfElements(),
        page.isFirst(),
        page.isLast(),
        page.isEmpty(),
        TransactionHistorySummaryDTO.fromDomain(summary)
    );
  }
}
