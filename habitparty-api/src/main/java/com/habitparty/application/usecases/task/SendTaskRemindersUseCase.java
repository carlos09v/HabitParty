package com.habitparty.application.usecases.task;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.EmailSenderPort;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.EmailDispatchLog;
import com.habitparty.core.domain.entities.User;
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
  private final Clock clock;

  @Autowired
  public SendTaskRemindersUseCase(
      TaskRepository taskPort,
      UserRepository userPort,
      EmailSenderPort emailPort,
      EmailDispatchLogRepository emailLogPort,
      Clock clock) {
    this.taskPort = taskPort;
    this.userPort = userPort;
    this.emailPort = emailPort;
    this.emailLogPort = emailLogPort;
    this.clock = clock != null ? clock : Clock.systemDefaultZone();
  }

  public SendTaskRemindersUseCase(
      TaskRepository taskPort,
      UserRepository userPort,
      EmailSenderPort emailPort,
      EmailDispatchLogRepository emailLogPort) {
    this(taskPort, userPort, emailPort, emailLogPort, Clock.systemDefaultZone());
  }

  public int execute() {
    Clock effectiveClock = clock != null ? clock : Clock.systemDefaultZone();
    Instant nowInstant = Instant.now(effectiveClock);
    // Consulta ampla no SQL cobrindo todos os fusos horários mundiais (UTC-12 a UTC+14);
    // cada lembrete é validado em seguida no fuso horário exato do seu proprietário.
    LocalDateTime maxWorldNow = LocalDateTime.ofInstant(nowInstant, ZoneOffset.ofHours(14));
    LocalDate minWorldToday = LocalDate.ofInstant(nowInstant, ZoneOffset.ofHours(-12));

    List<Task> pendingReminders = taskPort.findPendingEmailReminders(maxWorldNow, minWorldToday);
    if (pendingReminders.isEmpty()) {
      return 0;
    }

    Set<UUID> userIds = pendingReminders.stream()
        .map(Task::getUserId)
        .collect(Collectors.toSet());
    Map<UUID, User> usersById = new HashMap<>(userPort.findAllByIds(userIds).stream()
        .collect(Collectors.toMap(User::getId, Function.identity())));
    Map<UUID, Long> monthlySentCache = new HashMap<>();
    LocalDateTime logNow = LocalDateTime.now(effectiveClock.withZone(ZoneId.systemDefault()));

    int sentCount = 0;

    for (Task task : pendingReminders) {
      if (task instanceof Todo todo && todo.isSendEmailReminder() && !todo.isEmailReminderSent()) {
        try {
          User user = usersById.get(todo.getUserId());
          if (user == null) {
            user = userPort.findById(todo.getUserId()).orElse(null);
            if (user != null) {
              usersById.put(user.getId(), user);
            }
          }
          if (user != null) {
            ZoneId userZone = user.resolveZoneId(effectiveClock.getZone());
            LocalDate userToday = user.resolveLocalDate(effectiveClock);
            LocalDateTime userNow = user.resolveLocalDateTime(effectiveClock);

            LocalDateTime reminderAt = todo.getReminderAt().orElse(null);
            LocalDate dueDate = todo.getDueDate().orElse(null);
            if (reminderAt == null || reminderAt.isAfter(userNow)
                || (dueDate != null && dueDate.isBefore(userToday))) {
              continue;
            }

            boolean isPremium = user.isPremium();
            int maxMonthly = com.habitparty.core.domain.entities.task.EmailReminderQuotas.getMaxMonthlyDispatches(isPremium);

            UUID uid = user.getId();
            LocalDateTime startOfMonth = userToday.withDayOfMonth(1)
                .atStartOfDay(userZone)
                .withZoneSameInstant(ZoneId.systemDefault())
                .toLocalDateTime();
            long sentThisMonth = monthlySentCache.computeIfAbsent(uid,
                id -> emailLogPort.countByUserIdAndEmailTypeAndStatusAndSentAtAfter(
                    id, EmailType.TASK_REMINDER, EmailDispatchStatus.SENT, startOfMonth
                ));
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
                  logNow
              ));
              continue;
            }

            String userName = user.getFullName() != null && !user.getFullName().isBlank()
                ? user.getFullName()
                : user.getUsername();

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
              monthlySentCache.put(uid, sentThisMonth + 1);

              emailLogPort.save(new EmailDispatchLog(
                  UUID.randomUUID(),
                  user.getId(),
                  todo.getId(),
                  EmailType.TASK_REMINDER,
                  user.getEmail(),
                  "Lembrete de Tarefa: " + todo.getName(),
                  EmailDispatchStatus.SENT,
                  null,
                  logNow
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
                  logNow
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
                logNow
            ));
          } catch (Exception ignored) {
          }
        }
      }
    }

    return sentCount;
  }
}
