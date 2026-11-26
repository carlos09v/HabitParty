package com.habitparty.application.usecases.auth;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.TokenPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.AuthTokens;
import com.habitparty.core.domain.entities.RefreshToken;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserToken;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class RefreshTokenUseCase {
  private final RefreshTokenRepository refreshTokenRepository;
  private final UserRepository userRepository;
  private final TokenPort tokenPort;

  public RefreshTokenUseCase(RefreshTokenRepository refreshTokenRepository, UserRepository userRepository,
      TokenPort tokenPort) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.userRepository = userRepository;
    this.tokenPort = tokenPort;
  }

  @Transactional
  public AuthTokens execute(String rawRefreshToken) {
    RefreshToken tokenDomain = refreshTokenRepository.findByToken(rawRefreshToken)
        .orElseThrow(() -> new DomainValidationException("Refresh Token inválido ou não encontrado."));

    if (!tokenDomain.isValid()) {
      throw new DomainValidationException("Refresh Token expirado ou revogado. Faça login novamente.");
    }

    User user = userRepository.findById(tokenDomain.getUserId())
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    // Rotação de Refresh Token: revoga o token antigo e emite um novo token hasheado em SHA-256
    tokenDomain.revoke();
    refreshTokenRepository.save(tokenDomain);

    String newAccessToken = tokenPort.generateToken(user);
    String newRawRefreshToken = UUID.randomUUID().toString();
    RefreshToken rotatedToken = new RefreshToken(
        UUID.randomUUID(),
        user.getId(),
        UserToken.hashToken(newRawRefreshToken),
        Instant.now().plus(AuthSessionIssuer.REFRESH_TOKEN_TTL_DAYS, ChronoUnit.DAYS),
        false
    );
    refreshTokenRepository.save(rotatedToken);

    return new AuthTokens(newAccessToken, newRawRefreshToken);
  }
}
