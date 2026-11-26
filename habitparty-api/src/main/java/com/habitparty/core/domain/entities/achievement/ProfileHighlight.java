package com.habitparty.core.domain.entities.achievement;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.enums.HighlightType;
import com.habitparty.core.exceptions.DomainValidationException;

public record ProfileHighlight(
    UUID id,
    UUID userId,
    int displayOrder,
    HighlightType highlightType,
    UUID referenceId,
    String highlightKey,
    LocalDateTime createdAt) {

  public static final int MAX_SHOWCASE_SLOTS = 4;

  public ProfileHighlight {
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
      throw new DomainValidationException(
          "Destaques de insígnia, métrica ou artefato exigem a chave identificadora (highlightKey).");
    }

    id = id != null ? id : UUID.randomUUID();
    highlightKey = (highlightKey != null && !highlightKey.isBlank()) ? highlightKey.trim() : null;
    createdAt = createdAt != null ? createdAt : LocalDateTime.now();
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
