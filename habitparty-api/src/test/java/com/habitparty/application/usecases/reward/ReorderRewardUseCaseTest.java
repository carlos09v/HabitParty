package com.habitparty.application.usecases.reward;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardType;

@ExtendWith(MockitoExtension.class)
class ReorderRewardUseCaseTest {

  @Mock
  private RewardRepository rewardRepository;

  @InjectMocks
  private ReorderRewardUseCase useCase;

  @Test
  void shouldPersistOnlyRewardsWhoseOrderIndexChanged() {
    UUID userId = UUID.randomUUID();
    Reward first = new Reward(UUID.randomUUID(), userId, "A", BigDecimal.TEN, List.of(), RewardType.SINGLE_USE, 0, "gift", null, RewardCategory.NONE, null, null);
    Reward second = new Reward(UUID.randomUUID(), userId, "B", BigDecimal.TEN, List.of(), RewardType.SINGLE_USE, 1, "gift", null, RewardCategory.NONE, null, null);
    Reward third = new Reward(UUID.randomUUID(), userId, "C", BigDecimal.TEN, List.of(), RewardType.SINGLE_USE, 2, "gift", null, RewardCategory.NONE, null, null);

    when(rewardRepository.findAllByUserId(userId)).thenReturn(List.of(first, second, third));

    useCase.execute(userId, List.of(
        new RewardOrderCommand(first.getId(), 0),
        new RewardOrderCommand(third.getId(), 1),
        new RewardOrderCommand(second.getId(), 2)
    ));

    @SuppressWarnings("unchecked")
    ArgumentCaptor<List<Reward>> captor = ArgumentCaptor.forClass(List.class);
    verify(rewardRepository).saveAll(captor.capture());
    assertEquals(2, captor.getValue().size());
    assertEquals(1, third.getOrder_index());
    assertEquals(2, second.getOrder_index());
  }

  @Test
  void shouldSkipSaveAllWhenNoOrderChanged() {
    UUID userId = UUID.randomUUID();
    Reward first = new Reward(UUID.randomUUID(), userId, "A", BigDecimal.TEN, List.of(), RewardType.SINGLE_USE, 0, "gift", null, RewardCategory.NONE, null, null);

    when(rewardRepository.findAllByUserId(userId)).thenReturn(List.of(first));

    useCase.execute(userId, List.of(new RewardOrderCommand(first.getId(), 0)));

    verify(rewardRepository, never()).saveAll(anyList());
  }

  @Test
  void shouldKeepDebtsPinnedFirstAndPreventReorderingDebts() {
    UUID userId = UUID.randomUUID();
    Reward regularA = new Reward(UUID.randomUUID(), userId, "A", BigDecimal.TEN, List.of(), RewardType.SINGLE_USE, 0, "gift", null, RewardCategory.ENTERTAINMENT, null, null);
    Reward regularB = new Reward(UUID.randomUUID(), userId, "B", BigDecimal.TEN, List.of(), RewardType.SINGLE_USE, 1, "gift", null, RewardCategory.ENTERTAINMENT, null, null);
    Reward debt1 = new Reward(UUID.randomUUID(), userId, "Dívida 1", BigDecimal.TEN, List.of(), RewardType.SINGLE_USE, 2, "flame", null, RewardCategory.DEBT, null, null);
    Reward debt2 = new Reward(UUID.randomUUID(), userId, "Dívida 2", BigDecimal.TEN, List.of(), RewardType.SINGLE_USE, 3, "flame", null, RewardCategory.DEBT, null, null);

    when(rewardRepository.findAllByUserId(userId)).thenReturn(List.of(regularA, regularB, debt1, debt2));

    // Mesmo tentando colocar recompensas regulares antes ou inverter as dívidas no payload,
    // dívidas ficam fixas primeiro (0, 1) e apenas regulares reordenam após elas (2, 3)
    useCase.execute(userId, List.of(
        new RewardOrderCommand(regularB.getId(), 0),
        new RewardOrderCommand(debt2.getId(), 1),
        new RewardOrderCommand(debt1.getId(), 2),
        new RewardOrderCommand(regularA.getId(), 3)
    ));

    @SuppressWarnings("unchecked")
    ArgumentCaptor<List<Reward>> captor = ArgumentCaptor.forClass(List.class);
    verify(rewardRepository).saveAll(captor.capture());
    assertEquals(4, captor.getValue().size());
    assertEquals(0, debt1.getOrder_index());
    assertEquals(1, debt2.getOrder_index());
    assertEquals(2, regularB.getOrder_index());
    assertEquals(3, regularA.getOrder_index());
  }

  @Test
  void shouldIgnoreAttemptToSwapPinnedDebtsAlone() {
    UUID userId = UUID.randomUUID();
    Reward debt1 = new Reward(UUID.randomUUID(), userId, "Dívida 1", BigDecimal.TEN, List.of(), RewardType.SINGLE_USE, 0, "flame", null, RewardCategory.DEBT, null, null);
    Reward debt2 = new Reward(UUID.randomUUID(), userId, "Dívida 2", BigDecimal.TEN, List.of(), RewardType.SINGLE_USE, 1, "flame", null, RewardCategory.DEBT, null, null);

    when(rewardRepository.findAllByUserId(userId)).thenReturn(List.of(debt1, debt2));

    useCase.execute(userId, List.of(
        new RewardOrderCommand(debt2.getId(), 0),
        new RewardOrderCommand(debt1.getId(), 1)
    ));

    verify(rewardRepository, never()).saveAll(anyList());
    assertEquals(0, debt1.getOrder_index());
    assertEquals(1, debt2.getOrder_index());
  }
}
