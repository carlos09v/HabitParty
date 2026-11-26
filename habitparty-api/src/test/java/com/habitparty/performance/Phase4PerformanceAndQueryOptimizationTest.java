package com.habitparty.performance;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.client.RestClient;
import org.springframework.web.context.WebApplicationContext;

import com.habitparty.adapters.out.email.ResendEmailAdapter;
import com.habitparty.adapters.out.oauth.GoogleOAuthAdapter;
import com.habitparty.adapters.out.persistence.entities.AchievementJpaEntity;
import com.habitparty.adapters.out.persistence.entities.ArtifactJpaEntity;
import com.habitparty.adapters.out.persistence.entities.TaskJpaEntity;
import com.habitparty.adapters.out.persistence.entities.TodoJpaEntity;
import com.habitparty.adapters.out.persistence.repository.AchievementJpaRepository;
import com.habitparty.adapters.out.persistence.repository.ArtifactJpaRepository;
import com.habitparty.adapters.out.persistence.repository.TaskJpaRepository;
import com.habitparty.application.ports.AchievementRepository;
import com.habitparty.application.ports.ArtifactRepository;
import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.RewardRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.usecases.achievement.GetUserRetrospectiveUseCase;
import com.habitparty.application.usecases.achievement.GetUserShowcaseUseCase;
import com.habitparty.application.usecases.reward.CheckRewardGroupHasHistoryUseCase;
import com.habitparty.application.usecases.reward.DeleteRewardGroupUseCase;
import com.habitparty.application.usecases.task.MoveTaskCommand;
import com.habitparty.application.usecases.task.MoveTaskUseCase;
import com.habitparty.application.usecases.user.FindAllUsersUseCase;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.entities.achievement.UserRetrospective;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.AchievementCategory;
import com.habitparty.core.domain.enums.AchievementCode;
import com.habitparty.core.domain.enums.AchievementRarity;
import com.habitparty.core.domain.enums.ArtifactSourceType;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.domain.enums.SubscriptionStatus;
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
import com.habitparty.infrastructure.CacheConfig;
import com.habitparty.infrastructure.ExternalHttpClientConfig;
import com.habitparty.infrastructure.security.TurnstileVerifier;

import jakarta.persistence.EntityManagerFactory;

@SpringBootTest
class Phase4PerformanceAndQueryOptimizationTest {

  @Autowired
  private EntityManagerFactory entityManagerFactory;

  @Autowired
  private PlatformTransactionManager transactionManager;

  @Autowired
  private JdbcTemplate jdbcTemplate;

  @Autowired
  private CacheManager cacheManager;

  @Autowired
  private UserRepository userRepository;

  @Autowired
  private WorkspaceRepository workspaceRepository;

  @Autowired
  private BoardColumnRepository boardColumnRepository;

  @Autowired
  private TaskRepository taskRepository;

  @Autowired
  private TaskJpaRepository taskJpaRepository;

  @Autowired
  private RewardRepository rewardRepository;

  @Autowired
  private TransactionHistoryRepository transactionHistoryRepository;

  @Autowired
  private FocusRecordRepository focusRecordRepository;

  @Autowired
  private AchievementJpaRepository achievementJpaRepository;

  @Autowired
  private ArtifactJpaRepository artifactJpaRepository;

  @Autowired
  private AchievementRepository achievementRepository;

  @Autowired
  private ArtifactRepository artifactRepository;

  @Autowired
  private GetUserRetrospectiveUseCase getUserRetrospectiveUseCase;

  @Autowired
  private GetUserShowcaseUseCase getUserShowcaseUseCase;

  @Autowired
  private MoveTaskUseCase moveTaskUseCase;

  @Autowired
  private CheckRewardGroupHasHistoryUseCase checkRewardGroupHasHistoryUseCase;

  @Autowired
  private DeleteRewardGroupUseCase deleteRewardGroupUseCase;

  @Autowired
  private UserTimeResolver userTimeResolver;

  @Autowired
  private FindAllUsersUseCase findAllUsersUseCase;

  @Autowired
  @Qualifier(ExternalHttpClientConfig.EXTERNAL_REST_CLIENT_BEAN)
  private RestClient externalRestClient;

  @Autowired
  private ResendEmailAdapter resendEmailAdapter;

  @Autowired
  private GoogleOAuthAdapter googleOAuthAdapter;

  @Autowired
  private TurnstileVerifier turnstileVerifier;

  @Autowired
  private WebApplicationContext webApplicationContext;

  private TransactionTemplate txTemplate;

  @BeforeEach
  void setUp() {
    txTemplate = new TransactionTemplate(transactionManager);

    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
          task_id UUID PRIMARY KEY,
          board_column_id UUID NOT NULL,
          user_id UUID NOT NULL,
          name VARCHAR(255) NOT NULL,
          description VARCHAR(2000),
          order_index INTEGER NOT NULL,
          priority VARCHAR(50),
          tags VARCHAR ARRAY,
          difficulty VARCHAR(50) NOT NULL,
          status VARCHAR(50) NOT NULL,
          task_type VARCHAR(50) NOT NULL,
          is_hardcore_mode_enabled BOOLEAN NOT NULL,
          due_date DATE,
          total_focus_minutes INTEGER NOT NULL DEFAULT 0,
          focus_cycles_count INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL,
          version BIGINT NOT NULL DEFAULT 0
        )
        """);

    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS habit (
          task_id UUID PRIMARY KEY,
          current_streak INTEGER NOT NULL,
          highest_streak INTEGER NOT NULL DEFAULT 0,
          habit_type VARCHAR(50) NOT NULL,
          reset_counter VARCHAR(50) NOT NULL,
          importance_type VARCHAR(50) NOT NULL,
          last_completed_at TIMESTAMP,
          positive_count INTEGER NOT NULL DEFAULT 0,
          negative_count INTEGER NOT NULL DEFAULT 0
        )
        """);

    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS daily (
          task_id UUID PRIMARY KEY,
          current_streak INTEGER NOT NULL,
          highest_streak INTEGER NOT NULL DEFAULT 0,
          start_date DATE NOT NULL,
          repeat_type VARCHAR(50) NOT NULL,
          repeat_every INTEGER NOT NULL,
          days_of_week VARCHAR ARRAY,
          repeat_monthly_option VARCHAR(50),
          last_completed_at TIMESTAMP
        )
        """);

    jdbcTemplate.execute("""
        CREATE TABLE IF NOT EXISTS todo (
          task_id UUID PRIMARY KEY,
          due_time TIME,
          start_time TIME,
          due_end_time TIME,
          is_all_day BOOLEAN NOT NULL DEFAULT FALSE,
          reminder_type VARCHAR(50) NOT NULL,
          reminder_at TIMESTAMP,
          completed_at TIMESTAMP,
          is_penalty_applied BOOLEAN NOT NULL DEFAULT FALSE,
          send_email_reminder BOOLEAN NOT NULL DEFAULT FALSE,
          email_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
          reminder_attempts INTEGER NOT NULL DEFAULT 0
        )
        """);

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

  private User createAndSaveUser(String prefix, UserRole role, boolean premium, boolean founder, boolean verified) {
    String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    User user = new User(
        UUID.randomUUID(),
        role,
        premium,
        "Perf " + prefix,
        prefix + "_" + suffix,
        prefix + "_" + suffix + "@habitparty.test",
        "hashed-secret",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1996, 4, 15),
        null,
        UserGender.PREFER_NOT_TO_SAY,
        0,
        0,
        0,
        LocalDateTime.of(2025, 1, 10, 10, 0));
    user.initializeTimezone("UTC", Clock.systemUTC());
    user.setEmailVerified(verified);
    if (founder) {
      user.getSubscription().setFounder(true);
    }
    if (premium) {
      user.getSubscription().syncActiveSubscription(
          "cus_" + suffix, "sub_" + suffix, LocalDateTime.now(ZoneOffset.UTC).plusDays(30), false);
    } else {
      user.getSubscription().setSubscriptionStatus(SubscriptionStatus.FREE);
    }
    return userRepository.save(user);
  }

  private Statistics enableAndClearStats() {
    SessionFactory sf = entityManagerFactory.unwrap(SessionFactory.class);
    Statistics stats = sf.getStatistics();
    stats.setStatisticsEnabled(true);
    stats.clear();
    return stats;
  }

  @Test
  @DisplayName("Benchmark AdminOverview: consolida os 6 COUNTs de usuários em 1 única query SQL com contagem exata")
  void adminUserStatsShouldExecuteInSingleQuery() {
    createAndSaveUser("adm_free", UserRole.USER, false, false, false);
    createAndSaveUser("adm_prem", UserRole.USER, true, true, true);
    createAndSaveUser("adm_role", UserRole.ADMIN, true, false, true);

    Statistics stats = enableAndClearStats();
    UserRepository.AdminUserStatsSummary summary = userRepository.summarizeAdminUserStats().orElseThrow();

    assertEquals(1L, stats.getPrepareStatementCount(),
        "summarizeAdminUserStats deve consolidar os 6 COUNTs em exatamente 1 único PreparedStatement");
    assertEquals(userRepository.countAll(), summary.totalUsers());
    assertEquals(userRepository.countByIsPremium(true), summary.premiumUsers());
    assertEquals(userRepository.countByIsPremium(false), summary.freeUsers());
    assertEquals(userRepository.countFounders(), summary.founderUsers());
    assertEquals(userRepository.countByRole(UserRole.ADMIN), summary.adminUsers());
    assertEquals(userRepository.countByEmailVerified(true), summary.verifiedUsers());
  }

  @Test
  @DisplayName("Benchmark Retrospective: agrega histórico de 2025 diretamente no SQL (0 entidades TransactionHistory/FocusRecord hidratadas)")
  void retrospectiveShouldAggregateInSqlWithoutLoadingFullHistoryEntities() {
    User user = createAndSaveUser("retro_agg", UserRole.USER, false, false, true);
    UUID userId = user.getId();

    // 12 tarefas em 6 dias de julho/2025 (4 HARD com effortUnits=2 -> 16 tarefas totais, 8 difíceis) + 2 compras ignoradas
    for (int i = 0; i < 12; i++) {
      int day = 1 + (i % 6);
      boolean hard = i < 4;
      transactionHistoryRepository.save(new TransactionHistory(
          UUID.randomUUID(), userId, UUID.randomUUID(),
          new BigDecimal("5.00"), 20, null,
          TransactionType.TODO_COMPLETED, "Task " + i, null, null,
          hard ? TaskDifficulty.HARD : TaskDifficulty.EASY,
          List.of(), null, null, Boolean.FALSE, hard ? 2 : 1,
          LocalDateTime.of(2025, 7, day, 14, 20)));
    }
    transactionHistoryRepository.save(new TransactionHistory(
        UUID.randomUUID(), userId, UUID.randomUUID(),
        new BigDecimal("-15.00"), 0, new BigDecimal("15.00"),
        TransactionType.REWARD_BOUGHT, "Compra ignorada", null, null,
        null, List.of(), null, null, Boolean.FALSE, 1,
        LocalDateTime.of(2025, 7, 2, 16, 0)));

    // 3 sessões produtivas de 50 min (150 min total, 6 pomos) + 1 cupom (deve ser ignorado no SQL)
    UUID activityId = UUID.randomUUID();
    for (int i = 0; i < 3; i++) {
      focusRecordRepository.save(new FocusRecord(
          UUID.randomUUID(), userId, activityId, null, null, null, "Foco " + i,
          LocalDateTime.of(2025, 7, 1 + i, 10, 0),
          LocalDateTime.of(2025, 7, 1 + i, 10, 50),
          FocusRecordType.POMO, 2, 25, 25, new BigDecimal("10.00"), false));
    }
    focusRecordRepository.save(new FocusRecord(
        UUID.randomUUID(), userId, null, UUID.randomUUID(), null, null, "Cupom",
        LocalDateTime.of(2025, 7, 4, 18, 0),
        LocalDateTime.of(2025, 7, 4, 18, 45),
        FocusRecordType.STOPWATCH, 0, null, 0, BigDecimal.ZERO, false));

    Statistics stats = enableAndClearStats();
    UserRetrospective retro = getUserRetrospectiveUseCase.executeForSelf(userId, 2025);

    assertTrue(retro.eligible());
    assertEquals(6, retro.activeDays());
    assertEquals(16, retro.tasksCompleted());
    assertEquals(8, retro.hardTasksCompleted());
    assertEquals(150, retro.focusMinutes());
    assertEquals(3, retro.focusSessionsCount());
    assertEquals(6, retro.pomodorosCompleted());
    assertEquals(240, retro.xpEarned());
    assertEquals(0, new BigDecimal("60.00").compareTo(retro.coinsEarned()));
    assertEquals(7, retro.bestMonth());
    assertEquals(16, retro.bestMonthTasksCount());

    assertEquals(0L,
        stats.getEntityStatistics("com.habitparty.adapters.out.persistence.entities.TransactionHistoryJpaEntity")
            .getLoadCount(),
        "Retrospectiva não deve hidratar entidades TransactionHistoryJpaEntity na heap");
    assertEquals(0L,
        stats.getEntityStatistics("com.habitparty.adapters.out.persistence.entities.FocusRecordJpaEntity")
            .getLoadCount(),
        "Retrospectiva não deve hidratar entidades FocusRecordJpaEntity na heap");
  }

  @Test
  @DisplayName("Benchmark Showcase + Caffeine: 2ª chamada lê catálogos do cache e nunca consulta checklist_item")
  void showcaseShouldUseCaffeineCatalogCachesAndSkipChecklists() {
    User user = createAndSaveUser("showcase_perf", UserRole.USER, false, false, true);
    Workspace ws = workspaceRepository.save(new Workspace(UUID.randomUUID(), user.getId(), "WS Showcase"));
    BoardColumn col = boardColumnRepository.save(new BoardColumn(
        UUID.randomUUID(), user.getId(), ws.getId(), "Diárias", 0, "sun", true));

    Daily daily = new Daily(
        UUID.randomUUID(), col.getId(), user.getId(), "Meditar", null, 0,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, TaskStatus.COMPLETED,
        TaskType.DAILY, false, LocalDate.now(ZoneOffset.UTC), LocalDateTime.now(ZoneOffset.UTC),
        List.of(), 5, LocalDate.now(ZoneOffset.UTC).minusDays(5), DailyRepeatType.DAILY, 1,
        null, null, LocalDateTime.now(ZoneOffset.UTC));
    taskRepository.save(daily);
    taskRepository.saveChecklistItem(new ChecklistItem(UUID.randomUUID(), daily.getId(), user.getId(), "Etapa 1", true));

    if (achievementJpaRepository.findByCode(AchievementCode.TASK_FIRST.name()).isEmpty()) {
      achievementJpaRepository.saveAndFlush(AchievementJpaEntity.builder()
          .id(UUID.randomUUID())
          .code(AchievementCode.TASK_FIRST.name())
          .title("Primeira")
          .description("Desc")
          .iconName("check")
          .points(10)
          .category(AchievementCategory.TASKS)
          .rarity(AchievementRarity.COMMON)
          .targetValue(1)
          .displayOrder(1)
          .secret(false)
          .build());
    }
    if (artifactJpaRepository.findByCodeIgnoreCase("PHASE4_RELIC").isEmpty()) {
      artifactJpaRepository.saveAndFlush(ArtifactJpaEntity.builder()
          .id(UUID.randomUUID())
          .code("PHASE4_RELIC")
          .iconName("Gem")
          .rarity(AchievementRarity.RARE)
          .sourceType(ArtifactSourceType.ACHIEVEMENT)
          .requiredAchievementCode(AchievementCode.TASK_FIRST.name())
          .displayOrder(99)
          .build());
    }

    // 1ª chamada aquece os caches Caffeine (achievementsCatalog e artifactsCatalog)
    getUserShowcaseUseCase.executeReadOnly(user);

    // 2ª chamada: zero cargas de Achievement, Artifact ou ChecklistItem
    Statistics stats = enableAndClearStats();
    var result = getUserShowcaseUseCase.executeReadOnly(user);

    assertNotNull(result);
    assertEquals(1, result.taskStreaks().size());
    assertEquals(0L,
        stats.getEntityStatistics("com.habitparty.adapters.out.persistence.entities.AchievementJpaEntity").getLoadCount(),
        "Catálogo de conquistas deve ser servido do cache Caffeine");
    assertEquals(0L,
        stats.getEntityStatistics("com.habitparty.adapters.out.persistence.entities.ArtifactJpaEntity").getLoadCount(),
        "Catálogo de artefatos deve ser servido do cache Caffeine");
    assertEquals(0L,
        stats.getEntityStatistics("com.habitparty.adapters.out.persistence.entities.ChecklistItemJpaEntity").getLoadCount(),
        "Showcase nunca deve carregar checklist_item das tarefas recorrentes");
  }

  @Test
  @DisplayName("Cache Caffeine UserTimeResolver: 2ª consulta executa 0 queries e atualização do usuário invalida o cache")
  void userTimezoneCacheShouldHitAndEvictOnUserSave() {
    User user = createAndSaveUser("tz_cache", UserRole.USER, false, false, true);
    user.setTimezone("America/Sao_Paulo");
    user = userRepository.save(user);

    // 1ª leitura popula cache
    assertEquals(ZoneId.of("America/Sao_Paulo"), userTimeResolver.resolveZone(user.getId()));

    // 2ª leitura deve ser 100% cache hit (0 PreparedStatements!)
    Statistics stats = enableAndClearStats();
    assertEquals(ZoneId.of("America/Sao_Paulo"), userTimeResolver.resolveZone(user.getId()));
    assertEquals(0L, stats.getPrepareStatementCount(),
        "2ª resolução de timezone deve ser atendida pelo cache Caffeine com 0 queries SQL");

    // Atualização do fuso e save() devem invalidar a entrada no cache
    user.setTimezone("Asia/Tokyo");
    userRepository.save(user);
    assertEquals(ZoneId.of("Asia/Tokyo"), userTimeResolver.resolveZone(user.getId()),
        "Cache de timezone deve ser invalidado automaticamente após salvar o usuário");
  }

  @Test
  @DisplayName("Benchmark MoveTaskUseCase: mover 10 tarefas em lote executa consultas em lote O(1) em vez de 2N N+1")
  void moveTaskShouldBatchFetchTasksAndColumnsWithoutNPlusOne() {
    User user = createAndSaveUser("move_batch", UserRole.USER, true, false, true);
    Workspace ws = workspaceRepository.save(new Workspace(UUID.randomUUID(), user.getId(), "WS Move"));
    BoardColumn col1 = boardColumnRepository.save(new BoardColumn(
        UUID.randomUUID(), user.getId(), ws.getId(), "Col 1", 0, "sun", true));
    BoardColumn col2 = boardColumnRepository.save(new BoardColumn(
        UUID.randomUUID(), user.getId(), ws.getId(), "Col 2", 1, "moon", true));

    List<MoveTaskCommand> commands = new ArrayList<>();
    for (int i = 0; i < 10; i++) {
      Todo todo = new Todo(
          UUID.randomUUID(), col1.getId(), user.getId(), "Tarefa " + i, null, i,
          TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, TaskStatus.PENDING,
          TaskType.TODO, false, LocalDate.now(ZoneOffset.UTC).plusDays(2), LocalDateTime.now(ZoneOffset.UTC),
          List.of(), TodoReminderType.NONE, null, null, false, false, false);
      taskRepository.save(todo);
      commands.add(new MoveTaskCommand(todo.getId(), col2.getId(), 9 - i));
    }

    Statistics stats = enableAndClearStats();
    moveTaskUseCase.execute(user.getId(), commands);

    // Sem N+1: 1 batch SELECT tasks + 1 batch SELECT columns + 1 workspace check + 1 batch SELECT/UPDATE saveAll
    // (Antes seriam > 25 statements individuais; agora fica bem abaixo de 12 mesmo contando batch UPDATEs)
    assertTrue(stats.getPrepareStatementCount() <= 10L,
        "MoveTask de 10 tarefas não deve fazer N+1 (statements preparados: " + stats.getPrepareStatementCount() + ")");
    assertEquals(0L,
        stats.getEntityStatistics("com.habitparty.adapters.out.persistence.entities.ChecklistItemJpaEntity").getLoadCount(),
        "MoveTask não deve carregar checklists ao reordenar tarefas");
  }

  @Test
  @DisplayName("Benchmark RewardGroup: CheckHasHistory (2 queries) e DeleteRewardGroup (3 queries) em grupo de 4 pacotes")
  void rewardGroupCheckAndDeleteShouldAvoidNPlusOne() {
    User user = createAndSaveUser("rew_batch", UserRole.USER, false, false, true);
    List<UUID> rewardIds = new ArrayList<>();
    for (int i = 0; i < 4; i++) {
      Reward r = new Reward(
          UUID.randomUUID(), user.getId(), "Pack " + i, new BigDecimal("10.00"), List.of(),
          RewardType.TIME_BASED, i, "gamepad", null, RewardCategory.ENTERTAINMENT,
          30 * (i + 1), RewardPackageLevel.values()[i]);
      rewardRepository.save(r);
      rewardIds.add(r.getId());
    }
    transactionHistoryRepository.save(new TransactionHistory(
        UUID.randomUUID(), user.getId(), rewardIds.get(2),
        new BigDecimal("-10.00"), 0, new BigDecimal("10.00"),
        TransactionType.REWARD_BOUGHT, "Pack 2", null, null,
        null, List.of(), null, null, Boolean.FALSE, 1, LocalDateTime.now(ZoneOffset.UTC)));

    Statistics stats = enableAndClearStats();
    boolean hasHistory = checkRewardGroupHasHistoryUseCase.execute(rewardIds, user.getId());
    assertTrue(hasHistory);
    assertEquals(2L, stats.getPrepareStatementCount(),
        "CheckRewardGroupHasHistoryUseCase deve executar exatamente 2 queries (1 batch SELECT + 1 EXISTS)");

    stats.clear();
    deleteRewardGroupUseCase.execute(rewardIds, user.getId(), true);
    assertEquals(3L, stats.getPrepareStatementCount(),
        "DeleteRewardGroupUseCase deve executar exatamente 3 queries (1 batch SELECT + 1 DELETE tx + 1 DELETE rewards)");
    assertTrue(rewardRepository.findAllByUserId(user.getId()).isEmpty());
  }

  @Test
  @DisplayName("TaskJpaRepository: TREAT(t AS TodoJpaEntity) preserva Habit/Daily/Todo ativos e query direta em TodoJpaEntity lista arquivados")
  void taskJpaTreatAndDirectTodoQueriesShouldReturnExactSubsets() {
    User user = createAndSaveUser("task_treat", UserRole.USER, false, false, true);
    Workspace ws = workspaceRepository.save(new Workspace(UUID.randomUUID(), user.getId(), "WS Treat"));
    BoardColumn col = boardColumnRepository.save(new BoardColumn(
        UUID.randomUUID(), user.getId(), ws.getId(), "Quadro", 0, "star", true));

    LocalDate today = LocalDate.of(2026, 11, 25);
    LocalDate minDueDate = today.minusDays(7);
    LocalDateTime minCompletedAt = today.minusDays(7).atStartOfDay();

    Habit habit = new Habit(
        UUID.randomUUID(), col.getId(), user.getId(), "Ler", null, 0,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, TaskStatus.PENDING,
        TaskType.HABIT, false, null, today.minusDays(30).atTime(9, 0),
        List.of(), 3, HabitType.POSITIVE, HabitResetCounter.DAILY, HabitImportanceType.NORMAL, null);
    Daily daily = new Daily(
        UUID.randomUUID(), col.getId(), user.getId(), "Treinar", null, 1,
        TaskPriority.HIGH, List.of(), TaskDifficulty.MEDIUM, TaskStatus.PENDING,
        TaskType.DAILY, false, today, today.minusDays(30).atTime(9, 0),
        List.of(), 2, today.minusDays(30), DailyRepeatType.DAILY, 1, null, null, null);
    Todo pendingTodo = new Todo(
        UUID.randomUUID(), col.getId(), user.getId(), "Pendente", null, 2,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, TaskStatus.PENDING,
        TaskType.TODO, false, today.plusDays(2), today.atTime(9, 0),
        List.of(), TodoReminderType.NONE, null, null, false, false, false);
    Todo recentCompletedTodo = new Todo(
        UUID.randomUUID(), col.getId(), user.getId(), "Recente", null, 3,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, TaskStatus.COMPLETED,
        TaskType.TODO, false, today.minusDays(2), today.minusDays(5).atTime(9, 0),
        List.of(), TodoReminderType.NONE, null, today.minusDays(1).atTime(10, 0), false, false, false);
    Todo archivedCompletedTodo = new Todo(
        UUID.randomUUID(), col.getId(), user.getId(), "Arquivada", null, 4,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, TaskStatus.COMPLETED,
        TaskType.TODO, false, today.minusDays(20), today.minusDays(30).atTime(9, 0),
        List.of(), TodoReminderType.NONE, null, today.minusDays(15).atTime(10, 0), false, false, false);

    taskRepository.save(habit);
    taskRepository.save(daily);
    taskRepository.save(pendingTodo);
    taskRepository.save(recentCompletedTodo);
    taskRepository.save(archivedCompletedTodo);

    List<TaskJpaEntity> active = txTemplate.execute(status ->
        taskJpaRepository.findDashboardActiveByBoardColumnIdInOrderByOrderIndexAsc(
            List.of(col.getId()), minDueDate, minCompletedAt));
    assertNotNull(active);
    assertEquals(4, active.size(), "Habit, Daily, Todo pendente e Todo concluído recente devem ser retornados");
    assertTrue(active.stream().anyMatch(t -> t.getId().equals(habit.getId())), "TREAT não pode filtrar Habit");
    assertTrue(active.stream().anyMatch(t -> t.getId().equals(daily.getId())), "TREAT não pode filtrar Daily");
    assertTrue(active.stream().noneMatch(t -> t.getId().equals(archivedCompletedTodo.getId())));

    List<TodoJpaEntity> archived = txTemplate.execute(status ->
        taskJpaRepository.findArchivedCompletedTodosByBoardColumnId(col.getId(), minDueDate, minCompletedAt));
    assertNotNull(archived);
    assertEquals(1, archived.size());
    assertEquals(archivedCompletedTodo.getId(), archived.get(0).getId());
  }

  @Test
  @DisplayName("Infraestrutura: RestClient único compartilhado entre Resend/Google/Turnstile, Caffeine configurado e FindAllUsersUseCase paginado")
  void sharedRestClientCaffeineAndPaginatedUsersShouldBeWired() throws Exception {
    assertNotNull(externalRestClient);
    assertSame(externalRestClient, readPrivateField(resendEmailAdapter, "restClient"));
    assertSame(externalRestClient, readPrivateField(googleOAuthAdapter, "restClient"));
    assertSame(externalRestClient, readPrivateField(turnstileVerifier, "restClient"));

    assertNotNull(cacheManager.getCache(CacheConfig.ACHIEVEMENTS_CATALOG_CACHE));
    assertNotNull(cacheManager.getCache(CacheConfig.ARTIFACTS_CATALOG_CACHE));
    assertNotNull(cacheManager.getCache(CacheConfig.USER_TIMEZONES_CACHE));

    // Garante paginação segura em FindAllUsersUseCase (nunca tabela inteira sem limite)
    createAndSaveUser("page_u1", UserRole.USER, false, false, false);
    createAndSaveUser("page_u2", UserRole.USER, false, false, false);
    createAndSaveUser("page_u3", UserRole.USER, false, false, false);

    List<User> pageOfTwo = findAllUsersUseCase.execute(0, 2);
    assertEquals(2, pageOfTwo.size(), "FindAllUsersUseCase deve respeitar paginação/limite máximo");

    // Garante header Cache-Control imutável de 1 ano em /uploads/**
    Path uploadDir = Path.of("target/test-uploads");
    Files.createDirectories(uploadDir);
    String fileName = "phase4-cache-" + UUID.randomUUID() + ".txt";
    Path testFile = uploadDir.resolve(fileName);
    Files.writeString(testFile, "ok");
    try {
      MockMvc mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
      String cacheControl = mockMvc.perform(MockMvcRequestBuilders.get("/uploads/" + fileName))
          .andExpect(MockMvcResultMatchers.status().isOk())
          .andReturn()
          .getResponse()
          .getHeader("Cache-Control");
      assertNotNull(cacheControl);
      assertTrue(cacheControl.contains("max-age=31536000"), "Esperava max-age=31536000 em: " + cacheControl);
      assertTrue(cacheControl.contains("public"), "Esperava public em: " + cacheControl);
      assertTrue(cacheControl.contains("immutable"), "Esperava immutable em: " + cacheControl);
    } finally {
      Files.deleteIfExists(testFile);
    }
  }

  private Object readPrivateField(Object target, String fieldName) throws Exception {
    Field f = target.getClass().getDeclaredField(fieldName);
    f.setAccessible(true);
    return f.get(target);
  }
}
