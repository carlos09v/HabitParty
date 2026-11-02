package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.adapters.out.persistence.entities.UserTokenJpaEntity;
import com.habitparty.core.domain.entities.UserToken;

@Component
public class UserTokenMapper {

  public UserTokenJpaEntity toEntity(UserToken domain) {
    UserJpaEntity userReference = new UserJpaEntity();
    userReference.setId(domain.getUserId());

    UserTokenJpaEntity entity = new UserTokenJpaEntity();
    entity.setId(domain.getId());
    entity.setUser(userReference);
    entity.setTokenType(domain.getTokenType());
    entity.setToken(domain.getToken());
    entity.setExpirationDate(domain.getExpirationDate());
    entity.setUsed(domain.isUsed());
    entity.setUsedAt(domain.getUsedAt());
    entity.setCreatedAt(domain.getCreatedAt());
    return entity;
  }

  public UserToken toDomain(UserTokenJpaEntity entity) {
    return new UserToken(
        entity.getId(),
        entity.getUser().getId(),
        entity.getTokenType(),
        entity.getToken(),
        entity.getExpirationDate(),
        entity.isUsed(),
        entity.getUsedAt(),
        entity.getCreatedAt()
    );
  }
}
