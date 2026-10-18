package com.habitparty.infrastructure.jobs;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.habitparty.application.usecases.task.SendTaskRemindersUseCase;

@Component
public class TaskReminderJob {
  private static final Logger logger = LoggerFactory.getLogger(TaskReminderJob.class);
  private final SendTaskRemindersUseCase sendTaskRemindersUseCase;

  public TaskReminderJob(SendTaskRemindersUseCase sendTaskRemindersUseCase) {
    this.sendTaskRemindersUseCase = sendTaskRemindersUseCase;
  }

  // Roda a cada 15 minutos checando lembretes pendentes
  @Scheduled(cron = "0 */15 * * * *", zone = "${app.timezone:America/Sao_Paulo}")
  public void runTaskReminders() {
    try {
      int sentCount = sendTaskRemindersUseCase.execute();
      if (sentCount > 0) {
        logger.info("[TaskReminderJob] {} lembrete(s) de tarefa(s) enviado(s) com sucesso via e-mail.", sentCount);
      }
    } catch (Exception e) {
      logger.error("[TaskReminderJob] Erro durante o disparo de lembretes de tarefas: {}", e.getMessage(), e);
    }
  }
}
