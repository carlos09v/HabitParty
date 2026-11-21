package com.habitparty.adapters.out.persistence.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.habitparty.adapters.out.persistence.entities.ProcessedPaymentEventJpaEntity;
import com.habitparty.core.domain.enums.PaymentEventStatus;

public interface ProcessedPaymentEventJpaRepository
    extends JpaRepository<ProcessedPaymentEventJpaEntity, UUID> {
  boolean existsByStripeEventId(String stripeEventId);
  boolean existsByStripeEventIdAndStatusNot(String stripeEventId, PaymentEventStatus status);
  Optional<ProcessedPaymentEventJpaEntity> findByStripeEventId(String stripeEventId);
}
