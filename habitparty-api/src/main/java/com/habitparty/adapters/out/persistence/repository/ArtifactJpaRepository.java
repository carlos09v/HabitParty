package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.jpa.repository.JpaRepository;

import com.habitparty.adapters.out.persistence.entities.ArtifactJpaEntity;
import com.habitparty.core.domain.enums.ArtifactSourceType;
import com.habitparty.infrastructure.CacheConfig;

public interface ArtifactJpaRepository extends JpaRepository<ArtifactJpaEntity, UUID> {
  List<ArtifactJpaEntity> findAllByOrderByDisplayOrderAsc();
  List<ArtifactJpaEntity> findAllBySourceTypeOrderByDisplayOrderAsc(ArtifactSourceType sourceType);
  Optional<ArtifactJpaEntity> findByCodeIgnoreCase(String code);

  @Override
  @CacheEvict(cacheNames = CacheConfig.ARTIFACTS_CATALOG_CACHE, allEntries = true)
  <S extends ArtifactJpaEntity> S save(S entity);

  @Override
  @CacheEvict(cacheNames = CacheConfig.ARTIFACTS_CATALOG_CACHE, allEntries = true)
  <S extends ArtifactJpaEntity> S saveAndFlush(S entity);

  @Override
  @CacheEvict(cacheNames = CacheConfig.ARTIFACTS_CATALOG_CACHE, allEntries = true)
  <S extends ArtifactJpaEntity> List<S> saveAll(Iterable<S> entities);

  @Override
  @CacheEvict(cacheNames = CacheConfig.ARTIFACTS_CATALOG_CACHE, allEntries = true)
  void deleteAll();
}
