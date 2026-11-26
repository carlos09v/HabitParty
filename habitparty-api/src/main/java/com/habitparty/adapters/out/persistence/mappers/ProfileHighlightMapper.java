package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.ProfileHighlightJpaEntity;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;

@Component
public class ProfileHighlightMapper {

  public ProfileHighlightJpaEntity toEntity(ProfileHighlight domain) {
    return ProfileHighlightJpaEntity.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .displayOrder(domain.getDisplayOrder())
        .highlightType(domain.getHighlightType())
        .referenceId(domain.getReferenceId().orElse(null))
        .highlightKey(domain.getHighlightKey().orElse(null))
        .createdAt(domain.getCreatedAt())
        .build();
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
