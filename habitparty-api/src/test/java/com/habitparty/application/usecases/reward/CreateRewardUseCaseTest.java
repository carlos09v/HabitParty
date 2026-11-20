package com.habitparty.application.usecases.reward;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
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
import org.mockito.ArgumentCaptor;
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
class CreateRewardUseCaseTest {

  @Mock
  private RewardRepository rewardRepository;

  @Mock
  private UserRepository userRepository;

  @InjectMocks
  private CreateRewardUseCase useCase;

  private UUID userId;
  private User freeUser;
  private User premiumUser;

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
    premiumUser = new User(
        userId,
        UserRole.USER,
        true,
        "Hero Premium",
        "heropremium",
        "premium@habitparty.com",
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

  private Reward buildExistingReward(
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

  private List<Reward> buildDistinctCards(int count) {
    List<Reward> list = new ArrayList<>();
    for (int i = 0; i < count; i++) {
      list.add(buildExistingReward(
          "Reward Card " + i,
          RewardType.SINGLE_USE,
          RewardCategory.ENTERTAINMENT,
          RewardPackageLevel.NONE,
          null));
    }
    return list;
  }

  @Test
  void shouldRejectZeroPriceWhenCreatingReward() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(freeUser));

    CreateRewardCommand cmd = new CreateRewardCommand(
        "Mimo grátis",
        "gift",
        null,
        BigDecimal.ZERO,
        RewardCategory.ENTERTAINMENT,
        List.of(),
        RewardType.SINGLE_USE,
        RewardPackageLevel.NONE,
        null);

    assertThrows(DomainValidationException.class, () -> useCase.execute(cmd, userId));
    verify(rewardRepository, never()).save(any());
  }

  @Test
  void shouldPersistOptionalPackageLevelForSingleUseWhileClearingDurationAndLoot() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(freeUser));
    when(rewardRepository.findAllByUserId(userId)).thenReturn(List.of());
    when(rewardRepository.getMaxOrderIndex(userId)).thenReturn(0);
    when(rewardRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    CreateRewardCommand cmd = new CreateRewardCommand(
        "Livro Novo",
        "book",
        "Livro técnico",
        new BigDecimal("50"),
        RewardCategory.HOBBIES,
        List.of(),
        RewardType.SINGLE_USE,
        RewardPackageLevel.EPIC,
        60);

    Reward saved = useCase.execute(cmd, userId);

    ArgumentCaptor<Reward> captor = ArgumentCaptor.forClass(Reward.class);
    verify(rewardRepository).save(captor.capture());
    assertEquals(Optional.of(RewardPackageLevel.EPIC), saved.getPackageLevel());
    assertEquals(Optional.empty(), captor.getValue().getBaseDurationMinutes());
    assertNull(captor.getValue().getLootItems());
  }

  @Test
  void shouldForcePackageLevelNoneWhenCategoryIsDebt() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(freeUser));
    when(rewardRepository.findAllByUserId(userId)).thenReturn(List.of());
    when(rewardRepository.getMaxOrderIndex(userId)).thenReturn(0);
    when(rewardRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    CreateRewardCommand cmd = new CreateRewardCommand(
        "Hora extra no YouTube",
        "tv",
        "30m unitário",
        new BigDecimal("8"),
        RewardCategory.DEBT,
        List.of(),
        RewardType.SINGLE_USE,
        RewardPackageLevel.EPIC,
        null);

    Reward saved = useCase.execute(cmd, userId);

    assertEquals(Optional.of(RewardPackageLevel.NONE), saved.getPackageLevel());
    assertEquals(Optional.of(RewardCategory.DEBT), saved.getCategory());
  }

  @Test
  @DisplayName("Usuário Free deve ser bloqueado ao tentar criar o 13º card distinto na vitrine")
  void shouldBlockFreeUserWhenDistinctCardLimitIsReached() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(freeUser));
    when(rewardRepository.findAllByUserId(userId))
        .thenReturn(buildDistinctCards(RewardGrouping.FREE_MAX_REWARD_CARDS));

    CreateRewardCommand cmd = new CreateRewardCommand(
        "Novo Card 13",
        "gift",
        null,
        new BigDecimal("10"),
        RewardCategory.ENTERTAINMENT,
        List.of(),
        RewardType.SINGLE_USE,
        RewardPackageLevel.NONE,
        null);

    assertThrows(LimitExceededException.class, () -> useCase.execute(cmd, userId));
    verify(rewardRepository, never()).save(any());
  }

  @Test
  @DisplayName("Usuário Free com 12 cards ainda pode adicionar novo pacote em um card de cupom existente")
  void shouldAllowFreeUserAtCardLimitToAddPackageToExistingGroup() {
    List<Reward> existing = buildDistinctCards(RewardGrouping.FREE_MAX_REWARD_CARDS - 1);
    existing.add(buildExistingReward(
        "Videogame (30m)",
        RewardType.TIME_BASED,
        RewardCategory.ENTERTAINMENT,
        RewardPackageLevel.BASIC,
        30));

    when(userRepository.findById(userId)).thenReturn(Optional.of(freeUser));
    when(rewardRepository.findAllByUserId(userId)).thenReturn(existing);
    when(rewardRepository.getMaxOrderIndex(userId)).thenReturn(11);
    when(rewardRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    CreateRewardCommand cmd = new CreateRewardCommand(
        "Videogame (1h)",
        "gamepad",
        null,
        new BigDecimal("15"),
        RewardCategory.ENTERTAINMENT,
        List.of(),
        RewardType.TIME_BASED,
        RewardPackageLevel.PREMIUM,
        60);

    Reward saved = useCase.execute(cmd, userId);
    assertEquals("Videogame (1h)", saved.getName());
    verify(rewardRepository).save(any());
  }

  @Test
  @DisplayName("Deve bloquear 5º pacote dentro do mesmo card agrupado")
  void shouldBlockFifthVariantInSameGroupedCard() {
    List<Reward> existing = List.of(
        buildExistingReward("Videogame (30m)", RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.BASIC, 30),
        buildExistingReward("Videogame (1h)", RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.PREMIUM, 60),
        buildExistingReward("Videogame (3h)", RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.EPIC, 180),
        buildExistingReward("Videogame (8h)", RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.LEGENDARY, 480)
    );

    when(userRepository.findById(userId)).thenReturn(Optional.of(freeUser));
    when(rewardRepository.findAllByUserId(userId)).thenReturn(existing);

    CreateRewardCommand cmd = new CreateRewardCommand(
        "Videogame (2h)",
        "gamepad",
        null,
        new BigDecimal("25"),
        RewardCategory.ENTERTAINMENT,
        List.of(),
        RewardType.TIME_BASED,
        RewardPackageLevel.NONE,
        120);

    assertThrows(LimitExceededException.class, () -> useCase.execute(cmd, userId));
    verify(rewardRepository, never()).save(any());
  }

  @Test
  @DisplayName("Usuário Premium pode criar mais de 12 cards e é bloqueado ao atingir 50 cards")
  void shouldAllowPremiumPastFreeLimitAndBlockAt50Cards() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(premiumUser));
    when(rewardRepository.findAllByUserId(userId))
        .thenReturn(buildDistinctCards(RewardGrouping.FREE_MAX_REWARD_CARDS));
    when(rewardRepository.getMaxOrderIndex(userId)).thenReturn(11);
    when(rewardRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    CreateRewardCommand cmdAllowed = new CreateRewardCommand(
        "Card 13 Premium",
        "crown",
        null,
        new BigDecimal("20"),
        RewardCategory.SHOPPING,
        List.of(),
        RewardType.SINGLE_USE,
        RewardPackageLevel.NONE,
        null);

    Reward saved = useCase.execute(cmdAllowed, userId);
    assertEquals("Card 13 Premium", saved.getName());

    when(rewardRepository.findAllByUserId(userId))
        .thenReturn(buildDistinctCards(RewardGrouping.PREMIUM_MAX_REWARD_CARDS));

    CreateRewardCommand cmdBlocked = new CreateRewardCommand(
        "Card 51 Premium",
        "crown",
        null,
        new BigDecimal("20"),
        RewardCategory.SHOPPING,
        List.of(),
        RewardType.SINGLE_USE,
        RewardPackageLevel.NONE,
        null);

    assertThrows(LimitExceededException.class, () -> useCase.execute(cmdBlocked, userId));
  }

  @Test
  @DisplayName("Deve impedir criação de dois pacotes com o mesmo nível nomeado (ex.: dois Básico) no mesmo card")
  void shouldRejectDuplicateNamedPackageLevelInSameGroup() {
    List<Reward> existing = List.of(
        buildExistingReward(
            "Videogame (30m)",
            RewardType.TIME_BASED,
            RewardCategory.ENTERTAINMENT,
            RewardPackageLevel.BASIC,
            30));

    when(userRepository.findById(userId)).thenReturn(Optional.of(freeUser));
    when(rewardRepository.findAllByUserId(userId)).thenReturn(existing);

    CreateRewardCommand duplicateBasic = new CreateRewardCommand(
        "Videogame (45m)",
        "gamepad",
        null,
        new BigDecimal("12"),
        RewardCategory.ENTERTAINMENT,
        List.of(),
        RewardType.TIME_BASED,
        RewardPackageLevel.BASIC,
        45);

    assertThrows(DomainValidationException.class, () -> useCase.execute(duplicateBasic, userId));
    verify(rewardRepository, never()).save(any());
  }

  @Test
  @DisplayName("Deve permitir múltiplos pacotes sem nível nomeado (NONE) no mesmo card até o teto de 4")
  void shouldAllowMultipleNonePackagesInSameGroup() {
    List<Reward> existing = List.of(
        buildExistingReward(
            "Videogame (15m)",
            RewardType.TIME_BASED,
            RewardCategory.ENTERTAINMENT,
            RewardPackageLevel.NONE,
            15));

    when(userRepository.findById(userId)).thenReturn(Optional.of(freeUser));
    when(rewardRepository.findAllByUserId(userId)).thenReturn(existing);
    when(rewardRepository.getMaxOrderIndex(userId)).thenReturn(0);
    when(rewardRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

    CreateRewardCommand secondNone = new CreateRewardCommand(
        "Videogame (45m)",
        "gamepad",
        null,
        new BigDecimal("12"),
        RewardCategory.ENTERTAINMENT,
        List.of(),
        RewardType.TIME_BASED,
        RewardPackageLevel.NONE,
        45);

    Reward saved = useCase.execute(secondNone, userId);
    assertEquals("Videogame (45m)", saved.getName());
    verify(rewardRepository).save(any());
  }
}
