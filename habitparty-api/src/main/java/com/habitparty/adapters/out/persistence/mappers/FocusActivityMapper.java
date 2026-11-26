package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.FocusActivityJpaEntity;
import com.habitparty.core.domain.entities.focus.FocusActivity;

@Component
public class FocusActivityMapper {

  public FocusActivityJpaEntity toEntity(FocusActivity domain) {
    if (domain == null) {
      return null;
    }
    return FocusActivityJpaEntity.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .name(domain.getName())
        .icon(domain.getIcon())
        .orderIndex(domain.getOrderIndex())
        .recordType(domain.getRecordType())
        .pomoTimeMinutes(domain.getPomoDurationMinutes().orElse(null))
        .createdAt(domain.getCreatedAt())
        .build();
  }

  public void updateEntityFromDomain(FocusActivityJpaEntity entity, FocusActivity domain) {
    entity.setName(domain.getName());
    entity.setIcon(domain.getIcon());
    entity.setOrderIndex(domain.getOrderIndex());
    entity.setRecordType(domain.getRecordType());
    entity.setPomoTimeMinutes(domain.getPomoDurationMinutes().orElse(null));
  }

  public FocusActivity toDomain(FocusActivityJpaEntity entity) {
    if (entity == null) {
      return null;
    }
    return new FocusActivity(
        entity.getId(),
        entity.getUserId(),
        entity.getName(),
        entity.getIcon(),
        entity.getOrderIndex(),
        entity.getRecordType(),
        entity.getPomoTimeMinutes(),
        entity.getCreatedAt());
  }
}
