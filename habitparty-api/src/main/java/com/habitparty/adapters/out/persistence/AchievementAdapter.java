package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.mappers.AchievementMapper;
import com.habitparty.adapters.out.persistence.repository.AchievementJpaRepository;
import com.habitparty.application.ports.AchievementRepository;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.infrastructure.CacheConfig;

@Component
public class AchievementAdapter implements AchievementRepository {
  private final AchievementJpaRepository repository;
  private final AchievementMapper mapper;

  public AchievementAdapter(AchievementJpaRepository repository, AchievementMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  @Cacheable(
      cacheNames = CacheConfig.ACHIEVEMENTS_CATALOG_CACHE,
      key = "'all'",
      unless = "#result == null || #result.isEmpty()")
  public List<Achievement> findAllOrdered() {
    return repository.findAllByOrderByDisplayOrderAsc().stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public Optional<Achievement> findById(UUID id) {
    return repository.findById(id).map(mapper::toDomain);
  }

  @Override
  @Cacheable(
      cacheNames = CacheConfig.ACHIEVEMENTS_CATALOG_CACHE,
      key = "'code:' + #code",
      condition = "#code != null && !#code.isBlank()",
      unless = "#result == null")
  public Optional<Achievement> findByCode(String code) {
    return repository.findByCode(code).map(mapper::toDomain);
  }
}
