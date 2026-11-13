package com.habitparty.adapters.out.persistence.repository;

import java.time.LocalDateTime;
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
}
