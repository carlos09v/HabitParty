package com.habitparty.adapters.out.persistence;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.mappers.PasswordResetTokenMapper;
import com.habitparty.adapters.out.persistence.repository.PasswordResetTokenJpaRepository;
import com.habitparty.application.ports.PasswordResetTokenRepository;
import com.habitparty.core.domain.entities.PasswordResetToken;

@Component
public class PasswordResetTokenAdapter implements PasswordResetTokenRepository {
  private final PasswordResetTokenJpaRepository repository;
  private final PasswordResetTokenMapper mapper;

  public PasswordResetTokenAdapter(PasswordResetTokenJpaRepository repository, PasswordResetTokenMapper mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  @Override
  public PasswordResetToken save(PasswordResetToken token) {
    var entity = mapper.toEntity(token);
    var saved = repository.save(entity);
    return mapper.toDomain(saved);
  }

  @Override
  public Optional<PasswordResetToken> findByToken(String token) {
    return repository.findByToken(token).map(mapper::toDomain);
  }

  @Override
  public void invalidateActiveTokensByUserId(UUID userId) {
    repository.invalidateActiveTokensByUserId(userId);
  }

  @Override
  public void deleteObsoleteTokens(java.time.Instant threshold) {
    repository.deleteObsoleteTokens(threshold);
  }

  @Override
  public void deleteAllByUserId(UUID userId) {
    repository.deleteAllByUserId(userId);
  }
}
