package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.BoardColumnJpaEntity;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.adapters.out.persistence.entities.WorkspaceJpaEntity;
import com.habitparty.core.domain.entities.BoardColumn;

@Component
public class BoardColumnMapper {
  public BoardColumnJpaEntity toEntity(BoardColumn domain) {
    // Cria um user vazio apenas para carregar o ID
    UserJpaEntity userReference = new UserJpaEntity();
    userReference.setId(domain.getUserId());

    // Cria um workspace vazio apenas para carregar o ID
    WorkspaceJpaEntity workspaceReference = new WorkspaceJpaEntity();
    workspaceReference.setId(domain.getWorkspaceId());


    BoardColumnJpaEntity entity = new BoardColumnJpaEntity();
    entity.setId(domain.getId());
    entity.setUser(userReference);
    entity.setWorkspace(workspaceReference);
    entity.setName(domain.getName());
    entity.setIcon(domain.getIcon().orElse(null));
    entity.setOrderIndex(domain.getOrderIndex());

    return entity;
  }

  public BoardColumn toDomain(BoardColumnJpaEntity entity) {
    return new BoardColumn(
        entity.getId(),
        entity.getUser().getId(),
        entity.getWorkspace().getId(),
        entity.getName(),
        entity.getOrderIndex(),
        entity.getIcon());
  }
}
