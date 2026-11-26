package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.RefreshTokenJpaEntity;
import com.habitparty.core.domain.entities.RefreshToken;

@Component
public class RefreshTokenMapper {

  public RefreshTokenJpaEntity toEntity(RefreshToken domain) {
    return RefreshTokenJpaEntity.builder()
        .id(domain.getId())
        .userId(domain.getUserId())
        .token(domain.getToken())
        .expirationDate(domain.getExpirationDate())
        .revoked(domain.isRevoked())
        .build();
  }

  public void updateEntityFromDomain(RefreshTokenJpaEntity entity, RefreshToken domain) {
    entity.setToken(domain.getToken());
    entity.setExpirationDate(domain.getExpirationDate());
    entity.setRevoked(domain.isRevoked());
  }

  public RefreshToken toDomain(RefreshTokenJpaEntity entity) {
    return new RefreshToken(
        entity.getId(),
        entity.getUserId(),
        entity.getToken(),
        entity.getExpirationDate(),
        entity.isRevoked());
  }
}
