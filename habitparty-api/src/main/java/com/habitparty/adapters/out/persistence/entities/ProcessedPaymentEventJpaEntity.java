package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.PaymentEventStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "processed_payment_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProcessedPaymentEventJpaEntity {

  @Id
  @Column(name = "event_id", nullable = false)
  private UUID id;

  @Column(name = "user_id")
  private UUID userId;

  @Column(name = "stripe_event_id", length = 120, nullable = false, unique = true)
  private String stripeEventId;

  @Column(name = "event_type", length = 100)
  private String eventType;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", length = 30, nullable = false)
  private PaymentEventStatus status = PaymentEventStatus.PROCESSED;

  @Column(name = "error_message", length = 500)
  private String errorMessage;

  @Column(name = "processed_at", nullable = false)
  private LocalDateTime processedAt;
}
