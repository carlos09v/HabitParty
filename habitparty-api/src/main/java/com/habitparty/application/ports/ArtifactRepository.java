package com.habitparty.application.ports;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.achievement.Artifact;
import com.habitparty.core.domain.enums.ArtifactSourceType;

public interface ArtifactRepository {
  List<Artifact> findAllOrdered();
  List<Artifact> findBySourceTypeOrdered(ArtifactSourceType sourceType);
  Optional<Artifact> findById(UUID id);
  Optional<Artifact> findByCode(String code);
}
