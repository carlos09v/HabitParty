package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.UserTokenJpaEntity;
import com.habitparty.core.domain.entities.UserToken;

@Component
public class UserTokenMapper {

  public UserTokenJpaEntity toEntity(UserToken domain) {
    return UserTokenJpaEntity.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .tokenType(domain.getTokenType())
        .token(domain.getToken())
        .expirationDate(domain.getExpirationDate())
        .used(domain.isUsed())
        .usedAt(domain.getUsedAt())
        .createdAt(domain.getCreatedAt())
        .build();
  }

  public void updateEntityFromDomain(UserTokenJpaEntity entity, UserToken domain) {
    entity.setTokenType(domain.getTokenType());
    entity.setToken(domain.getToken());
    entity.setExpirationDate(domain.getExpirationDate());
    entity.setUsed(domain.isUsed());
    entity.setUsedAt(domain.getUsedAt());
  }

  public UserToken toDomain(UserTokenJpaEntity entity) {
    return new UserToken(
        entity.getId(),
        entity.getUserId(),
        entity.getTokenType(),
        entity.getToken(),
        entity.getExpirationDate(),
        entity.isUsed(),
        entity.getUsedAt(),
        entity.getCreatedAt());
  }
}
