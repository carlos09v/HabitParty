package com.habitparty.infrastructure.jobs;

import java.time.Instant;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;

import com.habitparty.application.ports.PasswordResetTokenRepository;
import com.habitparty.application.ports.RefreshTokenRepository;

import org.springframework.stereotype.Component;

@Component
public class TokenCleanupJob {
  private static final Logger logger = LoggerFactory.getLogger(TokenCleanupJob.class);
  private final RefreshTokenRepository tokenRepository;
  private final PasswordResetTokenRepository passwordResetTokenRepository;

  public TokenCleanupJob(RefreshTokenRepository tokenRepository, PasswordResetTokenRepository passwordResetTokenRepository) {
    this.tokenRepository = tokenRepository;
    this.passwordResetTokenRepository = passwordResetTokenRepository;
  }

  // Padrão Cron: Segundo, Minuto, Hora, Dia, Mês, Dia da Semana
  // "0 0 3 * * *" = Roda todos os dias, exatamente às 03:00 da manhã
  @Scheduled(cron = "0 0 3 * * *", zone = "${app.timezone:America/Sao_Paulo}")
  public void cleanObsoleteTokens() {
    logger.info("Iniciando varredura de limpeza de tokens obsoletos...");

    Instant now = Instant.now();
    // Calcula exatamente o dia e horário de 1 mês atrás para retenção de sessões revogadas
    LocalDateTime umMesAtras = LocalDateTime.now().minusMonths(1);

    try {
      tokenRepository.deleteObsoleteTokens(now, umMesAtras);
    } catch (Exception e) {
      logger.error("Erro ao limpar refresh tokens obsoletos", e);
    }

    try {
      passwordResetTokenRepository.deleteObsoleteTokens(now);
    } catch (Exception e) {
      logger.error("Erro ao limpar tokens de redefinição de senha obsoletos", e);
    }

    logger.info("Varredura de tokens finalizada com sucesso!");
  }
}
