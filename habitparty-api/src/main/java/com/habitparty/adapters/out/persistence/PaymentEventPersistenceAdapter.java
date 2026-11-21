package com.habitparty.adapters.out.persistence;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Component;

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
  public void recordEvent(String stripeEventId, String eventType) {
    recordEvent(stripeEventId, eventType, null, PaymentEventStatus.PROCESSED, null);
  }

  @Override
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
      if (targetStatus != PaymentEventStatus.PROCESSED) {
        return;
      }
    }
    ProcessedPaymentEventJpaEntity entity = new ProcessedPaymentEventJpaEntity(
        UUID.randomUUID(),
        userId,
        stripeEventId,
        eventType,
        targetStatus,
        errorMessage,
        LocalDateTime.now()
    );
    repository.saveAndFlush(entity);
  }

  @Override
  public boolean claimEvent(String stripeEventId, String eventType, UUID userId) {
    if (stripeEventId == null || stripeEventId.isBlank()) {
      return true;
    }
    var existingOpt = repository.findByStripeEventId(stripeEventId);
    if (existingOpt.isPresent()) {
      ProcessedPaymentEventJpaEntity existing = existingOpt.get();
      if (existing.getStatus() != PaymentEventStatus.FAILED) {
        return false;
      }
      existing.setEventType(eventType);
      existing.setUserId(userId);
      existing.setStatus(PaymentEventStatus.PROCESSED);
      existing.setErrorMessage(null);
      existing.setProcessedAt(LocalDateTime.now());
      repository.saveAndFlush(existing);
      return true;
    }
    ProcessedPaymentEventJpaEntity entity = new ProcessedPaymentEventJpaEntity(
        UUID.randomUUID(),
        userId,
        stripeEventId,
        eventType,
        PaymentEventStatus.PROCESSED,
        null,
        LocalDateTime.now()
    );
    repository.saveAndFlush(entity);
    return true;
  }
}
