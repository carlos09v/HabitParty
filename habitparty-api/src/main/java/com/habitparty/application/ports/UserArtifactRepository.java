package com.habitparty.application.ports;

import java.util.List;
import java.util.UUID;

import com.habitparty.core.domain.entities.achievement.UserArtifact;

public interface UserArtifactRepository {
  List<UserArtifact> findAllByUserId(UUID userId);
  List<UserArtifact> findUnseenByUserId(UUID userId);
  long countByUserId(UUID userId);
  UserArtifact save(UserArtifact userArtifact);
  List<UserArtifact> saveAll(List<UserArtifact> userArtifacts);
  void markAllSeenByUserId(UUID userId);
  void deleteAllByUserId(UUID userId);
  void deleteAchievementArtifactsByUserId(UUID userId);
}
