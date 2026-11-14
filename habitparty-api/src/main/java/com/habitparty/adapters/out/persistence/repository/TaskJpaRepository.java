package com.habitparty.adapters.out.persistence.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
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
import com.habitparty.adapters.out.persistence.entities.TodoJpaEntity;

public interface TaskJpaRepository extends JpaRepository<TaskJpaEntity, UUID> {
    // Busca todas as tarefas (de qualquer tipo) daquela coluna já ordenadas
    List<TaskJpaEntity> findByBoardColumnIdOrderByOrderIndexAsc(UUID boardColumnId);

    // Busca todas as tarefas das colunas informadas em lote (elimina N+1)
    List<TaskJpaEntity> findByBoardColumnIdInOrderByOrderIndexAsc(List<UUID> boardColumnIds);

    // Exemplo de busca com validação de usuário
    Optional<TaskJpaEntity> findByIdAndUserId(UUID id, UUID userId);

    // Retorna o maior índice daquela coluna. O COALESCE garante que, se a coluna estiver vazia, ele retorne -1 (assim a primeira tarefa será 0)
    @Query("SELECT COALESCE(MAX(t.orderIndex), -1) FROM TaskJpaEntity t WHERE t.boardColumnId = :boardColumnId")
    Integer findMaxOrderIndexByBoardColumnId(@Param("boardColumnId") UUID boardColumnId);

    // Busca paginada (ordenação estável por id) das tarefas recorrentes que precisam de reset diário
    @Query("SELECT t FROM TaskJpaEntity t WHERE t.taskType IN ('HABIT', 'DAILY') ORDER BY t.id")
    List<TaskJpaEntity> findRecurringTasks(Pageable pageable);

    @Query("SELECT t FROM TaskJpaEntity t WHERE t.userId IN :userIds AND t.taskType IN ('HABIT', 'DAILY') ORDER BY t.id")
    List<TaskJpaEntity> findRecurringTasksByUserIds(@Param("userIds") Collection<UUID> userIds);

    // Busca afazeres no modo hardcore pendentes, vencidos e que ainda não receberam a penalidade
    @Query("""
        SELECT t FROM TodoJpaEntity t
        WHERE t.isHardcoreModeEnabled = true
          AND t.status = 'PENDING'
          AND t.dueDate < :today
          AND t.isPenaltyApplied = false
    """)
    List<TodoJpaEntity> findOverdueHardcoreTodos(@Param("today") LocalDate today);

    @Query("""
        SELECT t FROM TodoJpaEntity t
        WHERE t.userId IN :userIds
          AND t.isHardcoreModeEnabled = true
          AND t.status = 'PENDING'
          AND t.dueDate < :maxDueDate
          AND t.isPenaltyApplied = false
    """)
    List<TodoJpaEntity> findOverdueHardcoreTodosByUserIds(
        @Param("userIds") Collection<UUID> userIds,
        @Param("maxDueDate") LocalDate maxDueDate);

    // Busca afazeres pendentes com lembrete por e-mail ativado cujo alarme já chegou e ainda não foi enviado
    @Query("""
        SELECT t FROM TodoJpaEntity t
        WHERE t.status = 'PENDING'
          AND t.sendEmailReminder = true
          AND t.emailReminderSent = false
          AND t.reminderAt IS NOT NULL
          AND t.reminderAt <= :now
          AND (t.dueDate IS NULL OR t.dueDate >= :today)
    """)
    List<TodoJpaEntity> findPendingEmailReminders(@Param("now") LocalDateTime now, @Param("today") LocalDate today);

    @Query("""
        SELECT COUNT(t) FROM TodoJpaEntity t
        WHERE t.userId = :userId
          AND t.status = 'PENDING'
          AND t.sendEmailReminder = true
          AND t.emailReminderSent = false
    """)
    long countActiveEmailRemindersByUserId(@Param("userId") UUID userId);

    @Query("""
        SELECT t.userId, COUNT(t) FROM TodoJpaEntity t
        WHERE t.userId IN :userIds
          AND t.status = 'PENDING'
          AND t.sendEmailReminder = true
          AND t.emailReminderSent = false
        GROUP BY t.userId
    """)
    List<Object[]> countActiveEmailRemindersByUserIds(@Param("userIds") Collection<UUID> userIds);

    // Projeção escalar: não hidrata a entidade polimórfica (evita LEFT JOIN em habit/todo e o
    // overhead do Persistence Context). Só junta 'daily' para obter os dias da semana.
    @Query(value = """
                SELECT t.id, t.name, t.taskType, t.dueDate, b.name, t.isHardcoreModeEnabled, d.daysOfWeek
                FROM TaskJpaEntity t
                JOIN BoardColumnJpaEntity b ON t.boardColumnId = b.id
                LEFT JOIN DailyJpaEntity d ON d.id = t.id
                WHERE b.workspace.id = :workspaceId
                  AND b.isVisible = true
                  AND (
                      (t.status = 'PENDING' AND (
                          (:filter = 'TODAY' AND t.dueDate = :today) OR
                          (:filter = 'OVERDUE' AND t.dueDate < :today AND t.taskType = 'TODO') OR
                          (:filter = 'ALL')
                      )) OR
                      (t.taskType = 'HABIT' AND (:filter = 'TODAY' OR :filter = 'ALL'))
                  )
                ORDER BY t.dueDate ASC NULLS LAST
            """,
            countQuery = """
                SELECT COUNT(t.id)
                FROM TaskJpaEntity t
                JOIN BoardColumnJpaEntity b ON t.boardColumnId = b.id
                WHERE b.workspace.id = :workspaceId
                  AND b.isVisible = true
                  AND (
                      (t.status = 'PENDING' AND (
                          (:filter = 'TODAY' AND t.dueDate = :today) OR
                          (:filter = 'OVERDUE' AND t.dueDate < :today AND t.taskType = 'TODO') OR
                          (:filter = 'ALL')
                      )) OR
                      (t.taskType = 'HABIT' AND (:filter = 'TODAY' OR :filter = 'ALL'))
                  )
            """)
    Page<Object[]> findDashboardTasks(
            @Param("workspaceId") UUID workspaceId,
            @Param("filter") String filter,
            @Param("today") LocalDate today,
            Pageable pageable);

    @Modifying
    @Query("DELETE FROM TaskJpaEntity t WHERE t.boardColumnId = :boardColumnId")
    void deleteAllByBoardColumnId(@Param("boardColumnId") UUID boardColumnId);

    @Modifying
    @Query("DELETE FROM TaskJpaEntity t WHERE t.boardColumnId IN :boardColumnIds")
    void deleteAllByBoardColumnIds(@Param("boardColumnIds") List<UUID> boardColumnIds);

    @Modifying
    @Query("DELETE FROM TaskJpaEntity t WHERE t.userId = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);

    // Projeção escalar: [workspaceId, workspaceName, count] — busca case-insensitive em nome e descrição
    @Query("""
        SELECT w.id, w.name, COUNT(t)
        FROM TaskJpaEntity t, BoardColumnJpaEntity c
        JOIN c.workspace w
        WHERE t.boardColumnId = c.id
          AND t.userId = :userId
          AND (LOWER(t.name) LIKE :pattern ESCAPE '\\' OR LOWER(t.description) LIKE :pattern ESCAPE '\\')
        GROUP BY w.id, w.name, w.createdAt
        ORDER BY w.createdAt ASC
        """)
    List<Object[]> countMatchingTasksByWorkspace(@Param("userId") UUID userId, @Param("pattern") String pattern);
}