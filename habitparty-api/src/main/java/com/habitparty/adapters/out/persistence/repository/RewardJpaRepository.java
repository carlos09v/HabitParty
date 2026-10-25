package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.habitparty.adapters.out.persistence.entities.RewardJpaEntity;

public interface RewardJpaRepository extends JpaRepository<RewardJpaEntity, UUID> {
  int countByUser_Id(UUID userId);

  List<RewardJpaEntity> findByUser_IdOrderByOrderIndexAsc(UUID userId);

  // Acha o maior index para criar uma nova no final da fila (começando do 0)
  @Query("SELECT COALESCE(MAX(r.orderIndex), -1) FROM RewardJpaEntity r WHERE r.user.id = :userId")
  int findMaxOrderIndexByUserId(@Param("userId") UUID userId);

  @Modifying
  @Query("DELETE FROM RewardJpaEntity r WHERE r.user.id = :userId")
  void deleteAllByUserId(@Param("userId") UUID userId);
}
