package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.InventoryItemJpaEntity;
import com.habitparty.core.domain.enums.InventoryItemStatus;

public interface InventoryItemRepository extends JpaRepository<InventoryItemJpaEntity, UUID> {
  @Query("SELECT i FROM InventoryItemJpaEntity i JOIN FETCH i.reward WHERE i.user.id = :userId AND i.status = :status ORDER BY i.orderIndex ASC")
  List<InventoryItemJpaEntity> findInventoryByUserId(@Param("userId") UUID userId,
      @Param("status") InventoryItemStatus status);
}
