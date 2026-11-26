package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.WorkspaceJpaEntity;
import com.habitparty.core.domain.entities.Workspace;

@Component
public class WorkspaceMapper {

  public WorkspaceJpaEntity toEntity(Workspace domain) {
    return WorkspaceJpaEntity.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .name(domain.getName())
        .build();
  }

  public void updateEntityFromDomain(WorkspaceJpaEntity entity, Workspace domain) {
    entity.setName(domain.getName());
  }

  public Workspace toDomain(WorkspaceJpaEntity entity) {
    return new Workspace(
        entity.getId(),
        entity.getUserId(),
        entity.getName());
  }
}
