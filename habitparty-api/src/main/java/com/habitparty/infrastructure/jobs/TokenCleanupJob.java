package com.habitparty.infrastructure.jobs;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;

import com.habitparty.application.ports.RefreshTokenRepository;

public class TokenCleanupJob {
  private static final Logger logger = LoggerFactory.getLogger(TokenCleanupJob.class);
  private final RefreshTokenRepository tokenRepository;

  public TokenCleanupJob(RefreshTokenRepository tokenRepository) {
    this.tokenRepository = tokenRepository;
  }

  // Padrão Cron: Segundo, Minuto, Hora, Dia, Mês, Dia da Semana
  // "0 0 3 * * *" = Roda todos os dias, exatamente às 03:00 da manhã
  @Scheduled(cron = "0 0 3 * * *")
  public void cleanObsoleteTokens() {
    logger.info("Iniciando varredura de limpeza de tokens obsoletos...");

    // Calcula exatamente o dia e horário de 1 mês atrás
    LocalDateTime umMesAtras = LocalDateTime.now().minusMonths(1);
    
    tokenRepository.deleteObsoleteTokens(umMesAtras);

    logger.info("Varredura de tokens finalizada com sucesso!");
  }
}
