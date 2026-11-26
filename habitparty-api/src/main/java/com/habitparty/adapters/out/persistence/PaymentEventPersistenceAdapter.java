package com.habitparty.adapters.out.persistence;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.ProcessedPaymentEventJpaEntity;
import com.habitparty.adapters.out.persistence.repository.ProcessedPaymentEventJpaRepository;
import com.habitparty.application.ports.PaymentEventRepository;
import com.habitparty.core.domain.enums.PaymentEventStatus;

@Component
public class PaymentEventPersistenceAdapter implements PaymentEventRepository {

  private final ProcessedPaymentEventJpaRepository repository;

  public PaymentEventPersistenceAdapter(ProcessedPaymentEventJpaRepository repository) {
    this.repository = repository;
  }

  @Override
  public boolean existsByEventId(String stripeEventId) {
    if (stripeEventId == null || stripeEventId.isBlank()) {
      return false;
    }
    return repository.existsByStripeEventIdAndStatusNot(stripeEventId, PaymentEventStatus.FAILED);
  }

  @Override
  @Transactional
  public void recordEvent(String stripeEventId, String eventType) {
    recordEvent(stripeEventId, eventType, null, PaymentEventStatus.PROCESSED, null);
  }

  @Override
  @Transactional
  public void recordEvent(
      String stripeEventId,
      String eventType,
      UUID userId,
      PaymentEventStatus status,
      String errorMessage) {
    if (stripeEventId == null || stripeEventId.isBlank()) {
      return;
    }
    PaymentEventStatus targetStatus = status != null ? status : PaymentEventStatus.PROCESSED;
    var existingOpt = repository.findByStripeEventId(stripeEventId);
    if (existingOpt.isPresent()) {
      ProcessedPaymentEventJpaEntity existing = existingOpt.get();
      if (existing.getStatus() == PaymentEventStatus.FAILED) {
        existing.setEventType(eventType);
        existing.setUserId(userId);
        existing.setStatus(targetStatus);
        existing.setErrorMessage(errorMessage);
        existing.setProcessedAt(LocalDateTime.now());
        repository.saveAndFlush(existing);
        return;
      }
      boolean changed = false;
      if (existing.getUserId() == null && userId != null) {
        existing.setUserId(userId);
        changed = true;
      }
      if (existing.getStatus() != targetStatus && targetStatus == PaymentEventStatus.IGNORED) {
        existing.setStatus(targetStatus);
        existing.setErrorMessage(errorMessage);
        changed = true;
      }
      if (changed) {
        repository.saveAndFlush(existing);
      }
      return;
    }
    ProcessedPaymentEventJpaEntity entity = ProcessedPaymentEventJpaEntity.builder()
        .id(UUID.randomUUID())
        .userId(userId)
        .stripeEventId(stripeEventId)
        .eventType(eventType)
        .status(targetStatus)
        .errorMessage(errorMessage)
        .processedAt(LocalDateTime.now())
        .build();
    repository.saveAndFlush(entity);
  }

  @Override
  @Transactional
  public boolean claimEvent(String stripeEventId, String eventType, UUID userId) {
    if (stripeEventId == null || stripeEventId.isBlank()) {
      return true;
    }
    LocalDateTime now = LocalDateTime.now();
    int inserted = repository.insertIfAbsent(
        UUID.randomUUID(),
        userId,
        stripeEventId,
        eventType,
        PaymentEventStatus.PROCESSED.name(),
        now);
    if (inserted > 0) {
      return true;
    }
    int reclaimed = repository.reclaimFailedEvent(
        stripeEventId,
        eventType,
        userId,
        PaymentEventStatus.FAILED,
        PaymentEventStatus.PROCESSED,
        now);
    return reclaimed > 0;
  }
}
