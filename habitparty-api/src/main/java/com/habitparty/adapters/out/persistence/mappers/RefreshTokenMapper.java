package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.RefreshTokenJpaEntity;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.core.domain.entities.RefreshToken;

@Component
public class RefreshTokenMapper {
  public RefreshTokenJpaEntity toEntity(RefreshToken domain) {
    RefreshTokenJpaEntity entity = new RefreshTokenJpaEntity();
    // Cria um user vazio apenas para carregar o ID
    UserJpaEntity userReference = new UserJpaEntity();
    userReference.setId(domain.getUserId());

    entity.setId(domain.getId());
    entity.setUser(userReference);
    entity.setToken(domain.getToken());
    entity.setExpirationDate(domain.getExpirationDate());
    entity.setRevoked(domain.isRevoked());

    return entity;
  }

  public RefreshToken toDomain(RefreshTokenJpaEntity entity) {
    return new RefreshToken(
        entity.getId(),
        entity.getUser().getId(), // Extrai apenas o ID do usuário
        entity.getToken(),
        entity.getExpirationDate(),
        entity.isRevoked());
  }

}
