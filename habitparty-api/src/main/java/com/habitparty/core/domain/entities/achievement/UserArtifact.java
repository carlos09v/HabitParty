package com.habitparty.core.domain.entities.achievement;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.UUID;

public class UserArtifact {
  private final UUID userId;
  private final UUID artifactId;
  private final String obtainedSource;
  private final LocalDateTime unlockedAt;
  private boolean seen;

  public UserArtifact(
      UUID userId,
      UUID artifactId,
      String obtainedSource,
      LocalDateTime unlockedAt,
      boolean seen) {
    this.userId = userId;
    this.artifactId = artifactId;
    this.obtainedSource = (obtainedSource != null && !obtainedSource.isBlank())
        ? obtainedSource.trim().toUpperCase(Locale.ROOT)
        : "ACHIEVEMENT";
    this.unlockedAt = unlockedAt != null ? unlockedAt : LocalDateTime.now();
    this.seen = seen;
  }

  public static UserArtifact createNewlyUnlocked(UUID userId, UUID artifactId, String obtainedSource) {
    return new UserArtifact(userId, artifactId, obtainedSource, LocalDateTime.now(), false);
  }

  public void markSeen() {
    this.seen = true;
  }

  public UUID getUserId() {
    return userId;
  }

  public UUID getArtifactId() {
    return artifactId;
  }

  public String getObtainedSource() {
    return obtainedSource;
  }

  public LocalDateTime getUnlockedAt() {
    return unlockedAt;
  }

  public boolean isSeen() {
    return seen;
  }
}
