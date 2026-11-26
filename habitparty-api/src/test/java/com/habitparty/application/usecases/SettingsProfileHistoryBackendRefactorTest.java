package com.habitparty.application.usecases;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.StringWriter;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.adapters.out.export.CsvTransactionExporterAdapter;
import com.habitparty.application.ports.AchievementRepository;
import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.PasswordHasherPort;
import com.habitparty.application.ports.PaymentGatewayPort;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.RefreshTokenRepository;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.SocialNotificationRepository;
import com.habitparty.application.ports.StoragePort;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionCsvExporterPort.CsvExportOptions;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.UserTokenRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.usecases.achievement.GetPublicUserShowcaseUseCase;
import com.habitparty.application.usecases.achievement.GetUserRetrospectiveUseCase;
import com.habitparty.application.usecases.achievement.GetUserShowcaseUseCase;
import com.habitparty.application.usecases.social.SocialRelationshipStatus;
import com.habitparty.application.usecases.social.SocialUserSummary;
import com.habitparty.application.usecases.transaction.DeleteTransactionHistoryUseCase;
import com.habitparty.application.usecases.transaction.ListUserTransactionsUseCase;
import com.habitparty.application.usecases.user.DeleteUserUseCase;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.application.usecases.user.UpdateUserPasswordUseCase;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.entities.UserSubscription;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.entities.social.Friendship;
import com.habitparty.core.domain.enums.HighlightType;
import com.habitparty.core.domain.enums.PrivacyLevel;
import com.habitparty.core.domain.enums.SubscriptionStatus;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserExperienceMode;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.PaymentProcessingException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

class SettingsProfileHistoryBackendRefactorTest {

  private User createUser(UUID id, SubscriptionStatus status, String stripeSubId) {
    UserSubscription sub = new UserSubscription(
        id,
        status == SubscriptionStatus.ACTIVE,
        false,
        "cus_123",
        stripeSubId,
        status,
        status == SubscriptionStatus.ACTIVE ? LocalDateTime.now().plusDays(30) : null,
        LocalDateTime.now());
    User user = new User(
        id,
        UserRole.USER,
        "Test User",
        "testuser",
        "test@habitparty.com",
        "hashed-pw",
        true,
        null,
        LocalDate.of(1995, 5, 10),
        null,
        UserGender.MALE,
        LocalDateTime.now(),
        UserStats.createInitial(id),
        sub);
    user.getStats().setTotalXp(1200);
    return user;
  }

  @Test
  @DisplayName("DeleteUserUseCase deve cancelar assinatura recorrente Stripe antes de apagar registros do banco")
  void deleteUserCancelsActiveRecurringStripeSubscriptionFirst() {
    UUID userId = UUID.randomUUID();
    User user = createUser(userId, SubscriptionStatus.ACTIVE, "sub_active_123");

    UserRepository userRepo = mock(UserRepository.class);
    PaymentGatewayPort paymentGateway = mock(PaymentGatewayPort.class);
    TaskRepository taskRepo = mock(TaskRepository.class);
    when(userRepo.findById(userId)).thenReturn(Optional.of(user));

    DeleteUserUseCase useCase = new DeleteUserUseCase(
        userRepo,
        mock(StoragePort.class),
        taskRepo,
        mock(BoardColumnRepository.class),
        mock(WorkspaceRepository.class),
        mock(RewardRepository.class),
        mock(InventoryItemRepository.class),
        mock(FocusRecordRepository.class),
        mock(FocusActivityRepository.class),
        mock(TransactionHistoryRepository.class),
        mock(RefreshTokenRepository.class),
        mock(UserTokenRepository.class),
        mock(EmailDispatchLogRepository.class),
        mock(UserAchievementRepository.class),
        mock(ProfileHighlightRepository.class),
        mock(FriendshipRepository.class),
        mock(SocialNotificationRepository.class),
        paymentGateway);

    useCase.execute(userId);

    verify(paymentGateway).cancelSubscriptionImmediately("sub_active_123");
    verify(userRepo).deleteById(userId);
  }

  @Test
  @DisplayName("DeleteUserUseCase deve abortar exclusão se cancelamento no Stripe falhar")
  void deleteUserAbortsIfStripeCancelFails() {
    UUID userId = UUID.randomUUID();
    User user = createUser(userId, SubscriptionStatus.ACTIVE, "sub_fail_999");

    UserRepository userRepo = mock(UserRepository.class);
    PaymentGatewayPort paymentGateway = mock(PaymentGatewayPort.class);
    when(userRepo.findById(userId)).thenReturn(Optional.of(user));
    doThrow(new PaymentProcessingException("Stripe timeout"))
        .when(paymentGateway).cancelSubscriptionImmediately("sub_fail_999");

    DeleteUserUseCase useCase = new DeleteUserUseCase(
        userRepo,
        mock(StoragePort.class),
        mock(TaskRepository.class),
        mock(BoardColumnRepository.class),
        mock(WorkspaceRepository.class),
        mock(RewardRepository.class),
        mock(InventoryItemRepository.class),
        mock(FocusRecordRepository.class),
        mock(FocusActivityRepository.class),
        mock(TransactionHistoryRepository.class),
        mock(RefreshTokenRepository.class),
        mock(UserTokenRepository.class),
        mock(EmailDispatchLogRepository.class),
        null, null, null, null,
        paymentGateway);

    assertThrows(PaymentProcessingException.class, () -> useCase.execute(userId));
    verify(userRepo, never()).deleteById(any());
  }

  @Test
  @DisplayName("UpdateUserPasswordUseCase deve rejeitar conta Google OAuth sem senha cadastrada (hasPassword=false)")
  void updatePasswordRejectsOAuthAccountWithoutPassword() {
    UUID userId = UUID.randomUUID();
    User oauthUser = createUser(userId, SubscriptionStatus.FREE, null);
    oauthUser.setHasPassword(false);

    UserRepository userRepo = mock(UserRepository.class);
    PasswordHasherPort hasher = mock(PasswordHasherPort.class);
    when(userRepo.findById(userId)).thenReturn(Optional.of(oauthUser));

    UpdateUserPasswordUseCase useCase = new UpdateUserPasswordUseCase(userRepo, hasher);

    assertThrows(DomainValidationException.class,
        () -> useCase.execute(userId, "anything", "NewPass@123"));
    verify(hasher, never()).matches(any(), any());
  }

  @Test
  @DisplayName("DeleteTransactionHistoryUseCase deve ocultar logicamente e permitir restauração (Undo)")
  void deleteTransactionHistorySoftHidesAndRestores() {
    UUID userId = UUID.randomUUID();
    UUID txId = UUID.randomUUID();
    TransactionHistory tx = new TransactionHistory(
        txId, userId, UUID.randomUUID(), BigDecimal.TEN, 15, null,
        TransactionType.HABIT_COMPLETED, "Beber água", null, null, TaskDifficulty.EASY,
        List.of("saúde"), LocalDateTime.now());

    TransactionHistoryRepository repo = mock(TransactionHistoryRepository.class);
    when(repo.findById(txId)).thenReturn(Optional.of(tx));
    when(repo.hideAllByIdsAndUserId(List.of(txId), userId)).thenReturn(1);
    when(repo.restoreAllByIdsAndUserId(List.of(txId), userId)).thenReturn(1);

    DeleteTransactionHistoryUseCase useCase = new DeleteTransactionHistoryUseCase(repo);

    useCase.execute(txId, userId);
    verify(repo).hideByIdAndUserId(txId, userId);
    verify(repo, never()).deleteById(any());

    assertEquals(1, useCase.executeBatch(List.of(txId, txId), userId));
    assertEquals(1, useCase.restoreBatch(List.of(txId), userId));
  }

  @Test
  @DisplayName("ListUserTransactionsUseCase deve retornar null para tab inválida e alinhar 7DAYS ao início do dia")
  void listTransactionsNormalizesTabAndAlignsPeriodToStartOfDay() {
    assertNull(ListUserTransactionsUseCase.resolveTypesForTab("INVALID_TAB"));

    Clock fixed = Clock.fixed(Instant.parse("2026-11-24T17:35:00Z"), ZoneId.of("UTC"));
    ZoneId sp = ZoneId.of("America/Sao_Paulo");
    var bounds = ListUserTransactionsUseCase.resolveDateBounds("7DAYS", null, null, fixed, sp);

    LocalDateTime expectedStart = LocalDate.of(2026, 11, 18)
        .atStartOfDay(sp)
        .withZoneSameInstant(ZoneId.systemDefault())
        .toLocalDateTime();
    assertEquals(expectedStart, bounds.startInclusive());
    assertNull(bounds.endExclusive());
  }

  @Test
  @DisplayName("CSV keyset exporter deve localizar headers/números, proteger fórmulas com espaço/quebra de linha e não invocar callback se o 1o lote falhar")
  void csvKeysetExporterLocalizesSanitizesAndDefersHeadersUntilFirstBatch() {
    CsvTransactionExporterAdapter adapter = new CsvTransactionExporterAdapter();
    AtomicBoolean headersWritten = new AtomicBoolean(false);

    assertThrows(IllegalStateException.class, () -> adapter.exportTransactionsKeyset(
        (cAt, cId) -> {
          throw new IllegalStateException("DB down");
        },
        500,
        new CsvExportOptions(ZoneId.of("UTC"), Locale.US, UserExperienceMode.PRODUCTIVITY, "YYYY-MM-DD", "24h"),
        new StringWriter(),
        () -> headersWritten.set(true)));
    assertFalse(headersWritten.get(), "Callback de cabeçalhos/BOM não pode rodar quando a 1a consulta falha");

    TransactionHistory tx = new TransactionHistory(
        UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
        new BigDecimal("12.50"), 30, new BigDecimal("25.00"),
        TransactionType.TODO_COMPLETED, "  =CMD()\n+SUM(A1)", null, null, TaskDifficulty.HARD,
        List.of("work", "urgent"), "Sprint 1", "Line 1\n-malicious", LocalDateTime.of(2026, 11, 24, 10, 0));

    StringWriter enWriter = new StringWriter();
    adapter.exportTransactionsKeyset(
        (cAt, cId) -> cAt == null ? List.of(tx) : List.of(),
        500,
        new CsvExportOptions(ZoneId.of("UTC"), Locale.US, UserExperienceMode.PRODUCTIVITY, "YYYY-MM-DD", "24h"),
        enWriter,
        () -> headersWritten.set(true));

    assertTrue(headersWritten.get());
    String enCsv = enWriter.toString();
    assertTrue(enCsv.startsWith("Name,Credits,Points,Type,Complexity,List,Tags,Description,Original Price,Date"));
    assertTrue(enCsv.contains("'  =CMD()"));
    assertTrue(enCsv.contains("'+SUM(A1)"));
    assertTrue(enCsv.contains("'-malicious"));
    assertTrue(enCsv.contains("12.5"));
    assertTrue(enCsv.contains("Sprint 1"));
    assertTrue(enCsv.contains("work, urgent"));
  }

  @Test
  @DisplayName("SocialUserSummary mascara levelTitle quando stats privadas, GetPublicUserShowcase pula executeReadOnly e Retro bloqueia BLOCKED_BY_VIEWER")
  void privacyMaskingLightweightPublicShowcaseAndBlockedByViewerRetro() {
    UUID viewerId = UUID.randomUUID();
    UUID targetId = UUID.randomUUID();
    User target = createUser(targetId, SubscriptionStatus.FREE, null);
    target.updatePrivacySettings(PrivacyLevel.PUBLIC, PrivacyLevel.PRIVATE, PrivacyLevel.PRIVATE, null);

    SocialUserSummary masked = SocialUserSummary.fromUserForViewer(target, 12, SocialRelationshipStatus.NONE);
    assertNull(masked.levelTitle());
    assertEquals(0, masked.totalXp());
    assertTrue(masked.emailVerified());

    UserRepository userRepo = mock(UserRepository.class);
    FriendshipRepository friendshipRepo = mock(FriendshipRepository.class);
    GetUserShowcaseUseCase showcaseUseCase = mock(GetUserShowcaseUseCase.class);
    ProfileHighlightRepository highlightRepo = mock(ProfileHighlightRepository.class);
    when(userRepo.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(target));
    when(friendshipRepo.findBetweenUsers(viewerId, targetId)).thenReturn(Optional.empty());
    when(highlightRepo.findAllByUserIdOrderByDisplayOrder(targetId)).thenReturn(List.of(
        new ProfileHighlight(UUID.randomUUID(), targetId, 0, HighlightType.ACCOUNT_BADGE, null, "FOUNDER", LocalDateTime.now()),
        new ProfileHighlight(UUID.randomUUID(), targetId, 1, HighlightType.STAT_METRIC, null, "TOTAL_XP", LocalDateTime.now())));

    GetPublicUserShowcaseUseCase publicShowcase = new GetPublicUserShowcaseUseCase(
        userRepo,
        friendshipRepo,
        new EffectiveStreakResolver(mock(TransactionHistoryRepository.class)),
        showcaseUseCase,
        highlightRepo);

    var res = publicShowcase.execute(viewerId, "testuser");
    verify(showcaseUseCase, never()).executeReadOnly(any());
    assertEquals(1, res.highlights().size());
    assertEquals(HighlightType.ACCOUNT_BADGE, res.highlights().get(0).getHighlightType());
    assertNull(res.user().levelTitle());

    // BLOCKED_BY_VIEWER em GetUserRetrospectiveUseCase deve lançar ResourceNotFoundException
    when(friendshipRepo.findBetweenUsers(viewerId, targetId))
        .thenReturn(Optional.of(Friendship.createBlocked(viewerId, targetId, Instant.now())));
    GetUserRetrospectiveUseCase retroUseCase = new GetUserRetrospectiveUseCase(
        userRepo,
        friendshipRepo,
        mock(TransactionHistoryRepository.class),
        mock(FocusRecordRepository.class),
        mock(UserAchievementRepository.class),
        mock(AchievementRepository.class),
        new UserTimeResolver(userRepo, Clock.systemUTC()));

    assertThrows(ResourceNotFoundException.class, () -> retroUseCase.executeForUsername(viewerId, "testuser", 2025));
  }
}
