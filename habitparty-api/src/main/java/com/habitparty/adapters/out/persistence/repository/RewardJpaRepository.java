package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.habitparty.adapters.out.persistence.entities.RewardJpaEntity;

public interface RewardJpaRepository extends JpaRepository<RewardJpaEntity, UUID> {
  int countByUser_Id(UUID userId);

  List<RewardJpaEntity> findByUser_Id(UUID userId);
}
