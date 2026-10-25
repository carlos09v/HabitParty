package com.habitparty.adapters.out.persistence;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.EmailDispatchLogJpaEntity;
import com.habitparty.adapters.out.persistence.repository.EmailDispatchLogJpaRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.core.domain.entities.EmailDispatchLog;

@Component
public class EmailDispatchLogAdapter implements EmailDispatchLogRepository {

  private final EmailDispatchLogJpaRepository repository;

  public EmailDispatchLogAdapter(EmailDispatchLogJpaRepository repository) {
    this.repository = repository;
  }

  @Override
  public EmailDispatchLog save(EmailDispatchLog domain) {
    EmailDispatchLogJpaEntity entity = new EmailDispatchLogJpaEntity(
        domain.getId(),
        domain.getUserId(),
        domain.getTaskId(),
        domain.getEmailType(),
        domain.getRecipientEmail(),
        domain.getSubject(),
        domain.getStatus(),
        domain.getErrorMessage(),
        domain.getSentAt()
    );

    EmailDispatchLogJpaEntity saved = repository.save(entity);

    return new EmailDispatchLog(
        saved.getId(),
        saved.getUserId(),
        saved.getTaskId(),
        saved.getEmailType(),
        saved.getRecipientEmail(),
        saved.getSubject(),
        saved.getStatus(),
        saved.getErrorMessage(),
        saved.getSentAt()
    );
  }

  @Override
  public long countBySentAtAfter(LocalDateTime date) {
    return repository.countBySentAtAfter(date);
  }

  @Override
  public long countByUserIdAndSentAtAfter(UUID userId, LocalDateTime date) {
    return repository.countByUserIdAndSentAtAfter(userId, date);
  }

  @Override
  public long countByUserIdAndEmailTypeAndStatusAndSentAtAfter(
      UUID userId,
      com.habitparty.core.domain.enums.EmailType emailType,
      com.habitparty.core.domain.enums.EmailDispatchStatus status,
      LocalDateTime date) {
    return repository.countByUserIdAndEmailTypeAndStatusAndSentAtAfter(userId, emailType, status, date);
  }

  @Override
  public List<EmailDispatchLog> findRecentByUserId(UUID userId, int limit) {
    return repository.findRecentByUserId(userId, PageRequest.of(0, limit))
        .stream()
        .map(entity -> new EmailDispatchLog(
            entity.getId(),
            entity.getUserId(),
            entity.getTaskId(),
            entity.getEmailType(),
            entity.getRecipientEmail(),
            entity.getSubject(),
            entity.getStatus(),
            entity.getErrorMessage(),
            entity.getSentAt()
        ))
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
}
