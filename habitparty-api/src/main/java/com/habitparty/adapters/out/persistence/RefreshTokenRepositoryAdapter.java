package com.habitparty.adapters.out.persistence;

import java.util.Optional;

import org.springframework.stereotype.Component;

import com.habitparty.adapters.out.persistence.mappers.RefreshTokenMapper;
import com.habitparty.adapters.out.persistence.repository.RefreshTokenJpaRepository;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.core.domain.entities.RefreshToken;

@Component
public class RefreshTokenRepositoryAdapter implements RefreshTokenRepository {
  private final RefreshTokenJpaRepository repository;
  private final RefreshTokenMapper mapper;

  public RefreshTokenRepositoryAdapter(RefreshTokenJpaRepository repository, RefreshTokenMapper mapper) {
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
}
