package com.habitparty.application.usecases.task;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.EmailSenderPort;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.EmailDispatchLog;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.EmailType;

@Service
public class SendTaskRemindersUseCase {
  private static final Logger log = LoggerFactory.getLogger(SendTaskRemindersUseCase.class);

  private final TaskRepository taskPort;
  private final UserRepository userPort;
  private final EmailSenderPort emailPort;
  private final EmailDispatchLogRepository emailLogPort;

  public SendTaskRemindersUseCase(
      TaskRepository taskPort,
      UserRepository userPort,
      EmailSenderPort emailPort,
      EmailDispatchLogRepository emailLogPort) {
    this.taskPort = taskPort;
    this.userPort = userPort;
    this.emailPort = emailPort;
    this.emailLogPort = emailLogPort;
  }

  @Transactional
  public int execute() {
    LocalDateTime now = LocalDateTime.now();
    LocalDate today = LocalDate.now();

    List<Task> pendingReminders = taskPort.findPendingEmailReminders(now, today);
    if (pendingReminders.isEmpty()) {
      return 0;
    }

    int sentCount = 0;

    for (Task task : pendingReminders) {
      if (task instanceof Todo todo && todo.isSendEmailReminder() && !todo.isEmailReminderSent()) {
        try {
          var userOpt = userPort.findById(todo.getUserId());
          if (userOpt.isPresent()) {
            var user = userOpt.get();
            boolean isPremium = user.isPremium();
            int maxMonthly = com.habitparty.core.domain.entities.task.EmailReminderQuotas.getMaxMonthlyDispatches(isPremium);

            LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            long sentThisMonth = emailLogPort.countByUserIdAndEmailTypeAndStatusAndSentAtAfter(
                user.getId(), EmailType.TASK_REMINDER, EmailDispatchStatus.SENT, startOfMonth
            );
            if (sentThisMonth >= maxMonthly) {
              String planName = isPremium ? "Premium (Uso Justo)" : "Free";
              log.warn("Usuário {} atingiu a cota mensal de {} e-mails de lembrete (plano {}). Lembrete pulado.",
                  user.getId(), maxMonthly, planName);
              todo.markEmailReminderSent();
              taskPort.save(todo);
              emailLogPort.save(new EmailDispatchLog(
                  UUID.randomUUID(),
                  user.getId(),
                  todo.getId(),
                  EmailType.TASK_REMINDER,
                  user.getEmail(),
                  "Lembrete de Tarefa: " + todo.getName(),
                  EmailDispatchStatus.FAILED,
                  "Cota mensal de " + maxMonthly + " lembretes excedida para o plano " + planName,
                  LocalDateTime.now()
              ));
              continue;
            }

            String userName = user.getFullName() != null && !user.getFullName().isBlank()
                ? user.getFullName()
                : user.getUsername();
            LocalDate dueDate = todo.getDueDate().orElse(null);

            boolean success = emailPort.sendTaskReminderEmail(
                user.getEmail(),
                userName,
                todo.getName(),
                dueDate,
                todo.isHardcoreModeEnabled()
            );

            if (success) {
              todo.markEmailReminderSent();
              taskPort.save(todo);
              sentCount++;

              emailLogPort.save(new EmailDispatchLog(
                  UUID.randomUUID(),
                  user.getId(),
                  todo.getId(),
                  EmailType.TASK_REMINDER,
                  user.getEmail(),
                  "Lembrete de Tarefa: " + todo.getName(),
                  EmailDispatchStatus.SENT,
                  null,
                  LocalDateTime.now()
              ));
            } else {
              emailLogPort.save(new EmailDispatchLog(
                  UUID.randomUUID(),
                  user.getId(),
                  todo.getId(),
                  EmailType.TASK_REMINDER,
                  user.getEmail(),
                  "Lembrete de Tarefa: " + todo.getName(),
                  EmailDispatchStatus.FAILED,
                  "Falha no provedor Resend",
                  LocalDateTime.now()
              ));
            }
          }
        } catch (Exception e) {
          log.error("Erro ao processar lembrete por e-mail para a tarefa ID {}: {}", todo.getId(), e.getMessage(), e);
          try {
            emailLogPort.save(new EmailDispatchLog(
                UUID.randomUUID(),
                todo.getUserId(),
                todo.getId(),
                EmailType.TASK_REMINDER,
                "desconhecido",
                "Lembrete de Tarefa: " + todo.getName(),
                EmailDispatchStatus.FAILED,
                e.getMessage(),
                LocalDateTime.now()
            ));
          } catch (Exception ignored) {
          }
        }
      }
    }

    return sentCount;
  }
}
