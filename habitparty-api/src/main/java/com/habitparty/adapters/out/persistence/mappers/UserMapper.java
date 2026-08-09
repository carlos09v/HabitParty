package com.habitparty.adapters.out.persistence.mappers;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.UserJpaEntity;
import com.habitparty.core.domain.entities.User;

// Tradutor
@Component
public class UserMapper {
  // 1. Traduz do Domínio para o Banco (Para salvar)
  public UserJpaEntity toEntity(User domain) {
    UserJpaEntity entity = new UserJpaEntity();
    entity.setId(domain.getId());
    entity.setFullName(domain.getFullName());
    entity.setEmail(domain.getEmail());
    entity.setUsername(domain.getUsername());
    entity.setPassword(domain.getPassword());
    entity.setCurrentCoins(domain.getCurrentCoins());
    entity.setTotalGoldEarned(domain.getTotalGoldEarned());
    entity.setGender(domain.getGender());
    entity.setBirthday(domain.getBirthday());
    entity.setProfilePhotoUrl(domain.getProfilePhotoUrl().orElse(null)); // Se não tiver, é null
    entity.setTotalXp(domain.getTotalXp());
    entity.setCurrentStreak(domain.getCurrentStreak());
    entity.setHighestStreak(domain.getHighestStreak());
    entity.setCreatedAt(domain.getCreatedAt());

    return entity;
  }

  // 2. Traduz do Banco para o Domínio (Para buscar e devolver ao Caso de Uso)
  public User toDomain(UserJpaEntity entity) {
    // Obs: A ordem importa, precisa ser igual ao definido no Dominio.
    return new User(
        entity.getId(),
        entity.getFullName(),
        entity.getUsername(),
        entity.getEmail(),
        entity.getPassword(),
        entity.getCurrentCoins(),
        entity.getTotalGoldEarned(),
        entity.getBirthday(),
        entity.getProfilePhotoUrl(),
        entity.getGender(),
        entity.getTotalXp(),
        entity.getCurrentStreak(),
        entity.getHighestStreak(),
        entity.getCreatedAt());
  }
}
