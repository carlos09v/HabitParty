package com.habitparty.core.domain.entities.social;

import java.time.Instant;
import java.util.UUID;

import com.habitparty.core.domain.enums.SocialNotificationType;
import com.habitparty.core.exceptions.DomainValidationException;

/**
 * Notificação social persistida (pedidos de amizade, aceites e marcos conquistados por amigos).
 */
public class SocialNotification {
  private static final int MAX_PAYLOAD_LENGTH = 500;

  private UUID id;
  private UUID recipientId;
  private UUID actorId;
  private SocialNotificationType type;
  private UUID referenceId;
  private String payload;
  private boolean seen;
  private Instant createdAt;

  public SocialNotification() {
  }

  public SocialNotification(
      UUID id,
      UUID recipientId,
      UUID actorId,
      SocialNotificationType type,
      UUID referenceId,
      String payload,
      boolean seen,
      Instant createdAt) {
    this.id = id;
    this.recipientId = recipientId;
    this.actorId = actorId;
    this.type = type;
    this.referenceId = referenceId;
    this.payload = truncatePayload(payload);
    this.seen = seen;
    this.createdAt = createdAt;
  }

  public static SocialNotification create(
      UUID recipientId,
      UUID actorId,
      SocialNotificationType type,
      UUID referenceId,
      String payload,
      Instant now) {
    if (recipientId == null || type == null) {
      throw new DomainValidationException("Destinatário e tipo da notificação são obrigatórios.");
    }
    if (actorId != null && recipientId.equals(actorId)) {
      throw new DomainValidationException("Um usuário não pode notificar a si mesmo.");
    }
    return new SocialNotification(
        UUID.randomUUID(),
        recipientId,
        actorId,
        type,
        referenceId,
        payload,
        false,
        now != null ? now : Instant.now());
  }

  private static String truncatePayload(String value) {
    if (value == null) {
      return null;
    }
    return value.length() <= MAX_PAYLOAD_LENGTH ? value : value.substring(0, MAX_PAYLOAD_LENGTH);
  }

  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getRecipientId() {
    return recipientId;
  }

  public void setRecipientId(UUID recipientId) {
    this.recipientId = recipientId;
  }

  public UUID getActorId() {
    return actorId;
  }

  public void setActorId(UUID actorId) {
    this.actorId = actorId;
  }

  public SocialNotificationType getType() {
    return type;
  }

  public void setType(SocialNotificationType type) {
    this.type = type;
  }

  public UUID getReferenceId() {
    return referenceId;
  }

  public void setReferenceId(UUID referenceId) {
    this.referenceId = referenceId;
  }

  public String getPayload() {
    return payload;
  }

  public void setPayload(String payload) {
    this.payload = truncatePayload(payload);
  }

  public boolean isSeen() {
    return seen;
  }

  public void setSeen(boolean seen) {
    this.seen = seen;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }
}
