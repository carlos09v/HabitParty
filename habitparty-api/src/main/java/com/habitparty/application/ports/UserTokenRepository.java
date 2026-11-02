package com.habitparty.application.ports;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.UserToken;
import com.habitparty.core.domain.enums.UserTokenType;

public interface UserTokenRepository {
  UserToken save(UserToken token);
  Optional<UserToken> findByTokenAndType(String token, UserTokenType tokenType);
  void invalidateActiveTokensByUserIdAndType(UUID userId, UserTokenType tokenType);
  void deleteObsoleteTokens(Instant threshold);
  void deleteAllByUserId(UUID userId);
}
