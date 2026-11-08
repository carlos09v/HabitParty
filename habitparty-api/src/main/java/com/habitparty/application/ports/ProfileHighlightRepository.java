package com.habitparty.application.ports;

import java.util.List;
import java.util.UUID;

import com.habitparty.core.domain.entities.achievement.ProfileHighlight;

public interface ProfileHighlightRepository {
  List<ProfileHighlight> findAllByUserIdOrderByDisplayOrder(UUID userId);
  List<ProfileHighlight> replaceAllForUser(UUID userId, List<ProfileHighlight> highlights);
  long countByUserId(UUID userId);
  void deleteAllByUserId(UUID userId);
}
