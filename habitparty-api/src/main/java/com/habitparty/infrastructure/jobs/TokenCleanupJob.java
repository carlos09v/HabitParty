package com.habitparty.infrastructure.jobs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.habitparty.application.usecases.auth.CleanObsoleteTokensUseCase;

import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;

@Component
public class TokenCleanupJob {
  private static final Logger logger = LoggerFactory.getLogger(TokenCleanupJob.class);
  private final CleanObsoleteTokensUseCase cleanObsoleteTokensUseCase;

  public TokenCleanupJob(CleanObsoleteTokensUseCase cleanObsoleteTokensUseCase) {
    this.cleanObsoleteTokensUseCase = cleanObsoleteTokensUseCase;
  }

  // Padronizado em UTC (06:00 UTC = 03:00 BRT) com lock distribuído
  @Scheduled(cron = "0 0 6 * * *", zone = "UTC")
  @SchedulerLock(name = "tokenCleanupJob", lockAtMostFor = "PT30M", lockAtLeastFor = "PT1M")
  public void cleanObsoleteTokens() {
    logger.info("[TokenCleanupJob] Iniciando varredura de limpeza de tokens obsoletos...");
    try {
      boolean allSucceeded = cleanObsoleteTokensUseCase.execute();
      if (allSucceeded) {
        logger.info("[TokenCleanupJob] Varredura de tokens finalizada com sucesso.");
      } else {
        logger.warn("[TokenCleanupJob] Varredura de tokens finalizada com falhas parciais (verifique os logs acima).");
      }
    } catch (Exception e) {
      logger.error("[TokenCleanupJob] Falha inesperada na varredura de limpeza de tokens: {}", e.getMessage(), e);
    }
  }
}
