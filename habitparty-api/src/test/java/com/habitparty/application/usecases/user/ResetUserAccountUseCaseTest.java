package com.habitparty.application.usecases.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.SocialNotificationRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.entities.UserSubscription;
import com.habitparty.core.domain.entities.achievement.CosmeticCatalog.CosmeticUnlockContext;
import com.habitparty.core.domain.enums.AccountResetScope;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.UserExperienceMode;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class ResetUserAccountUseCaseTest {

  @Mock
  private UserRepository userPort;
  @Mock
  private TaskRepository taskPort;
  @Mock
  private BoardColumnRepository boardColumnPort;
  @Mock
  private WorkspaceRepository workspacePort;
  @Mock
  private RewardRepository rewardPort;
  @Mock
  private InventoryItemRepository inventoryItemPort;
  @Mock
  private FocusRecordRepository focusRecordPort;
  @Mock
  private FocusActivityRepository focusActivityPort;
  @Mock
  private TransactionHistoryRepository transactionHistoryPort;
  @Mock
  private UserAchievementRepository userAchievementPort;
  @Mock
  private ProfileHighlightRepository profileHighlightPort;
  @Mock
  private SocialNotificationRepository socialNotificationPort;

  private ResetUserAccountUseCase useCase;

  @BeforeEach
  void setUp() {
    useCase = new ResetUserAccountUseCase(
        userPort,
        taskPort,
        boardColumnPort,
        workspacePort,
        rewardPort,
        inventoryItemPort,
        focusRecordPort,
        focusActivityPort,
        transactionHistoryPort,
        userAchievementPort,
        profileHighlightPort,
        socialNotificationPort);
  }

  private User createPopulatedUser(UUID userId) {
    UserStats stats = new UserStats(
        userId,
        new BigDecimal("250.50"),
        new BigDecimal("999.00"),
        4200,
        14,
        30,
        85,
        20,
        5,
        320,
        18,
        60,
        12,
        7,
        3,
        450,
        LocalDateTime.now());
    stats.setTotalWorkspacesCreated(3);
    stats.setTotalCleanHabitCycles(10);

    UserSubscription sub = new UserSubscription(
        userId,
        true,
        true,
        "cus_123",
        "sub_123",
        SubscriptionStatus.ACTIVE,
        LocalDateTime.now().plusMonths(6),
        LocalDateTime.now());

    User user = new User(
        userId,
        UserRole.USER,
        "Carlos Vinicius",
        "carlos",
        "carlos@habitparty.com",
        "hashed_pwd",
        true,
        LocalDateTime.now(),
        LocalDate.of(1998, 5, 20),
        "avatar.png",
        UserGender.MALE,
        UserExperienceMode.GAMIFIED,
        LocalDateTime.now().minusMonths(2),
        stats,
        sub);
    user.setBio("Rumo ao topo");
    user.setAvatarFrame("cosmic_gold");
    user.setTheme("royal-gold");
    return user;
  }

  @Test
  @DisplayName("Deve falhar se o escopo do reset for nulo")
  void shouldThrowWhenScopeIsNull() {
    UUID userId = UUID.randomUUID();
    assertThrows(DomainValidationException.class, () -> useCase.execute(userId, null));
  }

  @Test
  @DisplayName("Deve falhar se usuário não existir")
  void shouldThrowWhenUserNotFound() {
    UUID userId = UUID.randomUUID();
    when(userPort.findByIdForUpdate(userId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> useCase.execute(userId, AccountResetScope.METRICS));
  }

  @Test
  @DisplayName("METRICS sem deleteHistory deve zerar stats, conquistas e métricas de tasks preservando histórico e conteúdo")
  void shouldResetOnlyMetricsAndGamificationOnMetricsScopeWithoutDeletingHistoryByDefault() {
    UUID userId = UUID.randomUUID();
    User user = createPopulatedUser(userId);
    when(userPort.findByIdForUpdate(userId)).thenReturn(Optional.of(user));
    when(userPort.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    User result = useCase.execute(userId, AccountResetScope.METRICS);

    assertEquals(BigDecimal.ZERO, result.getCurrentCoins());
    assertEquals(BigDecimal.ZERO, result.getTotalGoldEarned());
    assertEquals(0, result.getTotalXp());
    assertEquals(0, result.getCurrentStreak());
    assertEquals(0, result.getHighestStreak());
    assertEquals(0, result.getStats().getAchievementPoints());
    assertEquals(0, result.getStats().getTotalTasksCompleted());
    assertEquals(0, result.getStats().getTotalWorkspacesCreated());

    // Mantém identidade, vitrine cosmética, tema e assinatura
    assertTrue(result.isPremium());
    assertTrue(result.isFounder());
    assertEquals("Rumo ao topo", result.getBio().orElse(null));
    assertEquals("cosmic_gold", result.getAvatarFrame());
    assertEquals("royal-gold", result.getTheme());

    verify(transactionHistoryPort, never()).deleteAllByUserId(any());
    verify(focusRecordPort, never()).deleteAllByUserId(any());
    verify(profileHighlightPort).deleteAllByUserId(userId);
    verify(userAchievementPort).deleteAllByUserId(userId);
    verify(taskPort).resetMetricsByUserId(userId);

    // Não apaga estrutura nem itens do usuário
    verify(taskPort, never()).deleteAllByUserId(any());
    verify(boardColumnPort, never()).deleteAllByUserId(any());
    verify(workspacePort, never()).deleteAllByUserId(any());
    verify(focusActivityPort, never()).deleteAllByUserId(any());
    verify(inventoryItemPort, never()).deleteAllByUserId(any());
    verify(rewardPort, never()).deleteAllByUserId(any());
    verify(socialNotificationPort, never()).deleteAllByUserId(any());
  }

  @Test
  @DisplayName("METRICS com deleteHistory=true deve apagar também transações e registros de foco mantendo conteúdo")
  void shouldDeleteHistoryOnMetricsScopeWhenExplicitlyRequested() {
    UUID userId = UUID.randomUUID();
    User user = createPopulatedUser(userId);
    when(userPort.findByIdForUpdate(userId)).thenReturn(Optional.of(user));
    when(userPort.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    useCase.execute(userId, AccountResetScope.METRICS, true);

    verify(transactionHistoryPort).deleteAllByUserId(userId);
    verify(focusRecordPort).deleteAllByUserId(userId);
    verify(profileHighlightPort).deleteAllByUserId(userId);
    verify(userAchievementPort).deleteAllByUserId(userId);
    verify(taskPort).resetMetricsByUserId(userId);
    verify(taskPort, never()).deleteAllByUserId(any());
    verify(workspacePort, never()).deleteAllByUserId(any());
  }

  @Test
  @DisplayName("COMPLETE deve apagar todo conteúdo em cascata bottom-up sem excluir conta ou assinatura")
  void shouldWipeAllContentWithoutDeletingAccountOnCompleteScope() {
    UUID userId = UUID.randomUUID();
    User user = createPopulatedUser(userId);
    when(userPort.findByIdForUpdate(userId)).thenReturn(Optional.of(user));
    when(userPort.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    User result = useCase.execute(userId, AccountResetScope.COMPLETE);

    assertEquals(BigDecimal.ZERO, result.getCurrentCoins());
    assertEquals(0, result.getTotalXp());
    assertEquals(0, result.getCurrentStreak());
    assertFalse(result.getBio().isPresent());
    assertEquals("none", result.getAvatarFrame());

    // Conta, email verificado, tema e assinatura seguem preservados
    assertEquals("carlos@habitparty.com", result.getEmail());
    assertTrue(result.isEmailVerified());
    assertTrue(result.isPremium());
    assertTrue(result.isFounder());
    assertEquals("royal-gold", result.getTheme());

    InOrder order = inOrder(
        transactionHistoryPort,
        focusRecordPort,
        profileHighlightPort,
        userAchievementPort,
        taskPort,
        boardColumnPort,
        workspacePort,
        focusActivityPort,
        inventoryItemPort,
        rewardPort,
        socialNotificationPort,
        userPort);

    order.verify(transactionHistoryPort).deleteAllByUserId(userId);
    order.verify(focusRecordPort).deleteAllByUserId(userId);
    order.verify(profileHighlightPort).deleteAllByUserId(userId);
    order.verify(userAchievementPort).deleteAllByUserId(userId);
    order.verify(taskPort).deleteAllByUserId(userId);
    order.verify(boardColumnPort).deleteAllByUserId(userId);
    order.verify(workspacePort).deleteAllByUserId(userId);
    order.verify(focusActivityPort).deleteAllByUserId(userId);
    order.verify(inventoryItemPort).deleteAllByUserId(userId);
    order.verify(rewardPort).deleteAllByUserId(userId);
    order.verify(socialNotificationPort).deleteAllByUserId(userId);
    order.verify(userPort).save(user);

    verify(taskPort, never()).resetMetricsByUserId(any());
  }

  @Test
  @DisplayName("METRICS deve revalidar e limpar cosméticos vinculados a conquistas/XP preservando VIP e Fundador")
  void shouldClearEarnedCosmeticsOnMetricsResetWhilePreservingAccountAndVipCosmetics() {
    UUID userId = UUID.randomUUID();
    User user = createPopulatedUser(userId);
    user.updateShowcaseProfile(
        null,
        "obsidian_crest",
        "ARTIFACT_COLLECTOR",
        "level_amateur",
        new CosmeticUnlockContext(
            java.util.Set.of("TROPHY_HUNTER_1000"),
            java.util.Set.of(),
            10L,
            java.util.Set.of(),
            LocalDateTime.now()));
    when(userPort.findByIdForUpdate(userId)).thenReturn(Optional.of(user));
    when(userPort.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    User result = useCase.execute(userId, AccountResetScope.METRICS, false);

    assertEquals("none", result.getAvatarFrame());
    assertFalse(result.getEquippedTitle().isPresent());
    assertFalse(result.getAvatarPreset().isPresent());
  }

  @Test
  @DisplayName("METRICS sem apagar histórico preserva título RETRO_* enquanto METRICS com deleteHistory limpa")
  void shouldHandleRetrospectiveTitleAccordingToHistoryDeletionOnMetricsReset() {
    UUID userId = UUID.randomUUID();
    User userPreserve = createPopulatedUser(userId);
    CosmeticUnlockContext retroCtx = new CosmeticUnlockContext(
        java.util.Set.of(),
        java.util.Set.of(),
        0L,
        java.util.Set.of(com.habitparty.core.domain.enums.RetrospectiveArchetype.DEEP_FOCUS_SAGE),
        LocalDateTime.now());
    userPreserve.updateShowcaseProfile(null, "none", "RETRO_DEEP_FOCUS_SAGE", "vip_cosmic", retroCtx);

    when(userPort.findByIdForUpdate(userId)).thenReturn(Optional.of(userPreserve));
    when(userPort.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    User preservedResult = useCase.execute(userId, AccountResetScope.METRICS, false);
    assertEquals("RETRO_DEEP_FOCUS_SAGE", preservedResult.getEquippedTitle().orElse(null));
    assertEquals("vip_cosmic", preservedResult.getAvatarPreset().orElse(null));

    User wipeHistoryResult = useCase.execute(userId, AccountResetScope.METRICS, true);
    assertFalse(wipeHistoryResult.getEquippedTitle().isPresent());
    assertEquals("vip_cosmic", wipeHistoryResult.getAvatarPreset().orElse(null));
  }
}
