package com.habitparty.core.domain.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import com.habitparty.core.domain.enums.UserLevel;
import com.habitparty.core.exceptions.DomainValidationException;

public class UserStats {
  private UUID userId;
  private BigDecimal currentCoins;
  private BigDecimal totalGoldEarned;
  private int totalXp;
  private int currentStreak;
  private int highestStreak;
  private int totalTasksCompleted;
  private int totalHardTasksCompleted;
  private int totalHardcoreTasksCompleted;
  private int totalFocusMinutes;
  private int totalFocusSessions;
  private int longestFocusSessionMinutes;
  private int totalPomodorosCompleted;
  private int totalRewardsRedeemed;
  private int totalMysteryBoxesOpened;
  private int achievementPoints;
  // Contadores comportamentais das conquistas expandidas (Release 1.2)
  private int totalNightFocusSessions;
  private int totalEarlyFocusSessions;
  private int totalCouponsDepleted;
  private int totalWorkspacesCreated;
  private int totalChecklistTasksCompleted;
  private int totalOnTimeTodosCompleted;
  private int totalCleanHabitCycles;
  private int totalActivityGoalsMet;
  private LocalDateTime updatedAt;

  /** Janela "Coruja da Meia-Noite": sessões que terminam entre 23:00 e 04:59 (horário local do usuário). */
  public static final int NIGHT_OWL_START_HOUR = 23;
  public static final int NIGHT_OWL_END_HOUR = 5;
  /** Janela "Madrugador": sessões que começam entre 05:00 e 06:59 (horário local do usuário). */
  public static final int EARLY_BIRD_START_HOUR = 5;
  public static final int EARLY_BIRD_END_HOUR = 7;
  /** Duração mínima (minutos) para uma sessão contar nos contadores de foco. */
  public static final int MIN_FOCUS_MINUTES_FOR_STATS = 10;

  public UserStats(
      UUID userId,
      BigDecimal currentCoins,
      BigDecimal totalGoldEarned,
      int totalXp,
      int currentStreak,
      int highestStreak,
      LocalDateTime updatedAt) {
    this(
        userId,
        currentCoins,
        totalGoldEarned,
        totalXp,
        currentStreak,
        highestStreak,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        updatedAt);
  }

  public UserStats(
      UUID userId,
      BigDecimal currentCoins,
      BigDecimal totalGoldEarned,
      int totalXp,
      int currentStreak,
      int highestStreak,
      int totalTasksCompleted,
      int totalHardTasksCompleted,
      int totalHardcoreTasksCompleted,
      int totalFocusMinutes,
      int totalFocusSessions,
      int longestFocusSessionMinutes,
      int totalPomodorosCompleted,
      int totalRewardsRedeemed,
      int totalMysteryBoxesOpened,
      int achievementPoints,
      LocalDateTime updatedAt) {
    this.userId = userId;
    this.currentCoins = currentCoins != null ? currentCoins : BigDecimal.ZERO;
    this.totalGoldEarned = totalGoldEarned != null ? totalGoldEarned : BigDecimal.ZERO;
    this.totalXp = totalXp;
    this.currentStreak = currentStreak;
    this.highestStreak = highestStreak;
    this.totalTasksCompleted = Math.max(0, totalTasksCompleted);
    this.totalHardTasksCompleted = Math.max(0, totalHardTasksCompleted);
    this.totalHardcoreTasksCompleted = Math.max(0, totalHardcoreTasksCompleted);
    this.totalFocusMinutes = Math.max(0, totalFocusMinutes);
    this.totalFocusSessions = Math.max(0, totalFocusSessions);
    this.longestFocusSessionMinutes = Math.max(0, longestFocusSessionMinutes);
    this.totalPomodorosCompleted = Math.max(0, totalPomodorosCompleted);
    this.totalRewardsRedeemed = Math.max(0, totalRewardsRedeemed);
    this.totalMysteryBoxesOpened = Math.max(0, totalMysteryBoxesOpened);
    this.achievementPoints = Math.max(0, achievementPoints);
    this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
  }

  public static UserStats createInitial(UUID userId) {
    return new UserStats(
        userId,
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        0,
        0,
        0,
        LocalDateTime.now()
    );
  }

  public UserLevel getCurrentLevel() {
    UserLevel[] allLevels = UserLevel.values();
    UserLevel levelCalculado = allLevels[0];

    for (UserLevel level : allLevels) {
      if (this.totalXp >= level.getMinXpRequired()) {
        levelCalculado = level;
      } else {
        break;
      }
    }
    return levelCalculado;
  }

  public UserLevel getNextLevel() {
    UserLevel current = getCurrentLevel();
    UserLevel[] allLevels = UserLevel.values();
    int currentIndex = current.ordinal();

    if (currentIndex < allLevels.length - 1) {
      return allLevels[currentIndex + 1];
    }
    return current;
  }

  public int getXpToNextLevel() {
    UserLevel nextLevel = getNextLevel();
    if (this.getCurrentLevel() == nextLevel) {
      return 0;
    }
    return nextLevel.getMinXpRequired() - this.totalXp;
  }

  public void addXp(int xpToAdd) {
    if (xpToAdd <= 0) {
      throw new DomainValidationException("O XP a ser adicionado deve ser maior que zero.");
    }
    this.totalXp += xpToAdd;
    this.updatedAt = LocalDateTime.now();
  }

  public void removeXp(int xpToRemove) {
    if (xpToRemove <= 0) {
      throw new DomainValidationException("O XP a ser removido deve ser maior que zero.");
    }
    this.totalXp = Math.max(0, this.totalXp - xpToRemove);
    this.updatedAt = LocalDateTime.now();
  }

  public void applyPenalty(BigDecimal penaltyAmount, int xpPenalty) {
    if (penaltyAmount != null) {
      this.removeCoins(penaltyAmount);
    }

    if (xpPenalty > 0) {
      int minXpForCurrentLevel = this.getCurrentLevel().getMinXpRequired();
      int xpAfterPenalty = this.totalXp - xpPenalty;
      this.totalXp = Math.max(minXpForCurrentLevel, xpAfterPenalty);
    }
    this.updatedAt = LocalDateTime.now();
  }

  public void incrementStreak() {
    this.currentStreak += 1;
    if (this.currentStreak > this.highestStreak) {
      this.highestStreak = this.currentStreak;
    }
    this.updatedAt = LocalDateTime.now();
  }

  public void resetStreak() {
    this.currentStreak = 0;
    this.updatedAt = LocalDateTime.now();
  }

  public void addCoins(BigDecimal amount) {
    if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
      this.currentCoins = this.currentCoins.add(amount);
      this.totalGoldEarned = this.totalGoldEarned.add(amount);
      this.updatedAt = LocalDateTime.now();
    }
  }

  public void removeCoins(BigDecimal penaltyAmount) {
    if (penaltyAmount != null && penaltyAmount.compareTo(BigDecimal.ZERO) > 0) {
      this.currentCoins = this.currentCoins.subtract(penaltyAmount);
      if (this.currentCoins.compareTo(BigDecimal.ZERO) < 0) {
        this.currentCoins = BigDecimal.ZERO;
      }
      this.updatedAt = LocalDateTime.now();
    }
  }

  public void spendMoney(BigDecimal amountToSpend) {
    if (amountToSpend == null || amountToSpend.compareTo(BigDecimal.ZERO) < 0) {
      throw new DomainValidationException("Valor de cobrança inválido.");
    }
    if (this.currentCoins.compareTo(amountToSpend) < 0) {
      throw new DomainValidationException("Você não tem moedas suficientes para resgatar esta recompensa.");
    }
    this.currentCoins = this.currentCoins.subtract(amountToSpend);
    this.updatedAt = LocalDateTime.now();
  }

  // --- CONTADORES DE CONQUISTAS E VITRINE ---
  public void recordTaskCompleted(boolean isHard, boolean isHardcore) {
    this.totalTasksCompleted += 1;
    if (isHard) {
      this.totalHardTasksCompleted += 1;
    }
    if (isHardcore) {
      this.totalHardcoreTasksCompleted += 1;
    }
    this.updatedAt = LocalDateTime.now();
  }

  public void recordFocusCompleted(int durationMinutes, int completedPomos) {
    if (durationMinutes >= 10) {
      this.totalFocusMinutes += durationMinutes;
      this.totalFocusSessions += 1;
      if (durationMinutes > this.longestFocusSessionMinutes) {
        this.longestFocusSessionMinutes = durationMinutes;
      }
    }
    if (completedPomos > 0) {
      this.totalPomodorosCompleted += completedPomos;
    }
    this.updatedAt = LocalDateTime.now();
  }

  /**
   * Registra o horário da sessão de foco para as conquistas secretas de período
   * (Coruja da Meia-Noite e Madrugador). Usa o horário local enviado pelo cliente.
   */
  public void recordFocusTimeOfDay(LocalDateTime startTime, LocalDateTime endTime, int durationMinutes) {
    if (durationMinutes < MIN_FOCUS_MINUTES_FOR_STATS || startTime == null || endTime == null) {
      return;
    }
    int endHour = endTime.getHour();
    if (endHour >= NIGHT_OWL_START_HOUR || endHour < NIGHT_OWL_END_HOUR) {
      this.totalNightFocusSessions += 1;
    }
    int startHour = startTime.getHour();
    if (startHour >= EARLY_BIRD_START_HOUR && startHour < EARLY_BIRD_END_HOUR) {
      this.totalEarlyFocusSessions += 1;
    }
    this.updatedAt = LocalDateTime.now();
  }

  public void recordCouponDepleted() {
    this.totalCouponsDepleted += 1;
    this.updatedAt = LocalDateTime.now();
  }

  public void recordWorkspaceCreated() {
    this.totalWorkspacesCreated += 1;
    this.updatedAt = LocalDateTime.now();
  }

  public void recordChecklistTaskCompleted() {
    this.totalChecklistTasksCompleted += 1;
    this.updatedAt = LocalDateTime.now();
  }

  public void recordOnTimeTodoCompleted() {
    this.totalOnTimeTodosCompleted += 1;
    this.updatedAt = LocalDateTime.now();
  }

  public void recordCleanHabitCycle() {
    this.totalCleanHabitCycles += 1;
    this.updatedAt = LocalDateTime.now();
  }

  public void recordActivityGoalMet() {
    this.totalActivityGoalsMet += 1;
    this.updatedAt = LocalDateTime.now();
  }

  public void recordRewardRedeemed() {
    this.totalRewardsRedeemed += 1;
    this.updatedAt = LocalDateTime.now();
  }

  public void recordMysteryBoxOpened() {
    this.totalMysteryBoxesOpened += 1;
    this.updatedAt = LocalDateTime.now();
  }

  public void addAchievementPoints(int points) {
    if (points > 0) {
      this.achievementPoints += points;
      this.updatedAt = LocalDateTime.now();
    }
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public BigDecimal getCurrentCoins() {
    return currentCoins;
  }

  public void setCurrentCoins(BigDecimal currentCoins) {
    this.currentCoins = currentCoins;
    this.updatedAt = LocalDateTime.now();
  }

  public BigDecimal getTotalGoldEarned() {
    return totalGoldEarned;
  }

  public void setTotalGoldEarned(BigDecimal totalGoldEarned) {
    this.totalGoldEarned = totalGoldEarned;
    this.updatedAt = LocalDateTime.now();
  }

  public int getTotalXp() {
    return totalXp;
  }

  public void setTotalXp(int totalXp) {
    this.totalXp = totalXp;
    this.updatedAt = LocalDateTime.now();
  }

  public int getCurrentStreak() {
    return currentStreak;
  }

  public void setCurrentStreak(int currentStreak) {
    this.currentStreak = currentStreak;
    this.updatedAt = LocalDateTime.now();
  }

  public int getHighestStreak() {
    return highestStreak;
  }

  public void setHighestStreak(int highestStreak) {
    this.highestStreak = highestStreak;
    this.updatedAt = LocalDateTime.now();
  }

  public int getTotalTasksCompleted() {
    return totalTasksCompleted;
  }

  public void setTotalTasksCompleted(int totalTasksCompleted) {
    this.totalTasksCompleted = Math.max(0, totalTasksCompleted);
  }

  public int getTotalHardTasksCompleted() {
    return totalHardTasksCompleted;
  }

  public void setTotalHardTasksCompleted(int totalHardTasksCompleted) {
    this.totalHardTasksCompleted = Math.max(0, totalHardTasksCompleted);
  }

  public int getTotalHardcoreTasksCompleted() {
    return totalHardcoreTasksCompleted;
  }

  public void setTotalHardcoreTasksCompleted(int totalHardcoreTasksCompleted) {
    this.totalHardcoreTasksCompleted = Math.max(0, totalHardcoreTasksCompleted);
  }

  public int getTotalFocusMinutes() {
    return totalFocusMinutes;
  }

  public void setTotalFocusMinutes(int totalFocusMinutes) {
    this.totalFocusMinutes = Math.max(0, totalFocusMinutes);
  }

  public int getTotalFocusSessions() {
    return totalFocusSessions;
  }

  public void setTotalFocusSessions(int totalFocusSessions) {
    this.totalFocusSessions = Math.max(0, totalFocusSessions);
  }

  public int getLongestFocusSessionMinutes() {
    return longestFocusSessionMinutes;
  }

  public void setLongestFocusSessionMinutes(int longestFocusSessionMinutes) {
    this.longestFocusSessionMinutes = Math.max(0, longestFocusSessionMinutes);
  }

  public int getTotalPomodorosCompleted() {
    return totalPomodorosCompleted;
  }

  public void setTotalPomodorosCompleted(int totalPomodorosCompleted) {
    this.totalPomodorosCompleted = Math.max(0, totalPomodorosCompleted);
  }

  public int getTotalRewardsRedeemed() {
    return totalRewardsRedeemed;
  }

  public void setTotalRewardsRedeemed(int totalRewardsRedeemed) {
    this.totalRewardsRedeemed = Math.max(0, totalRewardsRedeemed);
  }

  public int getTotalMysteryBoxesOpened() {
    return totalMysteryBoxesOpened;
  }

  public void setTotalMysteryBoxesOpened(int totalMysteryBoxesOpened) {
    this.totalMysteryBoxesOpened = Math.max(0, totalMysteryBoxesOpened);
  }

  public int getAchievementPoints() {
    return achievementPoints;
  }

  public void setAchievementPoints(int achievementPoints) {
    this.achievementPoints = Math.max(0, achievementPoints);
  }

  public int getTotalNightFocusSessions() {
    return totalNightFocusSessions;
  }

  public void setTotalNightFocusSessions(int totalNightFocusSessions) {
    this.totalNightFocusSessions = Math.max(0, totalNightFocusSessions);
  }

  public int getTotalEarlyFocusSessions() {
    return totalEarlyFocusSessions;
  }

  public void setTotalEarlyFocusSessions(int totalEarlyFocusSessions) {
    this.totalEarlyFocusSessions = Math.max(0, totalEarlyFocusSessions);
  }

  public int getTotalCouponsDepleted() {
    return totalCouponsDepleted;
  }

  public void setTotalCouponsDepleted(int totalCouponsDepleted) {
    this.totalCouponsDepleted = Math.max(0, totalCouponsDepleted);
  }

  public int getTotalWorkspacesCreated() {
    return totalWorkspacesCreated;
  }

  public void setTotalWorkspacesCreated(int totalWorkspacesCreated) {
    this.totalWorkspacesCreated = Math.max(0, totalWorkspacesCreated);
  }

  public int getTotalChecklistTasksCompleted() {
    return totalChecklistTasksCompleted;
  }

  public void setTotalChecklistTasksCompleted(int totalChecklistTasksCompleted) {
    this.totalChecklistTasksCompleted = Math.max(0, totalChecklistTasksCompleted);
  }

  public int getTotalOnTimeTodosCompleted() {
    return totalOnTimeTodosCompleted;
  }

  public void setTotalOnTimeTodosCompleted(int totalOnTimeTodosCompleted) {
    this.totalOnTimeTodosCompleted = Math.max(0, totalOnTimeTodosCompleted);
  }

  public int getTotalCleanHabitCycles() {
    return totalCleanHabitCycles;
  }

  public void setTotalCleanHabitCycles(int totalCleanHabitCycles) {
    this.totalCleanHabitCycles = Math.max(0, totalCleanHabitCycles);
  }

  public int getTotalActivityGoalsMet() {
    return totalActivityGoalsMet;
  }

  public void setTotalActivityGoalsMet(int totalActivityGoalsMet) {
    this.totalActivityGoalsMet = Math.max(0, totalActivityGoalsMet);
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
