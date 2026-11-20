package com.habitparty.application.usecases.achievement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.adapters.in.web.dtos.response.showcase.PublicUserShowcaseResponseDTO;
import com.habitparty.adapters.in.web.dtos.response.showcase.UserShowcaseResponseDTO;
import com.habitparty.application.ports.AchievementRepository;
import com.habitparty.application.ports.ArtifactRepository;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserArtifactRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.UpdateProfileHighlightsUseCase.HighlightSlotCommand;
import com.habitparty.application.usecases.social.SocialRelationshipStatus;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.entities.UserSubscription;
import com.habitparty.core.domain.entities.achievement.ProfileHighlight;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.HighlightType;
import com.habitparty.core.domain.enums.task.DailyRepeatType;
import com.habitparty.core.domain.enums.task.HabitImportanceType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;

class TaskStreakShowcaseTest {

  private User createUser(UUID id) {
    UserSubscription sub = new UserSubscription(id, true, false, null, null, null, null, LocalDateTime.now());
    return new User(
        id,
        UserRole.USER,
        "heroi",
        "heroi",
        "heroi@habitparty.com",
        "hash",
        true,
        null,
        LocalDate.of(1995, 4, 15),
        null,
        null,
        LocalDateTime.now(),
        UserStats.createInitial(id),
        sub);
  }

  private Daily createDaily(UUID taskId, UUID userId, String name, int currentStreak, int highestStreak, LocalDateTime lastCompletedAt) {
    Daily daily = new Daily(
        taskId,
        UUID.randomUUID(),
        userId,
        name,
        null,
        0,
        TaskPriority.MEDIUM,
        List.of(),
        TaskDifficulty.MEDIUM,
        TaskStatus.COMPLETED,
        TaskType.DAILY,
        false,
        LocalDate.of(2026, 11, 19),
        LocalDateTime.of(2026, 11, 1, 8, 0),
        List.of(),
        currentStreak,
        LocalDate.of(2026, 11, 1),
        DailyRepeatType.DAILY,
        1,
        null,
        null,
        lastCompletedAt);
    daily.restoreHighestStreak(highestStreak);
    return daily;
  }

  @Test
  @DisplayName("UpdateProfileHighlightsUseCase valida HIGHEST_TASK_STREAK e TASK_STREAK contra dono e tipo da tarefa")
  void updateHighlightsShouldAcceptValidTaskStreakAndRejectInvalidTargets() {
    UUID userId = UUID.randomUUID();
    UUID otherUserId = UUID.randomUUID();
    UUID dailyId = UUID.randomUUID();
    UUID todoId = UUID.randomUUID();
    UUID negativeHabitId = UUID.randomUUID();
    User user = createUser(userId);

    Daily daily = createDaily(dailyId, userId, "Meditar 10m", 2, 5, LocalDateTime.of(2026, 11, 19, 9, 0));
    Todo todo = new Todo(
        todoId,
        UUID.randomUUID(),
        userId,
        "Comprar livro",
        null,
        0,
        TaskPriority.Low,
        List.of(),
        TaskDifficulty.EASY,
        TaskStatus.PENDING,
        TaskType.TODO,
        false,
        LocalDate.of(2026, 11, 20),
        LocalDateTime.now(),
        List.of(),
        TodoReminderType.NONE,
        null,
        null);
    Habit negativeHabit = new Habit(
        negativeHabitId,
        UUID.randomUUID(),
        userId,
        "Roer unhas",
        null,
        0,
        TaskPriority.Low,
        List.of(),
        TaskDifficulty.EASY,
        TaskStatus.PENDING,
        TaskType.HABIT,
        false,
        null,
        LocalDateTime.now(),
        List.of(),
        0,
        HabitType.NEGATIVE,
        HabitResetCounter.DAILY,
        HabitImportanceType.LOW,
        null);

    UserRepository userRepo = mock(UserRepository.class);
    UserAchievementRepository userAchRepo = mock(UserAchievementRepository.class);
    ProfileHighlightRepository highlightRepo = mock(ProfileHighlightRepository.class);
    EvaluateUserAchievementsUseCase evaluateUseCase = mock(EvaluateUserAchievementsUseCase.class);
    TaskRepository taskRepo = mock(TaskRepository.class);

    when(userRepo.findById(userId)).thenReturn(Optional.of(user));
    when(taskRepo.findById(dailyId)).thenReturn(Optional.of(daily));
    when(taskRepo.findById(todoId)).thenReturn(Optional.of(todo));
    when(taskRepo.findById(negativeHabitId)).thenReturn(Optional.of(negativeHabit));
    when(highlightRepo.replaceAllForUser(eq(userId), anyList())).thenAnswer(inv -> inv.getArgument(1));

    UpdateProfileHighlightsUseCase useCase = new UpdateProfileHighlightsUseCase(
        userRepo,
        userAchRepo,
        highlightRepo,
        evaluateUseCase,
        mock(ArtifactRepository.class),
        mock(UserArtifactRepository.class),
        taskRepo);

    List<ProfileHighlight> saved = useCase.execute(userId, List.of(
        new HighlightSlotCommand(0, HighlightType.STAT_METRIC, null, "HIGHEST_TASK_STREAK"),
        new HighlightSlotCommand(1, HighlightType.TASK_STREAK, null, dailyId.toString())));

    assertEquals(2, saved.size());
    assertNull(saved.get(1).getReferenceId().orElse(null));
    assertEquals(dailyId.toString(), saved.get(1).getHighlightKey().orElse(null));

    assertThrows(DomainValidationException.class, () -> useCase.execute(userId, List.of(
        new HighlightSlotCommand(0, HighlightType.TASK_STREAK, null, todoId.toString()))));

    assertThrows(DomainValidationException.class, () -> useCase.execute(userId, List.of(
        new HighlightSlotCommand(0, HighlightType.TASK_STREAK, null, negativeHabitId.toString()))));

    assertThrows(DomainValidationException.class, () -> useCase.execute(userId, List.of(
        new HighlightSlotCommand(0, HighlightType.TASK_STREAK, null, dailyId.toString()),
        new HighlightSlotCommand(1, HighlightType.TASK_STREAK, null, dailyId.toString()))));

    Daily otherDaily = createDaily(UUID.randomUUID(), otherUserId, "Outro", 3, 3, null);
    when(taskRepo.findById(otherDaily.getId())).thenReturn(Optional.of(otherDaily));
    assertThrows(DomainValidationException.class, () -> useCase.execute(userId, List.of(
        new HighlightSlotCommand(0, HighlightType.TASK_STREAK, null, otherDaily.getId().toString()))));
  }

  @Test
  @DisplayName("GetUserShowcaseUseCase calcula taskStreaks/highestTaskStreak, filtra órfãos e DTO mascara título privado de visitante")
  void showcaseComputesTaskStreaksAndMasksUnpinnedTitleForVisitors() {
    UUID userId = UUID.randomUUID();
    User user = createUser(userId);
    UUID dailyId = UUID.randomUUID();
    UUID topHabitId = UUID.randomUUID();
    UUID deletedTaskId = UUID.randomUUID();

    Daily daily = createDaily(dailyId, userId, "Meditar 10m", 2, 2, LocalDateTime.of(2026, 11, 19, 8, 0));
    Habit topHabit = new Habit(
        topHabitId,
        UUID.randomUUID(),
        userId,
        "Hábito Secreto de Recorde",
        null,
        1,
        TaskPriority.HIGH,
        List.of(),
        TaskDifficulty.HARD,
        TaskStatus.PENDING,
        TaskType.HABIT,
        false,
        null,
        LocalDateTime.of(2026, 11, 1, 8, 0),
        List.of(),
        3,
        HabitType.POSITIVE,
        HabitResetCounter.WEEKLY,
        HabitImportanceType.HIGH,
        LocalDateTime.of(2026, 11, 19, 9, 0));
    topHabit.restoreHighestStreak(11);

    ProfileHighlight validTaskHighlight = new ProfileHighlight(
        UUID.randomUUID(), userId, 0, HighlightType.TASK_STREAK, null, dailyId.toString(), LocalDateTime.now());
    ProfileHighlight orphanedTaskHighlight = new ProfileHighlight(
        UUID.randomUUID(), userId, 1, HighlightType.TASK_STREAK, null, deletedTaskId.toString(), LocalDateTime.now());

    UserRepository userRepo = mock(UserRepository.class);
    AchievementRepository achRepo = mock(AchievementRepository.class);
    UserAchievementRepository userAchRepo = mock(UserAchievementRepository.class);
    ProfileHighlightRepository highlightRepo = mock(ProfileHighlightRepository.class);
    EvaluateUserAchievementsUseCase evaluateUseCase = mock(EvaluateUserAchievementsUseCase.class);
    ArtifactRepository artifactRepo = mock(ArtifactRepository.class);
    UserArtifactRepository userArtifactRepo = mock(UserArtifactRepository.class);
    TaskRepository taskRepo = mock(TaskRepository.class);

    when(userRepo.findById(userId)).thenReturn(Optional.of(user));
    when(highlightRepo.findAllByUserIdOrderByDisplayOrder(userId))
        .thenReturn(List.of(validTaskHighlight, orphanedTaskHighlight));
    when(evaluateUseCase.executeWithSnapshot(eq(user), anyList()))
        .thenReturn(new EvaluateUserAchievementsUseCase.EvaluationSnapshot(List.of(), List.of(), List.of()));
    when(achRepo.findAllOrdered()).thenReturn(List.of());
    when(userAchRepo.findAllByUserId(userId)).thenReturn(List.of());
    when(artifactRepo.findAllOrdered()).thenReturn(List.of());
    when(userArtifactRepo.findAllByUserId(userId)).thenReturn(List.of());
    when(taskRepo.findRecurringTasksByUserIds(List.of(userId))).thenReturn(List.of(daily, topHabit));

    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-19T12:00:00Z"), ZoneOffset.UTC);
    GetUserShowcaseUseCase showcaseUseCase = new GetUserShowcaseUseCase(
        userRepo,
        achRepo,
        userAchRepo,
        highlightRepo,
        evaluateUseCase,
        new EffectiveStreakResolver(null, fixedClock),
        null,
        artifactRepo,
        userArtifactRepo,
        taskRepo,
        fixedClock);

    var result = showcaseUseCase.execute(userId);

    assertEquals(1, result.highlights().size());
    assertEquals(dailyId.toString(), result.highlights().get(0).getHighlightKey().orElse(null));
    assertEquals(2, result.taskStreaks().size());
    assertEquals(11, result.highestTaskStreak());
    assertEquals("Hábito Secreto de Recorde", result.highestTaskStreakTitle());
    assertEquals(TaskType.HABIT, result.highestTaskStreakType());

    UserShowcaseResponseDTO ownerDto = UserShowcaseResponseDTO.fromDomain(result);
    assertEquals(2, ownerDto.taskStreaks().size());
    assertEquals(11, ownerDto.stats().highestTaskStreak());
    assertEquals("Hábito Secreto de Recorde", ownerDto.stats().highestTaskStreakTitle());
    assertNotNull(ownerDto.highlights().get(0).taskStreak());
    assertEquals("Meditar 10m", ownerDto.highlights().get(0).taskStreak().name());
    assertEquals(2, ownerDto.highlights().get(0).taskStreak().currentStreak());

    var publicResult = new GetPublicUserShowcaseUseCase.PublicUserShowcaseResult(
        com.habitparty.application.usecases.social.SocialUserSummary.fromUserForViewer(
            user, 0, SocialRelationshipStatus.NONE),
        SocialRelationshipStatus.NONE,
        null,
        true,
        true,
        true,
        result,
        0,
        result.highlights(),
        List.of(),
        List.of());
    PublicUserShowcaseResponseDTO visitorDto = PublicUserShowcaseResponseDTO.fromDomain(publicResult);

    assertEquals(11, visitorDto.stats().highestTaskStreak());
    assertNull(visitorDto.stats().highestTaskStreakTitle(), "Título de tarefa não fixada não deve vazar para visitantes");
    assertNull(visitorDto.stats().highestTaskStreakType());
    assertEquals(1, visitorDto.highlights().size());
    assertEquals("Meditar 10m", visitorDto.highlights().get(0).taskStreak().name());
    assertTrue(visitorDto.highlights().get(0).taskStreak().currentStreak() == 2);
  }

  @Test
  @DisplayName("GetUserShowcaseUseCase retorna apenas a Diária e o Hábito com maior streak ativo (ou vazio se nenhum estiver ativo)")
  void showcaseShouldReturnAtMostOneTopActiveDailyAndOneTopActiveHabit() {
    UUID userId = UUID.randomUUID();
    User user = createUser(userId);
    UUID topDailyId = UUID.randomUUID();
    UUID secondaryDailyId = UUID.randomUUID();
    UUID lapsedDailyId = UUID.randomUUID();
    UUID topHabitId = UUID.randomUUID();
    UUID zeroHabitId = UUID.randomUUID();

    Daily topDaily = createDaily(topDailyId, userId, "Correr 5km", 6, 6, LocalDateTime.of(2026, 11, 19, 7, 0));
    Daily secondaryDaily = createDaily(secondaryDailyId, userId, "Meditar", 2, 2, LocalDateTime.of(2026, 11, 19, 8, 0));
    Daily lapsedDaily = createDaily(lapsedDailyId, userId, "Diária Quebrada", 0, 12, LocalDateTime.of(2026, 11, 10, 8, 0));

    Habit topHabit = new Habit(
        topHabitId, UUID.randomUUID(), userId, "Ler Livro", null, 0,
        TaskPriority.HIGH, List.of(), TaskDifficulty.MEDIUM, TaskStatus.PENDING, TaskType.HABIT,
        false, null, LocalDateTime.of(2026, 11, 1, 8, 0), List.of(),
        4, HabitType.POSITIVE, HabitResetCounter.DAILY, HabitImportanceType.HIGH,
        LocalDateTime.of(2026, 11, 19, 9, 0));
    Habit zeroHabit = new Habit(
        zeroHabitId, UUID.randomUUID(), userId, "Alongar", null, 1,
        TaskPriority.Low, List.of(), TaskDifficulty.EASY, TaskStatus.PENDING, TaskType.HABIT,
        false, null, LocalDateTime.of(2026, 11, 1, 8, 0), List.of(),
        0, HabitType.POSITIVE, HabitResetCounter.DAILY, HabitImportanceType.LOW,
        null);

    // Usuário fixou anteriormente secondaryDaily; embora topDaily a ultrapasse, a já fixada deve continuar hidratada
    ProfileHighlight pinnedSecondary = new ProfileHighlight(
        UUID.randomUUID(), userId, 0, HighlightType.TASK_STREAK, null, secondaryDailyId.toString(), LocalDateTime.now());

    UserRepository userRepo = mock(UserRepository.class);
    AchievementRepository achRepo = mock(AchievementRepository.class);
    UserAchievementRepository userAchRepo = mock(UserAchievementRepository.class);
    ProfileHighlightRepository highlightRepo = mock(ProfileHighlightRepository.class);
    EvaluateUserAchievementsUseCase evaluateUseCase = mock(EvaluateUserAchievementsUseCase.class);
    TaskRepository taskRepo = mock(TaskRepository.class);

    when(userRepo.findById(userId)).thenReturn(Optional.of(user));
    when(highlightRepo.findAllByUserIdOrderByDisplayOrder(userId)).thenReturn(List.of(pinnedSecondary));
    when(evaluateUseCase.executeWithSnapshot(eq(user), anyList()))
        .thenReturn(new EvaluateUserAchievementsUseCase.EvaluationSnapshot(List.of(), List.of(), List.of()));
    when(achRepo.findAllOrdered()).thenReturn(List.of());
    when(userAchRepo.findAllByUserId(userId)).thenReturn(List.of());
    when(taskRepo.findRecurringTasksByUserIds(List.of(userId)))
        .thenReturn(List.of(topDaily, secondaryDaily, lapsedDaily, topHabit, zeroHabit));

    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-19T12:00:00Z"), ZoneOffset.UTC);
    GetUserShowcaseUseCase showcaseUseCase = new GetUserShowcaseUseCase(
        userRepo, achRepo, userAchRepo, highlightRepo, evaluateUseCase,
        new EffectiveStreakResolver(null, fixedClock), null, null, null, taskRepo, fixedClock);

    var result = showcaseUseCase.execute(userId);
    assertEquals(2, result.taskStreaks().size(), "Deve expor no máximo 1 Diária e 1 Hábito com streak ativo");
    assertEquals(topDailyId, result.taskStreaks().get(0).id());
    assertEquals(topHabitId, result.taskStreaks().get(1).id());

    UserShowcaseResponseDTO ownerDto = UserShowcaseResponseDTO.fromDomain(result);
    assertEquals(2, ownerDto.taskStreaks().size());
    assertNotNull(ownerDto.highlights().get(0).taskStreak(), "Highlight já fixado continua hidratado mesmo se ultrapassado");
    assertEquals("Meditar", ownerDto.highlights().get(0).taskStreak().name());

    // Quando nenhuma tarefa tem streak ativo, taskStreaks deve vir vazio
    when(highlightRepo.findAllByUserIdOrderByDisplayOrder(userId)).thenReturn(List.of());
    when(taskRepo.findRecurringTasksByUserIds(List.of(userId))).thenReturn(List.of(lapsedDaily, zeroHabit));

    var emptyResult = showcaseUseCase.execute(userId);
    assertTrue(emptyResult.taskStreaks().isEmpty(), "Sem nenhum streak ativo, nenhuma tarefa deve ser listada");
    assertTrue(UserShowcaseResponseDTO.fromDomain(emptyResult).taskStreaks().isEmpty());
  }
}
