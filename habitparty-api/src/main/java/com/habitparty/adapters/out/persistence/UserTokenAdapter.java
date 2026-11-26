package com.habitparty.adapters.out.persistence;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.entities.UserTokenJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.UserTokenMapper;
import com.habitparty.adapters.out.persistence.repository.UserTokenJpaRepository;
import com.habitparty.application.ports.UserTokenRepository;
import com.habitparty.core.domain.entities.UserToken;
import com.habitparty.core.domain.enums.UserTokenType;

@Component
public class UserTokenAdapter implements UserTokenRepository {
  private final UserTokenJpaRepository repository;
  private final UserTokenMapper mapper;

  public UserTokenAdapter(UserTokenJpaRepository repository, UserTokenMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  public UserToken save(UserToken token) {
    UserTokenJpaEntity entity = repository.findById(token.getId())
        .map(existing -> {
          mapper.updateEntityFromDomain(existing, token);
          return existing;
        })
        .orElseGet(() -> mapper.toEntity(token));
    UserTokenJpaEntity saved = repository.save(entity);
    return mapper.toDomain(saved);
  }

  @Override
  public Optional<UserToken> findByTokenAndType(String token, UserTokenType tokenType) {
    if (token == null || token.isBlank()) {
      return Optional.empty();
    }
    String hashed = UserToken.hashToken(token.trim());
    return repository.findByTokenAndTokenType(hashed, tokenType)
        .or(() -> repository.findByTokenAndTokenType(token.trim(), tokenType))
        .map(mapper::toDomain);
  }

  @Override
  public void invalidateActiveTokensByUserIdAndType(UUID userId, UserTokenType tokenType) {
    repository.invalidateActiveTokensByUserIdAndType(userId, tokenType, Instant.now());
  }

  @Override
  public void deleteObsoleteTokens(Instant threshold) {
    repository.deleteObsoleteTokens(threshold);
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
  }
}
