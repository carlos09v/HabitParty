package com.habitparty.application.ports;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.habitparty.core.domain.entities.EmailDispatchLog;

public interface EmailDispatchLogRepository {
  EmailDispatchLog save(EmailDispatchLog log);

  long countBySentAtAfter(LocalDateTime date);

  long countByStatusAndSentAtAfter(
      com.habitparty.core.domain.enums.EmailDispatchStatus status,
      LocalDateTime date
  );

  long countByUserIdAndSentAtAfter(UUID userId, LocalDateTime date);

  long countByUserIdAndStatusAndSentAtAfter(
      UUID userId,
      com.habitparty.core.domain.enums.EmailDispatchStatus status,
      LocalDateTime date
  );

  Map<UUID, Long> countByUserIdsAndSentAtAfter(Collection<UUID> userIds, LocalDateTime date);

  Map<UUID, Long> countByUserIdsAndStatusAndSentAtAfter(
      Collection<UUID> userIds,
      com.habitparty.core.domain.enums.EmailDispatchStatus status,
      LocalDateTime date
  );

  long countByUserIdAndEmailTypeAndStatusAndSentAtAfter(
      UUID userId,
      com.habitparty.core.domain.enums.EmailType emailType,
      com.habitparty.core.domain.enums.EmailDispatchStatus status,
      LocalDateTime date
  );

  List<EmailDispatchLog> findRecentByUserId(UUID userId, int limit);

  long countTotal();

  void deleteAllByUserId(UUID userId);
}
