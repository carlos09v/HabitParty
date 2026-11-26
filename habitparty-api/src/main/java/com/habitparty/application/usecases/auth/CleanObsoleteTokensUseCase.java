package com.habitparty.application.usecases.auth;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.UserTokenRepository;

@Service
public class CleanObsoleteTokensUseCase {
  private static final Logger logger = LoggerFactory.getLogger(CleanObsoleteTokensUseCase.class);

  private final RefreshTokenRepository refreshTokenRepository;
  private final UserTokenRepository userTokenRepository;
  private final Clock clock;

  public CleanObsoleteTokensUseCase(
      RefreshTokenRepository refreshTokenRepository,
      UserTokenRepository userTokenRepository) {
    this(refreshTokenRepository, userTokenRepository, Clock.systemUTC());
  }

  @Autowired
  public CleanObsoleteTokensUseCase(
      RefreshTokenRepository refreshTokenRepository,
      UserTokenRepository userTokenRepository,
      Clock clock) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.userTokenRepository = userTokenRepository;
    this.clock = clock != null ? clock : Clock.systemUTC();
  }

  /**
   * Remove refresh tokens e user tokens expirados/obsoletos.
   *
   * @return {@code true} se ambas as limpezas ocorreram sem erro; {@code false} em caso de falha parcial.
   */
  public boolean execute() {
    Instant now = Instant.now(clock);
    // Retenção de 1 mês para sessões revogadas
    LocalDateTime retentionLimit = LocalDateTime.now(clock).minusMonths(1);
    boolean allSucceeded = true;

    try {
      refreshTokenRepository.deleteObsoleteTokens(now, retentionLimit);
    } catch (Exception e) {
      allSucceeded = false;
      logger.error("Erro ao limpar refresh tokens obsoletos", e);
    }

    try {
      userTokenRepository.deleteObsoleteTokens(now);
    } catch (Exception e) {
      allSucceeded = false;
      logger.error("Erro ao limpar user tokens (verificação e redefinição de senha) obsoletos", e);
    }

    return allSucceeded;
  }
}
