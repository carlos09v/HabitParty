package com.habitparty.domain;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionCsvExporterPort;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.ports.projections.DashboardTaskDTO;
import com.habitparty.application.usecases.boardcolumn.DeleteBoardColumnUseCase;
import com.habitparty.application.usecases.focus.FocusActivityOrderCommand;
import com.habitparty.application.usecases.focus.ReorderFocusActivitiesUseCase;
import com.habitparty.application.usecases.social.SocialRelationshipStatus;
import com.habitparty.application.usecases.social.SocialUserSummary;
import com.habitparty.application.usecases.user.GetUserLayoutSummaryUseCase;
import com.habitparty.application.usecases.workspace.DeleteWorkspaceUseCase;
import com.habitparty.application.usecases.workspace.UpdateWorkspaceUseCase;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.EmailDispatchLog;
import com.habitparty.core.domain.entities.KanbanBoard;
import com.habitparty.core.domain.entities.OwnedByUser;
import com.habitparty.core.domain.entities.RefreshToken;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserToken;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.achievement.Artifact;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.entities.auth.DisposableEmailValidator;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.entities.reward.Reward;
import com.habitparty.core.domain.entities.social.SocialNotification;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.AchievementCode;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.HighlightType;
import com.habitparty.core.domain.enums.RewardCategory;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.domain.enums.SocialNotificationType;
import com.habitparty.core.domain.enums.UserExperienceMode;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserLevel;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.UserTokenType;
import com.habitparty.core.domain.enums.task.DailyRepeatMonthlyOption;
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
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.UnauthorizedException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class Phase5DomainAndArchitectureTest {

  private final UUID userId = UUID.randomUUID();
  private final UUID columnId = UUID.randomUUID();

  @Test
  @DisplayName("Daily: âncora mensal dia 31, 5ª semana em Fevereiro e ano bissexto (29/Fev) preservados")
  void dailyMonthlyAndYearlyAnchorsDoNotDriftOrOverflow() {
    // 1. Mensal dia 31: 31/Jan -> 28/Fev -> 31/Mar -> 30/Abr -> 31/Mai
    Daily day31 = new Daily(
        UUID.randomUUID(), columnId, userId, "Fechamento", null, 0,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.MEDIUM, TaskStatus.PENDING,
        TaskType.DAILY, false, LocalDate.of(2026, 1, 31), LocalDateTime.now(), List.of(),
        0, LocalDate.of(2026, 1, 31), DailyRepeatType.MONTHLY, 1,
        null, DailyRepeatMonthlyOption.DAY_OF_THE_MONTH, null);

    LocalDate feb = day31.calculateNextOccurrence(LocalDate.of(2026, 1, 31), false);
    LocalDate mar = day31.calculateNextOccurrence(feb, false);
    LocalDate apr = day31.calculateNextOccurrence(mar, false);
    LocalDate may = day31.calculateNextOccurrence(apr, false);

    assertEquals(LocalDate.of(2026, 2, 28), feb);
    assertEquals(LocalDate.of(2026, 3, 31), mar);
    assertEquals(LocalDate.of(2026, 4, 30), apr);
    assertEquals(LocalDate.of(2026, 5, 31), may);

    // 2. Mensal 5ª quinta-feira (2026-01-29): não transborda Fevereiro para Março e preserva ordinal 5 em Abril
    Daily fifthThursday = new Daily(
        UUID.randomUUID(), columnId, userId, "Revisão 5ª Quinta", null, 0,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.MEDIUM, TaskStatus.PENDING,
        TaskType.DAILY, false, LocalDate.of(2026, 1, 29), LocalDateTime.now(), List.of(),
        0, LocalDate.of(2026, 1, 29), DailyRepeatType.MONTHLY, 1,
        null, DailyRepeatMonthlyOption.DAY_OF_THE_WEEK, null);

    LocalDate febOcc = fifthThursday.calculateNextOccurrence(LocalDate.of(2026, 1, 29), false);
    LocalDate marOcc = fifthThursday.calculateNextOccurrence(febOcc, false);
    LocalDate aprOcc = fifthThursday.calculateNextOccurrence(marOcc, false);

    assertEquals(LocalDate.of(2026, 2, 26), febOcc); // Última quinta de Fev/2026 (não 05/Mar!)
    assertEquals(LocalDate.of(2026, 3, 26), marOcc); // Última quinta de Mar/2026
    assertEquals(LocalDate.of(2026, 4, 30), aprOcc); // 5ª quinta de Abr/2026 restaurada!

    // 3. Anual em ano bissexto (2024-02-29 -> 2025-02-28 -> ... -> 2028-02-29)
    Daily leapYearly = new Daily(
        UUID.randomUUID(), columnId, userId, "Aniversário Bissexto", null, 0,
        TaskPriority.Low, List.of(), TaskDifficulty.EASY, TaskStatus.PENDING,
        TaskType.DAILY, false, LocalDate.of(2024, 2, 29), LocalDateTime.now(), List.of(),
        0, LocalDate.of(2024, 2, 29), DailyRepeatType.YEARLY, 1, null, null, null);

    LocalDate y2025 = leapYearly.calculateNextOccurrence(LocalDate.of(2024, 2, 29), false);
    LocalDate y2026 = leapYearly.calculateNextOccurrence(y2025, false);
    LocalDate y2027 = leapYearly.calculateNextOccurrence(y2026, false);
    LocalDate y2028 = leapYearly.calculateNextOccurrence(y2027, false);

    assertEquals(LocalDate.of(2025, 2, 28), y2025);
    assertEquals(LocalDate.of(2028, 2, 29), y2028);
  }

  @Test
  @DisplayName("Daily: revertCompletion preserva highestStreak histórico alcançado antes de quebra")
  void dailyRevertCompletionPreservesHistoricalHighestStreak() {
    LocalDate day1 = LocalDate.of(2026, 6, 1);
    Daily daily = new Daily(
        UUID.randomUUID(), columnId, userId, "Meditar", null, 0,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.MEDIUM, TaskStatus.PENDING,
        TaskType.DAILY, false, day1, day1.atStartOfDay(), List.of(),
        0, day1, DailyRepeatType.DAILY, 1, null, null, null);

    // Alcança recorde histórico de 3 (com rollover diário de dueDate)
    daily.registerCompletion(day1.atTime(9, 0));
    daily.shiftToNextOccurrence(day1);
    daily.registerCompletion(day1.plusDays(1).atTime(9, 0));
    daily.shiftToNextOccurrence(day1.plusDays(1));
    daily.registerCompletion(day1.plusDays(2).atTime(9, 0));
    assertEquals(3, daily.getHighestStreak());

    // Quebra streak e reconstrói até empatar com 3
    daily.breakStreak();
    daily.advanceDueDateToAtLeast(day1.plusDays(5));
    daily.registerCompletion(day1.plusDays(5).atTime(9, 0));
    daily.shiftToNextOccurrence(day1.plusDays(5));
    daily.registerCompletion(day1.plusDays(6).atTime(9, 0));
    daily.shiftToNextOccurrence(day1.plusDays(6));
    daily.registerCompletion(day1.plusDays(7).atTime(9, 0));
    assertEquals(3, daily.getCurrentStreak());
    assertEquals(3, daily.getHighestStreak());

    // Desmarca a conclusão de hoje: streak cai para 2, mas recorde histórico 3 permanece intacto!
    daily.revertCompletion(day1.plusDays(6).atTime(9, 0), true);
    assertEquals(2, daily.getCurrentStreak());
    assertEquals(3, daily.getHighestStreak());
  }

  @Test
  @DisplayName("Habit: SAME_CYCLE após breakStreak recupera streak para 1 e Todo/Habit usam HALF_UP consistente com penalidade")
  void habitSameCycleAfterBreakRecoversAndRoundingMatchesPenalty() {
    LocalDate today = LocalDate.of(2026, 7, 10);
    Habit habit = new Habit(
        UUID.randomUUID(), columnId, userId, "Beber Água", null, 0,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, TaskStatus.PENDING,
        TaskType.HABIT, false, null, today.atStartOfDay(), List.of(),
        0, HabitType.BOTH, HabitResetCounter.DAILY, HabitImportanceType.NORMAL, null);

    habit.registerCompletion(today.atTime(9, 0));
    assertEquals(1, habit.getCurrentStreak());

    habit.breakStreak();
    assertEquals(0, habit.getCurrentStreak());

    // Novo registro positivo no MESMO ciclo deve sair de 0 para 1
    habit.registerCompletion(today.atTime(14, 0));
    assertEquals(1, habit.getCurrentStreak());

    // Arredondamento HALF_UP em Todo atrasado TRIVIAL/EASY: recompensa reduzida == penalidade (zero drift de $0.01)
    Todo overdueEasy = new Todo(
        UUID.randomUUID(), columnId, userId, "Easy Overdue", null, 0,
        TaskPriority.Low, List.of(), TaskDifficulty.EASY, TaskStatus.PENDING,
        TaskType.TODO, true, today.minusDays(1), today.minusDays(2).atStartOfDay(), List.of(),
        TodoReminderType.NONE, null, null, true);

    assertEquals(overdueEasy.calculatePenalty(today).coins(), overdueEasy.calculateReward(today).coins());
    assertEquals(new BigDecimal("0.38"), overdueEasy.calculateReward(today).coins());
  }

  @Test
  @DisplayName("Atomicidade: Todo.defineEventSchedule, Reward.updateDetails e FocusActivity.updateDetails não mutam em exceção")
  void domainUpdatesAreAtomicOnValidationFailure() {
    // 1. Todo.defineEventSchedule não muta dueDate/isAllDay quando startTime ausente com endTime presente
    Todo todo = new Todo(
        UUID.randomUUID(), columnId, userId, "Evento", null, 0,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.MEDIUM, TaskStatus.PENDING,
        TaskType.TODO, false, null, LocalDateTime.now(), List.of(),
        TodoReminderType.NONE, null, null);
    assertThrows(DomainValidationException.class,
        () -> todo.defineEventSchedule(null, LocalTime.of(15, 0), false, LocalDate.of(2026, 8, 1)));
    assertTrue(todo.getDueDate().isEmpty());
    assertFalse(todo.isAllDay());

    // 2. Reward.updateDetails não muta name/price se category=DEBT com type=TIME_BASED falhar
    Reward reward = new Reward(
        UUID.randomUUID(), userId, "Original", new BigDecimal("10.00"), List.of(),
        RewardType.SINGLE_USE, 0, "gift", "Desc original", RewardCategory.NONE, null, RewardPackageLevel.NONE);
    assertThrows(DomainValidationException.class, () -> reward.updateDetails(
        "Corrompido", "Nova desc", new BigDecimal("99.00"), "star",
        RewardCategory.DEBT, List.of("a"), RewardType.TIME_BASED, RewardPackageLevel.BASIC, 30));
    assertEquals("Original", reward.getName());
    assertEquals(new BigDecimal("10.00"), reward.getPrice());
    assertEquals(RewardCategory.NONE, reward.getCategory().orElseThrow());
    assertEquals(RewardType.SINGLE_USE, reward.getType());

    // 3. FocusActivity.updateDetails não muta name/recordType se POMO vier sem duração
    FocusActivity activity = new FocusActivity(
        UUID.randomUUID(), userId, "Leitura", "book", 0, FocusRecordType.STOPWATCH, null, LocalDateTime.now());
    assertThrows(DomainValidationException.class,
        () -> activity.updateDetails("Alterado", "flame", FocusRecordType.POMO, null));
    assertEquals("Leitura", activity.getName());
    assertEquals("book", activity.getIcon());
    assertEquals(FocusRecordType.STOPWATCH, activity.getRecordType());
  }

  @Test
  @DisplayName("Segurança e robustez de domínio: subdomínios descartáveis, truncamento JSON válido, tokens nulos, OwnedByUser, Locale.ROOT")
  void domainHardeningAndLocaleIndependence() {
    // Subdomínios descartáveis e ponto final
    assertTrue(DisposableEmailValidator.isDisposable("bot@sub.mailinator.com"));
    assertTrue(DisposableEmailValidator.isDisposable("bot@a.b.yopmail.com."));
    assertFalse(DisposableEmailValidator.isDisposable("user@gmail.com"));

    // SocialNotification trunca JSON > 500 chars produzindo JSON sintaticamente válido <= 500 chars
    String hugeJson = "{\"title\":\"" + "A\"\\".repeat(250) + "\"}";
    SocialNotification notification = SocialNotification.create(
        UUID.randomUUID(), UUID.randomUUID(), SocialNotificationType.FRIEND_MILESTONE_ACHIEVEMENT,
        UUID.randomUUID(), hugeJson, Instant.now());
    assertTrue(notification.getPayload().length() <= 500);
    JsonNode parsed = JsonMapper.builder().build().readTree(notification.getPayload());
    assertTrue(parsed.get("truncated").asBoolean());
    assertTrue(parsed.has("preview"));

    // Tokens com expirationDate nulo são considerados expirados (sem NPE)
    UserToken nullExpUserToken = new UserToken(UUID.randomUUID(), userId, UserTokenType.PASSWORD_RESET, "h", null, false);
    RefreshToken nullExpRefreshToken = new RefreshToken(UUID.randomUUID(), userId, "h", null, false);
    assertTrue(nullExpUserToken.isExpired());
    assertFalse(nullExpUserToken.isValid());
    assertTrue(nullExpRefreshToken.isExpired());
    assertFalse(nullExpRefreshToken.isValid());

    // OwnedByUser com userId nulo lança UnauthorizedException (sem NPE)
    Workspace orphanWorkspace = new Workspace(UUID.randomUUID(), null, "Orfão");
    assertInstanceOf(OwnedByUser.class, orphanWorkspace);
    assertThrows(UnauthorizedException.class, () -> orphanWorkspace.validateOwnership(userId));

    // Locale.ROOT sob Locale turco ("tr_TR", onde 'i'.toUpperCase() == 'İ')
    Locale previousLocale = Locale.getDefault();
    try {
      Locale.setDefault(Locale.of("tr", "TR"));
      assertEquals(Optional.of(AchievementCode.TASK_FIRST), AchievementCode.fromString("task_first"));
      assertEquals(UserExperienceMode.GAMIFIED, UserExperienceMode.fromStringOrDefault("gamified"));
      assertEquals(UserLevel.APPRENTICE, UserLevel.calculateLevel(150));
      assertEquals(UserLevel.ADVENTURER, UserLevel.APPRENTICE.getNextLevel());
    } finally {
      Locale.setDefault(previousLocale);
    }
  }

  @Test
  @DisplayName("Modernização Java 25 & Fronteira Hexagonal: sealed Task, records e zero vazamentos entre camadas")
  void java25ModernizationAndHexagonalBoundaries() {
    // Task é sealed com exatamente Habit, Daily, Todo
    assertTrue(Task.class.isSealed());
    assertEquals(Set.of(Habit.class, Daily.class, Todo.class), Set.of(Task.class.getPermittedSubclasses()));

    // Entidades imutáveis convertidas em records
    assertTrue(Artifact.class.isRecord());
    assertTrue(Achievement.class.isRecord());
    assertTrue(ProfileHighlight.class.isRecord());
    assertTrue(EmailDispatchLog.class.isRecord());
    assertTrue(TransactionHistory.class.isRecord());

    // KanbanBoard (core) não referencia application.ports
    for (Method m : KanbanBoard.KanbanColumn.class.getDeclaredMethods()) {
      for (Class<?> paramType : m.getParameterTypes()) {
        assertFalse(paramType.getName().startsWith("com.habitparty.application"),
            () -> "KanbanBoard não pode depender de application: " + paramType.getName());
      }
    }

    // GetUserLayoutSummaryUseCase (application) não retorna tipo de adapters.in.web
    for (Method m : GetUserLayoutSummaryUseCase.class.getDeclaredMethods()) {
      assertFalse(m.getReturnType().getName().startsWith("com.habitparty.adapters"),
          () -> "GetUserLayoutSummaryUseCase não pode retornar DTO web: " + m.getReturnType().getName());
    }

    // DashboardTaskDTO (application/ports) sem anotações Jackson
    assertEquals(0, DashboardTaskDTO.class.getAnnotations().length);

    // TransactionCsvExporterPort sem dependência de org.springframework.data.domain.Page
    for (Method m : TransactionCsvExporterPort.class.getDeclaredMethods()) {
      for (Class<?> p : m.getParameterTypes()) {
        assertFalse(p.getName().startsWith("org.springframework.data"),
            () -> "TransactionCsvExporterPort não pode depender de Spring Data: " + p.getName());
      }
    }
  }

  @Test
  @DisplayName("P2 UseCases: ReorderFocusActivities bloqueia promoção Free, UpdateWorkspace aplica guard, Delete limpa órfãos e SocialUserSummary mascara bloqueados")
  void p2UseCaseFixesAndSocialPrivacy() {
    // 1. ReorderFocusActivities bloqueia usuário Free promovendo atividade pausada (índice >= 4)
    FocusActivityRepository activityRepo = mock(FocusActivityRepository.class);
    UserRepository userRepo = mock(UserRepository.class);
    User freeUser = User.createNew(
        "Free User", "freeuser", "free@example.com", "hash", true, true,
        LocalDate.of(1995, 1, 1), null, UserGender.MALE, "UTC", Clock.systemUTC());
    List<FocusActivity> fiveActivities = java.util.stream.IntStream.range(0, 5)
        .mapToObj(i -> new FocusActivity(
            UUID.randomUUID(), freeUser.getId(), "Act " + i, "book", i, FocusRecordType.STOPWATCH, null, LocalDateTime.now()))
        .toList();
    when(activityRepo.findAllByUserIdOrderByOrderIndex(freeUser.getId())).thenReturn(fiveActivities);
    when(userRepo.findById(freeUser.getId())).thenReturn(Optional.of(freeUser));

    ReorderFocusActivitiesUseCase reorderUseCase = new ReorderFocusActivitiesUseCase(activityRepo, userRepo);
    // Tentativa de promover a 5ª atividade (pausada) para o slot 0
    assertThrows(LimitExceededException.class, () -> reorderUseCase.execute(
        freeUser.getId(),
        List.of(
            new FocusActivityOrderCommand(fiveActivities.get(4).getId(), 0),
            new FocusActivityOrderCommand(fiveActivities.get(0).getId(), 4))));
    verify(activityRepo, never()).saveAll(any());

    // 2. UpdateWorkspace aplica WorkspaceWriteGuard
    WorkspaceRepository wsRepo = mock(WorkspaceRepository.class);
    WorkspaceWriteGuard guard = mock(WorkspaceWriteGuard.class);
    UUID lockedWsId = UUID.randomUUID();
    when(wsRepo.findById(lockedWsId)).thenReturn(Optional.of(new Workspace(lockedWsId, userId, "Locked")));
    doThrow(new LimitExceededException("Somente leitura"))
        .when(guard).assertWorkspaceWritable(eq(lockedWsId), eq(userId), anyString());

    UpdateWorkspaceUseCase updateWs = new UpdateWorkspaceUseCase(wsRepo, guard);
    assertThrows(LimitExceededException.class, () -> updateWs.execute(lockedWsId, userId, "Novo Nome"));
    verify(wsRepo, never()).save(any());

    // 3. DeleteBoardColumn e DeleteWorkspace limpam focus_records.task_id e profile_highlights TASK_STREAK em lote
    BoardColumnRepository colRepo = mock(BoardColumnRepository.class);
    TaskRepository taskRepo = mock(TaskRepository.class);
    FocusRecordRepository focusRepo = mock(FocusRecordRepository.class);
    ProfileHighlightRepository highlightRepo = mock(ProfileHighlightRepository.class);

    UUID colId = UUID.randomUUID();
    UUID wsId = UUID.randomUUID();
    UUID deletedTaskId = UUID.randomUUID();
    BoardColumn col = new BoardColumn(colId, userId, wsId, "Col", 0, "sun", true);
    when(colRepo.findById(colId)).thenReturn(Optional.of(col));
    when(taskRepo.findIdsByBoardColumnIds(List.of(colId))).thenReturn(List.of(deletedTaskId));

    DeleteBoardColumnUseCase deleteCol = new DeleteBoardColumnUseCase(colRepo, taskRepo, focusRepo, highlightRepo, null);
    deleteCol.execute(colId, userId);

    verify(focusRepo).nullifyTaskIds(List.of(deletedTaskId));
    verify(highlightRepo).deleteByUserIdAndHighlightTypeAndHighlightKeys(
        userId, HighlightType.TASK_STREAK, List.of(deletedTaskId.toString()));
    verify(taskRepo).deleteAllByBoardColumnId(colId);

    // DeleteWorkspace também limpa referências órfãs
    when(wsRepo.findById(wsId)).thenReturn(Optional.of(new Workspace(wsId, userId, "WS")));
    when(colRepo.findAllByWorkspaceId(wsId)).thenReturn(List.of(col));
    DeleteWorkspaceUseCase deleteWs = new DeleteWorkspaceUseCase(wsRepo, colRepo, taskRepo, focusRepo, highlightRepo);
    deleteWs.execute(wsId, userId);

    verify(focusRepo, times(2)).nullifyTaskIds(List.of(deletedTaskId));
    verify(highlightRepo, times(2)).deleteByUserIdAndHighlightTypeAndHighlightKeys(
        userId, HighlightType.TASK_STREAK, List.of(deletedTaskId.toString()));

    // 4. SocialUserSummary mascara bio, XP, streak e conquistas para BLOCKED e BLOCKED_BY_VIEWER
    User publicUser = new User(
        UUID.randomUUID(), UserRole.USER, false, "Public", "pub", "pub@example.com", "pwd",
        BigDecimal.TEN, BigDecimal.TEN, LocalDate.of(1995, 1, 1), null,
        UserGender.FEMALE, 500, 12, 30, LocalDateTime.now(ZoneOffset.UTC));
    publicUser.setBio("Minha bio privada");
    publicUser.setEquippedTitle("STREAK_30");
    publicUser.getStats().addAchievementPoints(400);

    for (SocialRelationshipStatus blockedStatus : List.of(
        SocialRelationshipStatus.BLOCKED, SocialRelationshipStatus.BLOCKED_BY_VIEWER)) {
      SocialUserSummary summary = SocialUserSummary.fromUserForViewer(publicUser, 12, blockedStatus);
      assertNull(summary.bio());
      assertNull(summary.equippedTitle());
      assertNull(summary.levelTitle());
      assertEquals(0, summary.totalXp());
      assertEquals(0, summary.currentStreak());
      assertEquals(0, summary.highestStreak());
      assertEquals(0, summary.achievementPoints());
      assertNull(summary.friendCode());
    }
  }
}
