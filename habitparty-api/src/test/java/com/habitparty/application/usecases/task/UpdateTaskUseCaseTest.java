package com.habitparty.application.usecases.task;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;
import com.habitparty.core.exceptions.DomainValidationException;

class UpdateTaskUseCaseTest {

  private User buildUser(UUID userId, String timezone) {
    User user = new User(
        userId, UserRole.USER, false, "Tester", "tester", "tester@habitparty.com", "pwd",
        BigDecimal.ZERO, BigDecimal.ZERO, LocalDate.of(1995, 1, 1), null,
        UserGender.MALE, 0, 1, 0, LocalDateTime.of(2026, 1, 1, 12, 0));
    user.setTimezone(timezone);
    return user;
  }

  private Todo buildHardcoreTodo(UUID taskId, UUID userId, LocalDate dueDate) {
    return new Todo(
        taskId,
        UUID.randomUUID(),
        userId,
        "Entregar relatório",
        null,
        0,
        TaskPriority.MEDIUM,
        List.of(),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.TODO,
        true,
        dueDate,
        LocalDateTime.of(2026, 11, 13, 10, 0),
        List.of(),
        TodoReminderType.NONE,
        null,
        null);
  }

  @Test
  @DisplayName("updateBaseDetails usa a data local do usuário para permitir ou bloquear desativação de Hardcore na virada de fuso")
  void respectsUserTimezoneWhenDisablingHardcoreOnUpdate() {
    // 2026-11-14T02:00:00Z = 2026-11-13 23:00 em São Paulo / 2026-11-14 11:00 em Tóquio
    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-14T02:00:00Z"), ZoneId.of("UTC"));
    TaskRepository taskPort = mock(TaskRepository.class);
    UserRepository userPort = mock(UserRepository.class);
    EmailDispatchLogRepository emailLogPort = mock(EmailDispatchLogRepository.class);
    UpdateTaskUseCase useCase = new UpdateTaskUseCase(taskPort, userPort, emailLogPort, fixedClock);

    UUID userId = UUID.randomUUID();
    UUID taskId = UUID.randomUUID();
    LocalDate dueDate = LocalDate.of(2026, 11, 13);

    UpdateTaskCommand disableHardcoreCommand = new UpdateTaskCommand(
        "Entregar relatório", null, TaskPriority.MEDIUM, List.of(),
        TaskDifficulty.MEDIUM, false, dueDate,
        null, null, null, null, null, null, null, null,
        TodoReminderType.NONE, null, false, null, null);

    // 1. Em São Paulo ainda é 2026-11-13 -> prazo hoje não está vencido -> pode desativar Hardcore
    User spUser = buildUser(userId, "America/Sao_Paulo");
    Todo spTodo = buildHardcoreTodo(taskId, userId, dueDate);
    when(taskPort.findById(taskId)).thenReturn(Optional.of(spTodo));
    when(userPort.findById(userId)).thenReturn(Optional.of(spUser));
    when(taskPort.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

    Task updated = useCase.execute(taskId, userId, disableHardcoreCommand);
    assertFalse(updated.isHardcoreModeEnabled());

    // 2. Em Tóquio já é 2026-11-14 -> prazo de 2026-11-13 está vencido -> bloqueia desativar Hardcore
    User tokyoUser = buildUser(userId, "Asia/Tokyo");
    Todo tokyoTodo = buildHardcoreTodo(taskId, userId, dueDate);
    when(taskPort.findById(taskId)).thenReturn(Optional.of(tokyoTodo));
    when(userPort.findById(userId)).thenReturn(Optional.of(tokyoUser));

    assertThrows(DomainValidationException.class,
        () -> useCase.execute(taskId, userId, disableHardcoreCommand));
  }
}
