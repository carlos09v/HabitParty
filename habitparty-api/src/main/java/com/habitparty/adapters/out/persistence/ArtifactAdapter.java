package com.habitparty.adapters.out.persistence;

import java.util.Locale;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.mappers.ArtifactMapper;
import com.habitparty.adapters.out.persistence.repository.ArtifactJpaRepository;
import com.habitparty.application.ports.ArtifactRepository;
import com.habitparty.core.domain.entities.achievement.Artifact;
import com.habitparty.core.domain.enums.ArtifactSourceType;
import com.habitparty.infrastructure.CacheConfig;

@Component
public class ArtifactAdapter implements ArtifactRepository {
  private final ArtifactJpaRepository repository;
  private final ArtifactMapper mapper;

  public ArtifactAdapter(ArtifactJpaRepository repository, ArtifactMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  @Cacheable(
      cacheNames = CacheConfig.ARTIFACTS_CATALOG_CACHE,
      key = "'all'",
      unless = "#result == null || #result.isEmpty()")
  public List<Artifact> findAllOrdered() {
    return repository.findAllByOrderByDisplayOrderAsc().stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  @Cacheable(
      cacheNames = CacheConfig.ARTIFACTS_CATALOG_CACHE,
      key = "'source:' + #sourceType.name()",
      condition = "#sourceType != null",
      unless = "#result == null || #result.isEmpty()")
  public List<Artifact> findBySourceTypeOrdered(ArtifactSourceType sourceType) {
    if (sourceType == null) {
      return List.of();
    }
    return repository.findAllBySourceTypeOrderByDisplayOrderAsc(sourceType).stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
  public Optional<Artifact> findById(UUID id) {
    if (id == null) {
      return Optional.empty();
    }
    return repository.findById(id).map(mapper::toDomain);
  }

  @Override
  @Cacheable(
      cacheNames = CacheConfig.ARTIFACTS_CATALOG_CACHE,
      key = "'code:' + #code.trim().toUpperCase()",
      condition = "#code != null && !#code.isBlank()",
      unless = "#result == null")
  public Optional<Artifact> findByCode(String code) {
    if (code == null || code.isBlank()) {
      return Optional.empty();
    }
    return repository.findByCodeIgnoreCase(code.trim().toUpperCase(Locale.ROOT)).map(mapper::toDomain);
  }
}
