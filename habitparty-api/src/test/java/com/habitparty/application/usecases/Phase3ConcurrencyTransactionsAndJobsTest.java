package com.habitparty.application.usecases;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.transaction.support.TransactionTemplate;

import com.habitparty.adapters.out.persistence.entities.AchievementJpaEntity;
import com.habitparty.adapters.out.persistence.repository.AchievementJpaRepository;
import com.habitparty.adapters.out.persistence.repository.UserAchievementJpaRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.EmailSenderPort;
import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.PaymentEventRepository;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.SocialNotificationRepository;
import com.habitparty.application.ports.StoragePort;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
import com.habitparty.application.usecases.focus.CreateFocusRecordCommand;
import com.habitparty.application.usecases.focus.CreateFocusRecordUseCase;
import com.habitparty.application.usecases.focus.FocusRecordReversalSupport;
import com.habitparty.application.usecases.inventory.OpenMysteryBoxUseCase;
import com.habitparty.application.usecases.reward.RedeemRewardUseCase;
import com.habitparty.application.usecases.social.NotifyFriendsMilestoneUseCase;
import com.habitparty.application.usecases.task.ChangeTaskStatusUseCase;
import com.habitparty.application.usecases.task.DailyResetUseCase;
import com.habitparty.application.usecases.task.SendTaskRemindersUseCase;
import com.habitparty.application.usecases.user.UpdateProfilePhotoUseCase;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.AchievementCategory;
import com.habitparty.core.domain.enums.AchievementCode;
import com.habitparty.core.domain.enums.AchievementRarity;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.FriendRequestPolicy;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.PrivacyLevel;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.DailyRepeatType;
import com.habitparty.core.domain.enums.task.HabitImportanceType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

import net.javacrumbs.shedlock.core.LockConfiguration;
import net.javacrumbs.shedlock.core.LockProvider;
import net.javacrumbs.shedlock.core.SimpleLock;

@SpringBootTest
class Phase3ConcurrencyTransactionsAndJobsTest {

  @Autowired
  private PlatformTransactionManager transactionManager;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private InventoryItemRepository inventoryItemRepository;

  @Autowired
  private RewardRepository rewardRepository;

  @Autowired
  private AchievementJpaRepository achievementJpaRepository;

  @Autowired
  private UserAchievementJpaRepository userAchievementJpaRepository;

  @Autowired
  private EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;

  @Autowired
  private OpenMysteryBoxUseCase openMysteryBoxUseCase;

  @Autowired
  private RedeemRewardUseCase redeemRewardUseCase;

  @Autowired
  private PaymentEventRepository paymentEventRepository;

  @Autowired
  private LockProvider lockProvider;

  private TransactionTemplate txTemplate;

  @BeforeEach
  void setUp() {
    txTemplate = new TransactionTemplate(transactionManager);

    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS transaction_history (
          transaction_history_id UUID PRIMARY KEY,
          user_id UUID NOT NULL,
          transaction_type VARCHAR(50) NOT NULL,
          reference_id UUID,
          name_snapshot VARCHAR(255) NOT NULL,
          gold_amount NUMERIC(10, 2),
          xp_amount INTEGER,
          price_snapshot NUMERIC(10, 2),
          icon_snapshot VARCHAR(255),
          difficulty_snapshot VARCHAR(50),
          package_level_snapshot VARCHAR(50),
          tags_snapshot VARCHAR ARRAY,
          column_name_snapshot VARCHAR(255),
          description_snapshot VARCHAR(500),
          checklist_completed_snapshot BOOLEAN,
          effort_units_snapshot INTEGER,
          hidden_from_history BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL
        )
        """);

    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS rewards (
          reward_id UUID PRIMARY KEY,
          user_id UUID NOT NULL,
          name VARCHAR(30) NOT NULL,
          icon VARCHAR(20),
          description VARCHAR(140),
          order_index INTEGER NOT NULL,
          price NUMERIC(10, 2) NOT NULL,
          tags VARCHAR ARRAY,
          reward_type VARCHAR(50) NOT NULL,
          category VARCHAR(50),
          package_level VARCHAR(50),
          base_duration_minutes INTEGER,
          loot_items JSON,
          created_at TIMESTAMP NOT NULL
        )
        """);
  }

  private User createAndSaveUser(String prefix, BigDecimal coins) {
    String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    User user = new User(
        UUID.randomUUID(),
        UserRole.USER,
        false,
        "Test " + prefix,
        prefix + "_" + suffix,
        prefix + "_" + suffix + "@habitparty.test",
        "hashed-secret",
        coins,
        coins,
        LocalDate.of(1996, 4, 15),
        null,
        UserGender.PREFER_NOT_TO_SAY,
        0,
        0,
        0,
        LocalDateTime.now(ZoneOffset.UTC));
    user.initializeTimezone("UTC", Clock.systemUTC());
    return userRepository.save(user);
  }

  private <T> List<Future<T>> runConcurrently(int threads, Callable<T> task) throws Exception {
    ExecutorService pool = Executors.newFixedThreadPool(threads);
    CountDownLatch ready = new CountDownLatch(threads);
    CountDownLatch start = new CountDownLatch(1);
    List<Future<T>> futures = new ArrayList<>();
    try {
      for (int i = 0; i < threads; i++) {
        futures.add(pool.submit(() -> {
          ready.countDown();
          assertTrue(start.await(5, TimeUnit.SECONDS));
          return task.call();
        }));
      }
      assertTrue(ready.await(5, TimeUnit.SECONDS));
      start.countDown();
      for (Future<T> future : futures) {
        try {
          future.get(15, TimeUnit.SECONDS);
        } catch (Exception ignored) {
          // Capturado e verificado individualmente nos testes
        }
      }
      return futures;
    } finally {
      pool.shutdownNow();
    }
  }

  @Test
  @DisplayName("Rollback Isolation: falha em REQUIRES_NEW dentro de NotifyFriendsMilestoneUseCase não marca transação pai como rollbackOnly")
  void notifyFriendsMilestoneFailureShouldNeverPoisonParentTransaction() {
    User user = createAndSaveUser("rollback_iso", new BigDecimal("50.00"));
    UUID friendId = UUID.randomUUID();

    FriendshipRepository friendshipRepo = mock(FriendshipRepository.class);
    SocialNotificationRepository failingNotificationRepo = mock(SocialNotificationRepository.class);
    UserRepository mockUserRepo = mock(UserRepository.class);
    UserTimeResolver timeResolver = mock(UserTimeResolver.class);

    user.updatePrivacySettings(
        PrivacyLevel.PUBLIC, PrivacyLevel.PUBLIC, PrivacyLevel.PUBLIC, FriendRequestPolicy.EVERYONE);
    when(mockUserRepo.findById(user.getId())).thenReturn(Optional.of(user));
    when(friendshipRepo.findAcceptedFriendIds(user.getId())).thenReturn(List.of(friendId));
    when(timeResolver.clock()).thenReturn(Clock.systemUTC());
    when(failingNotificationRepo.saveAll(any())).thenThrow(new RuntimeException("Simulated DB failure in REQUIRES_NEW"));

    NotifyFriendsMilestoneUseCase notifier = new NotifyFriendsMilestoneUseCase(
        friendshipRepo, failingNotificationRepo, mockUserRepo, timeResolver);
    notifier.setTransactionManager(transactionManager);

    Achievement rareAchievement = new Achievement(
        UUID.randomUUID(),
        AchievementCode.TASK_HARD_5.name(),
        "Hardcore",
        "Desc",
        "trophy",
        25,
        AchievementCategory.TASKS,
        AchievementRarity.RARE,
        5,
        1,
        false);

    // Transação pai modifica saldo do usuário e dispara notificação que falha dentro de REQUIRES_NEW
    txTemplate.executeWithoutResult(status -> {
      User loaded = userRepository.findById(user.getId()).orElseThrow();
      loaded.addCoins(new BigDecimal("25.00"));
      userRepository.save(loaded);

      notifier.notifyAchievementUnlocked(user.getId(), rareAchievement);
      assertFalse(status.isRollbackOnly(), "Transação pai não pode ser marcada como rollbackOnly");
    });

    User persisted = userRepository.findById(user.getId()).orElseThrow();
    assertEquals(0, new BigDecimal("75.00").compareTo(persisted.getCurrentCoins()),
        "Commit da transação pai deve ter sido preservado após falha na notificação");
  }

  @Test
  @DisplayName("Concorrência: EvaluateUserAchievementsUseCase sob 6 threads simultâneas desbloqueia conquista 1 única vez sem PK error nem pontos duplicados")
  void concurrentAchievementEvaluationShouldUnlockOnceWithoutDuplicatePoints() throws Exception {
    User user = createAndSaveUser("ach_race", BigDecimal.ZERO);
    user.getStats().recordTaskCompleted(false, false);
    userRepository.save(user);

    // Garante existência de uma conquista conhecida (TASK_FIRST) no catálogo H2
    AchievementJpaEntity existing = achievementJpaRepository.findAllByOrderByDisplayOrderAsc().stream()
        .filter(a -> AchievementCode.TASK_FIRST.name().equals(a.getCode()))
        .findFirst()
        .orElseGet(() -> achievementJpaRepository.saveAndFlush(AchievementJpaEntity.builder()
            .id(UUID.randomUUID())
            .code(AchievementCode.TASK_FIRST.name())
            .title("Primeira Tarefa")
            .description("Complete sua primeira tarefa")
            .iconName("check")
            .points(15)
            .category(AchievementCategory.TASKS)
            .rarity(AchievementRarity.COMMON)
            .targetValue(1)
            .displayOrder(1)
            .secret(false)
            .build()));

    AtomicInteger errors = new AtomicInteger();
    runConcurrently(6, () -> {
      try {
        evaluateUserAchievementsUseCase.executeForUserId(user.getId());
      } catch (Exception e) {
        errors.incrementAndGet();
        throw e;
      }
      return null;
    });

    assertEquals(0, errors.get(), "Avaliação concorrente não deve falhar com PK/constraint ou deadlock");
    long unlocks = userAchievementJpaRepository.findAllByUserIdOrderByUnlockedAtDesc(user.getId()).stream()
        .filter(ua -> ua.getAchievementId().equals(existing.getId()))
        .count();
    assertEquals(1L, unlocks, "Conquista deve ser persistida exatamente uma vez");

    User reloaded = userRepository.findById(user.getId()).orElseThrow();
    assertEquals(existing.getPoints(), reloaded.getStats().getAchievementPoints(),
        "Pontos de conquista não podem ser duplicados sob concorrência");
  }

  @Test
  @DisplayName("Concorrência: OpenMysteryBoxUseCase sob 4 threads simultâneas permite exatamente 1 abertura (zero double-open)")
  void concurrentMysteryBoxOpenShouldAllowExactlyOneWinner() throws Exception {
    User user = createAndSaveUser("mbox_race", BigDecimal.ZERO);
    InventoryItem box = new InventoryItem(
        UUID.randomUUID(),
        user.getId(),
        UUID.randomUUID(),
        "Caixa Misteriosa",
        new BigDecimal("30.00"),
        RewardType.MISTERY_BOX,
        InventoryItemStatus.AVAILABLE,
        1,
        "mystery_box",
        RewardPackageLevel.BASIC,
        null,
        LocalDateTime.now(ZoneOffset.UTC),
        List.of());
    inventoryItemRepository.save(box);

    AtomicInteger successes = new AtomicInteger();
    AtomicInteger domainFailures = new AtomicInteger();

    runConcurrently(4, () -> {
      try {
        openMysteryBoxUseCase.execute(box.getId(), user.getId());
        successes.incrementAndGet();
      } catch (DomainValidationException e) {
        domainFailures.incrementAndGet();
      }
      return null;
    });

    assertEquals(1, successes.get(), "Exatamente 1 thread deve abrir a caixa misteriosa");
    assertEquals(3, domainFailures.get(), "As outras 3 threads devem ser bloqueadas por DomainValidationException");

    User reloaded = userRepository.findById(user.getId()).orElseThrow();
    assertEquals(1, reloaded.getStats().getTotalMysteryBoxesOpened(),
        "Contador de caixas abertas deve ser incrementado exatamente 1 vez");
  }

  @Test
  @DisplayName("Concorrência: RedeemRewardUseCase em dívida descartável (DEBT) cobra exatamente 1 vez sob 4 threads simultâneas")
  void concurrentDebtRedemptionShouldChargeExactlyOnce() throws Exception {
    User user = createAndSaveUser("debt_race", new BigDecimal("100.00"));
    Reward debt = new Reward(
        UUID.randomUUID(),
        user.getId(),
        "Dívida Única",
        new BigDecimal("40.00"),
        List.of("divida"),
        RewardType.SINGLE_USE,
        1,
        "coin",
        "Pagar 1x",
        RewardCategory.DEBT,
        null,
        null);
    rewardRepository.save(debt);

    AtomicInteger successes = new AtomicInteger();
    AtomicInteger notFoundFailures = new AtomicInteger();

    runConcurrently(4, () -> {
      try {
        redeemRewardUseCase.execute(debt.getId(), user.getId());
        successes.incrementAndGet();
      } catch (ResourceNotFoundException e) {
        notFoundFailures.incrementAndGet();
      }
      return null;
    });

    assertEquals(1, successes.get(), "Exatamente 1 thread deve quitar a dívida descartável");
    assertEquals(3, notFoundFailures.get(), "As demais threads devem encontrar a dívida já removida");

    User reloaded = userRepository.findById(user.getId()).orElseThrow();
    assertEquals(0, new BigDecimal("60.00").compareTo(reloaded.getCurrentCoins()),
        "Saldo deve ser debitado exatamente 1 vez (100 - 40 = 60)");
    assertTrue(rewardRepository.findById(debt.getId()).isEmpty(), "Dívida descartável deve ter sido removida");
  }

  @Test
  @DisplayName("Concorrência: claimEvent atômico de webhook Stripe permite exatamente 1 vencedor entre 6 threads simultâneas")
  void concurrentWebhookClaimShouldAllowExactlyOneWinner() throws Exception {
    String eventId = "evt_phase3_concurrent_" + UUID.randomUUID();
    AtomicInteger winners = new AtomicInteger();

    runConcurrently(6, () -> {
      if (paymentEventRepository.claimEvent(eventId, "checkout.session.completed", null)) {
        winners.incrementAndGet();
      }
      return null;
    });

    assertEquals(1, winners.get(), "Apenas 1 thread pode reivindicar o evento Stripe");
  }

  @Test
  @DisplayName("ShedLock: LockProvider JDBC impede execução concorrente do mesmo job entre 4 instâncias simultâneas")
  void shedLockShouldAllowOnlyOneConcurrentHolderPerJob() throws Exception {
    String lockName = "phase3TestLock_" + UUID.randomUUID().toString().substring(0, 8);
    AtomicInteger acquired = new AtomicInteger();

    runConcurrently(4, () -> {
      Optional<SimpleLock> lock = lockProvider.lock(new LockConfiguration(
          Instant.now(),
          lockName,
          Duration.ofMinutes(5),
          Duration.ofSeconds(30)));
      if (lock.isPresent()) {
        acquired.incrementAndGet();
      }
      return null;
    });

    assertEquals(1, acquired.get(), "Exatamente 1 instância pode adquirir o lock distribuído ShedLock");
  }

  @Test
  @DisplayName("DailyResetUseCase: corrige hot-loop de nextDailyResetAt, isola erro de 1 usuário no lote, não dá clean-cycle a BOTH PENDING e aplica Hardcore atrasado")
  void dailyResetFixesShouldWorkCorrectly() {
    ZoneId utc = ZoneOffset.UTC;
    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-25T02:00:00Z"), utc);
    LocalDate todayUtc = LocalDate.now(fixedClock);

    // 1. Hot-loop repair: lastDailyResetDate >= todayUtc, mas nextDailyResetAt <= nowUtc
    TaskRepository taskRepo = mock(TaskRepository.class);
    TransactionHistoryRepository txRepo = mock(TransactionHistoryRepository.class);
    UserRepository userRepo = mock(UserRepository.class);

    User staleNextResetUser = createDomainUser(UUID.randomUUID(), "hotloop");
    staleNextResetUser.initializeTimezone("UTC", fixedClock);
    staleNextResetUser.setLastDailyResetDate(todayUtc);
    staleNextResetUser.setNextDailyResetAt(Instant.parse("2026-11-25T01:00:00Z"));

    when(userRepo.findUserIdsDueForDailyReset(any())).thenReturn(List.of(staleNextResetUser.getId()));
    when(userRepo.findAllByIdsForUpdate(anyCollection())).thenReturn(List.of(staleNextResetUser));
    when(taskRepo.findRecurringTasksByUserIds(anyCollection())).thenReturn(List.of());

    DailyResetUseCase useCase = new DailyResetUseCase(
        taskRepo, txRepo, userRepo, fixedClock, TransactionOperations.withoutTransaction());
    DailyResetUseCase.RolloverSummary hotLoopSummary = useCase.executeDailyRolloverSummary();

    assertEquals(0, hotLoopSummary.processedUsers());
    assertEquals(todayUtc.plusDays(1).atStartOfDay(utc).toInstant(), staleNextResetUser.getNextDailyResetAt(),
        "nextDailyResetAt atrasado deve ser reparado para o próximo ciclo para encerrar hot-loop FOR UPDATE");
    verify(userRepo).saveAll(anyCollection());

    // 2. HabitType.BOTH PENDING não ganha clean-cycle e Daily Hardcore com ciclo pulado recebe penalidade
    TaskRepository taskRepo2 = mock(TaskRepository.class);
    TransactionHistoryRepository txRepo2 = mock(TransactionHistoryRepository.class);
    UserRepository userRepo2 = mock(UserRepository.class);

    User hardcoreUser = createDomainUser(UUID.randomUUID(), "hardcore_delay");
    hardcoreUser.initializeTimezone("UTC", fixedClock);
    hardcoreUser.setLastDailyResetDate(todayUtc.minusDays(2));
    hardcoreUser.setNextDailyResetAt(Instant.parse("2026-11-24T00:00:00Z"));
    hardcoreUser.addCoins(new BigDecimal("100.00"));
    hardcoreUser.setTotalXp(100);

    Habit pendingBothHabit = new Habit(
        UUID.randomUUID(), UUID.randomUUID(), hardcoreUser.getId(),
        "Hábito BOTH", null, 0, TaskPriority.MEDIUM, List.of(), TaskDifficulty.MEDIUM,
        TaskStatus.PENDING, TaskType.HABIT, false, null, todayUtc.minusDays(5).atTime(9, 0),
        List.of(), 0, HabitType.BOTH, HabitResetCounter.DAILY, HabitImportanceType.NORMAL, null);

    // Daily concluída há 3 dias: próxima ocorrência era há 2 dias (atrasada/pulada no rollover atrasado!)
    Daily skippedHardcoreDaily = new Daily(
        UUID.randomUUID(), UUID.randomUUID(), hardcoreUser.getId(),
        "Daily Hardcore", null, 1, TaskPriority.HIGH, List.of(), TaskDifficulty.HARD,
        TaskStatus.COMPLETED, TaskType.DAILY, true, todayUtc.minusDays(2), todayUtc.minusDays(10).atTime(9, 0),
        List.of(), 4, todayUtc.minusDays(10), DailyRepeatType.DAILY, 1, null, null,
        todayUtc.minusDays(3).atTime(20, 0));

    when(userRepo2.findUserIdsDueForDailyReset(any())).thenReturn(List.of(hardcoreUser.getId()));
    when(userRepo2.findAllByIdsForUpdate(anyCollection())).thenReturn(List.of(hardcoreUser));
    when(taskRepo2.findRecurringTasksByUserIds(anyCollection()))
        .thenReturn(List.of(pendingBothHabit, skippedHardcoreDaily));

    DailyResetUseCase useCase2 = new DailyResetUseCase(
        taskRepo2, txRepo2, userRepo2, fixedClock, TransactionOperations.withoutTransaction());
    DailyResetUseCase.RolloverSummary delayedSummary = useCase2.executeDailyRolloverSummary();

    assertEquals(1, delayedSummary.processedUsers());
    assertEquals(0, hardcoreUser.getStats().getTotalCleanHabitCycles(),
        "HabitType.BOTH com status PENDING não deve conceder cleanHabitCycles");
    assertEquals(0, skippedHardcoreDaily.getCurrentStreak(),
        "Daily pulada em rollover atrasado deve perder streak");
    assertTrue(hardcoreUser.getCurrentCoins().compareTo(new BigDecimal("100.00")) < 0,
        "Daily Hardcore pulada em rollover atrasado deve aplicar penalidade");

    // 3. Isolamento de erro no lote: 1 usuário quebrado não derruba o outro usuário saudável do lote
    TaskRepository taskRepo3 = mock(TaskRepository.class);
    TransactionHistoryRepository txRepo3 = mock(TransactionHistoryRepository.class);
    UserRepository userRepo3 = mock(UserRepository.class);

    User badUser = mock(User.class);
    UUID badUserId = UUID.randomUUID();
    when(badUser.getId()).thenReturn(badUserId);
    when(badUser.resolveZoneId(any())).thenThrow(new RuntimeException("Simulated corrupted user state"));

    User healthyUser = createDomainUser(UUID.randomUUID(), "healthy_batch");
    healthyUser.initializeTimezone("UTC", fixedClock);
    healthyUser.setLastDailyResetDate(todayUtc.minusDays(1));
    healthyUser.setNextDailyResetAt(Instant.parse("2026-11-25T00:00:00Z"));

    when(userRepo3.findUserIdsDueForDailyReset(any())).thenReturn(List.of(badUserId, healthyUser.getId()));
    when(userRepo3.findAllByIdsForUpdate(anyCollection())).thenAnswer(inv -> {
      java.util.Collection<UUID> ids = inv.getArgument(0);
      List<User> res = new ArrayList<>();
      if (ids.contains(badUserId)) {
        res.add(badUser);
      }
      if (ids.contains(healthyUser.getId())) {
        res.add(healthyUser);
      }
      return res;
    });
    when(taskRepo3.findRecurringTasksByUserIds(anyCollection())).thenReturn(List.of());

    DailyResetUseCase useCase3 = new DailyResetUseCase(
        taskRepo3, txRepo3, userRepo3, fixedClock, TransactionOperations.withoutTransaction());
    DailyResetUseCase.RolloverSummary isolatedSummary = useCase3.executeDailyRolloverSummary();

    assertEquals(1, isolatedSummary.processedUsers(),
        "Fallback por usuário deve processar o usuário saudável mesmo com falha de outro no lote");
    assertEquals(todayUtc, healthyUser.getLastDailyResetDate());
  }

  @Test
  @DisplayName("SendTaskRemindersUseCase: aplica teto de 3 tentativas (reminderAttempts) e interrompe loop infinito de retries")
  void sendTaskRemindersShouldCapRetriesAtThreeAttempts() {
    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-25T15:00:00Z"), ZoneOffset.UTC);
    UUID userId = UUID.randomUUID();
    User user = createDomainUser(userId, "reminder_cap");
    user.initializeTimezone("UTC", fixedClock);

    LocalDate today = LocalDate.now(fixedClock);
    LocalDateTime now = LocalDateTime.now(fixedClock);
    Todo todo = new Todo(
        UUID.randomUUID(), UUID.randomUUID(), userId, "Lembrete com falha", null,
        0, TaskPriority.HIGH, List.of(), TaskDifficulty.MEDIUM, TaskStatus.PENDING,
        TaskType.TODO, false, today.plusDays(1), now.minusDays(1), List.of(),
        TodoReminderType.ONE_DAY_EARLY, now.minusMinutes(10), null, false,
        true, false);

    TaskRepository taskRepo = mock(TaskRepository.class);
    UserRepository userRepo = mock(UserRepository.class);
    EmailSenderPort emailPort = mock(EmailSenderPort.class);
    EmailDispatchLogRepository emailLogPort = mock(EmailDispatchLogRepository.class);

    when(taskRepo.findPendingEmailReminders(any(), any())).thenReturn(List.of(todo));
    when(userRepo.findAllByIds(anyCollection())).thenReturn(List.of(user));
    when(emailLogPort.countByUserIdAndEmailTypeAndStatusAndSentAtAfter(any(), any(), any(), any())).thenReturn(0L);
    when(emailPort.sendTaskReminderEmail(any(), any(), any(), any(), any(Boolean.class))).thenReturn(false);

    SendTaskRemindersUseCase useCase = new SendTaskRemindersUseCase(
        taskRepo, userRepo, emailPort, emailLogPort, fixedClock);

    useCase.execute();
    assertEquals(1, todo.getReminderAttempts());
    assertFalse(todo.isEmailReminderSent());

    useCase.execute();
    assertEquals(2, todo.getReminderAttempts());
    assertFalse(todo.isEmailReminderSent());

    useCase.execute();
    assertEquals(Todo.MAX_REMINDER_ATTEMPTS, todo.getReminderAttempts());
    assertTrue(todo.isEmailReminderSent(), "Após 3 falhas deve marcar emailReminderSent=true para encerrar retries");
  }

  @Test
  @DisplayName("ChangeTaskStatusUseCase: ao reverter tarefa concluída como HARD e editada para EASY, decrementa totalHardTasksCompleted via snapshot")
  void changeTaskStatusRevertShouldUseDifficultySnapshotFromTransaction() {
    UUID userId = UUID.randomUUID();
    UUID taskId = UUID.randomUUID();
    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-25T15:00:00Z"), ZoneOffset.UTC);

    User user = createDomainUser(userId, "diff_snap");
    user.initializeTimezone("UTC", fixedClock);
    user.addCoins(new BigDecimal("100.00"));
    user.setTotalXp(100);
    user.getStats().recordTaskCompleted(true, false);
    assertEquals(1, user.getStats().getTotalHardTasksCompleted());

    Todo task = new Todo(
        taskId, UUID.randomUUID(), userId, "Tarefa Editada", null,
        0, TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, // Editada de HARD -> EASY após concluir
        TaskStatus.COMPLETED, TaskType.TODO, false, LocalDate.now(fixedClock), LocalDateTime.now(fixedClock),
        List.of(), TodoReminderType.NONE, null, LocalDateTime.now(fixedClock), false, false, false);

    TransactionHistory hardTx = new TransactionHistory(
        UUID.randomUUID(), userId, taskId, new BigDecimal("25.00"), 25, null,
        TransactionType.TODO_COMPLETED, "Tarefa Editada", null, null,
        TaskDifficulty.HARD, List.of(), null, null, LocalDateTime.now(fixedClock));

    TaskRepository taskRepo = mock(TaskRepository.class);
    TransactionHistoryRepository txRepo = mock(TransactionHistoryRepository.class);
    UserRepository userRepo = mock(UserRepository.class);

    when(taskRepo.findById(taskId)).thenReturn(Optional.of(task));
    when(userRepo.findById(userId)).thenReturn(Optional.of(user));
    when(userRepo.findByIdForUpdate(userId)).thenReturn(Optional.of(user));
    when(txRepo.findTop2ByUserIdAndReferenceIdAndType(userId, taskId, TransactionType.TODO_COMPLETED))
        .thenReturn(List.of(hardTx));
    when(txRepo.countCompletedTasksToday(eq(userId), any())).thenReturn(0);
    when(taskRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
    when(userRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

    ChangeTaskStatusUseCase useCase = new ChangeTaskStatusUseCase(
        taskRepo, txRepo, userRepo, null, null, fixedClock, null);

    useCase.execute(taskId, userId, TaskStatus.PENDING);

    assertEquals(0, user.getStats().getTotalHardTasksCompleted(),
        "Estorno deve usar difficultySnapshot (HARD) da transação em vez da dificuldade atual (EASY)");
  }

  @Test
  @DisplayName("UpdateProfilePhotoUseCase: se persistência no banco falhar, remove foto recém-enviada e preserva foto antiga")
  void updateProfilePhotoShouldCleanUpUploadedFileOnDbSaveFailure() {
    UUID userId = UUID.randomUUID();
    User user = createDomainUser(userId, "photo_rollback");
    user.updateProfilePhoto("/uploads/old-avatar.png");

    UserRepository userRepo = mock(UserRepository.class);
    StoragePort storagePort = mock(StoragePort.class);

    when(userRepo.findById(userId)).thenReturn(Optional.of(user));
    when(storagePort.uploadFile(any(), eq("new.png"), eq(3L))).thenReturn("/uploads/new-orphan.png");
    doThrow(new RuntimeException("Simulated DB write failure")).when(userRepo).save(any());

    UpdateProfilePhotoUseCase useCase = new UpdateProfilePhotoUseCase(userRepo, storagePort);

    assertThrows(RuntimeException.class,
        () -> useCase.execute(userId, new ByteArrayInputStream(new byte[]{1, 2, 3}), "new.png", 3L));

    verify(storagePort).deleteFile("/uploads/new-orphan.png");
    verify(storagePort, never()).deleteFile("/uploads/old-avatar.png");
  }

  @Test
  @DisplayName("CreateFocusRecordUseCase & FocusRecordReversalSupport: protege contra NPE sem usuário e sincroniza totalActivityGoalsMet e pomos < 10m")
  void focusNullSafetyAndReversalConsistencyShouldWork() {
    UUID userId = UUID.randomUUID();
    UUID activityId = UUID.randomUUID();
    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-25T15:00:00Z"), ZoneOffset.UTC);

    // 1. CreateFocusRecordUseCase não dá NPE na linha 242 quando loadedUser == null em sessão vinculada a tarefa
    FocusRecordRepository focusRepo = mock(FocusRecordRepository.class);
    InventoryItemRepository invRepo = mock(InventoryItemRepository.class);
    FocusActivityRepository actRepo = mock(FocusActivityRepository.class);
    TransactionHistoryRepository txRepo = mock(TransactionHistoryRepository.class);
    UserRepository missingUserRepo = mock(UserRepository.class);
    TaskRepository taskRepo = mock(TaskRepository.class);

    UUID linkedTaskId = UUID.randomUUID();
    Todo linkedTodo = new Todo(
        linkedTaskId, UUID.randomUUID(), userId, "Foco em Tarefa", null,
        0, TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, TaskStatus.PENDING,
        TaskType.TODO, false, LocalDate.now(fixedClock), LocalDateTime.now(fixedClock),
        List.of(), TodoReminderType.NONE, null, null, false, false, false);
    when(taskRepo.findById(linkedTaskId)).thenReturn(Optional.of(linkedTodo));
    when(missingUserRepo.findById(userId)).thenReturn(Optional.empty());
    when(focusRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

    CreateFocusRecordUseCase createFocusUseCase = new CreateFocusRecordUseCase(
        focusRepo, invRepo, actRepo, txRepo, missingUserRepo);
    createFocusUseCase.setTaskPort(taskRepo);
    createFocusUseCase.setClock(fixedClock);

    // Sessão curta (2 min, 0 XP/moedas) com tarefa vinculada e usuário ausente: nunca deve lançar NullPointerException
    LocalDateTime start = LocalDateTime.of(2026, 11, 25, 14, 0);
    LocalDateTime end = LocalDateTime.of(2026, 11, 25, 14, 2);
    FocusRecord created = createFocusUseCase.execute(userId, new CreateFocusRecordCommand(
        null, null, linkedTaskId, "Sem user", start, end, FocusRecordType.STOPWATCH, 0));
    assertNotNull(created);

    // Sessão longa (30 min) com usuário ausente: chega à validação explícita de ResourceNotFoundException (nunca NPE)
    assertThrows(ResourceNotFoundException.class, () -> createFocusUseCase.execute(userId, new CreateFocusRecordCommand(
        null, null, linkedTaskId, "Sem user 30m", start, start.plusMinutes(30), FocusRecordType.POMO, 1)));

    // 2. FocusRecordReversalSupport: reverte totalActivityGoalsMet e não subtrai completedPomos de sessão < 10m
    User statsUser = createDomainUser(userId, "focus_rev");
    statsUser.initializeTimezone("UTC", fixedClock);
    statsUser.addCoins(new BigDecimal("12.00"));
    statsUser.setTotalXp(25);
    statsUser.getStats().recordFocusCompleted(30, 1);
    statsUser.getStats().recordActivityGoalMet();
    assertEquals(1, statsUser.getStats().getTotalActivityGoalsMet());
    assertEquals(1, statsUser.getStats().getTotalPomodorosCompleted());

    FocusRecord shortUnder10mWithPomo = new FocusRecord(
        UUID.randomUUID(), userId, null, null, null, null, "Curta",
        LocalDateTime.of(2026, 11, 25, 13, 0),
        LocalDateTime.of(2026, 11, 25, 13, 5), // 5 min (< 10 min)
        FocusRecordType.POMO, 1, 25, 5, new BigDecimal("2.00"), false);

    FocusRecord qualifyingActivitySession = new FocusRecord(
        UUID.randomUUID(), userId, activityId, null, null, null, "Meta batida",
        LocalDateTime.of(2026, 11, 25, 11, 0),
        LocalDateTime.of(2026, 11, 25, 11, 30), // 30 min (>= 25 min target)
        FocusRecordType.POMO, 1, 25, 20, new BigDecimal("10.00"), false);

    UserRepository revUserRepo = mock(UserRepository.class);
    FocusRecordRepository revFocusRepo = mock(FocusRecordRepository.class);
    when(revUserRepo.findById(userId)).thenReturn(Optional.of(statsUser));

    // Primeiro estorna apenas a sessão < 10 min -> não pode subtrair o pomodoro da sessão válida de 30 min
    FocusRecordReversalSupport.revertDeletedRecords(
        userId, List.of(shortUnder10mWithPomo), revFocusRepo, revUserRepo, null, null, txRepo, fixedClock);
    assertEquals(1, statsUser.getStats().getTotalPomodorosCompleted(),
        "Sessão < 10 min nunca soma completedPomos e não deve estorná-lo");
    assertEquals(1, statsUser.getStats().getTotalActivityGoalsMet());

    // Agora estorna a sessão de atividade >= 25 min -> deve reverter totalActivityGoalsMet e completedPomos
    FocusRecordReversalSupport.revertDeletedRecords(
        userId, List.of(qualifyingActivitySession), revFocusRepo, revUserRepo, null, null, txRepo, fixedClock);
    assertEquals(0, statsUser.getStats().getTotalActivityGoalsMet(),
        "Estorno de sessão de atividade que bateu a meta deve decrementar totalActivityGoalsMet");
    assertEquals(0, statsUser.getStats().getTotalPomodorosCompleted());
  }

  private User createDomainUser(UUID id, String prefix) {
    return new User(
        id,
        UserRole.USER,
        false,
        "Domain " + prefix,
        prefix + "_user",
        prefix + "@habitparty.test",
        "hashed-secret",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1998, 6, 10),
        null,
        UserGender.PREFER_NOT_TO_SAY,
        0,
        0,
        0,
        LocalDateTime.now(ZoneOffset.UTC));
  }
}
