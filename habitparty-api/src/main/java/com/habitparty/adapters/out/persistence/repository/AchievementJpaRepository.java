package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.habitparty.adapters.out.persistence.entities.AchievementJpaEntity;

public interface AchievementJpaRepository extends JpaRepository<AchievementJpaEntity, UUID> {
  List<AchievementJpaEntity> findAllByOrderByDisplayOrderAsc();
  Optional<AchievementJpaEntity> findByCode(String code);
}
