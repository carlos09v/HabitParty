package com.habitparty.core.domain.entities.task;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.entities.task.Task.TaskReward;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;
import com.habitparty.core.exceptions.DomainValidationException;

class TodoDomainTest {

  private Todo createTodo(boolean isHardcore, LocalDate dueDate, boolean isPenaltyApplied) {
    return new Todo(
        UUID.randomUUID(),
        UUID.randomUUID(),
        UUID.randomUUID(),
        "Estudar Arquitetura",
        "Revisar ports e adapters",
        0,
        TaskPriority.HIGH,
        List.of("Estudo"),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.TODO,
        isHardcore,
        dueDate,
        LocalDateTime.now(),
        List.of(),
        TodoReminderType.NONE,
        null,
        null,
        isPenaltyApplied);
  }

  @Test
  @DisplayName("Deve lançar exceção se criar To-do Hardcore sem data de vencimento")
  void shouldThrowExceptionWhenCreatingHardcoreTodoWithoutDueDate() {
    DomainValidationException exception = assertThrows(DomainValidationException.class, () -> {
      createTodo(true, null, false);
    });

    assertEquals("Afazeres no modo Hardcore exigem uma data de vencimento.", exception.getMessage());
  }

  @Test
  @DisplayName("Permite criar To-do comum sem data de vencimento")
  void shouldAllowCreatingRegularTodoWithoutDueDate() {
    Todo todo = createTodo(false, null, false);
    assertFalse(todo.isHardcoreModeEnabled());
    assertTrue(todo.getDueDate().isEmpty());
  }

  @Test
  @DisplayName("Não permite alterar a data de vencimento de um afazer hardcore já vencido")
  void shouldThrowExceptionWhenChangingDueDateOfOverdueHardcoreTodo() {
    LocalDate pastDate = LocalDate.now().minusDays(2);
    Todo todo = createTodo(true, pastDate, true);

    DomainValidationException exception = assertThrows(DomainValidationException.class, () -> {
      todo.updateTodoDetails(LocalDate.now().plusDays(2), TodoReminderType.NONE, null);
    });

    assertEquals("Não é permitido alterar a data de um afazer hardcore com prazo vencido.", exception.getMessage());
  }

  @Test
  @DisplayName("Permite alterar a data de vencimento de um afazer hardcore que ainda não venceu")
  void shouldAllowChangingDueDateOfFutureHardcoreTodo() {
    LocalDate futureDate = LocalDate.now().plusDays(3);
    Todo todo = createTodo(true, futureDate, false);

    LocalDate newFutureDate = LocalDate.now().plusDays(5);
    todo.updateTodoDetails(newFutureDate, TodoReminderType.NONE, null);

    assertEquals(newFutureDate, todo.getDueDate().orElse(null));
  }

  @Test
  @DisplayName("Não permite desativar o modo Hardcore de uma tarefa vencida")
  void shouldThrowExceptionWhenDisablingHardcoreOnOverdueTask() {
    LocalDate pastDate = LocalDate.now().minusDays(1);
    Todo todo = createTodo(true, pastDate, true);

    DomainValidationException exception = assertThrows(DomainValidationException.class, () -> {
      todo.updateBaseDetails(
          todo.getName(),
          todo.getDescription().orElse(null),
          todo.getPriority().orElse(null),
          todo.getDifficulty(),
          todo.getTags(),
          false // Tentando desligar o modo hardcore
      );
    });

    assertEquals("Não é permitido desativar o modo Hardcore de uma tarefa com prazo vencido.", exception.getMessage());
  }

  @Test
  @DisplayName("Calcula recompensa cheia (100%) quando a penalidade não foi aplicada")
  void shouldCalculateFullRewardWhenPenaltyNotApplied() {
    Todo todo = createTodo(true, LocalDate.now().plusDays(1), false);

    TaskReward reward = todo.calculateReward();

    // Dificuldade MEDIUM: Base é 15 XP e $2.50
    assertEquals(15, reward.xp());
    assertEquals(new BigDecimal("2.50"), reward.coins());
  }

  @Test
  @DisplayName("Calcula recompensa reduzida (50%) quando a penalidade já foi aplicada")
  void shouldCalculateReducedRewardWhenPenaltyApplied() {
    Todo todo = createTodo(true, LocalDate.now().minusDays(1), true);

    TaskReward reward = todo.calculateReward();

    // Dificuldade MEDIUM com 50%: 7 XP e $1.25
    assertEquals(7, reward.xp());
    assertEquals(new BigDecimal("1.25"), reward.coins());
  }

  @Test
  @DisplayName("Calcula recompensa reduzida (50%) quando a tarefa hardcore está vencida mesmo antes de rodar o reset da meia-noite")
  void shouldCalculateReducedRewardWhenHardcoreTodoIsOverdueEvenIfPenaltyNotYetApplied() {
    Todo todo = createTodo(true, LocalDate.now().minusDays(1), false);

    TaskReward reward = todo.calculateReward();

    assertEquals(7, reward.xp());
    assertEquals(new BigDecimal("1.25"), reward.coins());
  }

  @Test
  @DisplayName("Deve gerenciar status de envio de e-mail e resetar flag quando horário do lembrete for alterado")
  void shouldManageEmailReminderFlagsAndResetWhenReminderTimeChanges() {
    LocalDateTime initialReminder = LocalDateTime.now().plusHours(2);
    Todo todo = new Todo(
        UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
        "Tarefa com Lembrete", "Descrição", 0, TaskPriority.HIGH,
        List.of(), TaskDifficulty.EASY, TaskStatus.PENDING, TaskType.TODO,
        false, LocalDate.now().plusDays(2), LocalDateTime.now(), List.of(),
        TodoReminderType.CUSTOM, initialReminder, null, false, true, false
    );

    assertTrue(todo.isSendEmailReminder());
    assertFalse(todo.isEmailReminderSent());

    // Marca como enviado
    todo.markEmailReminderSent();
    assertTrue(todo.isEmailReminderSent());

    // Atualiza com novo horário de alarme -> emailReminderSent deve resetar para false
    LocalDateTime newReminder = LocalDateTime.now().plusHours(4);
    todo.updateTodoDetails(LocalDate.now().plusDays(2), TodoReminderType.CUSTOM, newReminder, true);
    assertFalse(todo.isEmailReminderSent());
    assertTrue(todo.isSendEmailReminder());

    // Desativa o lembrete por e-mail -> sendEmailReminder fica false e emailReminderSent false
    todo.markEmailReminderSent();
    assertTrue(todo.isEmailReminderSent());
    todo.updateTodoDetails(LocalDate.now().plusDays(2), TodoReminderType.CUSTOM, newReminder, false);
    assertFalse(todo.isSendEmailReminder());
    assertFalse(todo.isEmailReminderSent());
  }
}
