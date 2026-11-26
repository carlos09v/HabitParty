package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.InventoryItemJpaEntity;
import com.habitparty.core.domain.enums.InventoryItemStatus;

import jakarta.persistence.LockModeType;

public interface InventoryItemJpaRepository extends JpaRepository<InventoryItemJpaEntity, UUID> {

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("SELECT i FROM InventoryItemJpaEntity i WHERE i.id = :id")
  Optional<InventoryItemJpaEntity> findByIdForUpdate(@Param("id") UUID id);

  int countByUserIdAndStatusIn(UUID userId, List<InventoryItemStatus> statuses);

  List<InventoryItemJpaEntity> findByUserIdAndStatusInOrderByOrderIndexAscAcquiredAtDesc(
      UUID userId,
      List<InventoryItemStatus> statuses);

  @Query("SELECT COALESCE(MAX(i.orderIndex), -1) FROM InventoryItemJpaEntity i WHERE i.userId = :userId AND i.status IN :statuses")
  int findMaxOrderIndexByUserIdAndStatusIn(
      @Param("userId") UUID userId,
      @Param("statuses") List<InventoryItemStatus> statuses);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM InventoryItemJpaEntity i WHERE i.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
