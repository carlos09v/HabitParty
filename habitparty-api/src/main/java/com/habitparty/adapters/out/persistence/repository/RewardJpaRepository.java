package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.RewardJpaEntity;

public interface RewardJpaRepository extends JpaRepository<RewardJpaEntity, UUID> {
  int countByUser_Id(UUID userId);

  List<RewardJpaEntity> findByUser_Id(UUID userId);

  // Puxa as recompensas para fechar o buraco da que foi deletada
    @Transactional
    @Modifying
    @Query("UPDATE RewardJpaEntity r SET r.orderIndex = r.orderIndex - 1 WHERE r.user.id = :userId AND r.orderIndex > :deletedIndex")
  void decrementOrderIndexForRewardsAfter(@Param("userId") UUID userId, @Param("deletedIndex") int deletedIndex);

    // Acha o maior index para criar uma nova no final da fila
    @Query("SELECT COALESCE(MAX(r.orderIndex), 0) FROM RewardJpaEntity r WHERE r.user.id = :userId")
    Integer findMaxOrderIndexByUserId(@Param("userId") UUID userId);
}
