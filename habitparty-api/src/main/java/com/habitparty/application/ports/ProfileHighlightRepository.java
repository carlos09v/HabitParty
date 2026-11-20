package com.habitparty.application.ports;

import java.util.List;
import java.util.UUID;

import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.enums.HighlightType;

public interface ProfileHighlightRepository {
  List<ProfileHighlight> findAllByUserIdOrderByDisplayOrder(UUID userId);
  List<ProfileHighlight> replaceAllForUser(UUID userId, List<ProfileHighlight> highlights);
  long countByUserId(UUID userId);
  void deleteAllByUserId(UUID userId);
  default void deleteByUserIdAndHighlightTypeAndHighlightKey(
      UUID userId,
      HighlightType highlightType,
      String highlightKey) {}
}
