package com.habitparty.application.usecases.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.TokenPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.AuthTokens;
import com.habitparty.core.domain.entities.RefreshToken;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.DomainValidationException;

@Service
@Transactional
public class SignInUseCase {
  private final UserRepository userRepository;
  private final PasswordHasherPort passwordHasher;
  private final TokenPort tokenPort;
  private final RefreshTokenRepository refreshTokenRepository;

  public SignInUseCase(UserRepository userRepository, PasswordHasherPort passwordHasher, TokenPort tokenPort,
      RefreshTokenRepository refreshTokenRepository) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenPort = tokenPort;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  private static final int MAX_ACTIVE_SESSIONS = 3;

  public AuthTokens execute(String email, String rawPassword) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new DomainValidationException("E-mail ou senha incorretos."));

    if (!passwordHasher.matches(rawPassword, user.getPassword())) {
      throw new DomainValidationException("E-mail ou senha incorretos.");
    }

    int activeSessions = refreshTokenRepository.countActiveByUserId(user.getId());
    if (activeSessions >= MAX_ACTIVE_SESSIONS) {
      refreshTokenRepository.revokeOldestSession(user.getId());
    }

    String accessToken = tokenPort.generateToken(user);

    RefreshToken refreshToken = new RefreshToken(
        UUID.randomUUID(),
        user.getId(),
        UUID.randomUUID().toString(),
        Instant.now().plus(7, ChronoUnit.DAYS),
        false
    );

    refreshTokenRepository.save(refreshToken);

    return new AuthTokens(accessToken, refreshToken.getToken());
  }
}
