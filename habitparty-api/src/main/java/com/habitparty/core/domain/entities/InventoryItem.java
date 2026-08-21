package com.habitparty.core.domain.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.UnauthorizedException;

public class InventoryItem {
  private UUID id;
  private UUID userId;
  private UUID rewardId;
  private String name_snapshot;
  private BigDecimal price_snapshot;
  private InventoryItemStatus status;
  private int orderIndex;
  private LocalDateTime acquiredAt;
  
  // Atributos opcionais (nullable)
  private String icon_snapshot;
  private Integer remainingMinutes; // Terá o valor do baseDurationMinutes como default

  public InventoryItem(UUID id, UUID userId, UUID rewardId, String name_snapshot, BigDecimal price_snapshot,
      InventoryItemStatus status, int orderIndex, LocalDateTime acquiredAt, String icon_snapshot,
      Integer remainingMinutes) {
    this.id = id;
    this.userId = userId;
    this.rewardId = rewardId;
    this.name_snapshot = name_snapshot;
    this.price_snapshot = price_snapshot;
    this.status = status;
    this.orderIndex = orderIndex;
    this.acquiredAt = acquiredAt;
    this.icon_snapshot = icon_snapshot;
    this.remainingMinutes = remainingMinutes;
  }

  // Regra 1: Gastar um item de uso único direto do inventário
  public void validateForConsumption() {
    if (this.status != InventoryItemStatus.AVAILABLE) {
      throw new DomainValidationException("Apenas itens disponíveis podem ser consumidos.");
    }
  }

  // Regra 2: Entrar no modo Foco
  public void startFocus() {
    if (this.status != InventoryItemStatus.AVAILABLE) {
      throw new DomainValidationException("O item precisa estar disponível para entrar em foco.");
    }
    this.status = InventoryItemStatus.IN_FOCUS;
  }

  // Regra 3: Cancelar o foco (devolve pro inventário sem mexer no tempo)
  public void cancelFocus() {
    if (this.status != InventoryItemStatus.IN_FOCUS) {
      throw new DomainValidationException("O item não está em modo foco para ser cancelado.");
    }
    this.status = InventoryItemStatus.AVAILABLE;
  }

  // Regra 4: Subtrair o tempo consumido (O "Salvar Automático")
  public void deductConsumedTime(int minutesConsumed) {
    if (this.remainingMinutes == null)
      return; // Proteção caso seja Single Use

    this.remainingMinutes -= minutesConsumed;
  }

  public void validateOwnership(UUID userIdLogado) {
    if (!this.userId.equals(userIdLogado)) {
      throw new UnauthorizedException("Você não tem permissão!");
    }
  }
  

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

  public String getName_snapshot() {
    return name_snapshot;
  }

  public void setName_snapshot(String name_snapshot) {
    this.name_snapshot = name_snapshot;
  }

  public BigDecimal getPrice_snapshot() {
    return price_snapshot;
  }

  public void setPrice_snapshot(BigDecimal price_snapshot) {
    this.price_snapshot = price_snapshot;
  }

  public Optional<String> getIcon_snapshot() {
    return Optional.ofNullable(icon_snapshot);
  }

  public void setIcon_snapshot(String icon_snapshot) {
    this.icon_snapshot = icon_snapshot;
  }
}
