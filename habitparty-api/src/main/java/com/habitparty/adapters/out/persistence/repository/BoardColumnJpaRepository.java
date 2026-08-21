package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.BoardColumnJpaEntity;

public interface BoardColumnJpaRepository extends JpaRepository<BoardColumnJpaEntity, UUID> {
  int countByWorkspace_Id(UUID workspaceId);

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
}
