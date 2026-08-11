package com.habitparty.application.ports;

import java.util.Optional;

import com.habitparty.core.domain.entities.RefreshToken;

public interface RefreshTokenRepository {
  RefreshToken save(RefreshToken refreshToken);
  Optional<RefreshToken> findByToken(String token);
}
