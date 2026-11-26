package com.habitparty.adapters.out.persistence;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.RefreshTokenJpaEntity;
import com.habitparty.adapters.out.persistence.mappers.RefreshTokenMapper;
import com.habitparty.adapters.out.persistence.repository.RefreshTokenJpaRepository;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.core.domain.entities.RefreshToken;
import com.habitparty.core.domain.entities.UserToken;

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
    RefreshTokenJpaEntity entity = repository.findById(refreshToken.getId())
        .map(existing -> {
          mapper.updateEntityFromDomain(existing, refreshToken);
          return existing;
        })
        .orElseGet(() -> mapper.toEntity(refreshToken));
    RefreshTokenJpaEntity savedEntity = repository.save(entity);
    return mapper.toDomain(savedEntity);
  }

  @Override
  public Optional<RefreshToken> findByToken(String token) {
    if (token == null || token.isBlank()) {
      return Optional.empty();
    }
    String hashed = UserToken.hashToken(token);
    // Busca primeiro por hash SHA-256; fallback para texto plano garante transição transparente de sessões legadas
    return repository.findByToken(hashed)
        .or(() -> repository.findByToken(token.trim()))
        .map(mapper::toDomain);
  }

  @Override
  public int countActiveByUserId(UUID userId) {
    return repository.countActiveTokensByUserId(userId);
  }

  @Override
  @Transactional
  public void revokeOldestSession(UUID userId) {
    repository.findFirstByUserIdAndRevokedFalseAndExpirationDateAfterOrderByCreatedAtAsc(userId, Instant.now())
        .ifPresent(oldestToken -> {
          oldestToken.setRevoked(true);
          repository.save(oldestToken);
        });
  }

  @Override
  @Transactional
  public void revokeAllByUserId(UUID userId) {
    repository.revokeAllByUserId(userId);
  }

  @Override
  public void deleteObsoleteTokens(Instant now, LocalDateTime revokedCutoff) {
    repository.deleteObsoleteTokens(now, revokedCutoff);
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
  }
}
