package com.habitparty.application.usecases.user;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.in.web.dtos.response.UserLayoutSummaryResponseDTO;
import com.habitparty.application.ports.TransactionHistoryRepository;

@Service
public class GetUserLayoutSummaryUseCase {
  private final TransactionHistoryRepository transactionHistoryRepository;
  private final UserTimeResolver userTimeResolver;

  public GetUserLayoutSummaryUseCase(
      TransactionHistoryRepository transactionHistoryRepository,
      UserTimeResolver userTimeResolver) {
    this.transactionHistoryRepository = transactionHistoryRepository;
    this.userTimeResolver = userTimeResolver;
  }

  @Transactional(readOnly = true)
  public UserLayoutSummaryResponseDTO execute(UUID userId) {
    ZoneId effectiveZone = userTimeResolver != null ? userTimeResolver.resolveZone(userId) : ZoneId.systemDefault();
    LocalDateTime latestCreatedAt = transactionHistoryRepository
        .findLatestTaskCompletionCreatedAtByUserId(userId)
        .orElse(null);
    OffsetDateTime zonedLastTaskCompletionAt = latestCreatedAt != null
        ? latestCreatedAt.atZone(ZoneId.systemDefault()).withZoneSameInstant(effectiveZone).toOffsetDateTime()
        : null;

    return new UserLayoutSummaryResponseDTO(zonedLastTaskCompletionAt);
  }
}
