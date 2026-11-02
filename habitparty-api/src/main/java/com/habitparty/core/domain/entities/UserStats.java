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
  private LocalDateTime updatedAt;

  public UserStats(
      UUID userId,
      BigDecimal currentCoins,
      BigDecimal totalGoldEarned,
      int totalXp,
      int currentStreak,
      int highestStreak,
      LocalDateTime updatedAt) {
    this.userId = userId;
    this.currentCoins = currentCoins != null ? currentCoins : BigDecimal.ZERO;
    this.totalGoldEarned = totalGoldEarned != null ? totalGoldEarned : BigDecimal.ZERO;
    this.totalXp = totalXp;
    this.currentStreak = currentStreak;
    this.highestStreak = highestStreak;
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

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }
}
