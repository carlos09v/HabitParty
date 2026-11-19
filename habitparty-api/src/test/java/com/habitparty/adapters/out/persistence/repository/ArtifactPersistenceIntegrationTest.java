package com.habitparty.adapters.out.persistence.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import jakarta.persistence.EntityManager;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.adapters.out.persistence.entities.AchievementJpaEntity;
import com.habitparty.adapters.out.persistence.entities.ArtifactJpaEntity;
import com.habitparty.application.ports.ArtifactRepository;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserArtifactRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.GetUnseenAchievementsUseCase;
import com.habitparty.application.usecases.achievement.GetUserShowcaseUseCase;
import com.habitparty.application.usecases.achievement.MarkArtifactsSeenUseCase;
import com.habitparty.application.usecases.achievement.UpdateProfileHighlightsUseCase;
import com.habitparty.application.usecases.achievement.UpdateProfileHighlightsUseCase.HighlightSlotCommand;
import com.habitparty.application.usecases.achievement.UpdateShowcaseProfileUseCase;
import com.habitparty.application.usecases.achievement.UpdateShowcaseProfileUseCase.UpdateShowcaseProfileCommand;
import com.habitparty.application.usecases.user.ResetUserAccountUseCase;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.Artifact;
import com.habitparty.core.domain.entities.achievement.UserArtifact;
import com.habitparty.core.domain.enums.AccountResetScope;
import com.habitparty.core.domain.enums.AchievementCategory;
import com.habitparty.core.domain.enums.AchievementRarity;
import com.habitparty.core.domain.enums.ArtifactSourceType;
import com.habitparty.core.domain.enums.HighlightType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

@SpringBootTest
@Transactional
class ArtifactPersistenceIntegrationTest {

  @Autowired
  private EntityManager entityManager;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private AchievementJpaRepository achievementJpaRepository;

  @Autowired
  private ArtifactJpaRepository artifactJpaRepository;

  @Autowired
  private ArtifactRepository artifactRepository;

  @Autowired
  private UserArtifactRepository userArtifactRepository;

  @Autowired
  private GetUserShowcaseUseCase getUserShowcaseUseCase;

  @Autowired
  private GetUnseenAchievementsUseCase getUnseenAchievementsUseCase;

  @Autowired
  private MarkArtifactsSeenUseCase markArtifactsSeenUseCase;

  @Autowired
  private UpdateProfileHighlightsUseCase updateProfileHighlightsUseCase;

  @Autowired
  private UpdateShowcaseProfileUseCase updateShowcaseProfileUseCase;

  @Autowired
  private ResetUserAccountUseCase resetUserAccountUseCase;

  @MockitoBean
  private TaskRepository taskRepository;

  @MockitoBean
  private TransactionHistoryRepository transactionHistoryRepository;

  @MockitoBean
  private RewardRepository rewardRepository;

  @Test
  @DisplayName("Persistência completa: concessão de artefato, destaques, cosméticos, métricas admin e reset")
  void shouldPersistArtifactsCosmeticsHighlightsAndResetFlow() {
    String suffix = UUID.randomUUID().toString().substring(0, 8);
    User user = new User(
        UUID.randomUUID(),
        UserRole.USER,
        false,
        "Relicário " + suffix,
        "relic_" + suffix,
        "relic_" + suffix + "@habitparty.com",
        "encoded_pwd",
        BigDecimal.TEN,
        new BigDecimal("100"),
        LocalDate.of(1998, 4, 20),
        null,
        UserGender.PREFER_NOT_TO_SAY,
        6500,
        35,
        35,
        LocalDateTime.now().minusDays(45));
    user.setEmailVerified(true);
    user.getStats().recordFocusCompleted(600, 10);
    user = userRepository.save(user);

    if (achievementJpaRepository.findByCode("FOCUS_HOURS_10").isEmpty()) {
      achievementJpaRepository.save(new AchievementJpaEntity(
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
          false));
    }

    if (artifactJpaRepository.findByCodeIgnoreCase("QUARTZ_HOURGLASS").isEmpty()) {
      artifactJpaRepository.save(new ArtifactJpaEntity(
          UUID.fromString("b1000000-0000-4000-8000-000000000002"),
          "QUARTZ_HOURGLASS",
          "Hourglass",
          AchievementRarity.RARE,
          ArtifactSourceType.ACHIEVEMENT,
          "FOCUS_HOURS_10",
          2));
    }
    if (artifactJpaRepository.findByCodeIgnoreCase("FATE_DICE").isEmpty()) {
      artifactJpaRepository.save(new ArtifactJpaEntity(
          UUID.fromString("b1000000-0000-4000-8000-000000000017"),
          "FATE_DICE",
          "Dices",
          AchievementRarity.RARE,
          ArtifactSourceType.MYSTERY_BOX,
          null,
          17));
    }

    // 1. Conquista não vista deve carregar grantedArtifact
    var unseen = getUnseenAchievementsUseCase.execute(user.getId());
    var focusUnseen = unseen.stream()
        .filter(u -> "FOCUS_HOURS_10".equals(u.achievement().getCode()))
        .findFirst()
        .orElseThrow();
    assertNotNull(focusUnseen.grantedArtifact());
    assertEquals("QUARTZ_HOURGLASS", focusUnseen.grantedArtifact().getCode());

    // 2. Artefato de Caixa Misteriosa salvo e marcado como visto
    Artifact fateDice = artifactRepository.findByCode("FATE_DICE").orElseThrow();
    userArtifactRepository.save(
        UserArtifact.createNewlyUnlocked(user.getId(), fateDice.getId(), "MYSTERY_BOX_BASIC"));
    assertEquals(2L, userArtifactRepository.countByUserId(user.getId()));

    markArtifactsSeenUseCase.execute(user.getId());
    assertTrue(userArtifactRepository.findUnseenByUserId(user.getId()).isEmpty());

    // 3. Vitrine exibe artefatos desbloqueados e permite destacar ARTIFACT
    var highlights = updateProfileHighlightsUseCase.execute(
        user.getId(),
        List.of(new HighlightSlotCommand(0, HighlightType.ARTIFACT, null, "FATE_DICE")));
    assertEquals(1, highlights.size());
    assertEquals(HighlightType.ARTIFACT, highlights.get(0).getHighlightType());

    // 4. Recém-criado não pode equipar JOURNEY_VETERAN; após retroagir created_at para 45 dias, pode equipar
    UUID savedUserId = user.getId();
    assertThrows(DomainValidationException.class, () -> updateShowcaseProfileUseCase.execute(
        savedUserId,
        new UpdateShowcaseProfileCommand(null, null, "JOURNEY_VETERAN", null)));

    entityManager.createNativeQuery("UPDATE users SET created_at = :oldDate WHERE user_id = :id")
        .setParameter("oldDate", LocalDateTime.now().minusDays(45))
        .setParameter("id", savedUserId)
        .executeUpdate();
    entityManager.flush();
    entityManager.clear();

    User updated = updateShowcaseProfileUseCase.execute(
        savedUserId,
        new UpdateShowcaseProfileCommand("Em busca do infinito", "forged_silver", "JOURNEY_VETERAN", "level_expert"));
    assertEquals("forged_silver", updated.getAvatarFrame());
    assertEquals("JOURNEY_VETERAN", updated.getEquippedTitle().orElseThrow());
    assertEquals("level_expert", updated.getAvatarPreset().orElseThrow());

    var showcase = getUserShowcaseUseCase.execute(user.getId());
    assertEquals(2, showcase.unlockedArtifactsCount());
    assertTrue(showcase.artifacts().stream()
        .anyMatch(a -> "QUARTZ_HOURGLASS".equals(a.artifact().getCode()) && a.unlocked()));

    // 5. Reset METRICS apaga artefato de conquista mas preserva artefato RNG da Caixa Misteriosa
    resetUserAccountUseCase.execute(user.getId(), AccountResetScope.METRICS);
    List<UserArtifact> afterMetrics = userArtifactRepository.findAllByUserId(user.getId());
    assertEquals(1, afterMetrics.size());
    assertEquals(fateDice.getId(), afterMetrics.get(0).getArtifactId());

    // 6. Reset COMPLETE apaga todos os artefatos e cosméticos
    User afterComplete = resetUserAccountUseCase.execute(user.getId(), AccountResetScope.COMPLETE);
    assertTrue(userArtifactRepository.findAllByUserId(user.getId()).isEmpty());
    assertEquals("none", afterComplete.getAvatarFrame());
    assertFalse(afterComplete.getEquippedTitle().isPresent());
    assertFalse(afterComplete.getAvatarPreset().isPresent());
  }
}
