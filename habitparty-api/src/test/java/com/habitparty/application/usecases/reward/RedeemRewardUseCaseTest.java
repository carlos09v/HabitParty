package com.habitparty.application.usecases.reward;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;

@ExtendWith(MockitoExtension.class)
class RedeemRewardUseCaseTest {

  @Mock
  private RewardRepository rewardRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private InventoryItemRepository inventoryItemRepository;

  @Mock
  private TransactionHistoryRepository transactionHistoryRepository;

  @InjectMocks
  private RedeemRewardUseCase useCase;

  private UUID userId;
  private UUID rewardId;
  private User user;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    rewardId = UUID.randomUUID();

    user = new User(
        userId,
        UserRole.USER,
        false,
        "Hero Test",
        "herotest",
        "hero@habitparty.com",
        "hashed_pwd",
        new BigDecimal("100.00"),
        new BigDecimal("100.00"),
        LocalDate.of(1995, 1, 1),
        null,
        UserGender.MALE,
        0,
        0,
        0,
        LocalDateTime.now());
  }

  @Test
  @DisplayName("Recompensa na categoria DEBT deve descontar moedas imediatamente sem enviar para a mochila mesmo se lotada")
  void shouldImmediatelySettleDebtRewardWithoutAddingToInventory() {
    Reward debtReward = new Reward(
        rewardId,
        userId,
        "Vídeo urgente no YouTube",
        new BigDecimal("25.00"),
        List.of(),
        RewardType.SINGLE_USE,
        0,
        "tv",
        "Precisei assistir durante a entrega urgente",
        RewardCategory.DEBT,
        null,
        null);

    when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(debtReward));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    useCase.execute(rewardId, userId);

    assertEquals(new BigDecimal("75.00"), user.getCurrentCoins());
    assertEquals(0, user.getStats().getTotalRewardsRedeemed());
    verify(userRepository).save(user);
    verify(inventoryItemRepository, never()).countByUserId(any());
    verify(inventoryItemRepository, never()).getMaxOrderIndex(any());
    verify(inventoryItemRepository, never()).save(any());

    ArgumentCaptor<TransactionHistory> txCaptor = ArgumentCaptor.forClass(TransactionHistory.class);
    verify(transactionHistoryRepository).save(txCaptor.capture());
    assertEquals(TransactionType.REWARD_BOUGHT, txCaptor.getValue().getTransactionType());
    assertEquals(Optional.of(new BigDecimal("-25.00")), txCaptor.getValue().getGoldAmount());
    assertEquals(Optional.of(rewardId), txCaptor.getValue().getReferenceId());
    assertEquals(Optional.of("Precisei assistir durante a entrega urgente"),
        txCaptor.getValue().getDescriptionSnapshot());
  }

  @Test
  @DisplayName("Recompensas TIME_BASED ou MISTERY_BOX na categoria DEBT devem ser rejeitadas para não burlar mochila ou caixa")
  void shouldRejectNonSingleUseRewardsInDebtCategory() {
    Reward debtCoupon = new Reward(
        rewardId,
        userId,
        "Excesso no videogame",
        new BigDecimal("30.00"),
        List.of(),
        RewardType.TIME_BASED,
        0,
        "gamepad",
        null,
        RewardCategory.DEBT,
        60,
        null);

    Reward debtBox = new Reward(
        rewardId,
        userId,
        "Caixa Dívida",
        new BigDecimal("30.00"),
        List.of(),
        RewardType.MISTERY_BOX,
        0,
        "gift",
        null,
        RewardCategory.DEBT,
        null,
        RewardPackageLevel.BASIC);

    when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(debtCoupon));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    assertThrows(DomainValidationException.class, () -> useCase.execute(rewardId, userId));

    when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(debtBox));
    assertThrows(DomainValidationException.class, () -> useCase.execute(rewardId, userId));

    verify(userRepository, never()).save(any());
    verify(inventoryItemRepository, never()).save(any());
    verify(transactionHistoryRepository, never()).save(any());
  }

  @Test
  @DisplayName("Recompensa comum SingleUse deve continuar respeitando limite e indo para a mochila")
  void shouldSendRegularSingleUseRewardToInventoryAndCheckCapacity() {
    Reward regularReward = new Reward(
        rewardId,
        userId,
        "Chocolate",
        new BigDecimal("15.00"),
        List.of(),
        RewardType.SINGLE_USE,
        0,
        "pizza",
        "   ",
        RewardCategory.ENTERTAINMENT,
        null,
        null);

    when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(regularReward));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(inventoryItemRepository.countByUserId(userId)).thenReturn(2);
    when(inventoryItemRepository.getMaxOrderIndex(userId)).thenReturn(2);

    useCase.execute(rewardId, userId);

    assertEquals(new BigDecimal("85.00"), user.getCurrentCoins());
    verify(inventoryItemRepository).save(any());
    ArgumentCaptor<TransactionHistory> txCaptor = ArgumentCaptor.forClass(TransactionHistory.class);
    verify(transactionHistoryRepository).save(txCaptor.capture());
    assertEquals(Optional.empty(), txCaptor.getValue().getDescriptionSnapshot());
  }

  @Test
  @DisplayName("Recompensa comum deve falhar quando a mochila estiver lotada")
  void shouldThrowLimitExceededWhenRegularRewardAndBackpackFull() {
    Reward regularReward = new Reward(
        rewardId,
        userId,
        "Cinema",
        new BigDecimal("15.00"),
        List.of(),
        RewardType.SINGLE_USE,
        0,
        "clapperboard",
        null,
        RewardCategory.ENTERTAINMENT,
        null,
        null);

    when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(regularReward));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(inventoryItemRepository.countByUserId(userId)).thenReturn(20);

    assertThrows(LimitExceededException.class, () -> useCase.execute(rewardId, userId));
    verify(inventoryItemRepository, never()).save(any());
  }

  @Test
  @DisplayName("Quitação de Dívida com multiplicador deve cobrar preço unitário cheio sem desconto de pacote")
  void shouldChargeFullUnitPriceMultipliedByQuantityForDebtWithoutDiscount() {
    Reward debtReward = new Reward(
        rewardId,
        userId,
        "Videogame (30m)",
        new BigDecimal("8.00"),
        List.of(),
        RewardType.SINGLE_USE,
        0,
        "gamepad",
        null,
        RewardCategory.DEBT,
        null,
        RewardPackageLevel.NONE);

    when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(debtReward));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    useCase.execute(rewardId, userId, 6);

    assertEquals(new BigDecimal("52.00"), user.getCurrentCoins());
    verify(inventoryItemRepository, never()).save(any());

    ArgumentCaptor<TransactionHistory> txCaptor = ArgumentCaptor.forClass(TransactionHistory.class);
    verify(transactionHistoryRepository).save(txCaptor.capture());
    assertEquals(Optional.of(new BigDecimal("-48.00")), txCaptor.getValue().getGoldAmount());
    assertEquals("Videogame (30m) (6x)", txCaptor.getValue().getNameSnapshot());
  }

  @Test
  @DisplayName("Multiplicador maior que 1x deve ser rejeitado para recompensas que não são Dívida")
  void shouldRejectMultiplierGreaterThanOneForNonDebtReward() {
    Reward regularReward = new Reward(
        rewardId,
        userId,
        "Chocolate",
        new BigDecimal("15.00"),
        List.of(),
        RewardType.SINGLE_USE,
        0,
        "pizza",
        null,
        RewardCategory.ENTERTAINMENT,
        null,
        RewardPackageLevel.BASIC);

    when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(regularReward));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    assertThrows(DomainValidationException.class, () -> useCase.execute(rewardId, userId, 2));
    verify(userRepository, never()).save(any());
    verify(transactionHistoryRepository, never()).save(any());
  }
}
