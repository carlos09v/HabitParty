package com.habitparty.core.domain.entities;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.exceptions.DomainValidationException;

class InventoryItemDomainTest {

  private InventoryItem buildItem(RewardType type, InventoryItemStatus status, Integer remainingSeconds) {
    return new InventoryItem(
        UUID.randomUUID(),
        UUID.randomUUID(),
        UUID.randomUUID(),
        "Item Teste",
        BigDecimal.TEN,
        type,
        status,
        0,
        "gamepad",
        RewardPackageLevel.BASIC,
        remainingSeconds,
        LocalDateTime.now());
  }

  @Test
  @DisplayName("Deve permitir enviar cupom TIME_BASED com saldo para o Foco")
  void shouldAllowSendingAvailableTimeBasedItemWithRemainingSecondsToFocus() {
    InventoryItem item = buildItem(RewardType.TIME_BASED, InventoryItemStatus.AVAILABLE, 1800);

    item.sendToFocus();

    assertEquals(InventoryItemStatus.IN_FOCUS, item.getStatus());
  }

  @Test
  @DisplayName("Deve rejeitar envio ao Foco para itens que não são TIME_BASED")
  void shouldRejectSendingNonTimeBasedItemsToFocus() {
    InventoryItem singleUse = buildItem(RewardType.SINGLE_USE, InventoryItemStatus.AVAILABLE, null);
    InventoryItem mysteryBox = buildItem(RewardType.MISTERY_BOX, InventoryItemStatus.AVAILABLE, null);

    assertThrows(DomainValidationException.class, singleUse::sendToFocus);
    assertThrows(DomainValidationException.class, mysteryBox::sendToFocus);
  }

  @Test
  @DisplayName("Deve rejeitar envio ao Foco quando cupom estiver esgotado")
  void shouldRejectSendingDepletedCouponToFocus() {
    InventoryItem zeroSeconds = buildItem(RewardType.TIME_BASED, InventoryItemStatus.AVAILABLE, 0);
    InventoryItem oneSecond = buildItem(RewardType.TIME_BASED, InventoryItemStatus.AVAILABLE, 1);

    assertThrows(DomainValidationException.class, zeroSeconds::sendToFocus);
    assertThrows(DomainValidationException.class, oneSecond::sendToFocus);
  }

  @Test
  @DisplayName("Deve permitir devolver cupom com tempo restante para a mochila")
  void shouldAllowReturningTimeBasedItemWithRemainingSecondsToBackpack() {
    InventoryItem item = buildItem(RewardType.TIME_BASED, InventoryItemStatus.IN_FOCUS, 600);

    item.returnToBackpack();

    assertEquals(InventoryItemStatus.AVAILABLE, item.getStatus());
  }

  @Test
  @DisplayName("Deve rejeitar devolução para a mochila quando cupom em Foco estiver esgotado")
  void shouldRejectReturningDepletedCouponToBackpack() {
    InventoryItem zeroSeconds = buildItem(RewardType.TIME_BASED, InventoryItemStatus.IN_FOCUS, 0);
    InventoryItem oneSecond = buildItem(RewardType.TIME_BASED, InventoryItemStatus.IN_FOCUS, 1);

    assertThrows(DomainValidationException.class, zeroSeconds::returnToBackpack);
    assertThrows(DomainValidationException.class, oneSecond::returnToBackpack);
  }
}
