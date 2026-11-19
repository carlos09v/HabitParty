package com.habitparty.application.usecases.achievement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.application.ports.AchievementRepository;
import com.habitparty.application.ports.ArtifactRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserArtifactRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.UpdateProfileHighlightsUseCase.HighlightSlotCommand;
import com.habitparty.application.usecases.inventory.OpenMysteryBoxUseCase;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.achievement.Artifact;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.entities.achievement.UserArtifact;
import com.habitparty.core.domain.enums.AchievementCategory;
import com.habitparty.core.domain.enums.AchievementRarity;
import com.habitparty.core.domain.enums.ArtifactSourceType;
import com.habitparty.core.domain.enums.HighlightType;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

class ArtifactUnlockAndMysteryBoxDropTest {

  private User createUser() {
    return new User(
        UUID.randomUUID(),
        UserRole.USER,
        false,
        "Aventureiro",
        "aventureiro_test",
        "av@habitparty.com",
        "pwd",
        BigDecimal.TEN,
        BigDecimal.TEN,
        LocalDate.of(1998, 5, 10),
        null,
        UserGender.MALE,
        500,
        5,
        10,
        LocalDateTime.now());
  }

  @Test
  @DisplayName("EvaluateUserAchievementsUseCase concede relíquia de mérito quando a conquista vinculada desbloqueia")
  void evaluateShouldGrantArtifactLinkedToUnlockedAchievement() {
    User user = createUser();
    user.getStats().recordFocusCompleted(600, 10);

    Achievement focusHours10 = new Achievement(
        UUID.randomUUID(),
        "FOCUS_HOURS_10",
        "Aprendiz do Templo",
        "Acumule 10 horas de foco.",
        "Clock",
        50,
        AchievementCategory.FOCUS,
        AchievementRarity.RARE,
        600,
        28,
        false);

    Artifact quartzHourglass = new Artifact(
        UUID.randomUUID(),
        "QUARTZ_HOURGLASS",
        "Hourglass",
        AchievementRarity.RARE,
        ArtifactSourceType.ACHIEVEMENT,
        "FOCUS_HOURS_10",
        2);

    AchievementRepository achRepo = mock(AchievementRepository.class);
    UserAchievementRepository userAchRepo = mock(UserAchievementRepository.class);
    ProfileHighlightRepository highlightRepo = mock(ProfileHighlightRepository.class);
    UserRepository userRepo = mock(UserRepository.class);
    ArtifactRepository artifactRepo = mock(ArtifactRepository.class);
    UserArtifactRepository userArtifactRepo = mock(UserArtifactRepository.class);

    when(achRepo.findAllOrdered()).thenReturn(List.of(focusHours10));
    when(userAchRepo.findAllByUserId(user.getId())).thenReturn(List.of());
    when(userAchRepo.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
    when(artifactRepo.findAllOrdered()).thenReturn(List.of(quartzHourglass));
    when(userArtifactRepo.findAllByUserId(user.getId())).thenReturn(List.of());
    when(userArtifactRepo.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));

    EvaluateUserAchievementsUseCase useCase = new EvaluateUserAchievementsUseCase(
        achRepo, userAchRepo, highlightRepo, userRepo, null, artifactRepo, userArtifactRepo);

    var snapshot = useCase.executeWithSnapshot(user, List.of());

    assertEquals(1, snapshot.newlyUnlocked().size());
    assertEquals(1, snapshot.newlyUnlockedArtifacts().size());
    assertEquals("QUARTZ_HOURGLASS", snapshot.newlyUnlockedArtifacts().get(0).getCode());
    verify(userArtifactRepo).saveAll(any());
  }

  @Test
  @DisplayName("UpdateProfileHighlightsUseCase valida posse de artefato e anula referenceId ao salvar ARTIFACT")
  void highlightsShouldValidateOwnedArtifactAndNullReferenceId() {
    User user = createUser();
    Artifact owned = new Artifact(
        UUID.randomUUID(),
        "FATE_DICE",
        "Dices",
        AchievementRarity.RARE,
        ArtifactSourceType.MYSTERY_BOX,
        null,
        17);
    Artifact unowned = new Artifact(
        UUID.randomUUID(),
        "ASTRAL_RELIQUARY",
        "Orbit",
        AchievementRarity.LEGENDARY,
        ArtifactSourceType.MYSTERY_BOX,
        null,
        20);

    UserRepository userRepo = mock(UserRepository.class);
    UserAchievementRepository userAchRepo = mock(UserAchievementRepository.class);
    ProfileHighlightRepository highlightRepo = mock(ProfileHighlightRepository.class);
    EvaluateUserAchievementsUseCase evalUseCase = mock(EvaluateUserAchievementsUseCase.class);
    ArtifactRepository artifactRepo = mock(ArtifactRepository.class);
    UserArtifactRepository userArtifactRepo = mock(UserArtifactRepository.class);

    when(userRepo.findById(user.getId())).thenReturn(Optional.of(user));
    when(userAchRepo.findAllByUserId(user.getId())).thenReturn(List.of());
    when(artifactRepo.findByCode("FATE_DICE")).thenReturn(Optional.of(owned));
    when(artifactRepo.findByCode("ASTRAL_RELIQUARY")).thenReturn(Optional.of(unowned));
    when(userArtifactRepo.findAllByUserId(user.getId()))
        .thenReturn(List.of(UserArtifact.createNewlyUnlocked(user.getId(), owned.getId(), "MYSTERY_BOX_BASIC")));
    when(highlightRepo.replaceAllForUser(any(), any())).thenAnswer(inv -> inv.getArgument(1));

    UpdateProfileHighlightsUseCase useCase = new UpdateProfileHighlightsUseCase(
        userRepo, userAchRepo, highlightRepo, evalUseCase, artifactRepo, userArtifactRepo);

    List<ProfileHighlight> saved = useCase.execute(
        user.getId(),
        List.of(new HighlightSlotCommand(0, HighlightType.ARTIFACT, UUID.randomUUID(), "FATE_DICE")));

    assertEquals(1, saved.size());
    assertEquals(HighlightType.ARTIFACT, saved.get(0).getHighlightType());
    assertEquals("FATE_DICE", saved.get(0).getHighlightKey().orElseThrow());
    assertTrue(saved.get(0).getReferenceId().isEmpty());

    assertThrows(DomainValidationException.class, () -> useCase.execute(
        user.getId(),
        List.of(new HighlightSlotCommand(0, HighlightType.ARTIFACT, null, "ASTRAL_RELIQUARY"))));
  }

  @Test
  @DisplayName("OpenMysteryBoxUseCase preserva fluxo de recompensa normal mesmo com repositório de artefatos conectado")
  void openMysteryBoxCompletesNormallyWithArtifactPortsWired() {
    User user = createUser();
    UUID boxId = UUID.randomUUID();
    InventoryItem box = new InventoryItem(
        boxId,
        user.getId(),
        UUID.randomUUID(),
        "Caixa Lendária",
        new BigDecimal("80.00"),
        RewardType.MISTERY_BOX,
        InventoryItemStatus.AVAILABLE,
        0,
        "gift",
        RewardPackageLevel.LEGENDARY,
        null,
        LocalDateTime.now());

    InventoryItemRepository inventoryRepo = mock(InventoryItemRepository.class);
    TransactionHistoryRepository txRepo = mock(TransactionHistoryRepository.class);
    UserRepository userRepo = mock(UserRepository.class);
    ArtifactRepository artifactRepo = mock(ArtifactRepository.class);
    UserArtifactRepository userArtifactRepo = mock(UserArtifactRepository.class);

    when(inventoryRepo.findById(boxId)).thenReturn(Optional.of(box));
    when(userRepo.findById(user.getId())).thenReturn(Optional.of(user));
    when(artifactRepo.findBySourceTypeOrdered(ArtifactSourceType.MYSTERY_BOX)).thenReturn(List.of());

    OpenMysteryBoxUseCase useCase = new OpenMysteryBoxUseCase(inventoryRepo, txRepo);
    useCase.setUserPort(userRepo);
    useCase.setArtifactPort(artifactRepo);
    useCase.setUserArtifactPort(userArtifactRepo);

    var result = useCase.executeWithDrop(boxId, user.getId());

    assertNotNull(result.item());
    assertEquals(1, user.getStats().getTotalMysteryBoxesOpened());
    verify(inventoryRepo).save(box);
    verify(txRepo).save(any());
  }
}
