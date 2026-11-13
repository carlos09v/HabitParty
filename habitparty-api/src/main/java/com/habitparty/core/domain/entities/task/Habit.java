package com.habitparty.core.domain.entities.task;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.habitparty.core.domain.enums.task.HabitImportanceType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.exceptions.DomainValidationException;

public class Habit extends Task {
  private int currentStreak;
  private HabitType habitType;
  private HabitResetCounter resetCounter;
  private HabitImportanceType importanceType;
  private LocalDateTime lastCompletedAt;
  private int positiveCount;
  private int negativeCount;

  public Habit(// --- Campos da Base (Task) ---
      UUID id, UUID boardColumnId, UUID userId, String name,
      String description, int orderIndex, TaskPriority priority,
      List<String> tags, TaskDifficulty difficulty, TaskStatus status,
      TaskType taskType, boolean isHardcoreModeEnabled, LocalDate dueDate,
      LocalDateTime createdAt, List<ChecklistItem> checklist,

      // --- Campos Específicos (Habit) ---
      int currentStreak, HabitType habitType,
      HabitResetCounter resetCounter, HabitImportanceType importanceType,
      LocalDateTime lastCompletedAt) {
    this(id, boardColumnId, userId, name, description, orderIndex, priority,
        tags, difficulty, status, taskType, isHardcoreModeEnabled, dueDate,
        createdAt, checklist, currentStreak, habitType, resetCounter,
        importanceType, lastCompletedAt, 0, 0);
  }

  public Habit(// --- Campos da Base (Task) ---
      UUID id, UUID boardColumnId, UUID userId, String name,
      String description, int orderIndex, TaskPriority priority,
      List<String> tags, TaskDifficulty difficulty, TaskStatus status,
      TaskType taskType, boolean isHardcoreModeEnabled, LocalDate dueDate,
      LocalDateTime createdAt, List<ChecklistItem> checklist,

      // --- Campos Específicos (Habit) ---
      int currentStreak, HabitType habitType,
      HabitResetCounter resetCounter, HabitImportanceType importanceType,
      LocalDateTime lastCompletedAt, int positiveCount, int negativeCount) {

    // O super envia os dados básicos lá pra cima para a classe abstrata cuidar
    super(id, boardColumnId, userId, name, description, orderIndex, priority,
        tags, difficulty, status, taskType, isHardcoreModeEnabled, null, createdAt, checklist);

    if (habitType == null) {
      throw new DomainValidationException("O tipo do hábito (POSITIVO, NEGATIVO, etc.) é obrigatório.");
    }
    if (resetCounter == null) {
      throw new DomainValidationException("O período de reset (DAILY, WEEKLY, etc.) é obrigatório para hábitos.");
    }
    if (importanceType == null) {
      throw new DomainValidationException("A importância do hábito é obrigatória.");
    }
    this.currentStreak = currentStreak;
    this.habitType = habitType;
    this.resetCounter = resetCounter;
    this.importanceType = importanceType;
    this.lastCompletedAt = lastCompletedAt;
    this.positiveCount = positiveCount;
    this.negativeCount = negativeCount;
  }

  public void updateHabitDetails(HabitType habitType, HabitResetCounter resetCounter,
      HabitImportanceType importanceType) {
    this.habitType = habitType;
    this.resetCounter = resetCounter;
    this.importanceType = importanceType;
  }

  private enum CycleRelation {
    SAME_CYCLE,
    CONSECUTIVE_CYCLE,
    BROKEN
  }

  private CycleRelation compareCycles(LocalDate lastDate, LocalDate currentDate) {
    return switch (this.resetCounter) {
      case DAILY -> {
        if (!lastDate.isBefore(currentDate)) {
          yield CycleRelation.SAME_CYCLE;
        }
        yield lastDate.isEqual(currentDate.minusDays(1))
            ? CycleRelation.CONSECUTIVE_CYCLE
            : CycleRelation.BROKEN;
      }
      case WEEKLY -> {
        java.time.temporal.WeekFields weekFields = java.time.temporal.WeekFields.ISO;
        int lastWeek = lastDate.get(weekFields.weekOfWeekBasedYear());
        int currentWeek = currentDate.get(weekFields.weekOfWeekBasedYear());
        int lastYear = lastDate.get(weekFields.weekBasedYear());
        int currentYear = currentDate.get(weekFields.weekBasedYear());

        if (lastYear > currentYear || (lastYear == currentYear && lastWeek >= currentWeek)) {
          yield CycleRelation.SAME_CYCLE;
        }
        LocalDate nextWeekDate = lastDate.plusWeeks(1);
        if (nextWeekDate.get(weekFields.weekBasedYear()) == currentYear
            && nextWeekDate.get(weekFields.weekOfWeekBasedYear()) == currentWeek) {
          yield CycleRelation.CONSECUTIVE_CYCLE;
        }
        yield CycleRelation.BROKEN;
      }
      case MONTHLY -> {
        java.time.Period period = java.time.Period.between(
            lastDate.withDayOfMonth(1), currentDate.withDayOfMonth(1));
        int monthsBetween = period.getYears() * 12 + period.getMonths();

        if (monthsBetween <= 0) {
          yield CycleRelation.SAME_CYCLE;
        }
        yield monthsBetween == 1 ? CycleRelation.CONSECUTIVE_CYCLE : CycleRelation.BROKEN;
      }
    };
  }

  public boolean isInSameCycle(LocalDate referenceDate) {
    if (this.lastCompletedAt == null) {
      return false;
    }
    LocalDate effectiveDate = referenceDate != null ? referenceDate : LocalDate.now();
    return compareCycles(this.lastCompletedAt.toLocalDate(), effectiveDate) == CycleRelation.SAME_CYCLE;
  }

  public boolean isStreakStillActive(LocalDate referenceDate) {
    if (this.currentStreak <= 0) {
      return false;
    }
    if (this.lastCompletedAt == null) {
      return true;
    }
    LocalDate effectiveDate = referenceDate != null ? referenceDate : LocalDate.now();
    CycleRelation relation = compareCycles(this.lastCompletedAt.toLocalDate(), effectiveDate);
    return relation == CycleRelation.SAME_CYCLE || relation == CycleRelation.CONSECUTIVE_CYCLE;
  }

  public int getEffectiveStreak(LocalDate referenceDate) {
    return isStreakStillActive(referenceDate) ? this.currentStreak : 0;
  }

  /**
   * Zera o streak caso o ciclo anterior tenha expirado sem conclusão (antes de calcular recompensa/incrementar).
   */
  public void refreshStreakForDate(LocalDate referenceDate) {
    if (this.currentStreak > 0 && this.lastCompletedAt != null && !isStreakStillActive(referenceDate)) {
      this.currentStreak = 0;
    }
  }

  @Override
  public TaskReward calculateReward() {
    return calculateReward(LocalDate.now());
  }

  @Override
  public TaskReward calculateReward(LocalDate referenceDate) {
    // 1. Define a recompensa base pela Importância
    int baseXp = switch (this.importanceType) {
      case LOW -> 5;
      case NORMAL -> 10;
      case HIGH -> 25;
    };
    
    BigDecimal baseCoins = switch (this.importanceType) {
      case LOW -> new BigDecimal("0.75");
      case NORMAL -> new BigDecimal("1.75");
      case HIGH -> new BigDecimal("3.75");
    };

    // 2. Multiplicadores baseados no tipo de ciclo
    int habitFormedThreshold = switch (this.resetCounter) {
      case DAILY -> 21; // 3 semanas para formar
      case WEEKLY -> 8; // 2 meses (8 semanas) para formar
      case MONTHLY -> 6; // 6 meses para formar
    };

    int adaptationThreshold = habitFormedThreshold / 3;
    int effectiveStreak = getEffectiveStreak(referenceDate);

    // 2. Aplica o decaimento baseado no Streak efetivo
    BigDecimal multiplier = BigDecimal.ONE;
    if (effectiveStreak >= habitFormedThreshold) {
      multiplier = HALF_RATE; // Hábito formado: paga metade
    } else if (effectiveStreak >= adaptationThreshold) {
      multiplier = ADAPTATION_RATE; // Adaptação: paga 75%
    }

    // Calcula o valor final arredondando para baixo
    int finalXp = Math.max(1, BigDecimal.valueOf(baseXp).multiply(multiplier).intValue());
    BigDecimal finalCoins = baseCoins
            .multiply(multiplier)
            .setScale(2, java.math.RoundingMode.HALF_DOWN);

    // Garante que ganhe no mínimo $ 0,01
    if (finalCoins.compareTo(MIN_COINS) < 0) {
        finalCoins = MIN_COINS;
    }
    
    return new TaskReward(finalXp, finalCoins);
  }

  @Override
  public void registerCompletion() {
    registerCompletion(LocalDateTime.now());
  }

  @Override
  public void registerCompletion(LocalDateTime completionTime) {
    if (completionTime == null) {
      completionTime = LocalDateTime.now();
    }

    this.positiveCount++;

    if (this.lastCompletedAt == null) {
      this.currentStreak = Math.max(1, this.currentStreak + 1);
      this.lastCompletedAt = completionTime;
      return;
    }

    CycleRelation relation = compareCycles(this.lastCompletedAt.toLocalDate(), completionTime.toLocalDate());
    switch (relation) {
      case SAME_CYCLE -> {
        this.lastCompletedAt = completionTime;
        return;
      }
      case CONSECUTIVE_CYCLE -> this.currentStreak++;
      case BROKEN -> this.currentStreak = 1;
    }

    this.lastCompletedAt = completionTime;
  }

  public void resetCycleCounts() {
    this.positiveCount = 0;
    this.negativeCount = 0;
  }

  public void registerNegative() {
    this.negativeCount++;
  }

  // Método de Domínio para falhas
  public void breakStreak() {
    this.currentStreak = 0;
  }

  // --- Getters ---
  public int getCurrentStreak() {
    return currentStreak;
  }

  public HabitType getHabitType() {
    return habitType;
  }

  public HabitResetCounter getResetCounter() {
    return resetCounter;
  }

  public HabitImportanceType getImportanceType() {
    return importanceType;
  }

  public LocalDateTime getLastCompletedAt() {
    return lastCompletedAt;
  }

  public int getPositiveCount() {
    return positiveCount;
  }

  public int getNegativeCount() {
    return negativeCount;
  }
}
