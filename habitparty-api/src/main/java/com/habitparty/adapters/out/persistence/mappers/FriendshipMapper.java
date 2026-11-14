package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.FriendshipJpaEntity;
import com.habitparty.core.domain.entities.social.Friendship;

@Component
public class FriendshipMapper {

  public Friendship toDomain(FriendshipJpaEntity entity) {
    if (entity == null) {
      return null;
    }
    return new Friendship(
        entity.getId(),
        entity.getRequesterId(),
        entity.getAddresseeId(),
        entity.getStatus(),
        entity.getCreatedAt(),
        entity.getRespondedAt());
  }

  public FriendshipJpaEntity toEntity(Friendship domain) {
    if (domain == null) {
      return null;
    }
    FriendshipJpaEntity entity = new FriendshipJpaEntity();
    entity.setId(domain.getId());
    entity.setRequesterId(domain.getRequesterId());
    entity.setAddresseeId(domain.getAddresseeId());
    entity.setStatus(domain.getStatus());
    entity.setCreatedAt(domain.getCreatedAt());
    entity.setRespondedAt(domain.getRespondedAt());
    return entity;
  }
}
