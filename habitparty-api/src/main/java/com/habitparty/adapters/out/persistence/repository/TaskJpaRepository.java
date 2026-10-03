package com.habitparty.adapters.out.persistence.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.TaskJpaEntity;

public interface TaskJpaRepository extends JpaRepository<TaskJpaEntity, UUID> {
    // Busca todas as tarefas (de qualquer tipo) daquela coluna já ordenadas
    List<TaskJpaEntity> findByBoardColumnIdOrderByOrderIndexAsc(UUID boardColumnId);

    // Exemplo de busca com validação de usuário
    Optional<TaskJpaEntity> findByIdAndUserId(UUID id, UUID userId);

    // Retorna o maior índice daquela coluna. O COALESCE garante que, se a coluna estiver vazia, ele retorne -1 (assim a primeira tarefa será 0)
    @Query("SELECT COALESCE(MAX(t.orderIndex), -1) FROM TaskJpaEntity t WHERE t.boardColumnId = :boardColumnId")
    Integer findMaxOrderIndexByBoardColumnId(@Param("boardColumnId") UUID boardColumnId);

    // Busca apenas as tarefas filhas que precisam de reset diário
    @Query("SELECT t FROM TaskJpaEntity t WHERE t.taskType IN ('HABIT', 'DAILY')")
    List<TaskJpaEntity> findAllRecurringTasks();

    @Query("""
                SELECT t, b.name
                FROM TaskJpaEntity t
                JOIN BoardColumnJpaEntity b ON t.boardColumnId = b.id
                WHERE b.workspace.id = :workspaceId
                  AND t.status = 'PENDING'
                  AND (
                      (:filter = 'TODAY' AND (t.dueDate = :today OR t.taskType = 'HABIT')) OR
                      (:filter = 'OVERDUE' AND t.dueDate < :today AND t.taskType = 'TODO') OR
                      (:filter = 'ALL')
                  )
                ORDER BY t.dueDate ASC NULLS LAST
            """)
    Page<Object[]> findDashboardTasks(
            @Param("workspaceId") UUID workspaceId,
            @Param("filter") String filter,
            @Param("today") LocalDate today,
            Pageable pageable);

    @Modifying
    @Query("DELETE FROM TaskJpaEntity t WHERE t.boardColumnId = :boardColumnId")
    void deleteAllByBoardColumnId(@Param("boardColumnId") UUID boardColumnId);
}