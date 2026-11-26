package com.habitparty.adapters.out.persistence;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.EmailDispatchLogJpaEntity;
import com.habitparty.adapters.out.persistence.repository.EmailDispatchLogJpaRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.core.domain.entities.EmailDispatchLog;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.EmailType;

@Component
public class EmailDispatchLogAdapter implements EmailDispatchLogRepository {

  private final EmailDispatchLogJpaRepository repository;

  public EmailDispatchLogAdapter(EmailDispatchLogJpaRepository repository) {
    this.repository = repository;
  }

  @Override
  public EmailDispatchLog save(EmailDispatchLog domain) {
    EmailDispatchLogJpaEntity entity = EmailDispatchLogJpaEntity.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .taskId(domain.getTaskId())
        .emailType(domain.getEmailType())
        .recipientEmail(domain.getRecipientEmail())
        .subject(domain.getSubject())
        .status(domain.getStatus())
        .errorMessage(domain.getErrorMessage())
        .sentAt(domain.getSentAt())
        .build();

    EmailDispatchLogJpaEntity saved = repository.save(entity);
    return toDomain(saved);
  }

  @Override
  public long countBySentAtAfter(LocalDateTime date) {
    return repository.countBySentAtAfter(date);
  }

  @Override
  public long countByStatusAndSentAtAfter(EmailDispatchStatus status, LocalDateTime date) {
    return repository.countByStatusAndSentAtAfter(status, date);
  }

  @Override
  public long countByUserIdAndStatusAndSentAtAfter(UUID userId, EmailDispatchStatus status, LocalDateTime date) {
    return repository.countByUserIdAndStatusAndSentAtAfter(userId, status, date);
  }

  @Override
  public Map<UUID, Long> countByUserIdsAndStatusAndSentAtAfter(
      Collection<UUID> userIds,
      EmailDispatchStatus status,
      LocalDateTime date) {
    if (userIds == null || userIds.isEmpty()) {
      return Map.of();
    }
    List<Object[]> rows = repository.countByUserIdsAndStatusAndSentAtAfter(userIds, status, date);
    Map<UUID, Long> result = new HashMap<>(rows.size());
    for (Object[] row : rows) {
      result.put((UUID) row[0], ((Number) row[1]).longValue());
    }
    return result;
  }

  @Override
  public long countByUserIdAndEmailTypeAndStatusAndSentAtAfter(
      UUID userId,
      EmailType emailType,
      EmailDispatchStatus status,
      LocalDateTime date) {
    return repository.countByUserIdAndEmailTypeAndStatusAndSentAtAfter(userId, emailType, status, date);
  }

  @Override
  public List<EmailDispatchLog> findRecentByUserId(UUID userId, int limit) {
    return repository.findRecentByUserId(userId, PageRequest.of(0, limit))
        .stream()
        .map(this::toDomain)
        .toList();
  }

  @Override
  public long countTotal() {
    return repository.count();
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
  }

  private EmailDispatchLog toDomain(EmailDispatchLogJpaEntity entity) {
    return new EmailDispatchLog(
        entity.getId(),
        entity.getUserId(),
        entity.getTaskId(),
        entity.getEmailType(),
        entity.getRecipientEmail(),
        entity.getSubject(),
        entity.getStatus(),
        entity.getErrorMessage(),
        entity.getSentAt());
  }
}
