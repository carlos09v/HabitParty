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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.entities.reward.RewardGrouping;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;

@ExtendWith(MockitoExtension.class)
class UpdateRewardUseCaseTest {

  @Mock
  private RewardRepository rewardRepository;

  @Mock
  private UserRepository userRepository;

  @InjectMocks
  private UpdateRewardUseCase useCase;

  private UUID userId;
  private User freeUser;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    freeUser = new User(
        userId,
        UserRole.USER,
        false,
        "Hero Test",
        "herotest",
        "hero@habitparty.com",
        "hashed",
        BigDecimal.TEN,
        BigDecimal.TEN,
        LocalDate.of(1995, 1, 1),
        null,
        UserGender.MALE,
        0,
        0,
        0,
        LocalDateTime.now());
  }

  private Reward buildReward(
      String name, RewardType type, RewardCategory category, RewardPackageLevel pkg, Integer minutes) {
    return new Reward(
        UUID.randomUUID(),
        userId,
        name,
        new BigDecimal("10"),
        List.of(),
        type,
        0,
        "gamepad",
        null,
        category,
        minutes,
        pkg);
  }

  @Test
  @DisplayName("Deve bloquear renomeação de variante quando isso dividir o grupo e ultrapassar o limite de 12 cards")
  void shouldBlockVariantSplitThatExceedsFreeCardLimit() {
    List<Reward> userRewards = new ArrayList<>();
    for (int i = 0; i < RewardGrouping.FREE_MAX_REWARD_CARDS - 1; i++) {
      userRewards.add(buildReward(
          "Card " + i, RewardType.SINGLE_USE, RewardCategory.NONE, RewardPackageLevel.NONE, null));
    }
    Reward v1 = buildReward(
        "Videogame (30m)", RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.BASIC, 30);
    Reward v2 = buildReward(
        "Videogame (1h)", RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.PREMIUM, 60);
    userRewards.add(v1);
    userRewards.add(v2);

    when(userRepository.findById(userId)).thenReturn(Optional.of(freeUser));
    when(rewardRepository.findAllByUserId(userId)).thenReturn(userRewards);

    UpdateRewardCommand splitCmd = new UpdateRewardCommand(
        "Netflix (1h)",
        "tv",
        null,
        new BigDecimal("15"),
        RewardCategory.ENTERTAINMENT,
        List.of(),
        RewardType.TIME_BASED,
        RewardPackageLevel.PREMIUM,
        60);

    assertThrows(LimitExceededException.class, () -> useCase.execute(v2.getId(), splitCmd, userId));
    verify(rewardRepository, never()).save(any());
  }

  @Test
  @DisplayName("Usuário Free legado com mais de 12 cards pode continuar editando um card sem criar novos grupos")
  void shouldAllowGrandfatheredUserToEditExistingCardWithoutIncreasingGroupCount() {
    List<Reward> userRewards = new ArrayList<>();
    for (int i = 0; i < 15; i++) {
      userRewards.add(buildReward(
          "Card " + i, RewardType.SINGLE_USE, RewardCategory.NONE, RewardPackageLevel.NONE, null));
    }
    Reward target = userRewards.get(0);

    when(userRepository.findById(userId)).thenReturn(Optional.of(freeUser));
    when(rewardRepository.findAllByUserId(userId)).thenReturn(userRewards);
    when(rewardRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    UpdateRewardCommand editCmd = new UpdateRewardCommand(
        "Card Renomeado",
        "gift",
        "Nova desc",
        new BigDecimal("12"),
        RewardCategory.NONE,
        List.of(),
        RewardType.SINGLE_USE,
        RewardPackageLevel.NONE,
        null);

    Reward updated = useCase.execute(target.getId(), editCmd, userId);
    assertEquals("Card Renomeado", updated.getName());
    verify(rewardRepository).save(target);
  }

  @Test
  @DisplayName("Deve bloquear alteração do pacote para um nível já existente no mesmo card")
  void shouldRejectUpdatingPackageToDuplicateTierInSameGroup() {
    Reward v1 = buildReward(
        "Videogame (30m)", RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.BASIC, 30);
    Reward v2 = buildReward(
        "Videogame (1h)", RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.PREMIUM, 60);

    when(userRepository.findById(userId)).thenReturn(Optional.of(freeUser));
    when(rewardRepository.findAllByUserId(userId)).thenReturn(List.of(v1, v2));

    UpdateRewardCommand duplicateTierCmd = new UpdateRewardCommand(
        "Videogame (1h)",
        "gamepad",
        null,
        new BigDecimal("15"),
        RewardCategory.ENTERTAINMENT,
        List.of(),
        RewardType.TIME_BASED,
        RewardPackageLevel.BASIC,
        60);

    assertThrows(DomainValidationException.class, () -> useCase.execute(v2.getId(), duplicateTierCmd, userId));
    verify(rewardRepository, never()).save(any());
  }

  @Test
  @DisplayName("Deve validar cotas independentes ao converter card regular em dívida e vice-versa")
  void shouldValidateIndependentQuotasWhenSwitchingBetweenRegularAndDebt() {
    java.util.List<Reward> fullDebtsPlusOneRegular = new java.util.ArrayList<>();
    for (int i = 0; i < RewardGrouping.MAX_ACTIVE_DEBTS; i++) {
      fullDebtsPlusOneRegular.add(buildReward(
          "Dívida " + i, RewardType.SINGLE_USE, RewardCategory.DEBT, RewardPackageLevel.NONE, null));
    }
    Reward regularTarget = buildReward(
        "Regular", RewardType.SINGLE_USE, RewardCategory.NONE, RewardPackageLevel.NONE, null);
    fullDebtsPlusOneRegular.add(regularTarget);

    when(userRepository.findById(userId)).thenReturn(Optional.of(freeUser));
    when(rewardRepository.findAllByUserId(userId)).thenReturn(fullDebtsPlusOneRegular);

    UpdateRewardCommand toDebtCmd = new UpdateRewardCommand(
        "Regular", "gift", null, new BigDecimal("10"), RewardCategory.DEBT,
        List.of(), RewardType.SINGLE_USE, RewardPackageLevel.NONE, null);
    assertThrows(LimitExceededException.class, () -> useCase.execute(regularTarget.getId(), toDebtCmd, userId));

    java.util.List<Reward> fullRegularPlusOneDebt = new java.util.ArrayList<>();
    for (int i = 0; i < RewardGrouping.FREE_MAX_REWARD_CARDS; i++) {
      fullRegularPlusOneDebt.add(buildReward(
          "Regular " + i, RewardType.SINGLE_USE, RewardCategory.NONE, RewardPackageLevel.NONE, null));
    }
    Reward debtTarget = buildReward(
        "Dívida Extra", RewardType.SINGLE_USE, RewardCategory.DEBT, RewardPackageLevel.NONE, null);
    fullRegularPlusOneDebt.add(debtTarget);

    when(rewardRepository.findAllByUserId(userId)).thenReturn(fullRegularPlusOneDebt);

    UpdateRewardCommand toRegularCmd = new UpdateRewardCommand(
        "Dívida Extra", "gift", null, new BigDecimal("10"), RewardCategory.NONE,
        List.of(), RewardType.SINGLE_USE, RewardPackageLevel.NONE, null);
    assertThrows(LimitExceededException.class, () -> useCase.execute(debtTarget.getId(), toRegularCmd, userId));
  }
}
