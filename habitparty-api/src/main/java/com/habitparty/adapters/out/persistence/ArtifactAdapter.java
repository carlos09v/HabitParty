package com.habitparty.adapters.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.mappers.ArtifactMapper;
import com.habitparty.adapters.out.persistence.repository.ArtifactJpaRepository;
import com.habitparty.application.ports.ArtifactRepository;
import com.habitparty.core.domain.entities.achievement.Artifact;
import com.habitparty.core.domain.enums.ArtifactSourceType;

@Component
public class ArtifactAdapter implements ArtifactRepository {
  private final ArtifactJpaRepository repository;
  private final ArtifactMapper mapper;

  public ArtifactAdapter(ArtifactJpaRepository repository, ArtifactMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  public List<Artifact> findAllOrdered() {
    return repository.findAllByOrderByDisplayOrderAsc().stream()
        .map(mapper::toDomain)
        .toList();
  }

  @Override
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
  public Optional<Artifact> findByCode(String code) {
    if (code == null || code.isBlank()) {
      return Optional.empty();
    }
    return repository.findByCodeIgnoreCase(code.trim()).map(mapper::toDomain);
  }
}
