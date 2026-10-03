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
  }

  public void updateHabitDetails(HabitType habitType, HabitResetCounter resetCounter,
      HabitImportanceType importanceType) {
    this.habitType = habitType;
    this.resetCounter = resetCounter;
    this.importanceType = importanceType;
  }

  @Override
  public TaskReward calculateReward() {
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

    // 2. Aplica o decaimento baseado no Streak atual
    double multiplier = 1.0;
    if (this.currentStreak >= habitFormedThreshold) {
      multiplier = 0.5; // Hábito formado: paga metade
    } else if (this.currentStreak >= adaptationThreshold) {
      multiplier = 0.75; // Adaptação: paga 75%
    }

    // Calcula o valor final arredondando para baixo
    int finalXp = Math.max(1, (int) (baseXp * multiplier));
    BigDecimal finalCoins = baseCoins
            .multiply(BigDecimal.valueOf(multiplier))
            .setScale(2, java.math.RoundingMode.HALF_DOWN);

    // Garante que ganhe no mínimo $ 0,01
    if (finalCoins.compareTo(new BigDecimal("0.01")) < 0) {
        finalCoins = new BigDecimal("0.01");
    }
    
    return new TaskReward(finalXp, finalCoins);
  }

  @Override
  public void registerCompletion() {
    this.lastCompletedAt = LocalDateTime.now();
    this.currentStreak++;
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
}
