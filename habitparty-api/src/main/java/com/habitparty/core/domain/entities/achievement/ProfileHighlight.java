package com.habitparty.core.domain.entities.achievement;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.enums.HighlightType;
import com.habitparty.core.exceptions.DomainValidationException;

public class ProfileHighlight {
  public static final int MAX_SHOWCASE_SLOTS = 4;

  private UUID id;
  private UUID userId;
  private int displayOrder;
  private HighlightType highlightType;
  private UUID referenceId;
  private String highlightKey;
  private LocalDateTime createdAt;

  public ProfileHighlight(
      UUID id,
      UUID userId,
      int displayOrder,
      HighlightType highlightType,
      UUID referenceId,
      String highlightKey,
      LocalDateTime createdAt) {
    if (displayOrder < 0 || displayOrder >= MAX_SHOWCASE_SLOTS) {
      throw new DomainValidationException(
          "A ordem do destaque na vitrine deve estar entre 0 e " + (MAX_SHOWCASE_SLOTS - 1) + ".");
    }
    if (highlightType == null) {
      throw new DomainValidationException("O tipo do destaque é obrigatório.");
    }
    if (highlightType == HighlightType.ACHIEVEMENT && referenceId == null) {
      throw new DomainValidationException("Destaques de conquista exigem o ID da conquista (referenceId).");
    }
    if (highlightType != HighlightType.ACHIEVEMENT && (highlightKey == null || highlightKey.isBlank())) {
      throw new DomainValidationException("Destaques de insígnia ou métrica exigem a chave identificadora (highlightKey).");
    }

    this.id = id != null ? id : UUID.randomUUID();
    this.userId = userId;
    this.displayOrder = displayOrder;
    this.highlightType = highlightType;
    this.referenceId = referenceId;
    this.highlightKey = highlightKey != null && !highlightKey.isBlank() ? highlightKey.trim() : null;
    this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
  }

  public UUID getId() {
    return id;
  }

  public UUID getUserId() {
    return userId;
  }

  public int getDisplayOrder() {
    return displayOrder;
  }

  public HighlightType getHighlightType() {
    return highlightType;
  }

  public Optional<UUID> getReferenceId() {
    return Optional.ofNullable(referenceId);
  }

  public Optional<String> getHighlightKey() {
    return Optional.ofNullable(highlightKey);
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }
}
