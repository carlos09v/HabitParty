package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.InventoryItemJpaEntity;
import com.habitparty.core.domain.enums.InventoryItemStatus;

public interface InventoryItemJpaRepository extends JpaRepository<InventoryItemJpaEntity, UUID> {
  int countByUser_IdAndStatusIn(UUID userId, List<InventoryItemStatus> statuses); // Limitar mochila ativa => 20 Free / 100 Premium

  List<InventoryItemJpaEntity> findByUser_IdAndStatusInOrderByOrderIndexAscAcquiredAtDesc(
      UUID userId,
      List<InventoryItemStatus> statuses);

  @Query("SELECT COALESCE(MAX(i.orderIndex), -1) FROM InventoryItemJpaEntity i WHERE i.user.id = :userId AND i.status IN :statuses")
  int findMaxOrderIndexByUserIdAndStatusIn(
      @Param("userId") UUID userId,
      @Param("statuses") List<InventoryItemStatus> statuses);

  @Modifying
  @Query("DELETE FROM InventoryItemJpaEntity i WHERE i.user.id = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
