package com.habitparty.adapters.out.persistence.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.FocusRecordJpaEntity;

public interface FocusRecordJpaRepository extends JpaRepository<FocusRecordJpaEntity, UUID> {

  List<FocusRecordJpaEntity> findAllByUserIdOrderByStartTimeDesc(UUID userId);

  List<FocusRecordJpaEntity> findAllByFocusActivityIdOrderByStartTimeDesc(UUID focusActivityId);

  List<FocusRecordJpaEntity> findAllByTaskIdOrderByStartTimeDesc(UUID taskId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM FocusRecordJpaEntity f WHERE f.focusActivityId = :focusActivityId")
  void deleteAllByFocusActivityId(@Param("focusActivityId") UUID focusActivityId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM FocusRecordJpaEntity f WHERE f.taskId = :taskId")
  void deleteAllByTaskId(@Param("taskId") UUID taskId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("UPDATE FocusRecordJpaEntity f SET f.focusActivityId = null WHERE f.focusActivityId = :focusActivityId")
  void nullifyFocusActivityId(@Param("focusActivityId") UUID focusActivityId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("UPDATE FocusRecordJpaEntity f SET f.taskId = null WHERE f.taskId = :taskId")
  void nullifyTaskId(@Param("taskId") UUID taskId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("UPDATE FocusRecordJpaEntity f SET f.taskId = null WHERE f.taskId IN :taskIds")
  void nullifyTaskIdIn(@Param("taskIds") Collection<UUID> taskIds);

  Page<FocusRecordJpaEntity> findAllByFocusActivityIdOrderByStartTimeDesc(UUID focusActivityId, Pageable pageable);

  Page<FocusRecordJpaEntity> findAllByTaskIdOrderByStartTimeDesc(UUID taskId, Pageable pageable);

  Page<FocusRecordJpaEntity> findAllByUserIdOrderByStartTimeDesc(UUID userId, Pageable pageable);

  // Soma apenas minutos elegíveis à recompensa no dia (>= 10 min e teto de 90 min por sessão)
  // usando intervalo semi-aberto [startOfDay, nextDayStart) para evitar arredondamento de microssegundos no Postgres.
  @Query("""
      SELECT COALESCE(SUM(
        CASE
          WHEN f.durationMinutes < 10 THEN 0
          WHEN f.durationMinutes > 90 THEN 90
          ELSE f.durationMinutes
        END
      ), 0)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.endTime >= :startOfDay
        AND f.endTime < :nextDayStart
      """)
  int sumTodayFocusMinutesByUserId(
      @Param("userId") UUID userId,
      @Param("startOfDay") LocalDateTime startOfDay,
      @Param("nextDayStart") LocalDateTime nextDayStart);

  @Query("""
      SELECT COALESCE(SUM(
        CASE
          WHEN f.durationMinutes < 10 THEN 0
          WHEN f.durationMinutes > 90 THEN 90
          ELSE f.durationMinutes
        END
      ), 0)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.endTime >= :startOfDay
        AND f.endTime < :nextDayStart
        AND f.id <> :excludedRecordId
      """)
  int sumTodayFocusMinutesByUserIdExcludingRecord(
      @Param("userId") UUID userId,
      @Param("startOfDay") LocalDateTime startOfDay,
      @Param("nextDayStart") LocalDateTime nextDayStart,
      @Param("excludedRecordId") UUID excludedRecordId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM FocusRecordJpaEntity f WHERE f.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);

  boolean existsByTaskIdAndFocusActivityIdIsNull(UUID taskId);

  interface FocusActivityImpactProjection {
    long getTotalRecordsCount();

    Long getTotalXpEarned();

    BigDecimal getTotalCoinsEarned();
  }

  @Query("""
      SELECT COUNT(f) AS totalRecordsCount,
             COALESCE(SUM(f.xpEarned), 0) AS totalXpEarned,
             COALESCE(SUM(f.coinsEarned), 0) AS totalCoinsEarned
      FROM FocusRecordJpaEntity f
      WHERE f.focusActivityId = :focusActivityId
      """)
  FocusActivityImpactProjection summarizeImpactByFocusActivityId(
      @Param("focusActivityId") UUID focusActivityId);

  @Query("""
      SELECT COALESCE(MAX(f.durationMinutes), 0)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.durationMinutes >= 10
      """)
  int findMaxProductiveDurationMinutesByUserId(@Param("userId") UUID userId);

  @Query("""
      SELECT COALESCE(MAX(f.durationMinutes), 0)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.id <> :excludedRecordId
        AND f.durationMinutes >= 10
      """)
  int findMaxProductiveDurationMinutesExcludingRecord(
      @Param("userId") UUID userId,
      @Param("excludedRecordId") UUID excludedRecordId);

  @Query("""
      SELECT COALESCE(MAX(f.durationMinutes), 0)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.id NOT IN :excludedRecordIds
        AND f.durationMinutes >= 10
      """)
  int findMaxProductiveDurationMinutesExcludingRecords(
      @Param("userId") UUID userId,
      @Param("excludedRecordIds") Collection<UUID> excludedRecordIds);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("""
      UPDATE FocusRecordJpaEntity f
      SET f.xpEarned = :xpEarned,
          f.coinsEarned = :coinsEarned
      WHERE f.id = :recordId
      """)
  int updateRewardsById(
      @Param("recordId") UUID recordId,
      @Param("xpEarned") int xpEarned,
      @Param("coinsEarned") BigDecimal coinsEarned);

  @Query("""
      SELECT COALESCE(SUM(f.durationMinutes), 0)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.endTime >= :startOfDay
        AND f.endTime < :nextDayStart
      """)
  int sumProductiveFocusMinutesByUserId(
      @Param("userId") UUID userId,
      @Param("startOfDay") LocalDateTime startOfDay,
      @Param("nextDayStart") LocalDateTime nextDayStart);

  @Query("""
      SELECT COALESCE(SUM(f.durationMinutes), 0)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.endTime >= :startOfDay
        AND f.endTime < :nextDayStart
        AND f.id <> :excludedRecordId
      """)
  int sumProductiveFocusMinutesByUserIdExcludingRecord(
      @Param("userId") UUID userId,
      @Param("startOfDay") LocalDateTime startOfDay,
      @Param("nextDayStart") LocalDateTime nextDayStart,
      @Param("excludedRecordId") UUID excludedRecordId);

  interface ProductiveFocusSessionProjection {
    UUID getUserId();

    LocalDateTime getEndTime();

    int getDurationMinutes();
  }

  @Query("""
      SELECT f.userId AS userId, f.endTime AS endTime, f.durationMinutes AS durationMinutes
      FROM FocusRecordJpaEntity f
      WHERE f.userId IN :userIds
        AND f.inventoryItemId IS NULL
        AND f.endTime >= :since
      """)
  List<ProductiveFocusSessionProjection> findProductiveFocusSessionsByUserIdsSince(
      @Param("userIds") Collection<UUID> userIds,
      @Param("since") LocalDateTime since);

  @Query("""
      SELECT DISTINCT f.userId
      FROM FocusRecordJpaEntity f
      WHERE f.inventoryItemId IS NULL
      """)
  List<UUID> findDistinctProductiveUserIds();

  List<FocusRecordJpaEntity> findAllByUserIdAndEndTimeBetweenOrderByEndTimeAsc(
      UUID userId, LocalDateTime startInclusive, LocalDateTime endInclusive);

  List<FocusRecordJpaEntity> findAllByUserIdInAndInventoryItemIdIsNullOrderByStartTimeDesc(Collection<UUID> userIds);

  @Query("""
      SELECT EXTRACT(YEAR FROM f.endTime),
             EXTRACT(MONTH FROM f.endTime),
             EXTRACT(DAY FROM f.endTime),
             EXTRACT(HOUR FROM f.endTime),
             CASE
               WHEN EXTRACT(MINUTE FROM f.endTime) >= 45 THEN 3
               WHEN EXTRACT(MINUTE FROM f.endTime) >= 30 THEN 2
               WHEN EXTRACT(MINUTE FROM f.endTime) >= 15 THEN 1
               ELSE 0
             END,
             COALESCE(SUM(CASE WHEN f.durationMinutes > 0 THEN f.durationMinutes ELSE 0 END), 0),
             COUNT(f),
             COALESCE(SUM(CASE WHEN f.completedPomos IS NOT NULL AND f.completedPomos > 0 THEN f.completedPomos ELSE 0 END), 0),
             COALESCE(MAX(CASE WHEN f.durationMinutes >= :minActiveMinutes THEN 1 ELSE 0 END), 0)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.endTime IS NOT NULL
        AND f.endTime >= :startInclusive
        AND f.endTime < :endExclusive
      GROUP BY EXTRACT(YEAR FROM f.endTime),
               EXTRACT(MONTH FROM f.endTime),
               EXTRACT(DAY FROM f.endTime),
               EXTRACT(HOUR FROM f.endTime),
               CASE
                 WHEN EXTRACT(MINUTE FROM f.endTime) >= 45 THEN 3
                 WHEN EXTRACT(MINUTE FROM f.endTime) >= 30 THEN 2
                 WHEN EXTRACT(MINUTE FROM f.endTime) >= 15 THEN 1
                 ELSE 0
               END
      """)
  List<Object[]> aggregateForRetrospective(
      @Param("userId") UUID userId,
      @Param("startInclusive") LocalDateTime startInclusive,
      @Param("endExclusive") LocalDateTime endExclusive,
      @Param("minActiveMinutes") int minActiveMinutes);

  interface FocusAnalyticsRowProjection {
    UUID getFocusActivityId();

    LocalDateTime getEndTime();

    int getDurationMinutes();

    Integer getCompletedPomos();

    Integer getXpEarned();

    BigDecimal getCoinsEarned();
  }

  @Query("""
      SELECT f.focusActivityId AS focusActivityId,
             f.endTime AS endTime,
             f.durationMinutes AS durationMinutes,
             f.completedPomos AS completedPomos,
             f.xpEarned AS xpEarned,
             f.coinsEarned AS coinsEarned
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
        AND f.endTime IS NOT NULL
        AND f.durationMinutes > 0
      """)
  List<FocusAnalyticsRowProjection> findProductiveAnalyticsByUserId(@Param("userId") UUID userId);

  @Query("""
      SELECT MIN(f.endTime)
      FROM FocusRecordJpaEntity f
      WHERE f.userId = :userId
        AND f.inventoryItemId IS NULL
      """)
  LocalDateTime findEarliestProductiveEndTimeByUserId(@Param("userId") UUID userId);
}
