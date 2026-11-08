package com.habitparty.adapters.in.web.dtos.response.showcase;

import java.util.UUID;

import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.enums.HighlightType;

public record ProfileHighlightResponseDTO(
    UUID id,
    int displayOrder,
    HighlightType highlightType,
    UUID referenceId,
    String highlightKey) {

  public static ProfileHighlightResponseDTO fromDomain(ProfileHighlight highlight) {
    return new ProfileHighlightResponseDTO(
        highlight.getId(),
        highlight.getDisplayOrder(),
        highlight.getHighlightType(),
        highlight.getReferenceId().orElse(null),
        highlight.getHighlightKey().orElse(null));
  }
}
