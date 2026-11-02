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
    return repository.existsByStripeEventId(stripeEventId);
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
    if (repository.existsByStripeEventId(stripeEventId)) {
      return;
    }
    ProcessedPaymentEventJpaEntity entity = new ProcessedPaymentEventJpaEntity(
        UUID.randomUUID(),
        userId,
        stripeEventId,
        eventType,
        status != null ? status : PaymentEventStatus.PROCESSED,
        errorMessage,
        LocalDateTime.now()
    );
    repository.save(entity);
  }
}
