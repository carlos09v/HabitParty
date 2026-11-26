package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.BoardColumnJpaEntity;
import com.habitparty.core.domain.entities.BoardColumn;

@Component
public class BoardColumnMapper {

  public BoardColumnJpaEntity toEntity(BoardColumn domain) {
    return BoardColumnJpaEntity.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .workspaceId(domain.getWorkspaceId())
        .isVisible(domain.isVisible())
        .name(domain.getName())
        .icon(domain.getIcon().orElse(null))
        .orderIndex(domain.getOrderIndex())
        .build();
  }

  public void updateEntityFromDomain(BoardColumnJpaEntity entity, BoardColumn domain) {
    entity.setUserId(domain.getUserId());
    entity.setWorkspaceId(domain.getWorkspaceId());
    entity.setVisible(domain.isVisible());
    entity.setName(domain.getName());
    entity.setIcon(domain.getIcon().orElse(null));
    entity.setOrderIndex(domain.getOrderIndex());
  }

  public BoardColumn toDomain(BoardColumnJpaEntity entity) {
    return new BoardColumn(
        entity.getId(),
        entity.getUserId(),
        entity.getWorkspaceId(),
        entity.getName(),
        entity.getOrderIndex(),
        entity.getIcon(),
        entity.isVisible());
  }
}
