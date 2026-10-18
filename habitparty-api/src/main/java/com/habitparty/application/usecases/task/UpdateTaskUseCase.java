package com.habitparty.application.usecases.task;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.EmailType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service 
@Transactional
public class UpdateTaskUseCase {
  private final TaskRepository port;
  private final UserRepository userPort;
  private final EmailDispatchLogRepository emailLogPort;

  public UpdateTaskUseCase(
      TaskRepository port,
      UserRepository userPort,
      EmailDispatchLogRepository emailLogPort) {
    this.port = port;
    this.userPort = userPort;
    this.emailLogPort = emailLogPort;
  }

  public Task execute(UUID taskId, UUID userIdLogado, UpdateTaskCommand command) {
    Task task = port.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
    task.validateOwnership(userIdLogado);

    // Validação específica para Todo no modo Hardcore antes da atualização
    if (task instanceof Todo t) {
      if (command.isHardcoreModeEnabled()) {
        java.time.LocalDate effectiveDueDate = command.dueDate() != null ? command.dueDate() : t.getDueDate().orElse(null);
        if (effectiveDueDate == null) {
          throw new DomainValidationException("Afazeres no modo Hardcore exigem uma data de vencimento.");
        }
        if (!t.isHardcoreModeEnabled() && effectiveDueDate.isBefore(java.time.LocalDate.now())) {
          throw new DomainValidationException("Não é permitido ativar o modo Hardcore com data no passado.");
        }
      }
    }

    // 2. Atualiza os campos comuns
    task.updateBaseDetails(
        command.name(), command.description(), command.priority(), 
        command.difficulty(), command.tags(), command.isHardcoreModeEnabled()
    );

    // 3. Atualiza os campos específicos usando Pattern Matching
    if (task instanceof Habit h) {
      h.updateHabitDetails(command.habitType(), command.resetCounter(), command.importanceType());
    } 
    else if (task instanceof Daily d) {
      int safeRepeat = command.repeatEvery() != null ? command.repeatEvery() : 1;
      d.updateDailyDetails(command.startDate(), command.repeatType(), safeRepeat, 
                           command.daysOfWeek(), command.monthlyOption());
    } 
    else if (task instanceof Todo t) {
      if (Boolean.TRUE.equals(command.sendEmailReminder())) {
        boolean wasAlreadyActive = t.isSendEmailReminder() && !t.isEmailReminderSent();
        if (!wasAlreadyActive) {
          var user = userPort.findById(userIdLogado)
              .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));
          boolean isPremium = user.isPremium();
          int maxActive = com.habitparty.core.domain.entities.task.EmailReminderQuotas.getMaxActiveReminders(isPremium);
          int maxMonthly = com.habitparty.core.domain.entities.task.EmailReminderQuotas.getMaxMonthlyDispatches(isPremium);

          long activeReminders = port.countActiveEmailRemindersByUserId(userIdLogado);
          if (activeReminders >= maxActive) {
            String msg = isPremium
                ? "Limite de lembretes ativos atingido! Usuários Premium podem ter no máximo " + maxActive + " lembretes por e-mail ativos simultaneamente (Política de Uso Justo)."
                : "Limite de lembretes atingido! Usuários do plano gratuito podem ter no máximo " + maxActive + " lembretes por e-mail ativos simultaneamente. Assine o plano Premium para ter até 30 lembretes ativos.";
            throw new DomainValidationException(msg);
          }

          LocalDateTime startOfMonth = java.time.LocalDate.now().withDayOfMonth(1).atStartOfDay();
          long sentThisMonth = emailLogPort.countByUserIdAndEmailTypeAndStatusAndSentAtAfter(
              userIdLogado,
              EmailType.TASK_REMINDER,
              EmailDispatchStatus.SENT,
              startOfMonth
          );
          if (sentThisMonth >= maxMonthly) {
            String msg = isPremium
                ? "Cota mensal atingida! Usuários Premium podem receber no máximo " + maxMonthly + " lembretes por e-mail por mês (Política de Uso Justo)."
                : "Limite mensal atingido! Usuários do plano gratuito podem receber no máximo " + maxMonthly + " lembretes por e-mail por mês. Faça upgrade para o plano Premium para ter até 100 disparos mensais.";
            throw new DomainValidationException(msg);
          }
        }
      }

      LocalDateTime newReminderAt = Todo.calculateReminderTime(
          command.dueDate(), command.reminderType(), command.customReminderAt()
      );
      t.updateTodoDetails(command.dueDate(), command.reminderType(), newReminderAt, command.sendEmailReminder());
    }

    return port.save(task);
  }
}
