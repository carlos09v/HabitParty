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

  List<TaskJpaEntity> findByBoardColumnIdOrderByOrderIndexAsc(UUID boardColumnId);

  List<TaskJpaEntity> findByBoardColumnIdInOrderByOrderIndexAsc(List<UUID> boardColumnIds);

  @Query("""
      SELECT t
      FROM TaskJpaEntity t
      WHERE t.boardColumnId IN :boardColumnIds
        AND (
          t.taskType <> com.habitparty.core.domain.enums.task.TaskType.TODO
          OR t.status <> com.habitparty.core.domain.enums.task.TaskStatus.COMPLETED
          OR (t.dueDate IS NOT NULL AND t.dueDate >= :minDueDate)
          OR (TREAT(t AS TodoJpaEntity).completedAt IS NOT NULL AND TREAT(t AS TodoJpaEntity).completedAt >= :minCompletedAt)
          OR (t.dueDate IS NULL AND TREAT(t AS TodoJpaEntity).completedAt IS NULL AND t.createdAt >= :minCompletedAt)
        )
      ORDER BY t.orderIndex ASC
      """)
  List<TaskJpaEntity> findDashboardActiveByBoardColumnIdInOrderByOrderIndexAsc(
      @Param("boardColumnIds") Collection<UUID> boardColumnIds,
      @Param("minDueDate") LocalDate minDueDate,
      @Param("minCompletedAt") LocalDateTime minCompletedAt);

  @Query("""
      SELECT t
      FROM TodoJpaEntity t
      WHERE t.boardColumnId = :boardColumnId
        AND t.status = com.habitparty.core.domain.enums.task.TaskStatus.COMPLETED
        AND (t.dueDate IS NULL OR t.dueDate < :minDueDate)
        AND (t.completedAt IS NULL OR t.completedAt < :minCompletedAt)
        AND (t.dueDate IS NOT NULL OR t.completedAt IS NOT NULL OR t.createdAt < :minCompletedAt)
      ORDER BY t.completedAt DESC NULLS LAST, t.orderIndex ASC
      """)
  List<TodoJpaEntity> findArchivedCompletedTodosByBoardColumnId(
      @Param("boardColumnId") UUID boardColumnId,
      @Param("minDueDate") LocalDate minDueDate,
      @Param("minCompletedAt") LocalDateTime minCompletedAt);

  @Query("SELECT t.boardColumnId FROM TaskJpaEntity t WHERE t.id = :taskId")
  Optional<UUID> findBoardColumnIdById(@Param("taskId") UUID taskId);

  @Query("SELECT COALESCE(MAX(t.orderIndex), -1) FROM TaskJpaEntity t WHERE t.boardColumnId = :boardColumnId")
  Integer findMaxOrderIndexByBoardColumnId(@Param("boardColumnId") UUID boardColumnId);

  @Query("SELECT t.orderIndex FROM TaskJpaEntity t WHERE t.id = :taskId AND t.boardColumnId = :boardColumnId AND t.userId = :userId")
  Optional<Integer> findOrderIndexByIdAndBoardColumnIdAndUserId(
      @Param("taskId") UUID taskId,
      @Param("boardColumnId") UUID boardColumnId,
      @Param("userId") UUID userId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("UPDATE TaskJpaEntity t SET t.orderIndex = t.orderIndex + 1 WHERE t.boardColumnId = :boardColumnId AND t.orderIndex > :afterOrderIndex")
  void shiftOrderIndexUpAfter(
      @Param("boardColumnId") UUID boardColumnId,
      @Param("afterOrderIndex") int afterOrderIndex);

  @Query("SELECT t FROM TaskJpaEntity t WHERE t.userId IN :userIds AND t.taskType IN ('HABIT', 'DAILY') ORDER BY t.id")
  List<TaskJpaEntity> findRecurringTasksByUserIds(@Param("userIds") Collection<UUID> userIds);

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

  @Query("""
      SELECT t FROM TodoJpaEntity t
      WHERE t.status = 'PENDING'
        AND t.sendEmailReminder = true
        AND t.emailReminderSent = false
        AND t.reminderAttempts < 3
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

  @Query(value = """
      SELECT t.id, t.name, t.taskType, t.dueDate, b.name, t.isHardcoreModeEnabled, d.daysOfWeek
      FROM TaskJpaEntity t
      JOIN BoardColumnJpaEntity b ON t.boardColumnId = b.id
      LEFT JOIN DailyJpaEntity d ON d.id = t.id
      WHERE b.workspaceId = :workspaceId
        AND b.isVisible = true
        AND (
            (t.status = 'PENDING' AND (
                (:filter = 'TODAY' AND t.dueDate = :today) OR
                (:filter = 'OVERDUE' AND t.dueDate < :today AND t.taskType = 'TODO') OR
                (:filter = 'ALL')
            )) OR
            (t.taskType = 'HABIT' AND ((:filter = 'TODAY' AND t.status = 'PENDING') OR :filter = 'ALL'))
        )
      ORDER BY t.dueDate ASC NULLS LAST
      """,
      countQuery = """
      SELECT COUNT(t.id)
      FROM TaskJpaEntity t
      JOIN BoardColumnJpaEntity b ON t.boardColumnId = b.id
      WHERE b.workspaceId = :workspaceId
        AND b.isVisible = true
        AND (
            (t.status = 'PENDING' AND (
                (:filter = 'TODAY' AND t.dueDate = :today) OR
                (:filter = 'OVERDUE' AND t.dueDate < :today AND t.taskType = 'TODO') OR
                (:filter = 'ALL')
            )) OR
            (t.taskType = 'HABIT' AND ((:filter = 'TODAY' AND t.status = 'PENDING') OR :filter = 'ALL'))
        )
      """)
  Page<Object[]> findDashboardTasks(
      @Param("workspaceId") UUID workspaceId,
      @Param("filter") String filter,
      @Param("today") LocalDate today,
      Pageable pageable);

  @Query("SELECT t.id FROM TaskJpaEntity t WHERE t.boardColumnId IN :boardColumnIds")
  List<UUID> findIdsByBoardColumnIdIn(@Param("boardColumnIds") Collection<UUID> boardColumnIds);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM TaskJpaEntity t WHERE t.boardColumnId = :boardColumnId")
  void deleteAllByBoardColumnId(@Param("boardColumnId") UUID boardColumnId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM TaskJpaEntity t WHERE t.boardColumnId IN :boardColumnIds")
  void deleteAllByBoardColumnIds(@Param("boardColumnIds") List<UUID> boardColumnIds);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM TaskJpaEntity t WHERE t.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("UPDATE TaskJpaEntity t SET t.totalFocusMinutes = 0, t.focusCyclesCount = 0 WHERE t.userId = :userId")
  void resetTaskFocusMetricsByUserId(@Param("userId") UUID userId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("UPDATE HabitJpaEntity h SET h.currentStreak = 0, h.highestStreak = 0, h.positiveCount = 0, h.negativeCount = 0, h.lastCompletedAt = null WHERE h.id IN (SELECT t.id FROM TaskJpaEntity t WHERE t.userId = :userId)")
  void resetHabitMetricsByUserId(@Param("userId") UUID userId);

  @Modifying(flushAutomatically = true, clearAutomatically = true)
  @Query("UPDATE DailyJpaEntity d SET d.currentStreak = 0, d.highestStreak = 0, d.lastCompletedAt = null WHERE d.id IN (SELECT t.id FROM TaskJpaEntity t WHERE t.userId = :userId)")
  void resetDailyMetricsByUserId(@Param("userId") UUID userId);

  @Query("""
      SELECT w.id, w.name, COUNT(t)
      FROM TaskJpaEntity t
      JOIN BoardColumnJpaEntity c ON t.boardColumnId = c.id
      JOIN WorkspaceJpaEntity w ON c.workspaceId = w.id
      WHERE t.userId = :userId
        AND (LOWER(t.name) LIKE :pattern ESCAPE '\\' OR LOWER(t.description) LIKE :pattern ESCAPE '\\')
      GROUP BY w.id, w.name, w.createdAt
      ORDER BY w.createdAt ASC
      """)
  List<Object[]> countMatchingTasksByWorkspace(@Param("userId") UUID userId, @Param("pattern") String pattern);

  @Query("""
      SELECT t.id, t.name, t.taskType, c.name, w.name, t.totalFocusMinutes, t.focusCyclesCount
      FROM TaskJpaEntity t
      JOIN BoardColumnJpaEntity c ON t.boardColumnId = c.id
      JOIN WorkspaceJpaEntity w ON c.workspaceId = w.id
      WHERE t.userId = :userId
        AND w.id IN :workspaceIds
        AND t.taskType IN ('DAILY', 'TODO')
        AND t.status <> 'COMPLETED'
      ORDER BY w.createdAt ASC, c.orderIndex ASC, t.orderIndex ASC
      """)
  List<Object[]> findFocusableTaskProjections(
      @Param("userId") UUID userId,
      @Param("workspaceIds") Collection<UUID> workspaceIds);
}
