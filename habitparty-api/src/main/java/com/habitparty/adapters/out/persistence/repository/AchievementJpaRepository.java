package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.jpa.repository.JpaRepository;

import com.habitparty.adapters.out.persistence.entities.AchievementJpaEntity;
import com.habitparty.infrastructure.CacheConfig;

public interface AchievementJpaRepository extends JpaRepository<AchievementJpaEntity, UUID> {
  List<AchievementJpaEntity> findAllByOrderByDisplayOrderAsc();
  Optional<AchievementJpaEntity> findByCode(String code);

  @Override
  @CacheEvict(cacheNames = CacheConfig.ACHIEVEMENTS_CATALOG_CACHE, allEntries = true)
  <S extends AchievementJpaEntity> S save(S entity);

  @Override
  @CacheEvict(cacheNames = CacheConfig.ACHIEVEMENTS_CATALOG_CACHE, allEntries = true)
  <S extends AchievementJpaEntity> S saveAndFlush(S entity);

  @Override
  @CacheEvict(cacheNames = CacheConfig.ACHIEVEMENTS_CATALOG_CACHE, allEntries = true)
  <S extends AchievementJpaEntity> List<S> saveAll(Iterable<S> entities);

  @Override
  @CacheEvict(cacheNames = CacheConfig.ACHIEVEMENTS_CATALOG_CACHE, allEntries = true)
  void deleteAll();
}
