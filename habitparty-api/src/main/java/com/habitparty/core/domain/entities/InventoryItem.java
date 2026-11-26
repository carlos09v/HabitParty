package com.habitparty.core.domain.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.reward.MysteryBoxLootItem;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.exceptions.DomainValidationException;

public class InventoryItem implements OwnedByUser {
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
  private List<MysteryBoxLootItem> lootItemsSnapshot;

  public InventoryItem(UUID id, UUID userId, UUID rewardId, String nameSnapshot, BigDecimal priceSnapshot,
      RewardType rewardTypeSnapshot, InventoryItemStatus status, int orderIndex,
      String iconSnapshot, RewardPackageLevel packageLevelSnapshot, Integer remainingSeconds,
      LocalDateTime acquiredAt) {
    this(id, userId, rewardId, nameSnapshot, priceSnapshot, rewardTypeSnapshot, status, orderIndex,
        iconSnapshot, packageLevelSnapshot, remainingSeconds, acquiredAt, null);
  }

  public InventoryItem(UUID id, UUID userId, UUID rewardId, String nameSnapshot, BigDecimal priceSnapshot,
      RewardType rewardTypeSnapshot, InventoryItemStatus status, int orderIndex,
      String iconSnapshot, RewardPackageLevel packageLevelSnapshot, Integer remainingSeconds,
      LocalDateTime acquiredAt, List<MysteryBoxLootItem> lootItemsSnapshot) {
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
    this.lootItemsSnapshot = lootItemsSnapshot;
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
    if (this.rewardTypeSnapshot != RewardType.TIME_BASED) {
      throw new DomainValidationException("Apenas cupons de tempo podem ser enviados para o modo Foco.");
    }
    if (this.remainingSeconds != null && this.remainingSeconds <= 1) {
      throw new DomainValidationException("Este cupom não possui tempo restante para entrar em foco.");
    }
    this.status = InventoryItemStatus.IN_FOCUS;
  }

  // Cancelar o foco (devolve pro inventário sem mexer no tempo)
  public void returnToBackpack() {
    if (this.status != InventoryItemStatus.IN_FOCUS) {
      throw new DomainValidationException("O item não está no foco para ser devolvido.");
    }
    if (this.remainingSeconds != null && this.remainingSeconds <= 1) {
      throw new DomainValidationException("Cupons esgotados devem ser concluídos em vez de devolvidos à mochila.");
    }
    this.status = InventoryItemStatus.AVAILABLE;
  }

  // O tempo é descontado, mas o item NÃO SOME SOZINHO se zerar.
  public void deductSeconds(int secondsSpent) {
    if (this.status != InventoryItemStatus.IN_FOCUS) {
      throw new DomainValidationException("O tempo só pode ser descontado de itens em foco.");
    }
    if (secondsSpent < 0) {
      throw new DomainValidationException("Os segundos descontados não podem ser negativos.");
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
    refundSeconds(minutesToRefund * 60);
  }

  /**
   * Reembolsa tempo exato em segundos ao saldo do item no inventário, reativando cupons
   * previamente marcados como CONSUMED quando voltarem a ter saldo positivo.
   */
  public void refundSeconds(int secondsToRefund) {
    if (secondsToRefund < 0) {
      throw new DomainValidationException("Os segundos de reembolso não podem ser negativos.");
    }

    // Verifica se é um item baseado em tempo (null pointer safe)
    if (this.remainingSeconds != null) {
      this.remainingSeconds += secondsToRefund;

      // Se o item estava esgotado, ele "ressuscita" e volta para a mochila
      if (this.status == InventoryItemStatus.CONSUMED && this.remainingSeconds > 0) {
        this.status = InventoryItemStatus.AVAILABLE;
      }
    }
  }

  /**
   * Ajusta o saldo de segundos ao editar um registro existente deste mesmo item,
   * estornando os segundos anteriores e debitando os novos segundos sem permitir saldo negativo.
   */
  public void adjustFocusSeconds(int oldSeconds, int newSeconds) {
    if (this.status == InventoryItemStatus.DISCARDED) {
      throw new DomainValidationException("Não é possível alterar o tempo de um item descartado.");
    }
    if (this.remainingSeconds == null) {
      return;
    }
    int safeOld = Math.max(0, oldSeconds);
    int safeNew = Math.max(0, newSeconds);
    int restored = this.remainingSeconds + safeOld;
    if (safeNew > restored) {
      throw new DomainValidationException(
          "A duração da sessão excede o tempo disponível do item (" + (restored / 60) + "m).");
    }
    this.remainingSeconds = restored - safeNew;
    if (this.status == InventoryItemStatus.CONSUMED && this.remainingSeconds > 0) {
      this.status = InventoryItemStatus.AVAILABLE;
    }
  }

  // O usuário CLICA no botão "Concluir" na tela de foco ou no inventário
  public void consume() {
    if (this.status != InventoryItemStatus.IN_FOCUS && this.status != InventoryItemStatus.AVAILABLE) {
      throw new DomainValidationException("Este item não pode ser consumido no estado atual.");
    }

    if (this.status == InventoryItemStatus.AVAILABLE) {
      if (this.rewardTypeSnapshot == RewardType.MISTERY_BOX) {
        throw new DomainValidationException("Caixas misteriosas devem ser abertas antes de serem consumidas.");
      }
      if (this.rewardTypeSnapshot == RewardType.TIME_BASED
          && this.remainingSeconds != null
          && this.remainingSeconds > 1) {
        throw new DomainValidationException(
            "Cupons de tempo devem ser usados no modo Foco antes de serem concluídos.");
      }
      if (this.rewardTypeSnapshot == RewardType.TIME_BASED) {
        this.remainingSeconds = 0;
      }
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
      throw new DomainValidationException("Não é possível descartar um item que já foi consumido.");
    }
    if (this.status == InventoryItemStatus.DISCARDED) {
      throw new DomainValidationException("Este item já foi descartado.");
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

  public RewardType getRewardTypeSnapshot() {
    return rewardTypeSnapshot;
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

  public List<MysteryBoxLootItem> getLootItemsSnapshot() {
    return lootItemsSnapshot;
  }

  public void setLootItemsSnapshot(List<MysteryBoxLootItem> lootItemsSnapshot) {
    this.lootItemsSnapshot = lootItemsSnapshot;
  }
}
