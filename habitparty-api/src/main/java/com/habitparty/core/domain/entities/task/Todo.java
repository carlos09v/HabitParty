package com.habitparty.core.domain.entities.task;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
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
  private LocalTime dueTime;
  private LocalTime startTime;
  private LocalTime dueEndTime;
  private boolean isAllDay;
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
      boolean isPenaltyApplied, boolean sendEmailReminder, boolean emailReminderSent,
      LocalTime dueTime) {

    super(id, boardColumnId, userId, name, description, orderIndex, priority,
        tags, difficulty, status, taskType, isHardcoreModeEnabled,
        dueDate != null ? dueDate : (dueTime != null ? LocalDate.now() : null),
        createdAt, checklist);

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
    if (isHardcoreModeEnabled && this.dueDate == null) {
      throw new DomainValidationException("Afazeres no modo Hardcore exigem uma data de vencimento.");
    }
   
    this.dueTime = this.dueDate != null ? dueTime : null;
    this.reminderType = reminderType;
    this.reminderAt = reminderAt;
    this.completedAt = completedAt;
    this.isPenaltyApplied = isPenaltyApplied;
    this.sendEmailReminder = sendEmailReminder;
    this.emailReminderSent = emailReminderSent;
  }

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
    this(id, boardColumnId, userId, name, description, orderIndex, priority,
        tags, difficulty, status, taskType, isHardcoreModeEnabled, dueDate, createdAt, checklist,
        reminderType, reminderAt, completedAt, isPenaltyApplied, sendEmailReminder, emailReminderSent, null);
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

  public void updateTodoDetails(LocalDate newDueDate, LocalTime newDueTime, TodoReminderType newReminderType, LocalDateTime newReminderAt, Boolean sendEmailReminder) {
    LocalDate effectiveDueDate = newDueDate != null ? newDueDate : (newDueTime != null ? LocalDate.now() : null);

    if (effectiveDueDate != null && !effectiveDueDate.equals(this.dueDate)) {
      // Trava anti-burla: se o afazer é hardcore e já está vencido, a data não pode ser alterada
      if (this.isHardcoreModeEnabled() && this.isOverdue()) {
        throw new DomainValidationException("Não é permitido alterar a data de um afazer hardcore com prazo vencido.");
      }
      this.dueDate = effectiveDueDate; // Acessa o atributo protected herdado de Task
    } else if (effectiveDueDate == null && this.isHardcoreModeEnabled()) {
      throw new DomainValidationException("Afazeres no modo Hardcore exigem uma data de vencimento.");
    } else if (effectiveDueDate == null) {
      this.dueDate = null;
    }

    this.dueTime = (this.dueDate != null) ? newDueTime : null;
    if (this.dueDate == null) {
      this.startTime = null;
      this.dueEndTime = null;
      this.isAllDay = false;
    } else if (this.dueTime != null) {
      this.startTime = null;
      this.isAllDay = false;
      if (this.dueEndTime != null && !this.dueEndTime.isAfter(this.dueTime)) {
        this.dueEndTime = null;
      }
    } else if (this.startTime == null) {
      this.dueEndTime = null;
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

  public void updateTodoDetails(LocalDate newDueDate, TodoReminderType newReminderType, LocalDateTime newReminderAt, Boolean sendEmailReminder) {
    updateTodoDetails(newDueDate, this.dueTime, newReminderType, newReminderAt, sendEmailReminder);
  }

  public void updateTodoDetails(LocalDate newDueDate, TodoReminderType newReminderType, LocalDateTime newReminderAt) {
    updateTodoDetails(newDueDate, this.dueTime, newReminderType, newReminderAt, null);
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

    int penaltyXp = BigDecimal.valueOf(base.xp()).multiply(HALF_RATE).intValue();
    BigDecimal penaltyCoins = base.coins()
            .multiply(HALF_RATE)
            .setScale(2, java.math.RoundingMode.HALF_UP);

    if (penaltyCoins.compareTo(MIN_COINS) < 0) {
        penaltyCoins = MIN_COINS;
    }

    return new TaskReward(penaltyXp, penaltyCoins);
  }

  @Override
  public TaskReward calculateReward() {
    return calculateReward(LocalDate.now());
  }

  @Override
  public TaskReward calculateReward(LocalDate referenceDate) {
    TaskReward base = calculateBaseReward();

    // Se a penalidade já foi aplicada ou o afazer hardcore está com prazo vencido, ganha apenas 50%
    if (this.isPenaltyApplied || (this.isHardcoreModeEnabled() && this.isOverdue(referenceDate))) {
      int reducedXp = Math.max(1, BigDecimal.valueOf(base.xp()).multiply(HALF_RATE).intValue());
      BigDecimal reducedCoins = base.coins()
          .multiply(HALF_RATE)
          .setScale(2, java.math.RoundingMode.HALF_DOWN);

      if (reducedCoins.compareTo(MIN_COINS) < 0) {
        reducedCoins = MIN_COINS;
      }
      return new TaskReward(reducedXp, reducedCoins);
    }

    return base;
  }

  @Override
  public void registerCompletion() {
    registerCompletion(LocalDateTime.now());
  }

  @Override
  public void registerCompletion(LocalDateTime completionTime) {
    this.completedAt = completionTime != null ? completionTime : LocalDateTime.now();
  }

  @Override
  public boolean isRewardAlreadyClaimed() {
    return this.completedAt != null;
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

  /**
   * Define (ou remove, se nulo) o horário de término do evento.
   * Regra: exige um horário de início (startTime ou dueTime) e deve ser posterior a ele no mesmo dia.
   */
  public void defineDueEndTime(LocalTime newDueEndTime) {
    if (newDueEndTime == null) {
      this.dueEndTime = null;
      return;
    }
    LocalTime effectiveStart = this.startTime != null ? this.startTime : this.dueTime;
    if (effectiveStart == null) {
      throw new DomainValidationException("O horário de término exige um horário de início.");
    }
    if (!newDueEndTime.isAfter(effectiveStart)) {
      throw new DomainValidationException("O horário de término deve ser posterior ao horário de início.");
    }
    this.dueEndTime = newDueEndTime;
  }

  /**
   * Define (ou remove) a programação de Evento (Start/End time ou Dia Inteiro).
   * Mutuamente exclusiva com a Hora Pontual (dueTime).
   */
  public void defineEventSchedule(LocalTime newStartTime, LocalTime newEndTime, Boolean allDay) {
    if (this.dueDate == null && (Boolean.TRUE.equals(allDay) || newStartTime != null || newEndTime != null)) {
      this.dueDate = LocalDate.now();
    }
    if (this.dueDate == null) {
      this.isAllDay = false;
      this.startTime = null;
      this.dueEndTime = null;
      return;
    }

    if (Boolean.TRUE.equals(allDay)) {
      this.isAllDay = true;
      this.dueTime = null;
      this.startTime = null;
      this.dueEndTime = null;
      return;
    }

    this.isAllDay = false;
    if (newStartTime == null && newEndTime == null) {
      this.startTime = null;
      this.dueEndTime = null;
      return;
    }

    if (newStartTime == null) {
      throw new DomainValidationException("O horário de término exige um horário de início.");
    }
    if (newEndTime != null && !newEndTime.isAfter(newStartTime)) {
      throw new DomainValidationException("O horário de término deve ser posterior ao horário de início.");
    }

    this.dueTime = null;
    this.startTime = newStartTime;
    this.dueEndTime = newEndTime;
  }

  /**
   * Reidrata o horário de término vindo da persistência, descartando valores inconsistentes
   * em vez de lançar exceção (dados legados).
   */
  public void restoreDueEndTime(LocalTime persistedDueEndTime) {
    LocalTime effectiveStart = this.startTime != null ? this.startTime : this.dueTime;
    this.dueEndTime = (persistedDueEndTime != null && effectiveStart != null
        && persistedDueEndTime.isAfter(effectiveStart)) ? persistedDueEndTime : null;
  }

  /**
   * Reidrata os campos de Evento (startTime, dueEndTime e isAllDay) vindos da persistência.
   */
  public void restoreEventSchedule(LocalTime persistedStartTime, LocalTime persistedEndTime, boolean persistedAllDay) {
    if (this.dueDate == null) {
      this.isAllDay = false;
      this.startTime = null;
      this.dueEndTime = null;
      return;
    }
    if (persistedAllDay) {
      this.isAllDay = true;
      this.dueTime = null;
      this.startTime = null;
      this.dueEndTime = null;
      return;
    }
    this.isAllDay = false;
    if (persistedStartTime != null) {
      this.dueTime = null;
      this.startTime = persistedStartTime;
      this.dueEndTime = (persistedEndTime != null && persistedEndTime.isAfter(persistedStartTime))
          ? persistedEndTime
          : null;
    } else {
      restoreDueEndTime(persistedEndTime);
    }
  }

  // Apenas Getters (Sem Setters!)
  public Optional<LocalTime> getDueTime() {
    return Optional.ofNullable(dueTime);
  }

  public Optional<LocalTime> getStartTime() {
    return Optional.ofNullable(startTime);
  }

  public Optional<LocalTime> getDueEndTime() {
    return Optional.ofNullable(dueEndTime);
  }

  public boolean isAllDay() {
    return isAllDay;
  }

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