package com.habitparty.adapters.out.persistence.entities;

import java.time.Instant;
import java.util.UUID;

import com.habitparty.core.domain.enums.SocialNotificationType;

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
@Table(name = "social_notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SocialNotificationJpaEntity {

  @Id
  @Column(name = "notification_id", nullable = false, updatable = false)
  private UUID id;

  @Column(name = "recipient_id", nullable = false)
  private UUID recipientId;

  @Column(name = "actor_id")
  private UUID actorId;

  @Enumerated(EnumType.STRING)
  @Column(name = "notification_type", nullable = false, length = 40)
  private SocialNotificationType notificationType;

  @Column(name = "reference_id")
  private UUID referenceId;

  @Column(name = "payload", length = 500)
  private String payload;

  @Column(name = "is_seen", nullable = false)
  private boolean seen;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;
}
