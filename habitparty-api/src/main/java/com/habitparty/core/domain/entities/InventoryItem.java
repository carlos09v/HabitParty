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
  private Integer remainingMinutes; // Terá o valor do baseDurationMinutes como default

  public InventoryItem(UUID id, UUID userId, UUID rewardId, String nameSnapshot, BigDecimal priceSnapshot,
      RewardType rewardTypeSnapshot, InventoryItemStatus status, int orderIndex,
      String iconSnapshot, RewardPackageLevel packageLevelSnapshot, Integer remainingMinutes,
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
    this.remainingMinutes = remainingMinutes;
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
  public void deductTime(int minutesSpent) {
    if (this.status != InventoryItemStatus.IN_FOCUS) {
      throw new IllegalStateException("O tempo só pode ser descontado de itens em foco.");
    }

    // Garante que não fique negativo, parando no 0
    this.remainingMinutes = Math.max(0, this.remainingMinutes - minutesSpent);
  }

  public void refundTime(int minutesToRefund) {
    if (minutesToRefund < 0) {
      throw new DomainValidationException("Os minutos de reembolso não podem ser negativos.");
    }

    // Verifica se é um item baseado em tempo (null pointer safe)
    if (this.remainingMinutes != null) {
      this.remainingMinutes += minutesToRefund;

      // Se o item estava esgotado, ele "ressuscita" e volta para a mochila
      if (this.status == InventoryItemStatus.CONSUMED && this.remainingMinutes > 0) {
        this.status = InventoryItemStatus.AVAILABLE;
      }
    }
  }

  // O usuário CLICA no botão "Concluir" na tela de foco ou no inventário
  public void consume() {
    if (this.status != InventoryItemStatus.IN_FOCUS && this.status != InventoryItemStatus.AVAILABLE) {
      throw new IllegalStateException("Este item não pode ser consumido no estado atual.");
    }

    // Se o item está no foco e é baseado em tempo, barra o consumo se ainda houver saldo
    if (this.status == InventoryItemStatus.IN_FOCUS && this.remainingMinutes != null && this.remainingMinutes > 0) {
      throw new DomainValidationException("Você precisa gastar todo o tempo do item no timer antes de concluí-lo.");
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
    return Optional.ofNullable(remainingMinutes);
  }

  public void setRemainingMinutes(Integer remainingMinutes) {
    this.remainingMinutes = remainingMinutes;
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
