package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.UserArtifactJpaEntity;
import com.habitparty.core.domain.entities.achievement.UserArtifact;

@Component
public class UserArtifactMapper {

  public UserArtifactJpaEntity toEntity(UserArtifact domain) {
    return UserArtifactJpaEntity.builder()
        .userId(domain.getUserId())
        .artifactId(domain.getArtifactId())
        .obtainedSource(domain.getObtainedSource())
        .unlockedAt(domain.getUnlockedAt())
        .seen(domain.isSeen())
        .build();
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
