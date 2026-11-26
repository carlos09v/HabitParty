package com.habitparty.application.usecases.task;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.UUID;

import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.usecases.common.UtcDateTimeMapper;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.EmailReminderQuotas;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.EmailDispatchStatus;
import com.habitparty.core.domain.enums.EmailType;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

/**
 * Política compartilhada de agendamento de Eventos e cotas de lembretes por e-mail em {@link Todo},
 * eliminando duplicação entre {@link CreateTaskUseCase} e {@link UpdateTaskUseCase}.
 */
final class TodoSchedulePolicy {
  static final String EVENT_SCHEDULE_PREMIUM_MESSAGE =
      "Agendar afazeres como Evento (com horário de início/término ou dia inteiro) é um recurso exclusivo dos planos Premium.";

  private TodoSchedulePolicy() {
  }

  static boolean isEventSchedule(Boolean isAllDay, LocalTime startTime, LocalTime dueEndTime) {
    return Boolean.TRUE.equals(isAllDay) || startTime != null || dueEndTime != null;
  }

  static void assertEventScheduleAllowed(User user, boolean isEventSchedule) {
    if (!isEventSchedule) {
      return;
    }
    if (user == null) {
      throw new ResourceNotFoundException("Usuário não encontrado.");
    }
    if (!user.isPremium()) {
      throw new LimitExceededException(EVENT_SCHEDULE_PREMIUM_MESSAGE);
    }
  }

  static LocalDate resolveEffectiveDueDate(
      LocalDate requestedDueDate,
      LocalTime dueTime,
      boolean isEventSchedule,
      LocalDate userToday) {
    if (requestedDueDate != null) {
      return requestedDueDate;
    }
    return (dueTime != null || isEventSchedule) ? userToday : null;
  }

  static void validateEmailReminderQuotas(
      User user,
      UUID userId,
      LocalDate userToday,
      ZoneId userZone,
      TaskRepository taskPort,
      EmailDispatchLogRepository emailLogPort) {
    if (user == null) {
      throw new ResourceNotFoundException("Usuário não encontrado.");
    }
    user.validateEmailVerified("ativar lembretes por e-mail");

    boolean isPremium = user.isPremium();
    long activeReminders = taskPort.countActiveEmailRemindersByUserId(userId);
    EmailReminderQuotas.validateActiveRemindersQuota(isPremium, activeReminders);

    LocalDateTime startOfMonth = UtcDateTimeMapper.startOfMonthInServerZone(userToday, userZone);
    long sentThisMonth = emailLogPort.countByUserIdAndEmailTypeAndStatusAndSentAtAfter(
        userId,
        EmailType.TASK_REMINDER,
        EmailDispatchStatus.SENT,
        startOfMonth);
    EmailReminderQuotas.validateMonthlyDispatchesQuota(isPremium, sentThisMonth);
  }

  static void applyEventSchedule(
      Todo todo,
      LocalTime startTime,
      LocalTime dueEndTime,
      Boolean isAllDay,
      LocalDate userToday,
      boolean clearEventWhenUnset) {
    if (Boolean.TRUE.equals(isAllDay) || startTime != null) {
      todo.defineEventSchedule(startTime, dueEndTime, isAllDay, userToday);
    } else {
      if (clearEventWhenUnset) {
        todo.defineEventSchedule(null, null, false, userToday);
      }
      todo.defineDueEndTime(dueEndTime);
    }
  }
}
