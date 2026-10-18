package com.habitparty.application.usecases.auth;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.core.exceptions.DomainValidationException;

@Service
@Transactional
public class LogoutUseCase {
  private final RefreshTokenRepository refreshTokenRepository;

  public LogoutUseCase(RefreshTokenRepository refreshTokenRepository) {
    this.refreshTokenRepository = refreshTokenRepository;
  }

  public void execute(String refreshToken, UUID userIdLogado) {
    refreshTokenRepository.findByToken(refreshToken).ifPresent(tokenDomain -> {
      if (!tokenDomain.getUserId().equals(userIdLogado)) {
        throw new DomainValidationException("Você não tem permissão para revogar este token.");
      }
      tokenDomain.revoke(); 
      refreshTokenRepository.save(tokenDomain);
    });
  }
}
