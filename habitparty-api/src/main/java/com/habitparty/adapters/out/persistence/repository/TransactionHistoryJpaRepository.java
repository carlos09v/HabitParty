package com.habitparty.adapters.out.persistence.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
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

    // Busca geral paginada
    Page<TransactionHistoryJpaEntity> findAllByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    // Busca filtrada por tipos (Para as abas) paginada
    Page<TransactionHistoryJpaEntity> findAllByUserIdAndTransactionTypeInOrderByCreatedAtDesc(
            UUID userId, List<TransactionType> types, Pageable pageable);
}
