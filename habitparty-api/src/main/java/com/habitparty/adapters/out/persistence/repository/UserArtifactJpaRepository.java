package com.habitparty.adapters.out.persistence.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.UserArtifactJpaEntity;
import com.habitparty.adapters.out.persistence.entities.UserArtifactJpaEntity.UserArtifactId;

public interface UserArtifactJpaRepository extends JpaRepository<UserArtifactJpaEntity, UserArtifactId> {

  List<UserArtifactJpaEntity> findAllByUserIdOrderByUnlockedAtDesc(UUID userId);

  List<UserArtifactJpaEntity> findAllByUserIdAndSeenFalseOrderByUnlockedAtDesc(UUID userId);

  long countByUserId(UUID userId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query(value = """
      INSERT INTO user_artifacts (user_id, artifact_id, obtained_source, unlocked_at, is_seen)
      VALUES (:userId, :artifactId, :obtainedSource, :unlockedAt, :seen)
      ON CONFLICT DO NOTHING
      """, nativeQuery = true)
  int insertIfAbsent(
      @Param("userId") UUID userId,
      @Param("artifactId") UUID artifactId,
      @Param("obtainedSource") String obtainedSource,
      @Param("unlockedAt") LocalDateTime unlockedAt,
      @Param("seen") boolean seen);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("UPDATE UserArtifactJpaEntity ua SET ua.seen = true WHERE ua.userId = :userId AND ua.seen = false")
  void markAllSeenByUserId(@Param("userId") UUID userId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("DELETE FROM UserArtifactJpaEntity ua WHERE ua.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("""
      DELETE FROM UserArtifactJpaEntity ua
      WHERE ua.userId = :userId
        AND (
          ua.obtainedSource = 'ACHIEVEMENT'
          OR ua.artifactId IN (
            SELECT a.id FROM ArtifactJpaEntity a
            WHERE a.sourceType = com.habitparty.core.domain.enums.ArtifactSourceType.ACHIEVEMENT
          )
        )
      """)
  void deleteAchievementArtifactsByUserId(@Param("userId") UUID userId);
}
