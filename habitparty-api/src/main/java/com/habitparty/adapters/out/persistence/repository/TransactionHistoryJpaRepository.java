package com.habitparty.adapters.out.persistence.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.TransactionHistoryJpaEntity;
import com.habitparty.core.domain.enums.TransactionType;

public interface TransactionHistoryJpaRepository
    extends JpaRepository<TransactionHistoryJpaEntity, UUID>, JpaSpecificationExecutor<TransactionHistoryJpaEntity> {

  long countByUserIdAndTransactionTypeInAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
      UUID userId,
      List<TransactionType> types,
      LocalDateTime startInclusive,
      LocalDateTime endExclusive);

  boolean existsByUserIdAndTransactionTypeInAndCreatedAtGreaterThanEqual(
      UUID userId,
      List<TransactionType> types,
      LocalDateTime since);

  @Query("""
      SELECT t.userId, MAX(t.createdAt) FROM TransactionHistoryJpaEntity t
      WHERE t.userId IN :userIds
        AND t.transactionType IN :types
        AND t.createdAt >= :since
      GROUP BY t.userId
      """)
  List<Object[]> findLastCompletedTaskAtByUserIds(
      @Param("userIds") Collection<UUID> userIds,
      @Param("types") Collection<TransactionType> types,
      @Param("since") LocalDateTime since);

  @Query("""
      SELECT MAX(t.createdAt) FROM TransactionHistoryJpaEntity t
      WHERE t.userId = :userId
        AND t.transactionType IN :types
      """)
  LocalDateTime findLatestCreatedAtByUserIdAndTypes(
      @Param("userId") UUID userId,
      @Param("types") Collection<TransactionType> types);

  List<TransactionHistoryJpaEntity> findTop2ByUserIdAndReferenceIdAndTransactionTypeOrderByCreatedAtDesc(
      UUID userId, UUID referenceId, TransactionType transactionType);

  List<TransactionHistoryJpaEntity> findAllByUserIdAndReferenceIdAndTransactionType(
      UUID userId, UUID referenceId, TransactionType transactionType);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("UPDATE TransactionHistoryJpaEntity t SET t.hiddenFromHistory = true WHERE t.id = :id AND t.userId = :userId AND t.hiddenFromHistory = false")
  int hideByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("UPDATE TransactionHistoryJpaEntity t SET t.hiddenFromHistory = true WHERE t.id IN :ids AND t.userId = :userId AND t.hiddenFromHistory = false")
  int hideAllByIdInAndUserId(@Param("ids") List<UUID> ids, @Param("userId") UUID userId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("UPDATE TransactionHistoryJpaEntity t SET t.hiddenFromHistory = false WHERE t.id IN :ids AND t.userId = :userId AND t.hiddenFromHistory = true")
  int restoreAllByIdInAndUserId(@Param("ids") List<UUID> ids, @Param("userId") UUID userId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM TransactionHistoryJpaEntity t WHERE t.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM TransactionHistoryJpaEntity t WHERE t.id IN :ids AND t.userId = :userId")
  int deleteAllByIdInAndUserId(@Param("ids") List<UUID> ids, @Param("userId") UUID userId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM TransactionHistoryJpaEntity t WHERE t.referenceId IN :referenceIds AND t.userId = :userId")
  int deleteAllByReferenceIdInAndUserId(@Param("referenceIds") List<UUID> referenceIds, @Param("userId") UUID userId);

  boolean existsByReferenceIdAndUserId(UUID referenceId, UUID userId);

  boolean existsByReferenceIdInAndUserId(Collection<UUID> referenceIds, UUID userId);

  @Query("""
      SELECT EXTRACT(YEAR FROM t.createdAt),
             EXTRACT(MONTH FROM t.createdAt),
             EXTRACT(DAY FROM t.createdAt),
             EXTRACT(HOUR FROM t.createdAt),
             CASE
               WHEN EXTRACT(MINUTE FROM t.createdAt) >= 45 THEN 3
               WHEN EXTRACT(MINUTE FROM t.createdAt) >= 30 THEN 2
               WHEN EXTRACT(MINUTE FROM t.createdAt) >= 15 THEN 1
               ELSE 0
             END,
             COALESCE(SUM(CASE
               WHEN t.transactionType IN :completedTypes THEN
                 CASE WHEN t.effortUnitsSnapshot IS NOT NULL AND t.effortUnitsSnapshot > 1
                      THEN t.effortUnitsSnapshot ELSE 1 END
               ELSE 0 END), 0),
             COALESCE(SUM(CASE
               WHEN t.transactionType IN :completedTypes
                    AND t.difficultySnapshot = com.habitparty.core.domain.enums.task.TaskDifficulty.HARD THEN
                 CASE WHEN t.effortUnitsSnapshot IS NOT NULL AND t.effortUnitsSnapshot > 1
                      THEN t.effortUnitsSnapshot ELSE 1 END
               ELSE 0 END), 0),
             COALESCE(SUM(CASE WHEN t.xpAmount > 0 THEN t.xpAmount ELSE 0 END), 0),
             COALESCE(SUM(CASE WHEN t.goldAmount IS NOT NULL AND t.goldAmount > 0 THEN t.goldAmount ELSE 0 END), 0)
      FROM TransactionHistoryJpaEntity t
      WHERE t.userId = :userId
        AND t.transactionType IN :positiveTypes
        AND t.createdAt >= :startInclusive
        AND t.createdAt < :endExclusive
      GROUP BY EXTRACT(YEAR FROM t.createdAt),
               EXTRACT(MONTH FROM t.createdAt),
               EXTRACT(DAY FROM t.createdAt),
               EXTRACT(HOUR FROM t.createdAt),
               CASE
                 WHEN EXTRACT(MINUTE FROM t.createdAt) >= 45 THEN 3
                 WHEN EXTRACT(MINUTE FROM t.createdAt) >= 30 THEN 2
                 WHEN EXTRACT(MINUTE FROM t.createdAt) >= 15 THEN 1
                 ELSE 0
               END
      """)
  List<Object[]> aggregateForRetrospective(
      @Param("userId") UUID userId,
      @Param("completedTypes") Collection<TransactionType> completedTypes,
      @Param("positiveTypes") Collection<TransactionType> positiveTypes,
      @Param("startInclusive") LocalDateTime startInclusive,
      @Param("endExclusive") LocalDateTime endExclusive);

  List<TransactionHistoryJpaEntity> findAllByUserIdAndCreatedAtBetweenOrderByCreatedAtAsc(
      UUID userId, LocalDateTime startInclusive, LocalDateTime endInclusive);

  @Query("SELECT MIN(t.createdAt) FROM TransactionHistoryJpaEntity t WHERE t.userId = :userId")
  LocalDateTime findEarliestCreatedAtByUserId(@Param("userId") UUID userId);

  @Query("""
      SELECT COUNT(t) FROM TransactionHistoryJpaEntity t
      WHERE t.userId = :userId
        AND t.referenceId = :referenceId
        AND t.transactionType = :transactionType
        AND t.createdAt >= :startInclusive
        AND t.createdAt < :endExclusive
      """)
  long countHabitScoreTransactionsInRange(
      @Param("userId") UUID userId,
      @Param("referenceId") UUID referenceId,
      @Param("transactionType") TransactionType transactionType,
      @Param("startInclusive") LocalDateTime startInclusive,
      @Param("endExclusive") LocalDateTime endExclusive);

  @Query("""
      SELECT COUNT(th)
      FROM TransactionHistoryJpaEntity th
      WHERE th.transactionType = com.habitparty.core.domain.enums.TransactionType.FOCUS_COMPLETED
        AND EXISTS (
          SELECT 1
          FROM FocusRecordJpaEntity fr
          WHERE fr.id = th.referenceId
            AND fr.endTime IS NOT NULL
            AND th.createdAt <> fr.endTime
        )
      """)
  long countMismatchedFocusCompletedTimestamps();

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("""
      UPDATE TransactionHistoryJpaEntity th
      SET th.createdAt = (
        SELECT fr.endTime
        FROM FocusRecordJpaEntity fr
        WHERE fr.id = th.referenceId
      )
      WHERE th.transactionType = com.habitparty.core.domain.enums.TransactionType.FOCUS_COMPLETED
        AND EXISTS (
          SELECT 1
          FROM FocusRecordJpaEntity fr
          WHERE fr.id = th.referenceId
            AND fr.endTime IS NOT NULL
            AND th.createdAt <> fr.endTime
        )
      """)
  int syncFocusCompletedTimestampsWithFocusRecords();

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("""
      UPDATE TransactionHistoryJpaEntity th
      SET th.xpAmount = :xpAmount,
          th.goldAmount = :goldAmount
      WHERE th.referenceId = :referenceId
        AND th.userId = :userId
        AND th.transactionType = com.habitparty.core.domain.enums.TransactionType.FOCUS_COMPLETED
      """)
  int updateFocusRewardSnapshot(
      @Param("referenceId") UUID referenceId,
      @Param("userId") UUID userId,
      @Param("xpAmount") int xpAmount,
      @Param("goldAmount") BigDecimal goldAmount);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("""
      UPDATE TransactionHistoryJpaEntity th
      SET th.descriptionSnapshot = :descriptionSnapshot
      WHERE th.referenceId = :referenceId
        AND th.userId = :userId
        AND th.transactionType = com.habitparty.core.domain.enums.TransactionType.FOCUS_COMPLETED
      """)
  int updateFocusDescriptionSnapshot(
      @Param("referenceId") UUID referenceId,
      @Param("userId") UUID userId,
      @Param("descriptionSnapshot") String descriptionSnapshot);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("""
      UPDATE TransactionHistoryJpaEntity th
      SET th.createdAt = :createdAt
      WHERE th.referenceId = :referenceId
        AND th.userId = :userId
        AND th.transactionType = com.habitparty.core.domain.enums.TransactionType.FOCUS_COMPLETED
      """)
  int updateFocusCreatedAt(
      @Param("referenceId") UUID referenceId,
      @Param("userId") UUID userId,
      @Param("createdAt") LocalDateTime createdAt);

  interface TaskCompletionProjection {
    UUID getUserId();

    LocalDateTime getCreatedAt();
  }

  @Query("""
      SELECT t.userId AS userId, t.createdAt AS createdAt
      FROM TransactionHistoryJpaEntity t
      WHERE t.userId IN :userIds
        AND t.transactionType IN :types
        AND t.createdAt >= :since
      """)
  List<TaskCompletionProjection> findTaskCompletionsByUserIdsSince(
      @Param("userIds") Collection<UUID> userIds,
      @Param("types") Collection<TransactionType> types,
      @Param("since") LocalDateTime since);
}
