package com.habitparty.adapters.out.persistence;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.mappers.RefreshTokenMapper;
import com.habitparty.adapters.out.persistence.repository.RefreshTokenJpaRepository;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.core.domain.entities.RefreshToken;

@Component
public class RefreshTokenAdapter implements RefreshTokenRepository {
  private final RefreshTokenJpaRepository repository;
  private final RefreshTokenMapper mapper;

  public RefreshTokenAdapter(RefreshTokenJpaRepository repository, RefreshTokenMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  public RefreshToken save(RefreshToken refreshToken) {
    var entity = mapper.toEntity(refreshToken);
    var savedEntity = repository.save(entity);
    return mapper.toDomain(savedEntity);
  }

  @Override
  public Optional<RefreshToken> findByToken(String token) {
    return repository.findByToken(token)
        .map(mapper::toDomain);
  }

  @Override
  public int countActiveByUserId(UUID userId) {
    return repository.countActiveTokensByUserId(userId);
  }

  @Override
  public void revokeOldestSession(UUID userId) {
    repository.findFirstByUser_IdAndRevokedFalseOrderByCreatedAtAsc(userId)
        .ifPresent(oldestToken -> {
          oldestToken.setRevoked(true);
          repository.save(oldestToken);
        });
  }

  @Override
public void deleteObsoleteTokens(LocalDateTime dataLimite) {
    repository.deleteObsoleteTokens(dataLimite);
}
}
