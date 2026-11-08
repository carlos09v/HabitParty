package com.habitparty.infrastructure.jobs;

import java.time.Clock;
import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.habitparty.application.usecases.task.DailyResetUseCase;

@Component
public class DailyResetJob {
  private static final Logger logger = LoggerFactory.getLogger(DailyResetJob.class);
  private final DailyResetUseCase dailyResetUseCase;
  private final Clock clock;

  public DailyResetJob(DailyResetUseCase dailyResetUseCase, Clock clock) {
    this.dailyResetUseCase = dailyResetUseCase;
    this.clock = clock;
  }

  // Roda na inicialização do servidor para recuperar afazeres hardcore vencidos e streaks expirados caso a aplicação estivesse offline à meia-noite
  @EventListener(ApplicationReadyEvent.class)
  public void catchUpOverdueHardcoreTodosOnStartup() {
    try {
      LocalDate today = LocalDate.now(clock);
      // Usa o relógio no fuso de negócio (evita penalizar antes da hora quando a JVM está em UTC)
      int processedCount = dailyResetUseCase.processOverdueHardcoreTodos(today);
      if (processedCount > 0) {
        logger.info("[Startup] {} afazer(es) hardcore vencido(s) processado(s) com aplicação de penalidade.", processedCount);
      }
      int expiredStreaks = dailyResetUseCase.resetInactiveUserStreaks(today);
      if (expiredStreaks > 0) {
        logger.info("[Startup] {} ofensiva(s) de usuário(s) inativo(s) zerada(s).", expiredStreaks);
      }
    } catch (Exception e) {
      logger.error("[Startup] Erro ao processar rotina de recuperação no startup: {}", e.getMessage(), e);
    }
  }

  // Roda todo dia exatamente à meia-noite (00:00:00) no fuso configurado
  @Scheduled(cron = "0 0 0 * * *", zone = "${app.timezone:America/Sao_Paulo}")
  public void runDailyReset() {
    logger.info("Iniciando rotina de reset diário de tarefas e hábitos...");
    try {
      dailyResetUseCase.executeDailyRollover();
      int expiredStreaks = dailyResetUseCase.resetInactiveUserStreaks(LocalDate.now(clock));
      logger.info("Rotina de reset diário concluída com sucesso! ({} ofensiva(s) de usuários zerada(s))", expiredStreaks);
    } catch (Exception e) {
      logger.error("Erro durante a execução do reset diário: {}", e.getMessage(), e);
    }
  }
}
