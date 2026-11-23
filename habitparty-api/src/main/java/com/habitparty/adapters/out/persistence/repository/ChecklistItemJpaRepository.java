package com.habitparty.adapters.out.persistence.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.ChecklistItemJpaEntity;

public interface ChecklistItemJpaRepository extends JpaRepository<ChecklistItemJpaEntity, UUID> {
    // Leitura escalar sem carregar proxy LAZY de TaskJpaEntity na sessão JPA
    @Query("""
        SELECT new com.habitparty.adapters.out.persistence.repository.ChecklistItemProjection(
          c.id, c.task.id, c.userId, c.name, c.isCompleted, c.isRewarded, c.orderIndex, c.autoCompleted
        )
        FROM ChecklistItemJpaEntity c
        WHERE c.id = :id AND c.userId = :userId
        """)
    Optional<ChecklistItemProjection> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    // Carregamento em lote dos checklists de várias tarefas (elimina N+1 e proxy LAZY) com ordem determinística
    @Query("""
        SELECT new com.habitparty.adapters.out.persistence.repository.ChecklistItemProjection(
          c.id, c.task.id, c.userId, c.name, c.isCompleted, c.isRewarded, c.orderIndex, c.autoCompleted
        )
        FROM ChecklistItemJpaEntity c
        WHERE c.task.id IN :taskIds
        ORDER BY c.orderIndex ASC, c.id ASC
        """)
    List<ChecklistItemProjection> findAllByTaskIds(@Param("taskIds") Collection<UUID> taskIds);

    @Modifying
    @Query("DELETE FROM ChecklistItemJpaEntity c WHERE c.task.id IN (SELECT t.id FROM TaskJpaEntity t WHERE t.boardColumnId = :boardColumnId)")
    void deleteAllByBoardColumnId(@Param("boardColumnId") UUID boardColumnId);

    @Modifying
    @Query("DELETE FROM ChecklistItemJpaEntity c WHERE c.task.id IN (SELECT t.id FROM TaskJpaEntity t WHERE t.boardColumnId IN :boardColumnIds)")
    void deleteAllByBoardColumnIds(@Param("boardColumnIds") List<UUID> boardColumnIds);

    @Transactional
    @Modifying(flushAutomatically = true)
    @Query("""
        UPDATE ChecklistItemJpaEntity c
        SET c.name = :name,
            c.isCompleted = :isCompleted,
            c.isRewarded = :isRewarded,
            c.orderIndex = :orderIndex,
            c.autoCompleted = :autoCompleted
        WHERE c.id = :id AND c.userId = :userId
        """)
    int updateItemFields(
        @Param("id") UUID id,
        @Param("userId") UUID userId,
        @Param("name") String name,
        @Param("isCompleted") boolean isCompleted,
        @Param("isRewarded") boolean isRewarded,
        @Param("orderIndex") int orderIndex,
        @Param("autoCompleted") boolean autoCompleted);

    @Modifying(flushAutomatically = true)
    @Query("UPDATE ChecklistItemJpaEntity c SET c.isCompleted = false, c.autoCompleted = false WHERE c.task.id IN :taskIds AND (c.isCompleted = true OR c.autoCompleted = true)")
    void resetCompletedByTaskIds(@Param("taskIds") Collection<UUID> taskIds);

    @Modifying
    @Query("DELETE FROM ChecklistItemJpaEntity c WHERE c.userId = :userId OR c.task.id IN (SELECT t.id FROM TaskJpaEntity t WHERE t.userId = :userId)")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
