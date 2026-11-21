package com.habitparty.application.usecases.user;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.in.web.dtos.response.UserLayoutSummaryResponseDTO;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;

@Service
public class GetUserLayoutSummaryUseCase {
  private final TransactionHistoryRepository transactionHistoryRepository;
  private final UserTimeResolver userTimeResolver;
  private final FocusRecordRepository focusRecordRepository;
  private final Clock clock;

  @Autowired
  public GetUserLayoutSummaryUseCase(
      TransactionHistoryRepository transactionHistoryRepository,
      UserTimeResolver userTimeResolver,
      FocusRecordRepository focusRecordRepository,
      Clock clock) {
    this.transactionHistoryRepository = transactionHistoryRepository;
    this.userTimeResolver = userTimeResolver;
    this.focusRecordRepository = focusRecordRepository;
    this.clock = clock != null ? clock : Clock.systemDefaultZone();
  }

  public GetUserLayoutSummaryUseCase(
      TransactionHistoryRepository transactionHistoryRepository,
      UserTimeResolver userTimeResolver) {
    this(transactionHistoryRepository, userTimeResolver, null, Clock.systemDefaultZone());
  }

  @Transactional(readOnly = true)
  public UserLayoutSummaryResponseDTO execute(UUID userId) {
    ZoneId effectiveZone = userTimeResolver != null ? userTimeResolver.resolveZone(userId) : clock.getZone();
    LocalDateTime latestCreatedAt = transactionHistoryRepository
        .findLatestTaskCompletionCreatedAtByUserId(userId)
        .orElse(null);
    OffsetDateTime zonedLastTaskCompletionAt = latestCreatedAt != null
        ? latestCreatedAt.atZone(ZoneId.systemDefault()).withZoneSameInstant(effectiveZone).toOffsetDateTime()
        : null;

    int todayFocusMinutes = 0;
    if (focusRecordRepository != null && userId != null) {
      LocalDate today = LocalDate.now(clock.withZone(effectiveZone));
      todayFocusMinutes = focusRecordRepository.sumProductiveFocusMinutesOnDate(userId, today, effectiveZone);
    }

    return new UserLayoutSummaryResponseDTO(zonedLastTaskCompletionAt, todayFocusMinutes);
  }
}
