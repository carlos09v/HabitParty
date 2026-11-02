package com.habitparty.infrastructure.jobs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.habitparty.application.usecases.auth.CleanObsoleteTokensUseCase;

@Component
public class TokenCleanupJob {
  private static final Logger logger = LoggerFactory.getLogger(TokenCleanupJob.class);
  private final CleanObsoleteTokensUseCase cleanObsoleteTokensUseCase;

  public TokenCleanupJob(CleanObsoleteTokensUseCase cleanObsoleteTokensUseCase) {
    this.cleanObsoleteTokensUseCase = cleanObsoleteTokensUseCase;
  }

  // Padrão Cron: Segundo, Minuto, Hora, Dia, Mês, Dia da Semana
  // "0 0 3 * * *" = Roda todos os dias, exatamente às 03:00 da manhã
  @Scheduled(cron = "0 0 3 * * *", zone = "${app.timezone:America/Sao_Paulo}")
  public void cleanObsoleteTokens() {
    logger.info("Iniciando varredura de limpeza de tokens obsoletos...");
    cleanObsoleteTokensUseCase.execute();
    logger.info("Varredura de tokens finalizada com sucesso!");
  }
}
