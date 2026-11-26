package com.habitparty.core.domain.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.exceptions.DomainValidationException;

public record TransactionHistory(
    UUID id,
    UUID userId,
    UUID referenceId,
    BigDecimal goldAmount,
    int xpAmount,
    BigDecimal priceSnapshot,
    TransactionType transactionType,
    String nameSnapshot,
    String iconSnapshot,
    RewardPackageLevel packageLevelSnapshot,
    TaskDifficulty difficultySnapshot,
    List<String> tagsSnapshot,
    String columnNameSnapshot,
    String descriptionSnapshot,
    Boolean checklistCompletedSnapshot,
    Integer effortUnitsSnapshot,
    LocalDateTime createdAt) implements OwnedByUser {

  public TransactionHistory {
    if (userId == null) {
      throw new DomainValidationException("O ID do usuário é obrigatório na transação.");
    }
    if (transactionType == null) {
      throw new DomainValidationException("O tipo da transação é obrigatório.");
    }
    if (nameSnapshot == null || nameSnapshot.trim().isEmpty()) {
      throw new DomainValidationException("O nome do snapshot é obrigatório para manter o histórico visível.");
    }

    id = id != null ? id : UUID.randomUUID();
    goldAmount = goldAmount != null ? goldAmount : BigDecimal.ZERO;
    effortUnitsSnapshot = (effortUnitsSnapshot != null && effortUnitsSnapshot > 0) ? effortUnitsSnapshot : null;
    createdAt = createdAt != null ? createdAt : LocalDateTime.now();
  }

  public TransactionHistory(UUID id, UUID userId, UUID referenceId,
      BigDecimal goldAmount, int xpAmount, BigDecimal priceSnapshot,
      TransactionType transactionType, String nameSnapshot,
      String iconSnapshot, RewardPackageLevel packageLevelSnapshot,
      TaskDifficulty difficultySnapshot, List<String> tagsSnapshot, LocalDateTime createdAt) {
    this(id, userId, referenceId, goldAmount, xpAmount, priceSnapshot, transactionType, nameSnapshot,
        iconSnapshot, packageLevelSnapshot, difficultySnapshot, tagsSnapshot, null, null, null, null, createdAt);
  }

  public TransactionHistory(UUID id, UUID userId, UUID referenceId,
      BigDecimal goldAmount, int xpAmount, BigDecimal priceSnapshot,
      TransactionType transactionType, String nameSnapshot,
      String iconSnapshot, RewardPackageLevel packageLevelSnapshot,
      TaskDifficulty difficultySnapshot, List<String> tagsSnapshot, String columnNameSnapshot,
      LocalDateTime createdAt) {
    this(id, userId, referenceId, goldAmount, xpAmount, priceSnapshot, transactionType, nameSnapshot,
        iconSnapshot, packageLevelSnapshot, difficultySnapshot, tagsSnapshot, columnNameSnapshot, null, null, null, createdAt);
  }

  public TransactionHistory(UUID id, UUID userId, UUID referenceId,
      BigDecimal goldAmount, int xpAmount, BigDecimal priceSnapshot,
      TransactionType transactionType, String nameSnapshot,
      String iconSnapshot, RewardPackageLevel packageLevelSnapshot,
      TaskDifficulty difficultySnapshot, List<String> tagsSnapshot, String columnNameSnapshot,
      String descriptionSnapshot, LocalDateTime createdAt) {
    this(id, userId, referenceId, goldAmount, xpAmount, priceSnapshot, transactionType, nameSnapshot,
        iconSnapshot, packageLevelSnapshot, difficultySnapshot, tagsSnapshot, columnNameSnapshot,
        descriptionSnapshot, null, null, createdAt);
  }

  public TransactionHistory(UUID id, UUID userId, UUID referenceId,
      BigDecimal goldAmount, int xpAmount, BigDecimal priceSnapshot,
      TransactionType transactionType, String nameSnapshot,
      String iconSnapshot, RewardPackageLevel packageLevelSnapshot,
      TaskDifficulty difficultySnapshot, List<String> tagsSnapshot, String columnNameSnapshot,
      String descriptionSnapshot, Boolean checklistCompletedSnapshot, LocalDateTime createdAt) {
    this(id, userId, referenceId, goldAmount, xpAmount, priceSnapshot, transactionType, nameSnapshot,
        iconSnapshot, packageLevelSnapshot, difficultySnapshot, tagsSnapshot, columnNameSnapshot,
        descriptionSnapshot, checklistCompletedSnapshot, null, createdAt);
  }

  @Override
  public String ownershipDeniedMessage() {
    return "Você não tem permissão para acessar esta transação.";
  }

  // --- Getters ---
  public UUID getId() {
    return id;
  }

  @Override
  public UUID getUserId() {
    return userId;
  }

  public TransactionType getTransactionType() {
    return transactionType;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public String getNameSnapshot() {
    return nameSnapshot;
  }

  public int getXpAmount() {
    return xpAmount;
  }

  public Optional<UUID> getReferenceId() {
    return Optional.ofNullable(referenceId);
  }

  public Optional<BigDecimal> getGoldAmount() {
    return Optional.ofNullable(goldAmount);
  }

  public Optional<BigDecimal> getPriceSnapshot() {
    return Optional.ofNullable(priceSnapshot);
  }

  public Optional<String> getIconSnapshot() {
    return Optional.ofNullable(iconSnapshot);
  }

  public Optional<TaskDifficulty> getDifficultySnapshot() {
    return Optional.ofNullable(difficultySnapshot);
  }

  public Optional<RewardPackageLevel> getPackageLevelSnapshot() {
    return Optional.ofNullable(packageLevelSnapshot);
  }

  public Optional<List<String>> getTagsSnapshot() {
    return Optional.ofNullable(tagsSnapshot);
  }

  public Optional<String> getColumnNameSnapshot() {
    return Optional.ofNullable(columnNameSnapshot);
  }

  public Optional<String> getDescriptionSnapshot() {
    return Optional.ofNullable(descriptionSnapshot);
  }

  public Optional<Boolean> getChecklistCompletedSnapshot() {
    return Optional.ofNullable(checklistCompletedSnapshot);
  }

  public Optional<Integer> getEffortUnitsSnapshot() {
    return Optional.ofNullable(effortUnitsSnapshot).filter(v -> v > 0);
  }
}
