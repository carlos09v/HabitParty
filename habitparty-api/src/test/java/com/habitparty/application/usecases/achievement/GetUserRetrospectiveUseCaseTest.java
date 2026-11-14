package com.habitparty.application.usecases.achievement;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.habitparty.application.ports.AchievementRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.FriendshipRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserAchievementRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.UserTimeResolver;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.UserStats;
import com.habitparty.core.domain.entities.UserSubscription;
import com.habitparty.core.domain.entities.achievement.Achievement;
import com.habitparty.core.domain.entities.achievement.UserAchievement;
import com.habitparty.core.domain.entities.achievement.UserRetrospective;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.social.Friendship;
import com.habitparty.core.domain.enums.AchievementCategory;
import com.habitparty.core.domain.enums.AchievementRarity;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.PrivacyLevel;
import com.habitparty.core.domain.enums.RetrospectiveArchetype;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.exceptions.UnauthorizedException;

class GetUserRetrospectiveUseCaseTest {

  private User buildUser(UUID id, String username, LocalDateTime createdAt) {
    User user = new User(
        id,
        UserRole.USER,
        "Tester",
        username,
        username + "@example.com",
        "hashed",
        true,
        null,
        LocalDate.of(1995, 1, 1),
        null,
        null,
        createdAt,
        UserStats.createInitial(id),
        UserSubscription.createInitial(id));
    user.setTimezone("America/Sao_Paulo");
    return user;
  }

  private GetUserRetrospectiveUseCase buildUseCase(
      Clock clock,
      UserRepository userRepo,
      FriendshipRepository friendshipRepo,
      TransactionHistoryRepository txRepo,
      FocusRecordRepository focusRepo,
      UserAchievementRepository uaRepo,
      AchievementRepository achRepo) {
    return new GetUserRetrospectiveUseCase(
        userRepo,
        friendshipRepo,
        txRepo,
        focusRepo,
        uaRepo,
        achRepo,
        new UserTimeResolver(userRepo, clock));
  }

  @Test
  void shouldRejectInactiveDecemberAccountWhenFewerThanTwoCriteriaAreMet() {
    UUID userId = UUID.randomUUID();
    User user = buildUser(userId, "decemberjoin", LocalDateTime.of(2025, 12, 22, 10, 0));

    UserRepository userRepo = mock(UserRepository.class);
    FriendshipRepository friendshipRepo = mock(FriendshipRepository.class);
    TransactionHistoryRepository txRepo = mock(TransactionHistoryRepository.class);
    FocusRecordRepository focusRepo = mock(FocusRecordRepository.class);
    UserAchievementRepository uaRepo = mock(UserAchievementRepository.class);
    AchievementRepository achRepo = mock(AchievementRepository.class);

    when(userRepo.findById(userId)).thenReturn(Optional.of(user));
    when(txRepo.findEarliestCreatedAtByUserId(userId)).thenReturn(Optional.empty());
    when(focusRepo.findEarliestStartTimeByUserId(userId)).thenReturn(Optional.empty());
    // Apenas 2 dias e 2 tarefas concluídas em dezembro -> 0 critérios atingidos
    List<TransactionHistory> decTx = List.of(
        new TransactionHistory(
            UUID.randomUUID(), userId, UUID.randomUUID(), BigDecimal.ONE, 15, null,
            TransactionType.TODO_COMPLETED, "First task", null, null, TaskDifficulty.MEDIUM, null,
            LocalDateTime.of(2025, 12, 23, 14, 0)),
        new TransactionHistory(
            UUID.randomUUID(), userId, UUID.randomUUID(), BigDecimal.ONE, 10, null,
            TransactionType.HABIT_COMPLETED, "Second task", null, null, TaskDifficulty.EASY, null,
            LocalDateTime.of(2025, 12, 24, 9, 0)));
    when(txRepo.findAllByUserIdAndPeriod(eq(userId), any(), any())).thenReturn(decTx);
    when(focusRepo.findAllByUserIdAndPeriod(eq(userId), any(), any())).thenReturn(List.of());
    when(achRepo.findAllOrdered()).thenReturn(List.of());
    when(uaRepo.findAllByUserId(userId)).thenReturn(List.of());

    Clock janClock = Clock.fixed(Instant.parse("2026-01-10T15:00:00Z"), ZoneId.of("UTC"));
    GetUserRetrospectiveUseCase useCase = buildUseCase(
        janClock, userRepo, friendshipRepo, txRepo, focusRepo, uaRepo, achRepo);

    UserRetrospective result = useCase.executeForSelf(userId, 2025);

    assertFalse(result.eligible());
    assertTrue(result.inSeasonalWindow());
    assertEquals(0, result.criteriaMet());
    assertEquals(2, result.activeDays());
    assertEquals(2, result.tasksCompleted());
    assertEquals(0, result.focusMinutes());
    assertTrue(result.availableYears().isEmpty());
  }

  @Test
  void shouldMarkEligibleWhenTwoOfThreeCriteriaAreMetAndComputeHighlights() {
    UUID userId = UUID.randomUUID();
    User user = buildUser(userId, "activeuser", LocalDateTime.of(2025, 3, 1, 10, 0));

    UserRepository userRepo = mock(UserRepository.class);
    FriendshipRepository friendshipRepo = mock(FriendshipRepository.class);
    TransactionHistoryRepository txRepo = mock(TransactionHistoryRepository.class);
    FocusRecordRepository focusRepo = mock(FocusRecordRepository.class);
    UserAchievementRepository uaRepo = mock(UserAchievementRepository.class);
    AchievementRepository achRepo = mock(AchievementRepository.class);

    when(userRepo.findById(userId)).thenReturn(Optional.of(user));
    when(txRepo.findEarliestCreatedAtByUserId(userId))
        .thenReturn(Optional.of(LocalDateTime.of(2025, 3, 2, 10, 0)));
    when(focusRepo.findEarliestStartTimeByUserId(userId)).thenReturn(Optional.empty());

    // 10 tarefas em 6 dias distintos de agosto 2025 (atinge >= 5 dias e >= 10 tarefas = 2/3 critérios!)
    List<TransactionHistory> txs = new ArrayList<>();
    for (int i = 0; i < 10; i++) {
      int day = 1 + (i % 6);
      txs.add(new TransactionHistory(
          UUID.randomUUID(), userId, UUID.randomUUID(),
          new BigDecimal("2.50"), 25, null,
          TransactionType.DAILY_COMPLETED, "Task " + i, null, null,
          i < 4 ? TaskDifficulty.HARD : TaskDifficulty.MEDIUM, null,
          LocalDateTime.of(2025, 8, day, 12, 0)));
    }

    FocusRecord focus = new FocusRecord(
        UUID.randomUUID(), userId, UUID.randomUUID(), null, null,
        LocalDateTime.of(2025, 8, 2, 9, 0),
        LocalDateTime.of(2025, 8, 2, 10, 0),
        FocusRecordType.POMO, 2);

    UUID epicId = UUID.randomUUID();
    Achievement epicAch = new Achievement(
        epicId, "GRANDMASTER_FOCUS", "Mestre do Foco", "Desc", "Flame", 100,
        AchievementCategory.FOCUS, AchievementRarity.EPIC, 10, 1, false);
    UserAchievement unlock = new UserAchievement(
        userId, epicId, LocalDateTime.of(2025, 8, 2, 18, 0), true);

    when(txRepo.findAllByUserIdAndPeriod(eq(userId), any(), any())).thenReturn(txs);
    when(focusRepo.findAllByUserIdAndPeriod(eq(userId), any(), any())).thenReturn(List.of(focus));
    when(achRepo.findAllOrdered()).thenReturn(List.of(epicAch));
    when(uaRepo.findAllByUserId(userId)).thenReturn(List.of(unlock));

    Clock mid2026Clock = Clock.fixed(Instant.parse("2026-11-14T15:00:00Z"), ZoneId.of("UTC"));
    GetUserRetrospectiveUseCase useCase = buildUseCase(
        mid2026Clock, userRepo, friendshipRepo, txRepo, focusRepo, uaRepo, achRepo);

    UserRetrospective result = useCase.executeForSelf(userId, null);

    assertEquals(2025, result.year());
    assertTrue(result.eligible());
    assertFalse(result.inSeasonalWindow());
    assertEquals(2, result.criteriaMet());
    assertEquals(6, result.activeDays());
    assertEquals(10, result.tasksCompleted());
    assertEquals(4, result.hardTasksCompleted());
    assertEquals(60, result.focusMinutes());
    assertEquals(2, result.pomodorosCompleted());
    assertEquals(250, result.xpEarned());
    assertEquals(0, new BigDecimal("25.00").compareTo(result.coinsEarned()));
    assertEquals(8, result.bestMonth());
    assertEquals("GRANDMASTER_FOCUS", result.rarestAchievementCode());
    assertEquals(RetrospectiveArchetype.RISING_SPARK, result.archetype());
    assertEquals(RetrospectiveArchetype.CHALLENGE_SEEKER, RetrospectiveArchetype.resolve(10, 21, 8, 60));
    assertTrue(result.availableYears().contains(2025));
  }

  @Test
  void shouldDenyRetrospectiveWhenTargetUserSetStatsPrivate() {
    UUID viewerId = UUID.randomUUID();
    UUID ownerId = UUID.randomUUID();
    User owner = buildUser(ownerId, "privateowner", LocalDateTime.of(2025, 1, 1, 10, 0));
    owner.updatePrivacySettings(PrivacyLevel.PUBLIC, PrivacyLevel.FRIENDS_ONLY, PrivacyLevel.PUBLIC, null);

    UserRepository userRepo = mock(UserRepository.class);
    FriendshipRepository friendshipRepo = mock(FriendshipRepository.class);
    when(userRepo.findByUsernameIgnoreCase("privateowner")).thenReturn(Optional.of(owner));
    when(friendshipRepo.findBetweenUsers(viewerId, ownerId)).thenReturn(Optional.empty());

    GetUserRetrospectiveUseCase useCase = buildUseCase(
        Clock.systemUTC(),
        userRepo,
        friendshipRepo,
        mock(TransactionHistoryRepository.class),
        mock(FocusRecordRepository.class),
        mock(UserAchievementRepository.class),
        mock(AchievementRepository.class));

    assertThrows(UnauthorizedException.class, () -> useCase.executeForUsername(viewerId, "privateowner", 2025));

    // Quando são amigos aceitos, libera consulta!
    when(friendshipRepo.findBetweenUsers(viewerId, ownerId))
        .thenReturn(Optional.of(Friendship.createAccepted(viewerId, ownerId, Instant.now())));
    TransactionHistoryRepository txRepo = mock(TransactionHistoryRepository.class);
    when(txRepo.findEarliestCreatedAtByUserId(ownerId)).thenReturn(Optional.empty());
    when(txRepo.findAllByUserIdAndPeriod(eq(ownerId), any(), any())).thenReturn(List.of());
    FocusRecordRepository focusRepo = mock(FocusRecordRepository.class);
    when(focusRepo.findEarliestStartTimeByUserId(ownerId)).thenReturn(Optional.empty());
    when(focusRepo.findAllByUserIdAndPeriod(eq(ownerId), any(), any())).thenReturn(List.of());
    AchievementRepository achRepo = mock(AchievementRepository.class);
    when(achRepo.findAllOrdered()).thenReturn(List.of());
    UserAchievementRepository uaRepo = mock(UserAchievementRepository.class);
    when(uaRepo.findAllByUserId(ownerId)).thenReturn(List.of());

    GetUserRetrospectiveUseCase useCaseFriend = buildUseCase(
        Clock.fixed(Instant.parse("2026-11-14T15:00:00Z"), ZoneId.of("UTC")),
        userRepo, friendshipRepo, txRepo, focusRepo, uaRepo, achRepo);

    UserRetrospective allowed = useCaseFriend.executeForUsername(viewerId, "privateowner", 2025);
    assertEquals(2025, allowed.year());
  }
}
