package com.habitparty.application.usecases.reward;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyList;
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
import com.habitparty.application.ports.TransactionHistoryRepository;
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
class UpdateRewardGroupUseCaseTest {

  @Mock
  private RewardRepository rewardRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private TransactionHistoryRepository transactionHistoryRepository;

  @InjectMocks
  private UpdateRewardGroupUseCase useCase;

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
      String name, int orderIndex, RewardType type, RewardCategory category, RewardPackageLevel pkg, Integer minutes) {
    return new Reward(
        UUID.randomUUID(),
        userId,
        name,
        new BigDecimal("10"),
        List.of(),
        type,
        orderIndex,
        "gamepad",
        "desc antiga",
        category,
        minutes,
        pkg);
  }

  @Test
  @DisplayName("Deve renomear grupo inteiro atomicamente mesmo no limite de 12 cards, adicionar pacote e remover antigo")
  void shouldRenameAndSyncGroupedVariantsAtomicallyAtPlanLimit() {
    List<Reward> userRewards = new ArrayList<>();
    for (int i = 0; i < RewardGrouping.FREE_MAX_REWARD_CARDS - 1; i++) {
      userRewards.add(buildReward(
          "Card " + i, i, RewardType.SINGLE_USE, RewardCategory.NONE, RewardPackageLevel.NONE, null));
    }
    Reward v1 = buildReward(
        "Videogame (30m)", 11, RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.BASIC, 30);
    Reward v2 = buildReward(
        "Videogame (1h)", 12, RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.PREMIUM, 60);
    userRewards.add(v1);
    userRewards.add(v2);

    when(userRepository.findById(userId)).thenReturn(Optional.of(freeUser));
    when(rewardRepository.findAllByUserId(userId)).thenReturn(userRewards);
    when(rewardRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

    UpdateRewardGroupCommand command = new UpdateRewardGroupCommand(
        List.of(v1.getId(), v2.getId()),
        "PS5",
        "gamepad",
        "Sessão de PS5",
        RewardCategory.HOBBIES,
        List.of(),
        List.of(
            new UpdateRewardGroupCommand.VariantItem(
                v1.getId(), "PS5 (45m)", new BigDecimal("12"), RewardPackageLevel.BASIC, 45),
            new UpdateRewardGroupCommand.VariantItem(
                null, "PS5 (3h)", new BigDecimal("40"), RewardPackageLevel.EPIC, 180)),
        false);

    List<Reward> saved = useCase.execute(command, userId);

    assertEquals(2, saved.size());
    assertEquals("PS5 (45m)", saved.get(0).getName());
    assertEquals(45, saved.get(0).getBaseDurationMinutes().orElse(0));
    assertEquals("PS5 (3h)", saved.get(1).getName());
    assertEquals(180, saved.get(1).getBaseDurationMinutes().orElse(0));
    verify(rewardRepository).deleteById(v2.getId());
    verify(rewardRepository).saveAll(anyList());
  }

  @Test
  @DisplayName("Deve rejeitar atualização em grupo com mais de 4 pacotes")
  void shouldRejectMoreThanFourPackagesInGroup() {
    Reward v1 = buildReward(
        "Videogame (30m)", 0, RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.BASIC, 30);

    UpdateRewardGroupCommand command = new UpdateRewardGroupCommand(
        List.of(v1.getId()),
        "Videogame",
        "gamepad",
        "",
        RewardCategory.ENTERTAINMENT,
        List.of(),
        List.of(
            new UpdateRewardGroupCommand.VariantItem(v1.getId(), "Videogame (30m)", new BigDecimal("8"), RewardPackageLevel.BASIC, 30),
            new UpdateRewardGroupCommand.VariantItem(null, "Videogame (1h)", new BigDecimal("15"), RewardPackageLevel.PREMIUM, 60),
            new UpdateRewardGroupCommand.VariantItem(null, "Videogame (3h)", new BigDecimal("40"), RewardPackageLevel.EPIC, 180),
            new UpdateRewardGroupCommand.VariantItem(null, "Videogame (8h)", new BigDecimal("95"), RewardPackageLevel.LEGENDARY, 480),
            new UpdateRewardGroupCommand.VariantItem(null, "Videogame (10h)", new BigDecimal("120"), RewardPackageLevel.NONE, 600)),
        false);

    assertThrows(LimitExceededException.class, () -> useCase.execute(command, userId));
  }

  @Test
  @DisplayName("Deve rejeitar atualização em grupo com níveis nomeados duplicados (ex.: dois Premium)")
  void shouldRejectDuplicateNamedPackageTierInGroupUpdate() {
    Reward v1 = buildReward(
        "Videogame (30m)", 0, RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.BASIC, 30);
    Reward v2 = buildReward(
        "Videogame (1h)", 1, RewardType.TIME_BASED, RewardCategory.ENTERTAINMENT, RewardPackageLevel.PREMIUM, 60);

    when(userRepository.findById(userId)).thenReturn(Optional.of(freeUser));
    when(rewardRepository.findAllByUserId(userId)).thenReturn(List.of(v1, v2));

    UpdateRewardGroupCommand command = new UpdateRewardGroupCommand(
        List.of(v1.getId(), v2.getId()),
        "Videogame",
        "gamepad",
        "",
        RewardCategory.ENTERTAINMENT,
        List.of(),
        List.of(
            new UpdateRewardGroupCommand.VariantItem(
                v1.getId(), "Videogame (30m)", new BigDecimal("8"), RewardPackageLevel.PREMIUM, 30),
            new UpdateRewardGroupCommand.VariantItem(
                v2.getId(), "Videogame (1h)", new BigDecimal("15"), RewardPackageLevel.PREMIUM, 60)),
        false);

    assertThrows(DomainValidationException.class, () -> useCase.execute(command, userId));
  }
}
