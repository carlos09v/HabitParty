package com.habitparty.adapters.out.persistence.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.RewardJpaEntity;

public interface RewardJpaRepository extends JpaRepository<RewardJpaEntity, UUID> {

  int countByUserId(UUID userId);

  List<RewardJpaEntity> findByUserIdOrderByOrderIndexAsc(UUID userId);

  @Query("SELECT COALESCE(MAX(r.orderIndex), -1) FROM RewardJpaEntity r WHERE r.userId = :userId")
  int findMaxOrderIndexByUserId(@Param("userId") UUID userId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM RewardJpaEntity r WHERE r.userId = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query("DELETE FROM RewardJpaEntity r WHERE r.id IN :ids AND r.userId = :userId")
  int deleteAllByIdInAndUserId(@Param("ids") Collection<UUID> ids, @Param("userId") UUID userId);
}
