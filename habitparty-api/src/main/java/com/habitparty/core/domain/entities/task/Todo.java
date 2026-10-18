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
  private boolean isPenaltyApplied;
  private boolean sendEmailReminder;
  private boolean emailReminderSent;

  public Todo(
      // --- Campos da Base (Task) ---
      UUID id, UUID boardColumnId, UUID userId, String name,
      String description, int orderIndex, TaskPriority priority,
      List<String> tags, TaskDifficulty difficulty, TaskStatus status,
      TaskType taskType, boolean isHardcoreModeEnabled, LocalDate dueDate,
      LocalDateTime createdAt, List<ChecklistItem> checklist,

      // --- Campos Específicos (Todo) ---
      TodoReminderType reminderType, LocalDateTime reminderAt, LocalDateTime completedAt,
      boolean isPenaltyApplied, boolean sendEmailReminder, boolean emailReminderSent) {

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

    // Regra Hardcore: To-Do no modo Hardcore exige prazo de entrega
    if (isHardcoreModeEnabled && dueDate == null) {
      throw new DomainValidationException("Afazeres no modo Hardcore exigem uma data de vencimento.");
    }
   
    this.reminderType = reminderType;
    this.reminderAt = reminderAt;
    this.completedAt = completedAt;
    this.isPenaltyApplied = isPenaltyApplied;
    this.sendEmailReminder = sendEmailReminder;
    this.emailReminderSent = emailReminderSent;
  }

  // Construtores de conveniência (compatibilidade)
  public Todo(
      UUID id, UUID boardColumnId, UUID userId, String name,
      String description, int orderIndex, TaskPriority priority,
      List<String> tags, TaskDifficulty difficulty, TaskStatus status,
      TaskType taskType, boolean isHardcoreModeEnabled, LocalDate dueDate,
      LocalDateTime createdAt, List<ChecklistItem> checklist,
      TodoReminderType reminderType, LocalDateTime reminderAt, LocalDateTime completedAt,
      boolean isPenaltyApplied) {
    this(id, boardColumnId, userId, name, description, orderIndex, priority,
        tags, difficulty, status, taskType, isHardcoreModeEnabled, dueDate, createdAt, checklist,
        reminderType, reminderAt, completedAt, isPenaltyApplied, false, false);
  }

  public Todo(
      UUID id, UUID boardColumnId, UUID userId, String name,
      String description, int orderIndex, TaskPriority priority,
      List<String> tags, TaskDifficulty difficulty, TaskStatus status,
      TaskType taskType, boolean isHardcoreModeEnabled, LocalDate dueDate,
      LocalDateTime createdAt, List<ChecklistItem> checklist,
      TodoReminderType reminderType, LocalDateTime reminderAt, LocalDateTime completedAt) {
    this(id, boardColumnId, userId, name, description, orderIndex, priority,
        tags, difficulty, status, taskType, isHardcoreModeEnabled, dueDate, createdAt, checklist,
        reminderType, reminderAt, completedAt, false, false, false);
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

  public void updateTodoDetails(LocalDate newDueDate, TodoReminderType newReminderType, LocalDateTime newReminderAt, Boolean sendEmailReminder) {
    if (newDueDate != null && !newDueDate.equals(this.dueDate)) {
      // Trava anti-burla: se o afazer é hardcore e já está vencido, a data não pode ser alterada
      if (this.isHardcoreModeEnabled() && this.isOverdue()) {
        throw new DomainValidationException("Não é permitido alterar a data de um afazer hardcore com prazo vencido.");
      }
      this.dueDate = newDueDate; // Acessa o atributo protected herdado de Task
    } else if (newDueDate == null && this.isHardcoreModeEnabled()) {
      throw new DomainValidationException("Afazeres no modo Hardcore exigem uma data de vencimento.");
    }

    if (newReminderType != null) {
      this.reminderType = newReminderType;
    }

    if (newReminderAt != null && !newReminderAt.equals(this.reminderAt)) {
      this.reminderAt = newReminderAt;
      // Se a data/hora do lembrete mudou, permite que o novo e-mail seja disparado no novo momento
      this.emailReminderSent = false;
    }

    if (sendEmailReminder != null) {
      this.sendEmailReminder = sendEmailReminder;
      if (!this.sendEmailReminder) {
        this.emailReminderSent = false;
      }
    }
  }

  public void updateTodoDetails(LocalDate newDueDate, TodoReminderType newReminderType, LocalDateTime newReminderAt) {
    updateTodoDetails(newDueDate, newReminderType, newReminderAt, null);
  }

  public TaskReward calculateBaseReward() {
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
  public TaskReward calculatePenalty() {
    TaskReward base = calculateBaseReward();
    double penaltyRate = 0.5;

    int penaltyXp = (int) (base.xp() * penaltyRate);
    BigDecimal penaltyCoins = base.coins()
            .multiply(BigDecimal.valueOf(penaltyRate))
            .setScale(2, java.math.RoundingMode.HALF_UP);

    if (penaltyCoins.compareTo(new BigDecimal("0.01")) < 0) {
        penaltyCoins = new BigDecimal("0.01");
    }

    return new TaskReward(penaltyXp, penaltyCoins);
  }

  @Override
  public TaskReward calculateReward() {
    TaskReward base = calculateBaseReward();

    // Se a penalidade já foi aplicada ou o afazer hardcore está com prazo vencido, ganha apenas 50%
    if (this.isPenaltyApplied || (this.isHardcoreModeEnabled() && this.isOverdue())) {
      int reducedXp = Math.max(1, (int) (base.xp() * 0.5));
      BigDecimal reducedCoins = base.coins()
          .multiply(BigDecimal.valueOf(0.5))
          .setScale(2, java.math.RoundingMode.HALF_DOWN);

      if (reducedCoins.compareTo(new BigDecimal("0.01")) < 0) {
        reducedCoins = new BigDecimal("0.01");
      }
      return new TaskReward(reducedXp, reducedCoins);
    }

    return base;
  }

  @Override
  public void registerCompletion() {
    this.completedAt = LocalDateTime.now();
  }

  public void markPenaltyApplied() {
    this.isPenaltyApplied = true;
  }

  public boolean isPenaltyApplied() {
    return isPenaltyApplied;
  }

  public boolean isSendEmailReminder() {
    return sendEmailReminder;
  }

  public boolean isEmailReminderSent() {
    return emailReminderSent;
  }

  public void markEmailReminderSent() {
    this.emailReminderSent = true;
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