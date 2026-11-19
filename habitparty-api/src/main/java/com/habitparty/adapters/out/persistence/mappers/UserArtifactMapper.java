package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.UserArtifactJpaEntity;
import com.habitparty.core.domain.entities.achievement.UserArtifact;

@Component
public class UserArtifactMapper {

  public UserArtifactJpaEntity toEntity(UserArtifact domain) {
    return new UserArtifactJpaEntity(
        domain.getUserId(),
        domain.getArtifactId(),
        domain.getObtainedSource(),
        domain.getUnlockedAt(),
        domain.isSeen());
  }

  public UserArtifact toDomain(UserArtifactJpaEntity entity) {
    return new UserArtifact(
        entity.getUserId(),
        entity.getArtifactId(),
        entity.getObtainedSource(),
        entity.getUnlockedAt(),
        entity.isSeen());
  }
}
