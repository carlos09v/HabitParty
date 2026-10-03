package com.habitparty.adapters.out.persistence.repository;

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
    int countByWorkspace_Id(UUID workspaceId);

    List<BoardColumnJpaEntity> findByWorkspaceIdAndIsVisibleTrueOrderByOrderIndexAsc(UUID workspaceId);

    List<BoardColumnJpaEntity> findByWorkspace_Id(UUID workspaceId);

    // 1. Query para o Reordenamento na Deleção (Shift Down)
    @Transactional
    @Modifying
    @Query("UPDATE BoardColumnJpaEntity c SET c.orderIndex = c.orderIndex - 1 WHERE c.workspace.id = :workspaceId AND c.orderIndex > :deletedIndex")
    void decrementOrderIndexForColumnsAfter(@Param("workspaceId") UUID workspaceId,
            @Param("deletedIndex") int deletedIndex);

    // 2. Query para encontrar o maior índice na Criação
    @Query("SELECT COALESCE(MAX(c.orderIndex), 0) FROM BoardColumnJpaEntity c WHERE c.workspace.id = :workspaceId")
    Integer findMaxOrderIndexByWorkspaceId(@Param("workspaceId") UUID workspaceId);

    // Interface de Projeção (Pode colocar no mesmo arquivo do repository ou em um arquivo separado)
    public interface BoardColumnSummaryProjection {
        UUID getId();

        String getName();

        String getIcon();

        int getOrderIndex();

        Long getTotalTasks();

        Long getCompletedTasks();
    }

    // A Query que faz a contagem no banco de dados sem carregar as tarefas para o Java!
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
                WHERE b.workspace.id = :workspaceId
                GROUP BY b.id, b.name, b.icon, b.orderIndex
                ORDER BY b.orderIndex ASC
            """)
    List<BoardColumnSummaryProjection> findSummaryByWorkspaceId(
            @Param("workspaceId") UUID workspaceId,
            @Param("completedStatus") TaskStatus completedStatus);
}
