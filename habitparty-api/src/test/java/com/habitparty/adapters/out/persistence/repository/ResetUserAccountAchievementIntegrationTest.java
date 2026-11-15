package com.habitparty.adapters.out.persistence.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
import com.habitparty.application.ports.AchievementRepository;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.usecases.user.ResetUserAccountUseCase;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.achievement.UserAchievement;
import com.habitparty.core.domain.enums.AccountResetScope;
import com.habitparty.core.domain.enums.AchievementCategory;
import com.habitparty.core.domain.enums.AchievementCode;
import com.habitparty.core.domain.enums.AchievementRarity;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

@SpringBootTest
@Transactional
class ResetUserAccountAchievementIntegrationTest {

  @Autowired
  private ResetUserAccountUseCase resetUserAccountUseCase;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private WorkspaceRepository workspaceRepository;

  @Autowired
  private AchievementRepository achievementRepository;

  @Autowired
  private AchievementJpaRepository achievementJpaRepository;

  @Autowired
  private UserAchievementRepository userAchievementRepository;

  @MockitoBean
  private TaskRepository taskRepository;

  @MockitoBean
  private TransactionHistoryRepository transactionHistoryRepository;

  @MockitoBean
  private RewardRepository rewardRepository;

  @Test
  @DisplayName("Reset de métricas preserva totalWorkspacesCreated real e re-desbloqueia WORKSPACE_ARCHITECT no banco")
  void metricsResetReunlocksWorkspaceArchitectWhenExistingWorkspacesMeetTarget() {
    User savedUser = userRepository.save(new User(
        UUID.randomUUID(),
        UserRole.USER,
        true,
        "Arquiteto Reset",
        "arquiteto_" + UUID.randomUUID().toString().substring(0, 8),
        "arquiteto_" + UUID.randomUUID().toString().substring(0, 8) + "@habitparty.com",
        "encoded_pwd",
        BigDecimal.TEN,
        new BigDecimal("50"),
        LocalDate.of(1999, 1, 1),
        null,
        UserGender.PREFER_NOT_TO_SAY,
        120,
        3,
        3,
        LocalDateTime.now()));

    UUID userId = savedUser.getId();
    workspaceRepository.save(new Workspace(UUID.randomUUID(), userId, "Ambiente 1"));
    workspaceRepository.save(new Workspace(UUID.randomUUID(), userId, "Ambiente 2"));
    workspaceRepository.save(new Workspace(UUID.randomUUID(), userId, "Ambiente 3"));

    Achievement workspaceArchitect = achievementRepository.findByCode(AchievementCode.WORKSPACE_ARCHITECT.name())
        .orElseGet(() -> {
          achievementJpaRepository.save(new AchievementJpaEntity(
              UUID.randomUUID(),
              AchievementCode.WORKSPACE_ARCHITECT.name(),
              "Arquiteto de Ambientes",
              "Crie 2 ambientes de trabalho.",
              "layers",
              25,
              AchievementCategory.PROGRESSION,
              AchievementRarity.RARE,
              2,
              40,
              false));
          return achievementRepository.findByCode(AchievementCode.WORKSPACE_ARCHITECT.name()).orElseThrow();
        });

    userAchievementRepository.save(UserAchievement.createNewlyUnlocked(userId, workspaceArchitect.getId()));

    User afterMetricsReset = resetUserAccountUseCase.execute(userId, AccountResetScope.METRICS);
    List<UserAchievement> unlockedAfterMetrics = userAchievementRepository.findAllByUserId(userId);

    assertEquals(3, workspaceRepository.countByUserId(userId));
    assertEquals(3, afterMetricsReset.getStats().getTotalWorkspacesCreated());
    assertTrue(unlockedAfterMetrics.stream()
        .anyMatch(ua -> workspaceArchitect.getId().equals(ua.getAchievementId())));
    assertTrue(afterMetricsReset.getStats().getAchievementPoints() >= workspaceArchitect.getPoints());

    User afterCompleteReset = resetUserAccountUseCase.execute(userId, AccountResetScope.COMPLETE);
    List<UserAchievement> unlockedAfterComplete = userAchievementRepository.findAllByUserId(userId);

    assertEquals(0, workspaceRepository.countByUserId(userId));
    assertEquals(0, afterCompleteReset.getStats().getTotalWorkspacesCreated());
    assertEquals(0, unlockedAfterComplete.size());
    assertEquals(0, afterCompleteReset.getStats().getAchievementPoints());
  }
}
