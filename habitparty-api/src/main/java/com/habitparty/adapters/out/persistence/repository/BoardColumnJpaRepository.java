package com.habitparty.adapters.out.persistence.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.BoardColumnJpaEntity;
import com.habitparty.core.domain.enums.task.TaskStatus;

public interface BoardColumnJpaRepository extends JpaRepository<BoardColumnJpaEntity, UUID> {

  int countByWorkspaceId(UUID workspaceId);

  List<BoardColumnJpaEntity> findByWorkspaceIdAndIsVisibleTrueOrderByOrderIndexAsc(UUID workspaceId);

  List<BoardColumnJpaEntity> findByWorkspaceIdOrderByOrderIndexAsc(UUID workspaceId);

  List<BoardColumnJpaEntity> findByWorkspaceIdInOrderByOrderIndexAsc(Collection<UUID> workspaceIds);

  @Transactional
  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("UPDATE BoardColumnJpaEntity c SET c.orderIndex = c.orderIndex - 1 WHERE c.workspaceId = :workspaceId AND c.orderIndex > :deletedIndex")
  void decrementOrderIndexForColumnsAfter(
      @Param("workspaceId") UUID workspaceId,
      @Param("deletedIndex") int deletedIndex);

  @Query("SELECT COALESCE(MAX(c.orderIndex), -1) FROM BoardColumnJpaEntity c WHERE c.workspaceId = :workspaceId")
  Integer findMaxOrderIndexByWorkspaceId(@Param("workspaceId") UUID workspaceId);

  interface BoardColumnSummaryProjection {
    UUID getId();

    String getName();

    String getIcon();

    int getOrderIndex();

    Long getTotalTasks();

    Long getCompletedTasks();
  }

  @Query("""
      SELECT
          b.id AS id,
          b.name AS name,
          b.icon AS icon,
          b.orderIndex AS orderIndex,
          COUNT(t.id) AS totalTasks,
          SUM(CASE WHEN t.status = :completedStatus THEN 1 ELSE 0 END) AS completedTasks
      FROM BoardColumnJpaEntity b
      LEFT JOIN TaskJpaEntity t ON t.boardColumnId = b.id
      WHERE b.workspaceId = :workspaceId
      GROUP BY b.id, b.name, b.icon, b.orderIndex
      ORDER BY b.orderIndex ASC
      """)
  List<BoardColumnSummaryProjection> findSummaryByWorkspaceId(
      @Param("workspaceId") UUID workspaceId,
      @Param("completedStatus") TaskStatus completedStatus);

  @Query("""
      SELECT
          b.id AS id,
          b.name AS name,
          b.icon AS icon,
          b.orderIndex AS orderIndex,
          COUNT(t.id) AS totalTasks,
          SUM(CASE WHEN t.status = :completedStatus THEN 1 ELSE 0 END) AS completedTasks
      FROM BoardColumnJpaEntity b
      LEFT JOIN TaskJpaEntity t ON t.boardColumnId = b.id
      WHERE b.workspaceId IN :workspaceIds
      GROUP BY b.id, b.name, b.icon, b.orderIndex
      ORDER BY b.orderIndex ASC
      """)
  List<BoardColumnSummaryProjection> findSummaryByWorkspaceIdIn(
      @Param("workspaceIds") Collection<UUID> workspaceIds,
      @Param("completedStatus") TaskStatus completedStatus);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM BoardColumnJpaEntity c WHERE c.workspaceId = :workspaceId")
  void deleteAllByWorkspaceId(@Param("workspaceId") UUID workspaceId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM BoardColumnJpaEntity c WHERE c.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
