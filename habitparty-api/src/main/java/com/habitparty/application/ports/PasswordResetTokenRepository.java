package com.habitparty.application.ports;

import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.PasswordResetToken;

public interface PasswordResetTokenRepository {
  PasswordResetToken save(PasswordResetToken token);
  Optional<PasswordResetToken> findByToken(String token);
  void invalidateActiveTokensByUserId(UUID userId);
  void deleteObsoleteTokens(java.time.Instant threshold);
}
