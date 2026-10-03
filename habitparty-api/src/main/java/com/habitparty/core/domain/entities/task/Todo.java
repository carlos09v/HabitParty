package com.habitparty.core.domain.entities.task;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;
import com.habitparty.core.exceptions.DomainValidationException;

public class Todo extends Task {
  private TodoReminderType reminderType;
  private LocalDateTime reminderAt;
  private LocalDateTime completedAt;

  public Todo(
      // --- Campos da Base (Task) ---
      UUID id, UUID boardColumnId, UUID userId, String name,
      String description, int orderIndex, TaskPriority priority,
      List<String> tags, TaskDifficulty difficulty, TaskStatus status,
      TaskType taskType, boolean isHardcoreModeEnabled, LocalDate dueDate,
      LocalDateTime createdAt, List<ChecklistItem> checklist,

      // --- Campos Específicos (Todo) ---
      TodoReminderType reminderType, LocalDateTime reminderAt, LocalDateTime completedAt) {

    super(id, boardColumnId, userId, name, description, orderIndex, priority,
        tags, difficulty, status, taskType, isHardcoreModeEnabled, dueDate, createdAt, checklist);

    // --- VALIDAÇÕES DE DOMÍNIO ---
    if (reminderType == null) {
      throw new DomainValidationException("O tipo de lembrete (reminderType) é obrigatório, mesmo que seja NONE.");
    }

    // Regra: Se o usuário escolheu um lembrete customizado, a data/hora exata do alarme não pode ser nula
    if (reminderType.name().equals("CUSTOM") && reminderAt == null) {
      throw new DomainValidationException(
          "Para lembretes personalizados, a data e hora (reminderAt) são obrigatórias.");
    }
   
    this.reminderType = reminderType;
    this.reminderAt = reminderAt;
    this.completedAt = completedAt;
  }

  public static LocalDateTime calculateReminderTime(LocalDate dueDate, TodoReminderType type,
      LocalDateTime customReminderAt) {
    if (type == null || type == TodoReminderType.NONE || dueDate == null) {
      return null;
    }

    if (type == TodoReminderType.CUSTOM) {
      if (customReminderAt == null) {
        throw new DomainValidationException("A data customizada do lembrete é obrigatória.");
      }
      return customReminderAt;
    }

    // Regra de negócio: Alarmes padrão tocam sempre às 9h da manhã do dia calculado
    return switch (type) {
      case ONE_DAY_EARLY -> dueDate.minusDays(1).atTime(9, 0);
      case TWO_DAYS_EARLY -> dueDate.minusDays(2).atTime(9, 0);
      case THREE_DAYS_EARLY -> dueDate.minusDays(3).atTime(9, 0);
      case ONE_WEEK_EARLY -> dueDate.minusWeeks(1).atTime(9, 0);
      default -> null;
    };
  }

  public void updateTodoDetails(LocalDate newDueDate, TodoReminderType newReminderType, LocalDateTime newReminderAt) {
    if (newDueDate != null) {
      this.dueDate = newDueDate; // Acessa o atributo protected herdado de Task
    }

    if (newReminderType != null) {
      this.reminderType = newReminderType;
    }

    if (newReminderAt != null) {
      this.reminderAt = newReminderAt;
    }
  }

  @Override
  public TaskReward calculateReward() {
    int baseXp = switch (this.getDifficulty()) {
      case TRIVIAL -> 2;
      case EASY -> 5;
      case MEDIUM -> 15;
      case HARD -> 30;
    };
    
    BigDecimal baseCoins = switch (this.getDifficulty()) {
      case TRIVIAL -> new BigDecimal("0.25");
      case EASY -> new BigDecimal("0.75");
      case MEDIUM -> new BigDecimal("2.50");
      case HARD -> new BigDecimal("5.00");
    };

    return new TaskReward(baseXp, baseCoins);
  }

  @Override
  public void registerCompletion() {
    this.completedAt = LocalDateTime.now();
  }

  // Apenas Getters (Sem Setters!)
  public TodoReminderType getReminderType() {
    return reminderType;
  }

  public Optional<LocalDateTime> getReminderAt() {
    return Optional.ofNullable(reminderAt);
  }

  public LocalDateTime getCompletedAt() {
    return completedAt;
  }
}