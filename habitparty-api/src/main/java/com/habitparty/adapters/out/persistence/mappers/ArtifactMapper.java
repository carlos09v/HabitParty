package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.ArtifactJpaEntity;
import com.habitparty.core.domain.entities.achievement.Artifact;

@Component
public class ArtifactMapper {

  public Artifact toDomain(ArtifactJpaEntity entity) {
    return new Artifact(
        entity.getId(),
        entity.getCode(),
        entity.getIconName(),
        entity.getRarity(),
        entity.getSourceType(),
        entity.getRequiredAchievementCode(),
        entity.getDisplayOrder());
  }
}
