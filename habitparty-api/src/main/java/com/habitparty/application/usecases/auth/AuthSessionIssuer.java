package com.habitparty.application.usecases.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.TokenPort;
import com.habitparty.core.domain.entities.AuthTokens;
import com.habitparty.core.domain.entities.RefreshToken;
import com.habitparty.core.domain.entities.User;

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
      refreshTokenRepository.revokeOldestSession(user.getId());
    }

    String accessToken = tokenPort.generateToken(user);

    RefreshToken refreshToken = new RefreshToken(
        UUID.randomUUID(),
        user.getId(),
        UUID.randomUUID().toString(),
        Instant.now().plus(REFRESH_TOKEN_TTL_DAYS, ChronoUnit.DAYS),
        false
    );

    refreshTokenRepository.save(refreshToken);

    return new AuthTokens(accessToken, refreshToken.getToken());
  }
}
