package com.habitparty.application.ports;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.RefreshToken;

public interface RefreshTokenRepository {
  RefreshToken save(RefreshToken refreshToken);
  Optional<RefreshToken> findByToken(String token);
  int countActiveByUserId(UUID userId); // Limitar sessões
  void revokeOldestSession(UUID userId); // Revogar a primeira sessão
  void deleteObsoleteTokens(LocalDateTime dataLimite); // Apagar os campos obsoletos no db
}
