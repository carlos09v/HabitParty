package com.habitparty.infrastructure.jobs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.habitparty.application.usecases.task.DailyResetUseCase;
import com.habitparty.application.usecases.task.DailyResetUseCase.RolloverSummary;

@Component
public class DailyResetJob {

  private static final Logger logger = LoggerFactory.getLogger(DailyResetJob.class);

  private final DailyResetUseCase dailyResetUseCase;

  public DailyResetJob(DailyResetUseCase dailyResetUseCase) {
    this.dailyResetUseCase = dailyResetUseCase;
  }

  // Recupera no startup os ciclos diários pendentes (mesma lógica idempotente da Opção A)
  @EventListener(ApplicationReadyEvent.class)
  public void catchUpOverdueDailyRolloverOnStartup() {
    executeAndLog("Startup");
  }

  // Roda a cada 15 minutos em UTC para cobrir fusos horários inteiros e fracionários (:00, :15, :30, :45)
  @Scheduled(cron = "0 */15 * * * *", zone = "UTC")
  public void runDailyReset() {
    executeAndLog("Agendador UTC");
  }

  private void executeAndLog(String triggerSource) {
    try {
      RolloverSummary summary = dailyResetUseCase.executeDailyRolloverSummary();
      if (summary.processedUsers() > 0) {
        logger.info(
            "[{}] Virada diária executada para {} usuário(s): {} tarefa(s) atualizada(s), {} afazer(es) hardcore vencido(s), {} ofensiva(s) zerada(s).",
            triggerSource,
            summary.processedUsers(),
            summary.updatedTasks(),
            summary.overdueHardcoreTodos(),
            summary.expiredStreaks());
      } else {
        logger.debug("[{}] Nenhum usuário devido para virada diária neste ciclo.", triggerSource);
      }
    } catch (Exception e) {
      logger.error("[{}] Erro durante a execução do reset diário: {}", triggerSource, e.getMessage(), e);
    }
  }
}
