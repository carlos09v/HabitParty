package com.habitparty.application.usecases.inventory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;

@ExtendWith(MockitoExtension.class)
class ReorderInventoryItemUseCaseTest {

  @Mock
  private InventoryItemRepository inventoryRepository;

  @InjectMocks
  private ReorderInventoryItemUseCase useCase;

  @Test
  void shouldPersistOnlyInventoryItemsWhoseOrderIndexChanged() {
    UUID userId = UUID.randomUUID();
    UUID rewardId = UUID.randomUUID();
    InventoryItem item0 = new InventoryItem(UUID.randomUUID(), userId, rewardId, "Café", BigDecimal.TEN, RewardType.SINGLE_USE, InventoryItemStatus.AVAILABLE, 0, "coffee", RewardPackageLevel.NONE, null, LocalDateTime.now());
    InventoryItem item1 = new InventoryItem(UUID.randomUUID(), userId, rewardId, "Café", BigDecimal.TEN, RewardType.SINGLE_USE, InventoryItemStatus.AVAILABLE, 1, "coffee", RewardPackageLevel.NONE, null, LocalDateTime.now());
    InventoryItem item2 = new InventoryItem(UUID.randomUUID(), userId, rewardId, "Jogo", BigDecimal.TEN, RewardType.TIME_BASED, InventoryItemStatus.AVAILABLE, 2, "gamepad", RewardPackageLevel.BASIC, 1800, LocalDateTime.now());

    when(inventoryRepository.findByUserIdAndStatusIn(userId, List.of(InventoryItemStatus.AVAILABLE, InventoryItemStatus.IN_FOCUS)))
        .thenReturn(List.of(item0, item1, item2));

    useCase.execute(userId, List.of(
        new InventoryItemOrderCommand(item2.getId(), 0),
        new InventoryItemOrderCommand(item0.getId(), 1),
        new InventoryItemOrderCommand(item1.getId(), 2)
    ));

    @SuppressWarnings("unchecked")
    ArgumentCaptor<List<InventoryItem>> captor = ArgumentCaptor.forClass(List.class);
    verify(inventoryRepository).saveAll(captor.capture());
    assertEquals(3, captor.getValue().size());
    assertEquals(0, item2.getOrderIndex());
    assertEquals(1, item0.getOrderIndex());
    assertEquals(2, item1.getOrderIndex());
  }

  @Test
  void shouldSkipSaveAllWhenNoInventoryOrderChanged() {
    UUID userId = UUID.randomUUID();
    UUID rewardId = UUID.randomUUID();
    InventoryItem item0 = new InventoryItem(UUID.randomUUID(), userId, rewardId, "Café", BigDecimal.TEN, RewardType.SINGLE_USE, InventoryItemStatus.AVAILABLE, 0, "coffee", RewardPackageLevel.NONE, null, LocalDateTime.now());

    when(inventoryRepository.findByUserIdAndStatusIn(userId, List.of(InventoryItemStatus.AVAILABLE, InventoryItemStatus.IN_FOCUS)))
        .thenReturn(List.of(item0));

    useCase.execute(userId, List.of(new InventoryItemOrderCommand(item0.getId(), 0)));

    verify(inventoryRepository, never()).saveAll(anyList());
  }
}
