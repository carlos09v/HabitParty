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
import com.habitparty.core.exceptions.UnauthorizedException;

public class TransactionHistory {
  private final UUID id;
  private final UUID userId;
  private final TransactionType transactionType;
  private final LocalDateTime createdAt;

  // Soft-link unificado (Aponta para Task, Reward, InventoryItem ou FocusRecord)
  private final UUID referenceId;

  // Snapshots (O que garante que a UI não quebre se a origem for deletada)
  private final String nameSnapshot;

  private final BigDecimal goldAmount; // Positivo (ganhou moeda) ou Negativo (gastou)
  private final int xpAmount;
  private final BigDecimal priceSnapshot;
  private final String iconSnapshot;
  private final TaskDifficulty difficultySnapshot;
  private final RewardPackageLevel packageLevelSnapshot;
  private final List<String> tagsSnapshot;

  public TransactionHistory(UUID id, UUID userId, UUID referenceId,
      BigDecimal goldAmount, int xpAmount, BigDecimal priceSnapshot,
      TransactionType transactionType, String nameSnapshot,
      String iconSnapshot, RewardPackageLevel packageLevelSnapshot,
      TaskDifficulty difficultySnapshot, List<String> tagsSnapshot, LocalDateTime createdAt) {

    // Validações de integridade do Livro-Caixa
    if (userId == null)
      throw new DomainValidationException("O ID do usuário é obrigatório na transação.");
    if (transactionType == null)
      throw new DomainValidationException("O tipo da transação é obrigatório.");
    if (nameSnapshot == null || nameSnapshot.trim().isEmpty()) {
      throw new DomainValidationException("O nome do snapshot é obrigatório para manter o histórico visível.");
    }

    this.id = id != null ? id : UUID.randomUUID();
    this.userId = userId;
    this.referenceId = referenceId;
    this.transactionType = transactionType;
    this.nameSnapshot = nameSnapshot;

    // Se vier nulo, assume 0 (nenhuma movimentação financeira/XP)
    this.goldAmount = goldAmount != null ? goldAmount : BigDecimal.ZERO;
    this.xpAmount = xpAmount;

    this.priceSnapshot = priceSnapshot;
    this.iconSnapshot = iconSnapshot;
    this.packageLevelSnapshot = packageLevelSnapshot;
    this.difficultySnapshot = difficultySnapshot;
    this.tagsSnapshot = tagsSnapshot;
    this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
  }

  public void validateOwnership(UUID userIdLogado) {
    if (!this.userId.equals(userIdLogado)) {
      throw new UnauthorizedException("Você não tem permissão para acessar esta transação.");
    }
  }

  // --- Getters ---
  public UUID getId() {
    return id;
  }

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

  // Retorna tipo primitivo porque int nunca é null (se não houver ganho, é 0)
  public int getXpAmount() {
    return xpAmount;
  }

  // Usando Optionals para os campos que realmente podem ser nulos no banco
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
}