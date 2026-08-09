package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.adapters.out.persistence.entities.WorkspaceJpaEntity;
import com.habitparty.core.domain.entities.Workspace;

@Component
public class WorkspaceMapper {
  public WorkspaceJpaEntity toEntity(Workspace domain) {
    // 1. Cria um usuário vazio apenas para carregar o ID
    UserJpaEntity userReference = new UserJpaEntity();
    userReference.setId(domain.getUserId());

    WorkspaceJpaEntity entity = new WorkspaceJpaEntity();
    entity.setId(domain.getId());
    entity.setUser(userReference);
    entity.setName(domain.getName());

    return entity;
  }

  public Workspace toDomain(WorkspaceJpaEntity entity) {
    return new Workspace(
      entity.getId(),
      entity.getUser().getId(),
      entity.getName()
    );
  }
}
