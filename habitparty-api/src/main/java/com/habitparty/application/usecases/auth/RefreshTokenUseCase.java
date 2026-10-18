package com.habitparty.application.usecases.auth;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.TokenPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.AuthTokens;
import com.habitparty.core.domain.entities.RefreshToken;
import com.habitparty.core.domain.entities.User;
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

  public AuthTokens execute(String rawRefreshToken) {
    RefreshToken tokenDomain = refreshTokenRepository.findByToken(rawRefreshToken)
        .orElseThrow(() -> new DomainValidationException("Refresh Token inválido ou não encontrado."));

    if (!tokenDomain.isValid()) {
      throw new DomainValidationException("Refresh Token expirado ou revogado. Faça login novamente.");
    }

    User user = userRepository.findById(tokenDomain.getUserId())
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

    String newAccessToken = tokenPort.generateToken(user);

    return new AuthTokens(newAccessToken, tokenDomain.getToken());
  }
}
