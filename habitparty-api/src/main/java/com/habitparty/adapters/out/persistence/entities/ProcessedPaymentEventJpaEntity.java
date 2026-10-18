package com.habitparty.adapters.out.persistence.entities;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
  @Column(name = "event_id", length = 120, nullable = false)
  private String eventId;

  @Column(name = "event_type", length = 100)
  private String eventType;

  @Column(name = "processed_at", nullable = false)
  private LocalDateTime processedAt;
}
