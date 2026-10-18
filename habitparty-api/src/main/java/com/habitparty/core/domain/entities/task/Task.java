package com.habitparty.core.domain.entities.task;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.UnauthorizedException;

public abstract class Task {
  private UUID id;
  private UUID boardColumnId; // FK (Soft-link)
  private UUID userId; // FK (Soft-link)

  private String name;
  private String description;
  private int orderIndex;

  private TaskPriority priority;
  private List<String> tags;
  private TaskDifficulty difficulty;
  private TaskStatus status;
  private TaskType taskType;

  private boolean isHardcoreModeEnabled = false;
  protected LocalDate dueDate;
  private LocalDateTime createdAt;

  // Hard-link (Composição real do Aggregate Root)
  private List<ChecklistItem> checklist = new ArrayList<>();

  public record TaskReward(int xp, BigDecimal coins) {
  };

  public Task(UUID id, UUID boardColumnId, UUID userId, String name, String description, int orderIndex,
      TaskPriority priority, List<String> tags, TaskDifficulty difficulty, TaskStatus status, TaskType taskType,
      boolean isHardcoreModeEnabled,
      LocalDate dueDate, LocalDateTime createdAt, List<ChecklistItem> checklist) {
    this.id = id;
    this.boardColumnId = boardColumnId;
    this.userId = userId;
    this.name = name;
    this.description = description;
    this.orderIndex = orderIndex;
    this.priority = priority;
    this.tags = validateAndSanitizeTags(tags);
    this.difficulty = difficulty;
    this.status = status;
    this.taskType = taskType;
    this.isHardcoreModeEnabled = isHardcoreModeEnabled;
    this.dueDate = dueDate;
    this.createdAt = createdAt;
    this.checklist = checklist != null ? checklist : new ArrayList<>();
  }

  public void validateOwnership(UUID userIdLogado) {
    if (!this.userId.equals(userIdLogado)) {
      throw new UnauthorizedException("Você não tem permissão!");
    }
  }

  // Métodos Abstratos (Os filhos são obrigados a implementar!)
  public abstract TaskReward calculateReward();

  public abstract void registerCompletion();

  public void moveTo(UUID newBoardColumnId, int newOrderIndex) {
    this.boardColumnId = newBoardColumnId;
    this.orderIndex = newOrderIndex;
  }

  public void changeStatus(TaskStatus newStatus) {
    this.status = newStatus;
  }

  // Calcula a penalidade do modo Hardcore
  public TaskReward calculatePenalty() {
    // 1. Descobre quanto essa tarefa pagaria hoje (O filho responde isso!)
    TaskReward fullReward = this.calculateReward();

    // 2. Aplica a taxa de penalidade (Ex: 50% de multa)
    double penaltyRate = 0.5;

    int penaltyXp = (int) (fullReward.xp() * penaltyRate);
    BigDecimal penaltyCoins = fullReward.coins()
            .multiply(BigDecimal.valueOf(penaltyRate))
            .setScale(2, java.math.RoundingMode.HALF_UP);

    // 4. compareTo garante que a multa mínima seja $ 0,01 
    // para que o usuário não saia impune nas tarefas Triviais
    if (penaltyCoins.compareTo(new BigDecimal("0.01")) < 0) {
        penaltyCoins = new BigDecimal("0.01");
    }

    return new TaskReward(penaltyXp, penaltyCoins);
  }

  public boolean isOverdue() {
    return this.dueDate != null && this.dueDate.isBefore(LocalDate.now());
  }

  // Uso de setter semântico e não anêmico (tradicional/burro)
  public void updateBaseDetails(String name, String description, TaskPriority priority,
      TaskDifficulty difficulty, List<String> tags,
      boolean isHardcoreModeEnabled) {
    if (this.isHardcoreModeEnabled && !isHardcoreModeEnabled && this.isOverdue()) {
      throw new DomainValidationException("Não é permitido desativar o modo Hardcore de uma tarefa com prazo vencido.");
    }
    this.name = name;
    this.description = description;
    this.priority = priority;
    this.difficulty = difficulty;
    this.tags = validateAndSanitizeTags(tags);
    this.isHardcoreModeEnabled = isHardcoreModeEnabled;
  }

  private List<String> validateAndSanitizeTags(List<String> tags) {
    if (tags == null) {
      return null;
    }
    if (tags.size() > 5) {
      throw new DomainValidationException("A tarefa não pode ter mais de 5 tags.");
    }
    for (String tag : tags) {
      if (tag != null && tag.length() > 25) {
        throw new DomainValidationException("Cada tag deve ter até 25 caracteres.");
      }
    }
    return tags;
  }

  // --- Getters ---
  public UUID getId() {
    return id;
  }

  public UUID getBoardColumnId() {
    return boardColumnId;
  }

  public UUID getUserId() {
    return userId;
  }

  public String getName() {
    return name;
  }

  public Optional<String> getDescription() {
    return Optional.ofNullable(description);
  }

  public int getOrderIndex() {
    return orderIndex;
  }

  public void setOrderIndex(int orderIndex) {
    this.orderIndex = orderIndex;
  }

  public Optional<TaskPriority> getPriority() {
    return Optional.ofNullable(priority);
  }

  public List<String> getTags() {
    return tags;
  }

  public TaskDifficulty getDifficulty() {
    return difficulty;
  }

  public TaskStatus getStatus() {
    return status;
  }

  public TaskType getTaskType() {
    return taskType;
  }

  public boolean isHardcoreModeEnabled() {
    return isHardcoreModeEnabled;
  }

  public Optional<LocalDate> getDueDate() {
    return Optional.ofNullable(dueDate);
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public List<ChecklistItem> getChecklist() {
    return checklist;
  }

  public void setChecklist(List<ChecklistItem> checklist) {
    this.checklist = checklist;
  }

}
