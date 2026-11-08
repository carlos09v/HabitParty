package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.ProfileHighlightJpaEntity;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;

@Component
public class ProfileHighlightMapper {

  public ProfileHighlightJpaEntity toEntity(ProfileHighlight domain) {
    return new ProfileHighlightJpaEntity(
        domain.getId(),
        domain.getUserId(),
        domain.getDisplayOrder(),
        domain.getHighlightType(),
        domain.getReferenceId().orElse(null),
        domain.getHighlightKey().orElse(null),
        domain.getCreatedAt());
  }

  public ProfileHighlight toDomain(ProfileHighlightJpaEntity entity) {
    return new ProfileHighlight(
        entity.getId(),
        entity.getUserId(),
        entity.getDisplayOrder(),
        entity.getHighlightType(),
        entity.getReferenceId(),
        entity.getHighlightKey(),
        entity.getCreatedAt());
  }
}
