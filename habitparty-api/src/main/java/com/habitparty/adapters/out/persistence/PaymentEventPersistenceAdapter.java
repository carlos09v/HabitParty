package com.habitparty.adapters.out.persistence;

import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.ProcessedPaymentEventJpaEntity;
import com.habitparty.adapters.out.persistence.repository.ProcessedPaymentEventJpaRepository;
import com.habitparty.application.ports.PaymentEventRepository;

@Component
public class PaymentEventPersistenceAdapter implements PaymentEventRepository {

  private final ProcessedPaymentEventJpaRepository repository;

  public PaymentEventPersistenceAdapter(ProcessedPaymentEventJpaRepository repository) {
    this.repository = repository;
  }

  @Override
  public boolean existsByEventId(String eventId) {
    if (eventId == null || eventId.isBlank()) {
      return false;
    }
    return repository.existsById(eventId);
  }

  @Override
  public void recordEvent(String eventId, String eventType) {
    if (eventId == null || eventId.isBlank()) {
      return;
    }
    ProcessedPaymentEventJpaEntity entity = new ProcessedPaymentEventJpaEntity(
        eventId,
        eventType,
        LocalDateTime.now()
    );
    repository.save(entity);
  }
}
