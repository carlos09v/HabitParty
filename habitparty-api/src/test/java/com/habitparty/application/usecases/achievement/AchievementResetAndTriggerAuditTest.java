package com.habitparty.application.usecases.achievement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.transaction.support.TransactionOperations;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.PaymentEventRepository;
import com.habitparty.application.ports.PaymentGatewayPort;
import com.habitparty.application.ports.PaymentWebhookEvent;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.SocialNotificationRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.usecases.focus.CreateFocusRecordCommand;
import com.habitparty.application.usecases.focus.CreateFocusRecordUseCase;
import com.habitparty.application.usecases.payment.ProcessStripeWebhookUseCase;
import com.habitparty.application.usecases.task.DailyResetUseCase;
import com.habitparty.application.usecases.task.RecordHabitScoreUseCase;
import com.habitparty.application.usecases.user.ResetUserAccountUseCase;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.focus.FocusRewardCalculator;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.enums.AccountResetScope;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.HabitImportanceType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;

class AchievementResetAndTriggerAuditTest {

  private User createTestUser(UUID userId) {
    return new User(
        userId,
        UserRole.USER,
        false,
        "Auditoria",
        "auditoria_user",
        "auditoria@habitparty.com",
        "hashed_pwd",
        BigDecimal.TEN,
        new BigDecimal("100"),
        LocalDate.of(1998, 5, 10),
        null,
        UserGender.NON_BINARY,
        500,
        5,
        10,
        LocalDateTime.of(2026, 1, 1, 10, 0));
  }

  private Habit createBothHabit(UUID habitId, UUID userId, TaskStatus status, int positiveCount, int negativeCount,
      LocalDateTime lastCompletedAt) {
    Habit habit = new Habit(
        habitId,
        UUID.randomUUID(),
        userId,
        "Hábito Misto",
        null,
        0,
        TaskPriority.MEDIUM,
        List.of(),
        TaskDifficulty.MEDIUM,
        status,
        TaskType.HABIT,
        false,
        null,
        LocalDateTime.of(2026, 10, 1, 9, 0),
        List.of(),
        1,
        HabitType.BOTH,
        HabitResetCounter.DAILY,
        HabitImportanceType.NORMAL,
        lastCompletedAt);
    for (int i = 0; i < positiveCount; i++) {
      habit.registerCompletion(lastCompletedAt != null ? lastCompletedAt : LocalDateTime.of(2026, 10, 17, 15, 0));
    }
    for (int i = 0; i < negativeCount; i++) {
      habit.registerNegative();
    }
    habit.changeStatus(status);
    return habit;
  }

  @Test
  @DisplayName("ResetUserAccountUseCase (METRICS) preserva contagem de workspaces existentes e reavalia conquistas")
  void resetMetricsPreservesWorkspaceCountAndReevaluatesAchievements() {
    UUID userId = UUID.randomUUID();
    User user = createTestUser(userId);
    user.getStats().recordWorkspaceCreated();
    user.getStats().recordWorkspaceCreated();
    user.getStats().recordWorkspaceCreated();

    UserRepository userPort = mock(UserRepository.class);
    TaskRepository taskPort = mock(TaskRepository.class);
    BoardColumnRepository boardColumnPort = mock(BoardColumnRepository.class);
    WorkspaceRepository workspacePort = mock(WorkspaceRepository.class);
    RewardRepository rewardPort = mock(RewardRepository.class);
    InventoryItemRepository inventoryItemPort = mock(InventoryItemRepository.class);
    FocusRecordRepository focusRecordPort = mock(FocusRecordRepository.class);
    FocusActivityRepository focusActivityPort = mock(FocusActivityRepository.class);
    TransactionHistoryRepository transactionHistoryPort = mock(TransactionHistoryRepository.class);
    UserAchievementRepository userAchievementPort = mock(UserAchievementRepository.class);
    ProfileHighlightRepository profileHighlightPort = mock(ProfileHighlightRepository.class);
    SocialNotificationRepository socialNotificationPort = mock(SocialNotificationRepository.class);
    EvaluateUserAchievementsUseCase evaluateUseCase = mock(EvaluateUserAchievementsUseCase.class);

    when(userPort.findByIdForUpdate(userId)).thenReturn(Optional.of(user));
    when(workspacePort.countByUserId(userId)).thenReturn(3);
    when(userPort.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    ResetUserAccountUseCase useCase = new ResetUserAccountUseCase(
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
        socialNotificationPort,
        evaluateUseCase);

    User saved = useCase.execute(userId, AccountResetScope.METRICS);

    assertEquals(3, saved.getStats().getTotalWorkspacesCreated());
    verify(workspacePort, never()).deleteAllByUserId(userId);
    verify(evaluateUseCase).execute(saved);
  }

  @Test
  @DisplayName("ResetUserAccountUseCase (COMPLETE) zera workspaces e ainda reavalia conquistas preservadas (ex.: Fundador)")
  void resetCompleteZeroesWorkspaceCountAndReevaluatesAchievements() {
    UUID userId = UUID.randomUUID();
    User user = createTestUser(userId);
    user.grantFounderStatus();
    user.getStats().recordWorkspaceCreated();
    user.getStats().recordWorkspaceCreated();

    UserRepository userPort = mock(UserRepository.class);
    TaskRepository taskPort = mock(TaskRepository.class);
    BoardColumnRepository boardColumnPort = mock(BoardColumnRepository.class);
    WorkspaceRepository workspacePort = mock(WorkspaceRepository.class);
    RewardRepository rewardPort = mock(RewardRepository.class);
    InventoryItemRepository inventoryItemPort = mock(InventoryItemRepository.class);
    FocusRecordRepository focusRecordPort = mock(FocusRecordRepository.class);
    FocusActivityRepository focusActivityPort = mock(FocusActivityRepository.class);
    TransactionHistoryRepository transactionHistoryPort = mock(TransactionHistoryRepository.class);
    UserAchievementRepository userAchievementPort = mock(UserAchievementRepository.class);
    ProfileHighlightRepository profileHighlightPort = mock(ProfileHighlightRepository.class);
    SocialNotificationRepository socialNotificationPort = mock(SocialNotificationRepository.class);
    EvaluateUserAchievementsUseCase evaluateUseCase = mock(EvaluateUserAchievementsUseCase.class);

    when(userPort.findByIdForUpdate(userId)).thenReturn(Optional.of(user));
    when(userPort.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    ResetUserAccountUseCase useCase = new ResetUserAccountUseCase(
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
        socialNotificationPort,
        evaluateUseCase);

    User saved = useCase.execute(userId, AccountResetScope.COMPLETE);

    assertEquals(0, saved.getStats().getTotalWorkspacesCreated());
    assertTrue(saved.isFounder());
    verify(workspacePort).deleteAllByUserId(userId);
    verify(evaluateUseCase).execute(saved);
  }

  @Test
  @DisplayName("CreateFocusRecordUseCase contabiliza UserStats e avalia conquistas mesmo após o soft cap diário de 8h")
  void createFocusRecordUpdatesStatsAndEvaluatesAchievementsWhenRewardIsSoftCapped() {
    UUID userId = UUID.randomUUID();
    UUID activityId = UUID.randomUUID();
    User user = createTestUser(userId);
    FocusActivity activity = new FocusActivity(
        activityId,
        userId,
        "Deep Work",
        "brain",
        0,
        FocusRecordType.POMO,
        25,
        LocalDateTime.of(2026, 1, 1, 10, 0));

    FocusRecordRepository focusRecordPort = mock(FocusRecordRepository.class);
    InventoryItemRepository inventoryItemPort = mock(InventoryItemRepository.class);
    FocusActivityRepository focusActivityPort = mock(FocusActivityRepository.class);
    TransactionHistoryRepository transactionHistoryPort = mock(TransactionHistoryRepository.class);
    UserRepository userPort = mock(UserRepository.class);
    TaskRepository taskPort = mock(TaskRepository.class);
    EvaluateUserAchievementsUseCase evaluateUseCase = mock(EvaluateUserAchievementsUseCase.class);

    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(focusActivityPort.findById(activityId)).thenReturn(Optional.of(activity));
    when(focusRecordPort.sumFocusMinutesOnDate(any(), any(), any())).thenReturn(FocusRewardCalculator.DAILY_TIER3_MINUTES);
    when(focusRecordPort.save(any(FocusRecord.class))).thenAnswer(inv -> inv.getArgument(0));
    when(userPort.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    CreateFocusRecordUseCase useCase = new CreateFocusRecordUseCase(
        focusRecordPort,
        inventoryItemPort,
        focusActivityPort,
        transactionHistoryPort,
        userPort);
    useCase.setTaskPort(taskPort);
    useCase.setEvaluateUserAchievementsUseCase(evaluateUseCase);

    LocalDateTime endTime = LocalDateTime.now(ZoneOffset.UTC).minusMinutes(2);
    LocalDateTime startTime = endTime.minusMinutes(25);
    CreateFocusRecordCommand command = new CreateFocusRecordCommand(
        activityId,
        null,
        null,
        "Sessão após soft cap",
        startTime,
        endTime,
        FocusRecordType.POMO,
        1);

    FocusRecord saved = useCase.execute(userId, command);

    assertEquals(0, saved.getXpEarned().orElse(0));
    assertEquals(0, BigDecimal.ZERO.compareTo(saved.getCoinsEarned().orElse(BigDecimal.ZERO)));
    assertEquals(1, user.getStats().getTotalFocusSessions());
    assertEquals(25, user.getStats().getTotalFocusMinutes());
    assertEquals(1, user.getStats().getTotalPomodorosCompleted());
    assertEquals(1, user.getStats().getTotalActivityGoalsMet());
    verify(userPort).save(user);
    verify(evaluateUseCase).execute(user);
  }

  @Test
  @DisplayName("DailyResetUseCase concede ciclo limpo de hábito BOTH sem recaída no rollover e avalia conquistas")
  void dailyResetAwardsCleanCycleForBothHabitAndEvaluatesAchievements() {
    UUID userId = UUID.randomUUID();
    UUID habitId = UUID.randomUUID();
    User user = createTestUser(userId);
    LocalDateTime completedYesterday = LocalDateTime.of(2026, 10, 17, 15, 0);
    Habit cleanBothHabit = createBothHabit(habitId, userId, TaskStatus.COMPLETED, 1, 0, completedYesterday);

    Clock fixedClock = Clock.fixed(Instant.parse("2026-10-18T10:00:00Z"), ZoneOffset.UTC);
    TaskRepository taskPort = mock(TaskRepository.class);
    TransactionHistoryRepository transactionPort = mock(TransactionHistoryRepository.class);
    UserRepository userPort = mock(UserRepository.class);
    BoardColumnRepository boardColumnPort = mock(BoardColumnRepository.class);
    EvaluateUserAchievementsUseCase evaluateUseCase = mock(EvaluateUserAchievementsUseCase.class);

    when(userPort.findUserIdsDueForDailyReset(any())).thenReturn(List.of(userId));
    when(userPort.findAllByIdsForUpdate(List.of(userId))).thenReturn(List.of(user));
    when(taskPort.findRecurringTasksByUserIds(any())).thenReturn(List.of(cleanBothHabit));
    when(taskPort.findOverdueHardcoreTodosByUserIds(any(), any())).thenReturn(List.of());

    DailyResetUseCase useCase = new DailyResetUseCase(
        taskPort,
        transactionPort,
        userPort,
        fixedClock,
        TransactionOperations.withoutTransaction(),
        boardColumnPort);
    useCase.setEvaluateUserAchievementsUseCase(evaluateUseCase);

    useCase.executeDailyRolloverSummary();

    assertEquals(1, user.getStats().getTotalCleanHabitCycles());
    assertEquals(TaskStatus.PENDING, cleanBothHabit.getStatus());
    assertEquals(0, cleanBothHabit.getPositiveCount());
    assertEquals(0, cleanBothHabit.getNegativeCount());
    verify(evaluateUseCase).execute(user);
  }

  @Test
  @DisplayName("Hábito BOTH com '+' seguido de '-' no mesmo ciclo não recebe ciclo limpo nem no clique nem no rollover")
  void bothHabitWithSameCycleRelapseNeverAwardsCleanCycle() {
    UUID userId = UUID.randomUUID();
    UUID habitId = UUID.randomUUID();
    User user = createTestUser(userId);
    Habit habit = createBothHabit(habitId, userId, TaskStatus.PENDING, 0, 0, null);

    Clock fixedClock = Clock.fixed(Instant.parse("2026-10-18T10:00:00Z"), ZoneOffset.UTC);
    TaskRepository taskPort = mock(TaskRepository.class);
    TransactionHistoryRepository transactionPort = mock(TransactionHistoryRepository.class);
    UserRepository userPort = mock(UserRepository.class);
    BoardColumnRepository boardColumnPort = mock(BoardColumnRepository.class);
    EvaluateUserAchievementsUseCase evaluateUseCase = mock(EvaluateUserAchievementsUseCase.class);
    ApplicationEventPublisher eventPublisher = mock(ApplicationEventPublisher.class);

    when(taskPort.findById(habitId)).thenReturn(Optional.of(habit));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(taskPort.save(any())).thenAnswer(inv -> inv.getArgument(0));
    when(userPort.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    RecordHabitScoreUseCase scoreUseCase = new RecordHabitScoreUseCase(
        taskPort,
        transactionPort,
        userPort,
        evaluateUseCase,
        boardColumnPort,
        fixedClock,
        eventPublisher);

    scoreUseCase.execute(habitId, userId, 1);
    assertEquals(0, user.getStats().getTotalCleanHabitCycles());

    scoreUseCase.execute(habitId, userId, -1);
    assertEquals(1, habit.getNegativeCount());

    // Virada do dia seguinte
    Clock nextDayClock = Clock.fixed(Instant.parse("2026-10-19T10:00:00Z"), ZoneOffset.UTC);
    EvaluateUserAchievementsUseCase rolloverEvaluateUseCase = mock(EvaluateUserAchievementsUseCase.class);
    when(userPort.findUserIdsDueForDailyReset(any())).thenReturn(List.of(userId));
    when(userPort.findAllByIdsForUpdate(List.of(userId))).thenReturn(List.of(user));
    when(taskPort.findRecurringTasksByUserIds(any())).thenReturn(List.of(habit));
    when(taskPort.findOverdueHardcoreTodosByUserIds(any(), any())).thenReturn(List.of());

    DailyResetUseCase dailyResetUseCase = new DailyResetUseCase(
        taskPort,
        transactionPort,
        userPort,
        nextDayClock,
        TransactionOperations.withoutTransaction(),
        boardColumnPort);
    dailyResetUseCase.setEvaluateUserAchievementsUseCase(rolloverEvaluateUseCase);

    dailyResetUseCase.executeDailyRolloverSummary();

    assertEquals(0, user.getStats().getTotalCleanHabitCycles());
    verify(rolloverEvaluateUseCase, never()).execute(any());
  }

  @Test
  @DisplayName("ProcessStripeWebhookUseCase avalia conquistas ao conceder status de Fundador no checkout e na atualização")
  void stripeWebhookEvaluatesAchievementsWhenGrantingFounderStatus() {
    UUID userId = UUID.randomUUID();
    User user = createTestUser(userId);
    assertFalse(user.isFounder());

    UserRepository userRepository = mock(UserRepository.class);
    PaymentEventRepository paymentEventRepository = mock(PaymentEventRepository.class);
    PaymentGatewayPort paymentGatewayPort = mock(PaymentGatewayPort.class);
    EvaluateUserAchievementsUseCase evaluateUseCase = mock(EvaluateUserAchievementsUseCase.class);

    when(paymentEventRepository.claimEvent(any(), any(), any())).thenReturn(true);
    when(userRepository.findByIdForUpdate(userId)).thenReturn(Optional.of(user));
    when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    ProcessStripeWebhookUseCase useCase = new ProcessStripeWebhookUseCase(
        userRepository, paymentEventRepository, paymentGatewayPort);
    useCase.setEvaluateUserAchievementsUseCase(evaluateUseCase);

    useCase.execute(new PaymentWebhookEvent.CheckoutCompleted(
        "evt_founder_checkout",
        "cs_founder_1",
        "subscription",
        "cus_1",
        "sub_1",
        userId,
        user.getEmail(),
        365,
        Map.of("plan", "FOUNDER_ANNUAL")));

    assertTrue(user.isFounder());
    verify(evaluateUseCase).execute(user);

    User pixUser = createTestUser(UUID.randomUUID());
    when(userRepository.findByIdForUpdate(pixUser.getId())).thenReturn(Optional.of(pixUser));
    useCase.execute(new PaymentWebhookEvent.CheckoutCompleted(
        "evt_founder_pix",
        "cs_pix_1",
        "payment",
        null,
        null,
        pixUser.getId(),
        pixUser.getEmail(),
        30,
        Map.of("isFounder", "true")));

    assertTrue(pixUser.isFounder());
    verify(evaluateUseCase).execute(pixUser);

    User subUpdatedUser = createTestUser(UUID.randomUUID());
    when(userRepository.findByIdForUpdate(subUpdatedUser.getId())).thenReturn(Optional.of(subUpdatedUser));
    useCase.execute(new PaymentWebhookEvent.SubscriptionUpdated(
        "evt_founder_sub_updated",
        "sub_2",
        "cus_2",
        subUpdatedUser.getId(),
        LocalDateTime.now().plusMonths(1),
        "active",
        Map.of("isFounder", "true")));

    assertTrue(subUpdatedUser.isFounder());
    verify(evaluateUseCase).execute(subUpdatedUser);
  }
}
