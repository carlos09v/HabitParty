package com.habitparty.core.domain.entities.task;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.OwnedByUser;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.exceptions.DomainValidationException;

public abstract sealed class Task implements OwnedByUser permits Habit, Daily, Todo {
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
  private int totalFocusMinutes = 0;
  private int focusCyclesCount = 0;
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

  // Métodos Abstratos (Os filhos são obrigados a implementar!)
  public abstract TaskReward calculateReward();

  public TaskReward calculateReward(LocalDate referenceDate) {
    return calculateReward();
  }

  public abstract void registerCompletion();

  public void registerCompletion(LocalDateTime completionTime) {
    registerCompletion();
  }

  /**
   * Indica se a recompensa de conclusão já foi resgatada (para evitar ganho infinito ao marcar e desmarcar).
   */
  public boolean isRewardAlreadyClaimed() {
    return false;
  }

  public boolean isRewardAlreadyClaimed(LocalDate referenceDate) {
    return isRewardAlreadyClaimed();
  }

  public void moveTo(UUID newBoardColumnId, int newOrderIndex) {
    this.boardColumnId = newBoardColumnId;
    this.orderIndex = newOrderIndex;
  }

  public void changeStatus(TaskStatus newStatus) {
    this.status = newStatus;
  }

  protected static final BigDecimal HALF_RATE = new BigDecimal("0.50");
  protected static final BigDecimal ADAPTATION_RATE = new BigDecimal("0.75");
  protected static final BigDecimal DAILY_CONSISTENCY_BONUS_RATE = new BigDecimal("1.10");
  protected static final BigDecimal MIN_COINS = new BigDecimal("0.01");

  // Calcula a penalidade do modo Hardcore
  public TaskReward calculatePenalty() {
    return calculatePenalty(LocalDate.now());
  }

  public TaskReward calculatePenalty(LocalDate referenceDate) {
    // 1. Descobre quanto essa tarefa pagaria hoje (O filho responde isso!)
    TaskReward fullReward = this.calculateReward(referenceDate);
    return calculateHalfPenalty(fullReward);
  }

  protected TaskReward calculateHalfPenalty(TaskReward fullReward) {
    // 2. Aplica a taxa de penalidade (Ex: 50% de multa)
    int penaltyXp = (int) (fullReward.xp() * 0.5);
    BigDecimal penaltyCoins = fullReward.coins()
            .multiply(HALF_RATE)
            .setScale(2, java.math.RoundingMode.HALF_UP);

    // 4. compareTo garante que a multa mínima seja $ 0,01 
    // para que o usuário não saia impune nas tarefas Triviais
    if (penaltyCoins.compareTo(MIN_COINS) < 0) {
        penaltyCoins = MIN_COINS;
    }

    return new TaskReward(penaltyXp, penaltyCoins);
  }

  protected TaskReward calculateDifficultyBaseReward(int effortUnits) {
    int safeUnits = Math.max(1, effortUnits);
    int unitXp = switch (this.difficulty) {
      case TRIVIAL -> 2;
      case EASY -> 5;
      case MEDIUM -> 15;
      case HARD -> 30;
    };

    BigDecimal unitCoins = switch (this.difficulty) {
      case TRIVIAL -> new BigDecimal("0.25");
      case EASY -> new BigDecimal("0.75");
      case MEDIUM -> new BigDecimal("2.50");
      case HARD -> new BigDecimal("5.00");
    };

    return new TaskReward(unitXp * safeUnits, unitCoins.multiply(BigDecimal.valueOf(safeUnits)));
  }

  public boolean supportsRewardedChecklistSteps() {
    return this.taskType != TaskType.HABIT && this.difficulty == TaskDifficulty.HARD;
  }

  public void validateCanRewardChecklistItem(UUID excludedItemId) {
    if (!supportsRewardedChecklistSteps()) {
      throw new DomainValidationException(
          "Etapas recompensadas estão disponíveis apenas para tarefas diárias e to-dos na dificuldade difícil.");
    }
    if (countRewardedChecklistItemsExcluding(excludedItemId) >= ChecklistItem.MAX_REWARDED_ITEMS_PER_TASK) {
      throw new DomainValidationException(
          "Uma tarefa pode ter no máximo " + ChecklistItem.MAX_REWARDED_ITEMS_PER_TASK + " etapas recompensadas.");
    }
  }

  public int countRewardedChecklistItems() {
    return countRewardedChecklistItemsExcluding(null);
  }

  public int countRewardedChecklistItemsExcluding(UUID excludedItemId) {
    if (!supportsRewardedChecklistSteps() || this.checklist == null || this.checklist.isEmpty()) {
      return 0;
    }
    int count = 0;
    for (ChecklistItem item : this.checklist) {
      if (item != null && item.isRewarded() && !Objects.equals(item.getId(), excludedItemId)) {
        count++;
        if (count >= ChecklistItem.MAX_REWARDED_ITEMS_PER_TASK) {
          return ChecklistItem.MAX_REWARDED_ITEMS_PER_TASK;
        }
      }
    }
    return count;
  }

  public int countPendingRewardedChecklistItems() {
    if (!supportsRewardedChecklistSteps() || this.checklist == null || this.checklist.isEmpty()) {
      return 0;
    }
    int rewardedSeen = 0;
    int pendingCount = 0;
    for (ChecklistItem item : this.checklist) {
      if (item != null && item.isRewarded()) {
        rewardedSeen++;
        if (!item.isCompleted()) {
          pendingCount++;
        }
        if (rewardedSeen >= ChecklistItem.MAX_REWARDED_ITEMS_PER_TASK) {
          break;
        }
      }
    }
    return pendingCount;
  }

  public int getRewardMultiplierUnits() {
    return 1 + countRewardedChecklistItems();
  }

  public int getPendingRewardPenaltyUnits() {
    return 1 + countPendingRewardedChecklistItems();
  }

  public int nextChecklistOrderIndex() {
    if (this.checklist == null || this.checklist.isEmpty()) {
      return 0;
    }
    int max = -1;
    for (ChecklistItem item : this.checklist) {
      if (item != null && item.getOrderIndex() > max) {
        max = item.getOrderIndex();
      }
    }
    return max + 1;
  }

  public List<ChecklistItem> markAllChecklistItemsCompleted() {
    if (this.checklist == null || this.checklist.isEmpty()) {
      return List.of();
    }
    List<ChecklistItem> updated = new ArrayList<>();
    for (ChecklistItem item : this.checklist) {
      if (item != null && !item.isCompleted()) {
        item.markAutoCompleted();
        updated.add(item);
      }
    }
    return updated;
  }

  public List<ChecklistItem> revertAutoCompletedChecklistItems() {
    if (this.checklist == null || this.checklist.isEmpty()) {
      return List.of();
    }
    List<ChecklistItem> updated = new ArrayList<>();
    for (ChecklistItem item : this.checklist) {
      if (item != null && item.isAutoCompleted()) {
        item.revertAutoCompleted();
        updated.add(item);
      }
    }
    return updated;
  }

  public List<ChecklistItem> resetAllChecklistItems() {
    if (this.checklist == null || this.checklist.isEmpty()) {
      return List.of();
    }
    List<ChecklistItem> updated = new ArrayList<>();
    for (ChecklistItem item : this.checklist) {
      if (item != null && item.isCompleted()) {
        item.setCompleted(false);
        updated.add(item);
      }
    }
    return updated;
  }

  public List<ChecklistItem> clearRewardedChecklistItemsIfNotHard() {
    if (supportsRewardedChecklistSteps() || this.checklist == null || this.checklist.isEmpty()) {
      return List.of();
    }
    List<ChecklistItem> updated = new ArrayList<>();
    for (ChecklistItem item : this.checklist) {
      if (item != null && item.isRewarded()) {
        item.setRewarded(false);
        updated.add(item);
      }
    }
    return updated;
  }

  public boolean isOverdue() {
    return isOverdue(LocalDate.now());
  }

  public boolean isOverdue(LocalDate referenceDate) {
    LocalDate effectiveDate = referenceDate != null ? referenceDate : LocalDate.now();
    return this.dueDate != null && this.dueDate.isBefore(effectiveDate);
  }

  // Uso de setter semântico e não anêmico (tradicional/burro)
  public void updateBaseDetails(String name, String description, TaskPriority priority,
      TaskDifficulty difficulty, List<String> tags,
      boolean isHardcoreModeEnabled) {
    updateBaseDetails(name, description, priority, difficulty, tags, isHardcoreModeEnabled, LocalDate.now());
  }

  public void updateBaseDetails(String name, String description, TaskPriority priority,
      TaskDifficulty difficulty, List<String> tags,
      boolean isHardcoreModeEnabled, LocalDate referenceDate) {
    if (this.isHardcoreModeEnabled && !isHardcoreModeEnabled && this.isOverdue(referenceDate)) {
      throw new DomainValidationException("Não é permitido desativar o modo Hardcore de uma tarefa com prazo vencido.");
    }
    this.name = name;
    this.description = description;
    this.priority = priority;
    this.difficulty = difficulty;
    this.tags = validateAndSanitizeTags(tags);
    this.isHardcoreModeEnabled = isHardcoreModeEnabled;
  }

  private static final int MAX_TAGS = 5;
  private static final int MAX_TAG_SEGMENT_LENGTH = 25;
  private static final int MAX_TAG_PATH_LENGTH = 80;
  private static final String TAG_HIERARCHY_SEPARATOR = " > ";

  private List<String> validateAndSanitizeTags(List<String> tags) {
    if (tags == null) {
      return null;
    }
    if (tags.size() > MAX_TAGS) {
      throw new DomainValidationException("A tarefa não pode ter mais de 5 tags.");
    }
    List<String> sanitized = new ArrayList<>(tags.size());
    for (String tag : tags) {
      if (tag == null) {
        continue;
      }
      String[] rawSegments = tag.split(">", -1);
      List<String> normalizedSegments = new ArrayList<>(rawSegments.length);
      for (String rawSegment : rawSegments) {
        String trimmedSegment = rawSegment.trim();
        if (trimmedSegment.isEmpty()) {
          throw new DomainValidationException(
              rawSegments.length > 1
                  ? "Cada nível da tag hierárquica deve ser preenchido."
                  : "Tags vazias não são permitidas.");
        }
        if (trimmedSegment.length() > MAX_TAG_SEGMENT_LENGTH) {
          throw new DomainValidationException(
              "Cada nível da tag deve ter até " + MAX_TAG_SEGMENT_LENGTH + " caracteres.");
        }
        normalizedSegments.add(trimmedSegment);
      }
      String normalizedPath = String.join(TAG_HIERARCHY_SEPARATOR, normalizedSegments);
      if (normalizedPath.length() > MAX_TAG_PATH_LENGTH) {
        throw new DomainValidationException(
            "Cada tag completa deve ter até " + MAX_TAG_PATH_LENGTH + " caracteres.");
      }
      sanitized.add(normalizedPath);
    }
    return sanitized;
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

  public void restoreFocusMetrics(int totalFocusMinutes, int focusCyclesCount) {
    this.totalFocusMinutes = Math.max(0, totalFocusMinutes);
    this.focusCyclesCount = Math.max(0, focusCyclesCount);
  }

  public void addFocusSession(int durationMinutes, int completedPomos) {
    if (this.taskType == TaskType.HABIT) {
      throw new DomainValidationException("Apenas tarefas Diárias e Afazeres podem ser vinculadas a sessões de foco.");
    }
    this.totalFocusMinutes = Math.max(0, this.totalFocusMinutes + Math.max(0, durationMinutes));
    this.focusCyclesCount = Math.max(0, this.focusCyclesCount + Math.max(0, completedPomos));
  }

  public void removeFocusSession(int durationMinutes, int completedPomos) {
    this.totalFocusMinutes = Math.max(0, this.totalFocusMinutes - Math.max(0, durationMinutes));
    this.focusCyclesCount = Math.max(0, this.focusCyclesCount - Math.max(0, completedPomos));
  }

  public int getTotalFocusMinutes() {
    return totalFocusMinutes;
  }

  public int getFocusCyclesCount() {
    return focusCyclesCount;
  }

}
