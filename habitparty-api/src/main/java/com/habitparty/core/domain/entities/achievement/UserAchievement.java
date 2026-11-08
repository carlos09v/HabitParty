package com.habitparty.core.domain.entities.achievement;

import java.time.LocalDateTime;
import java.util.UUID;

public class UserAchievement {
  private UUID userId;
  private UUID achievementId;
  private LocalDateTime unlockedAt;
  private boolean seen;

  public UserAchievement(
      UUID userId,
      UUID achievementId,
      LocalDateTime unlockedAt,
      boolean seen) {
    this.userId = userId;
    this.achievementId = achievementId;
    this.unlockedAt = unlockedAt != null ? unlockedAt : LocalDateTime.now();
    this.seen = seen;
  }

  public static UserAchievement createNewlyUnlocked(UUID userId, UUID achievementId) {
    return new UserAchievement(userId, achievementId, LocalDateTime.now(), false);
  }

  public void markSeen() {
    this.seen = true;
  }

  public UUID getUserId() {
    return userId;
  }

  public UUID getAchievementId() {
    return achievementId;
  }

  public LocalDateTime getUnlockedAt() {
    return unlockedAt;
  }

  public boolean isSeen() {
    return seen;
  }
}
