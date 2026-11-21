package com.habitparty.adapters.out.persistence.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.TransactionHistoryJpaEntity;
import com.habitparty.core.domain.enums.TransactionType;

public interface TransactionHistoryJpaRepository extends JpaRepository<TransactionHistoryJpaEntity, UUID>, JpaSpecificationExecutor<TransactionHistoryJpaEntity> {

    // Traz o histórico do usuário ordenado do mais novo pro mais velho
    List<TransactionHistoryJpaEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);

    // Ver se ja completou alguma tarefa hoje pra dar o incrementStreak no usuario
    long countByUser_IdAndTransactionTypeInAndCreatedAtBetween(
            UUID userId,
            List<TransactionType> types,
            LocalDateTime startOfDay,
            LocalDateTime endOfDay);

    boolean existsByUser_IdAndTransactionTypeInAndCreatedAtGreaterThanEqual(
            UUID userId,
            List<TransactionType> types,
            LocalDateTime since);

    @Query("""
        SELECT t.user.id, MAX(t.createdAt) FROM TransactionHistoryJpaEntity t
        WHERE t.user.id IN :userIds
          AND t.transactionType IN :types
          AND t.createdAt >= :since
        GROUP BY t.user.id
    """)
    List<Object[]> findLastCompletedTaskAtByUserIds(
            @Param("userIds") Collection<UUID> userIds,
            @Param("types") Collection<TransactionType> types,
            @Param("since") LocalDateTime since);

    @Query("""
        SELECT MAX(t.createdAt) FROM TransactionHistoryJpaEntity t
        WHERE t.user.id = :userId
          AND t.transactionType IN :types
    """)
    LocalDateTime findLatestCreatedAtByUserIdAndTypes(
        @Param("userId") UUID userId,
        @Param("types") Collection<TransactionType> types);

    // Busca geral paginada
    Page<TransactionHistoryJpaEntity> findAllByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    // Busca filtrada por tipos (Para as abas) paginada
    Page<TransactionHistoryJpaEntity> findAllByUserIdAndTransactionTypeInOrderByCreatedAtDesc(
            UUID userId, List<TransactionType> types, Pageable pageable);

    @Modifying
    @Query("DELETE FROM TransactionHistoryJpaEntity t WHERE t.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM TransactionHistoryJpaEntity t WHERE t.id IN :ids AND t.user.id = :userId")
    int deleteAllByIdInAndUserId(@Param("ids") List<UUID> ids, @Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM TransactionHistoryJpaEntity t WHERE t.referenceId IN :referenceIds AND t.user.id = :userId")
    int deleteAllByReferenceIdInAndUserId(@Param("referenceIds") List<UUID> referenceIds, @Param("userId") UUID userId);

    @Query("SELECT COUNT(t) > 0 FROM TransactionHistoryJpaEntity t WHERE t.referenceId = :referenceId AND t.user.id = :userId")
    boolean existsByReferenceIdAndUserId(@Param("referenceId") UUID referenceId, @Param("userId") UUID userId);

    List<TransactionHistoryJpaEntity> findAllByUser_IdAndCreatedAtBetweenOrderByCreatedAtAsc(
            UUID userId, LocalDateTime startInclusive, LocalDateTime endInclusive);

    @Query("SELECT MIN(t.createdAt) FROM TransactionHistoryJpaEntity t WHERE t.user.id = :userId")
    LocalDateTime findEarliestCreatedAtByUserId(@Param("userId") UUID userId);

    @Query("""
        SELECT COUNT(t) FROM TransactionHistoryJpaEntity t
        WHERE t.user.id = :userId
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

    @Modifying
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

    @Modifying
    @Query("""
        UPDATE TransactionHistoryJpaEntity th
        SET th.xpAmount = :xpAmount,
            th.goldAmount = :goldAmount
        WHERE th.referenceId = :referenceId
          AND th.user.id = :userId
          AND th.transactionType = com.habitparty.core.domain.enums.TransactionType.FOCUS_COMPLETED
    """)
    int updateFocusRewardSnapshot(
        @Param("referenceId") UUID referenceId,
        @Param("userId") UUID userId,
        @Param("xpAmount") int xpAmount,
        @Param("goldAmount") BigDecimal goldAmount);

    @Modifying
    @Query("""
        UPDATE TransactionHistoryJpaEntity th
        SET th.descriptionSnapshot = :descriptionSnapshot
        WHERE th.referenceId = :referenceId
          AND th.user.id = :userId
          AND th.transactionType = com.habitparty.core.domain.enums.TransactionType.FOCUS_COMPLETED
    """)
    int updateFocusDescriptionSnapshot(
        @Param("referenceId") UUID referenceId,
        @Param("userId") UUID userId,
        @Param("descriptionSnapshot") String descriptionSnapshot);

    interface TaskCompletionProjection {
        UUID getUserId();

        LocalDateTime getCreatedAt();
    }

    @Query("""
        SELECT t.user.id AS userId, t.createdAt AS createdAt
        FROM TransactionHistoryJpaEntity t
        WHERE t.user.id IN :userIds
          AND t.transactionType IN :types
          AND t.createdAt >= :since
    """)
    List<TaskCompletionProjection> findTaskCompletionsByUserIdsSince(
        @Param("userIds") Collection<UUID> userIds,
        @Param("types") Collection<TransactionType> types,
        @Param("since") LocalDateTime since);
}
