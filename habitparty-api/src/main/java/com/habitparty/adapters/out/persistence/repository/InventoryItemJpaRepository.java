package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.InventoryItemJpaEntity;
import com.habitparty.core.domain.enums.InventoryItemStatus;

public interface InventoryItemJpaRepository extends JpaRepository<InventoryItemJpaEntity, UUID> {
  int countByUserId(UUID userId); // Limitar o usuário => até 100 itens

  List<InventoryItemJpaEntity> findByUserIdAndStatusInOrderByAcquiredAtDesc(UUID userId, List<InventoryItemStatus> statuses);

  @Query("SELECT COALESCE(MAX(i.orderIndex), -1) FROM InventoryItemJpaEntity i WHERE i.user.id = :userId")
  int findMaxOrderIndexByUserId(@Param("userId") UUID userId);
}
