package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.ChecklistItemJpaEntity;
import com.habitparty.adapters.out.persistence.entities.TaskJpaEntity;
import com.habitparty.adapters.out.persistence.repository.ChecklistItemProjection;
import com.habitparty.core.domain.entities.task.ChecklistItem;

@Component
public class ChecklistItemMapper {

  public ChecklistItem toDomain(ChecklistItemProjection projection) {
    return new ChecklistItem(
        projection.id(),
        projection.taskId(),
        projection.userId(),
        projection.name(),
        projection.isCompleted(),
        projection.isRewarded(),
        projection.orderIndex(),
        projection.autoCompleted());
  }

  public ChecklistItem toDomain(ChecklistItemJpaEntity entity) {
    return new ChecklistItem(
        entity.getId(),
        entity.getTask().getId(),
        entity.getUserId(),
        entity.getName(),
        entity.isCompleted(),
        entity.isRewarded(),
        entity.getOrderIndex(),
        entity.isAutoCompleted());
  }

  public ChecklistItemJpaEntity toEntity(ChecklistItem domain, TaskJpaEntity taskEntity) {
    return ChecklistItemJpaEntity.builder()
        .id(domain.getId())
        .task(taskEntity)
        .userId(domain.getUserId())
        .name(domain.getName())
        .isCompleted(domain.isCompleted())
        .isRewarded(domain.isRewarded())
        .orderIndex(domain.getOrderIndex())
        .autoCompleted(domain.isAutoCompleted())
        .build();
  }

  public void updateEntityFromDomain(ChecklistItemJpaEntity entity, ChecklistItem domain) {
    entity.setName(domain.getName());
    entity.setCompleted(domain.isCompleted());
    entity.setRewarded(domain.isRewarded());
    entity.setOrderIndex(domain.getOrderIndex());
    entity.setAutoCompleted(domain.isAutoCompleted());
  }
}
