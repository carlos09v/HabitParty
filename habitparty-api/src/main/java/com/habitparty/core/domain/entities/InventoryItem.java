package com.habitparty.core.domain.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.UnauthorizedException;

public class InventoryItem {
  private UUID id;
  private UUID userId;
  private UUID rewardId;
  private String nameSnapshot;
  private BigDecimal priceSnapshot;
  private RewardType rewardTypeSnapshot;
  private InventoryItemStatus status;
  private int orderIndex;
  private LocalDateTime acquiredAt;

  // Atributos opcionais (nullable)
  private String iconSnapshot;
  private RewardPackageLevel packageLevelSnapshot;
  private Integer remainingSeconds;

  public InventoryItem(UUID id, UUID userId, UUID rewardId, String nameSnapshot, BigDecimal priceSnapshot,
      RewardType rewardTypeSnapshot, InventoryItemStatus status, int orderIndex,
      String iconSnapshot, RewardPackageLevel packageLevelSnapshot, Integer remainingSeconds,
      LocalDateTime acquiredAt) {
    this.id = id;
    this.userId = userId;
    this.rewardId = rewardId;
    this.nameSnapshot = nameSnapshot;
    this.priceSnapshot = priceSnapshot;
    this.rewardTypeSnapshot = rewardTypeSnapshot;
    this.status = status;
    this.orderIndex = orderIndex;
    this.acquiredAt = acquiredAt;
    this.iconSnapshot = iconSnapshot;
    this.packageLevelSnapshot = packageLevelSnapshot;
    this.remainingSeconds = remainingSeconds;
  }

  public void validateOwnership(UUID userIdLogado) {
    if (!this.userId.equals(userIdLogado)) {
      throw new UnauthorizedException("Você não tem permissão!");
    }
  }

  // Gastar um item de uso único direto do inventário
  public void validateForConsumption() {
    if (this.status != InventoryItemStatus.AVAILABLE) {
      throw new DomainValidationException("Apenas itens disponíveis podem ser consumidos.");
    }
  }

  // Enviar para o modo Foco
  public void sendToFocus() {
    if (this.status != InventoryItemStatus.AVAILABLE) {
      throw new DomainValidationException("O item precisa estar disponível para entrar em foco.");
    }
    this.status = InventoryItemStatus.IN_FOCUS;
  }

  // Cancelar o foco (devolve pro inventário sem mexer no tempo)
  public void returnToBackpack() {
    if (this.status != InventoryItemStatus.IN_FOCUS) {
      throw new DomainValidationException("O item não está no foco para ser devolvido.");
    }
    this.status = InventoryItemStatus.AVAILABLE;
  }

  // O tempo é descontado, mas o item NÃO SOME SOZINHO se zerar.
  public void deductSeconds(int secondsSpent) {
    if (this.status != InventoryItemStatus.IN_FOCUS) {
      throw new IllegalStateException("O tempo só pode ser descontado de itens em foco.");
    }

    if (this.remainingSeconds == null) {
      return;
    }

    // Garante que não fique negativo, parando no 0
    this.remainingSeconds = Math.max(0, this.remainingSeconds - secondsSpent);
  }

  public void deductTime(int minutesSpent) {
    deductSeconds(minutesSpent * 60);
  }

  public void refundTime(int minutesToRefund) {
    if (minutesToRefund < 0) {
      throw new DomainValidationException("Os minutos de reembolso não podem ser negativos.");
    }

    // Verifica se é um item baseado em tempo (null pointer safe)
    if (this.remainingSeconds != null) {
      this.remainingSeconds += minutesToRefund * 60;

      // Se o item estava esgotado, ele "ressuscita" e volta para a mochila
      if (this.status == InventoryItemStatus.CONSUMED && this.remainingSeconds > 0) {
        this.status = InventoryItemStatus.AVAILABLE;
      }
    }
  }

  // O usuário CLICA no botão "Concluir" na tela de foco ou no inventário
  public void consume() {
    if (this.status != InventoryItemStatus.IN_FOCUS && this.status != InventoryItemStatus.AVAILABLE) {
      throw new IllegalStateException("Este item não pode ser consumido no estado atual.");
    }

    // Se o item está no foco e é baseado em tempo, barra o consumo se ainda houver saldo significativo
    if (this.status == InventoryItemStatus.IN_FOCUS) {
      if (this.remainingSeconds != null && this.remainingSeconds > 1) {
        throw new DomainValidationException("Você precisa gastar todo o tempo do item no timer antes de concluí-lo.");
      }
      this.remainingSeconds = 0;
    }

    // Muda o status e ele desaparece permanentemente do Foco e da Mochila
    this.status = InventoryItemStatus.CONSUMED;
  }

  public void discard() {
    if (this.status == InventoryItemStatus.CONSUMED) {
      throw new IllegalStateException("Não é possível descartar um item que já foi consumido.");
    }
    this.status = InventoryItemStatus.DISCARDED;
  }

  // --- Getters and Setters ---
  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getUserId() {
    return userId;
  }

  public void setUserId(UUID userId) {
    this.userId = userId;
  }

  public UUID getRewardId() {
    return rewardId;
  }

  public void setRewardId(UUID rewardId) {
    this.rewardId = rewardId;
  }

  public InventoryItemStatus getStatus() {
    return status;
  }

  public void setStatus(InventoryItemStatus status) {
    this.status = status;
  }

  public int getOrderIndex() {
    return orderIndex;
  }

  public void setOrderIndex(int orderIndex) {
    this.orderIndex = orderIndex;
  }

  public Optional<Integer> getRemainingMinutes() {
    return remainingSeconds != null
        ? Optional.of((int) Math.ceil(remainingSeconds / 60.0))
        : Optional.empty();
  }

  public void setRemainingMinutes(Integer remainingMinutes) {
    this.remainingSeconds = remainingMinutes != null ? remainingMinutes * 60 : null;
  }

  public Optional<Integer> getRemainingSeconds() {
    return Optional.ofNullable(remainingSeconds);
  }

  public void setRemainingSeconds(Integer remainingSeconds) {
    this.remainingSeconds = remainingSeconds;
  }

  public LocalDateTime getAcquiredAt() {
    return acquiredAt;
  }

  public void setAcquiredAt(LocalDateTime acquiredAt) {
    this.acquiredAt = acquiredAt;
  }

  public String getNameSnapshot() {
    return nameSnapshot;
  }

  public void setNameSnapshot(String nameSnapshot) {
    this.nameSnapshot = nameSnapshot;
  }

  public BigDecimal getPriceSnapshot() {
    return priceSnapshot;
  }

  public void setPriceSnapshot(BigDecimal priceSnapshot) {
    this.priceSnapshot = priceSnapshot;
  }

  public Optional<String> getIconSnapshot() {
    return Optional.ofNullable(iconSnapshot);
  }

  public void setIcon_snapshot(String iconSnapshot) {
    this.iconSnapshot = iconSnapshot;
  }

  public RewardType getRewardTypeSnapshot() {
    return rewardTypeSnapshot;
  }

  public void setRewardType_snapshot(RewardType rewardTypeSnapshot) {
    this.rewardTypeSnapshot = rewardTypeSnapshot;
  }

  public void setRewardTypeSnapshot(RewardType rewardTypeSnapshot) {
    this.rewardTypeSnapshot = rewardTypeSnapshot;
  }

  public void setIconSnapshot(String iconSnapshot) {
    this.iconSnapshot = iconSnapshot;
  }

  public Optional<RewardPackageLevel> getPackageLevelSnapshot() {
    return Optional.ofNullable(packageLevelSnapshot);
  }

  public void setPackageLevelSnapshot(RewardPackageLevel packageLevelSnapshot) {
    this.packageLevelSnapshot = packageLevelSnapshot;
  }
}
