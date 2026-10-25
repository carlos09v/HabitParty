package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.ChecklistItemJpaEntity;

public interface ChecklistItemJpaRepository extends JpaRepository<ChecklistItemJpaEntity, UUID> {
    // Aquele atalho de performance incrível que discutimos!
    Optional<ChecklistItemJpaEntity> findByIdAndUserId(UUID id, UUID userId);

    @Modifying
    @Query("DELETE FROM ChecklistItemJpaEntity c WHERE c.task.id IN (SELECT t.id FROM TaskJpaEntity t WHERE t.boardColumnId = :boardColumnId)")
    void deleteAllByBoardColumnId(@Param("boardColumnId") UUID boardColumnId);

    @Modifying
    @Query("DELETE FROM ChecklistItemJpaEntity c WHERE c.task.id IN (SELECT t.id FROM TaskJpaEntity t WHERE t.boardColumnId IN :boardColumnIds)")
    void deleteAllByBoardColumnIds(@Param("boardColumnIds") List<UUID> boardColumnIds);

    @Modifying
    @Query("DELETE FROM ChecklistItemJpaEntity c WHERE c.userId = :userId OR c.task.id IN (SELECT t.id FROM TaskJpaEntity t WHERE t.userId = :userId)")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
