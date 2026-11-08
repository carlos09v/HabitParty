package com.habitparty.adapters.out.persistence.entities;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_achievements")
@IdClass(UserAchievementJpaEntity.UserAchievementId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAchievementJpaEntity {

  @Id
  @Column(name = "user_id", nullable = false)
  private UUID userId;

  @Id
  @Column(name = "achievement_id", nullable = false)
  private UUID achievementId;

  @Column(name = "unlocked_at", nullable = false)
  private LocalDateTime unlockedAt = LocalDateTime.now();

  @Column(name = "is_seen", nullable = false)
  private boolean seen = false;

  @Getter
  @Setter
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UserAchievementId implements Serializable {
    private UUID userId;
    private UUID achievementId;

    @Override
    public boolean equals(Object o) {
      if (this == o) return true;
      if (o == null || getClass() != o.getClass()) return false;
      UserAchievementId that = (UserAchievementId) o;
      return Objects.equals(userId, that.userId) && Objects.equals(achievementId, that.achievementId);
    }

    @Override
    public int hashCode() {
      return Objects.hash(userId, achievementId);
    }
  }
}
