package com.habitparty.adapters.out.persistence.repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.ProcessedPaymentEventJpaEntity;
import com.habitparty.core.domain.enums.PaymentEventStatus;

public interface ProcessedPaymentEventJpaRepository
    extends JpaRepository<ProcessedPaymentEventJpaEntity, UUID> {
  boolean existsByStripeEventIdAndStatusNot(String stripeEventId, PaymentEventStatus status);
  Optional<ProcessedPaymentEventJpaEntity> findByStripeEventId(String stripeEventId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(value = """
      INSERT INTO processed_payment_events
        (event_id, user_id, stripe_event_id, event_type, status, error_message, processed_at)
      VALUES (:eventId, :userId, :stripeEventId, :eventType, :status, NULL, :processedAt)
      ON CONFLICT DO NOTHING
      """, nativeQuery = true)
  int insertIfAbsent(
      @Param("eventId") UUID eventId,
      @Param("userId") UUID userId,
      @Param("stripeEventId") String stripeEventId,
      @Param("eventType") String eventType,
      @Param("status") String status,
      @Param("processedAt") LocalDateTime processedAt);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("""
      UPDATE ProcessedPaymentEventJpaEntity e
         SET e.eventType = :eventType,
             e.userId = :userId,
             e.status = :targetStatus,
             e.errorMessage = NULL,
             e.processedAt = :processedAt
       WHERE e.stripeEventId = :stripeEventId
         AND e.status = :expectedStatus
      """)
  int reclaimFailedEvent(
      @Param("stripeEventId") String stripeEventId,
      @Param("eventType") String eventType,
      @Param("userId") UUID userId,
      @Param("expectedStatus") PaymentEventStatus expectedStatus,
      @Param("targetStatus") PaymentEventStatus targetStatus,
      @Param("processedAt") LocalDateTime processedAt);
}
