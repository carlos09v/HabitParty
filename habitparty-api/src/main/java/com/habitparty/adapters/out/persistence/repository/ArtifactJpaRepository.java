package com.habitparty.adapters.out.persistence.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.habitparty.adapters.out.persistence.entities.ArtifactJpaEntity;
import com.habitparty.core.domain.enums.ArtifactSourceType;

public interface ArtifactJpaRepository extends JpaRepository<ArtifactJpaEntity, UUID> {
  List<ArtifactJpaEntity> findAllByOrderByDisplayOrderAsc();
  List<ArtifactJpaEntity> findAllBySourceTypeOrderByDisplayOrderAsc(ArtifactSourceType sourceType);
  Optional<ArtifactJpaEntity> findByCodeIgnoreCase(String code);
}
