package com.habitparty.application.usecases.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.TokenPort;
import com.habitparty.core.domain.entities.AuthTokens;
import com.habitparty.core.domain.entities.RefreshToken;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserToken;

public final class AuthSessionIssuer {
  public static final int MAX_ACTIVE_SESSIONS = 3;
  public static final int REFRESH_TOKEN_TTL_DAYS = 7;

  private AuthSessionIssuer() {}

  public static AuthTokens issueSession(
      User user,
      TokenPort tokenPort,
      RefreshTokenRepository refreshTokenRepository) {
    int activeSessions = refreshTokenRepository.countActiveByUserId(user.getId());
    if (activeSessions >= MAX_ACTIVE_SESSIONS) {
      int excess = activeSessions - MAX_ACTIVE_SESSIONS + 1;
      for (int i = 0; i < excess; i++) {
        refreshTokenRepository.revokeOldestSession(user.getId());
      }
    }

    String accessToken = tokenPort.generateToken(user);
    String rawRefreshToken = UUID.randomUUID().toString();
    String hashedRefreshToken = UserToken.hashToken(rawRefreshToken);

    RefreshToken refreshToken = new RefreshToken(
        UUID.randomUUID(),
        user.getId(),
        hashedRefreshToken,
        Instant.now().plus(REFRESH_TOKEN_TTL_DAYS, ChronoUnit.DAYS),
        false
    );

    refreshTokenRepository.save(refreshToken);

    return new AuthTokens(accessToken, rawRefreshToken);
  }
}
