package com.habitparty.infrastructure.jobs;

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

  public DailyResetJob(DailyResetUseCase dailyResetUseCase) {
    this.dailyResetUseCase = dailyResetUseCase;
  }

  // Roda na inicialização do servidor para recuperar afazeres hardcore vencidos caso a aplicação estivesse offline à meia-noite
  @EventListener(ApplicationReadyEvent.class)
  public void catchUpOverdueHardcoreTodosOnStartup() {
    try {
      int processedCount = dailyResetUseCase.processOverdueHardcoreTodos(LocalDate.now());
      if (processedCount > 0) {
        logger.info("[Startup] {} afazer(es) hardcore vencido(s) processado(s) com aplicação de penalidade.", processedCount);
      }
    } catch (Exception e) {
      logger.error("[Startup] Erro ao processar afazeres hardcore pendentes no startup: {}", e.getMessage(), e);
    }
  }

  // Roda todo dia exatamente à meia-noite (00:00:00) no fuso configurado
  @Scheduled(cron = "0 0 0 * * *", zone = "${app.timezone:America/Sao_Paulo}")
  public void runDailyReset() {
    logger.info("Iniciando rotina de reset diário de tarefas e hábitos...");
    try {
      dailyResetUseCase.executeDailyRollover();
      logger.info("Rotina de reset diário concluída com sucesso!");
    } catch (Exception e) {
      logger.error("Erro durante a execução do reset diário: {}", e.getMessage(), e);
    }
  }
}
