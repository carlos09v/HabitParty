package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.PasswordResetTokenJpaEntity;
import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.core.domain.entities.PasswordResetToken;

@Component
public class PasswordResetTokenMapper {
  public PasswordResetTokenJpaEntity toEntity(PasswordResetToken domain) {
    PasswordResetTokenJpaEntity entity = new PasswordResetTokenJpaEntity();
    UserJpaEntity userReference = new UserJpaEntity();
    userReference.setId(domain.getUserId());

    entity.setId(domain.getId());
    entity.setUser(userReference);
    entity.setToken(domain.getToken());
    entity.setExpirationDate(domain.getExpirationDate());
    entity.setUsed(domain.isUsed());

    return entity;
  }

  public PasswordResetToken toDomain(PasswordResetTokenJpaEntity entity) {
    return new PasswordResetToken(
        entity.getId(),
        entity.getUser().getId(),
        entity.getToken(),
        entity.getExpirationDate(),
        entity.isUsed());
  }
}
