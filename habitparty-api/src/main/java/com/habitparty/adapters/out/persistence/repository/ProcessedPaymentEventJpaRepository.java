package com.habitparty.adapters.out.persistence.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.habitparty.adapters.out.persistence.entities.ProcessedPaymentEventJpaEntity;

public interface ProcessedPaymentEventJpaRepository
    extends JpaRepository<ProcessedPaymentEventJpaEntity, UUID> {
  boolean existsByStripeEventId(String stripeEventId);
  Optional<ProcessedPaymentEventJpaEntity> findByStripeEventId(String stripeEventId);
}
