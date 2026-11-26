package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.FocusActivityJpaEntity;

public interface FocusActivityJpaRepository extends JpaRepository<FocusActivityJpaEntity, UUID> {

  List<FocusActivityJpaEntity> findAllByUserIdOrderByOrderIndexAsc(UUID userId);

  int countByUserId(UUID userId);

  @Query("SELECT COALESCE(MAX(f.orderIndex), -1) FROM FocusActivityJpaEntity f WHERE f.userId = :userId")
  int findMaxOrderIndexByUserId(@Param("userId") UUID userId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("UPDATE FocusActivityJpaEntity f SET f.orderIndex = f.orderIndex - 1 WHERE f.userId = :userId AND f.orderIndex > :deletedOrderIndex")
  void shiftOrderIndexDown(@Param("userId") UUID userId, @Param("deletedOrderIndex") int deletedOrderIndex);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM FocusActivityJpaEntity f WHERE f.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
