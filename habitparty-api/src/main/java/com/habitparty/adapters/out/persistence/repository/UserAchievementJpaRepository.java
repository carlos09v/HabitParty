package com.habitparty.adapters.out.persistence.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.UserAchievementJpaEntity;
import com.habitparty.adapters.out.persistence.entities.UserAchievementJpaEntity.UserAchievementId;

public interface UserAchievementJpaRepository extends JpaRepository<UserAchievementJpaEntity, UserAchievementId> {

  List<UserAchievementJpaEntity> findAllByUserIdOrderByUnlockedAtDesc(UUID userId);

  List<UserAchievementJpaEntity> findAllByUserIdAndSeenFalseOrderByUnlockedAtDesc(UUID userId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query(value = """
      INSERT INTO user_achievements (user_id, achievement_id, unlocked_at, is_seen)
      VALUES (:userId, :achievementId, :unlockedAt, :seen)
      ON CONFLICT DO NOTHING
      """, nativeQuery = true)
  int insertIfAbsent(
      @Param("userId") UUID userId,
      @Param("achievementId") UUID achievementId,
      @Param("unlockedAt") LocalDateTime unlockedAt,
      @Param("seen") boolean seen);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("UPDATE UserAchievementJpaEntity ua SET ua.seen = true WHERE ua.userId = :userId AND ua.seen = false")
  void markAllSeenByUserId(@Param("userId") UUID userId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("DELETE FROM UserAchievementJpaEntity ua WHERE ua.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
