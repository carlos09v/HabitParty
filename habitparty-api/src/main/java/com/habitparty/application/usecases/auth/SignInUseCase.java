package com.habitparty.application.usecases.auth;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.TokenPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.AuthTokens;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.exceptions.DomainValidationException;

@Service
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

  public AuthTokens execute(String email, String rawPassword) {
    String normalizedEmail = email != null ? email.trim().toLowerCase() : "";
    User user = userRepository.findByEmail(normalizedEmail)
        .orElseThrow(() -> new DomainValidationException("E-mail ou senha incorretos."));

    if (!passwordHasher.matches(rawPassword, user.getPassword())) {
      throw new DomainValidationException("E-mail ou senha incorretos.");
    }

    return AuthSessionIssuer.issueSession(user, tokenPort, refreshTokenRepository);
  }
}
