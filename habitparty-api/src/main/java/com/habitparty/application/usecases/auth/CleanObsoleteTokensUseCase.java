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
    this(refreshTokenRepository, userTokenRepository, Clock.systemDefaultZone());
  }

  @Autowired
  public CleanObsoleteTokensUseCase(
      RefreshTokenRepository refreshTokenRepository,
      UserTokenRepository userTokenRepository,
      Clock clock) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.userTokenRepository = userTokenRepository;
    this.clock = clock;
  }

  public void execute() {
    Instant now = Instant.now(clock);
    // Retenção de 1 mês para sessões revogadas
    LocalDateTime retentionLimit = LocalDateTime.now(clock).minusMonths(1);

    try {
      refreshTokenRepository.deleteObsoleteTokens(now, retentionLimit);
    } catch (Exception e) {
      logger.error("Erro ao limpar refresh tokens obsoletos", e);
    }

    try {
      userTokenRepository.deleteObsoleteTokens(now);
    } catch (Exception e) {
      logger.error("Erro ao limpar user tokens (verificação e redefinição de senha) obsoletos", e);
    }
  }
}
