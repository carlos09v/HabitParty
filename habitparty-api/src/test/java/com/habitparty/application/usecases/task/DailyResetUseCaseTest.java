package com.habitparty.application.usecases.task;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionOperations;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.task.DailyResetUseCase.RolloverSummary;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Todo;
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

@ExtendWith(MockitoExtension.class)
class DailyResetUseCaseTest {

  private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");
  // 2026-11-13 00:05 em America/Sao_Paulo (03:05 UTC)
  private static final Clock FIXED_CLOCK =
      Clock.fixed(Instant.parse("2026-11-13T03:05:00Z"), SAO_PAULO);

  @Mock
  private TaskRepository port;

  @Mock
  private TransactionHistoryRepository transactionPort;

  @Mock
  private UserRepository userPort;

  private DailyResetUseCase dailyResetUseCase;

  private UUID userId;
  private User user;
  private LocalDate todaySp;

  @BeforeEach
  void setUp() {
    dailyResetUseCase = new DailyResetUseCase(
        port, transactionPort, userPort,
        FIXED_CLOCK,
        TransactionOperations.withoutTransaction());

    todaySp = LocalDate.now(FIXED_CLOCK);
    userId = UUID.randomUUID();
    user = new User(
        userId,
        UserRole.USER,
        false,
        "Aventureiro",
        "aventureiro",
        "aventureiro@habitparty.com",
        "hashed_pwd",
        new BigDecimal("100.00"),
        BigDecimal.ZERO,
        LocalDate.of(1995, 1, 1),
        null,
        UserGender.MALE,
        5,
        2,
        100,
        LocalDateTime.of(2026, 1, 1, 10, 0)
    );
    user.setTimezone("America/Sao_Paulo");
    user.setLastDailyResetDate(todaySp.minusDays(1));
    user.setNextDailyResetAt(todaySp.atStartOfDay(SAO_PAULO).toInstant());
  }

  private void stubSingleDueUser(User targetUser) {
    when(userPort.findUserIdsDueForDailyReset(any(Instant.class))).thenReturn(List.of(targetUser.getId()));
    when(userPort.findAllByIds(anyCollection())).thenReturn(List.of(targetUser));
  }

  private void stubUserWasActiveYesterday(User targetUser, ZoneId zone) {
    LocalDate userToday = LocalDate.now(FIXED_CLOCK.withZone(zone));
    LocalDateTime completedInSys = userToday.minusDays(1).atTime(14, 0)
        .atZone(zone)
        .withZoneSameInstant(ZoneId.systemDefault())
        .toLocalDateTime();
    when(transactionPort.findLastCompletedTaskAtByUserIds(anyCollection(), any(LocalDateTime.class)))
        .thenReturn(Map.of(targetUser.getId(), completedInSys));
  }

  @Test
  @DisplayName("Deve resetar tarefa recorrente concluída ontem para PENDING e atualizar data do reset")
  void testCompletedRecurringTaskIsResetToPending() {
    Daily daily = new Daily(
        UUID.randomUUID(),
        UUID.randomUUID(),
        userId,
        "Meditar 10 minutos",
        "Atenção plena",
        1,
        TaskPriority.HIGH,
        List.of("mindfulness"),
        TaskDifficulty.MEDIUM,
        TaskStatus.COMPLETED,
        TaskType.DAILY,
        false,
        todaySp.minusDays(1),
        todaySp.minusDays(2).atTime(10, 0),
        List.of(),
        3,
        todaySp.minusDays(1),
        DailyRepeatType.DAILY,
        1,
        null,
        null,
        todaySp.minusDays(1).atTime(20, 0)
    );

    stubSingleDueUser(user);
    stubUserWasActiveYesterday(user, SAO_PAULO);
    when(port.findRecurringTasksByUserIds(anyCollection())).thenReturn(List.of(daily));

    RolloverSummary summary = dailyResetUseCase.executeDailyRolloverSummary();

    assertEquals(1, summary.processedUsers());
    assertEquals(1, summary.updatedTasks());
    assertEquals(0, summary.expiredStreaks());
    assertEquals(TaskStatus.PENDING, daily.getStatus());
    assertEquals(todaySp, user.getLastDailyResetDate());
    assertEquals(todaySp.plusDays(1).atStartOfDay(SAO_PAULO).toInstant(), user.getNextDailyResetAt());
    verify(port, times(1)).saveAll(List.of(daily));
    verify(port, never()).save(any());
  }

  @Test
  @DisplayName("Não deve resetar Daily concluída entre 00:00 e 00:15 antes do cron do ciclo")
  void testDailyCompletedAfterMidnightInSameCycleIsPreserved() {
    Daily completedToday = new Daily(
        UUID.randomUUID(),
        UUID.randomUUID(),
        userId,
        "Rotina matinal",
        null,
        1,
        TaskPriority.HIGH,
        List.of(),
        TaskDifficulty.EASY,
        TaskStatus.COMPLETED,
        TaskType.DAILY,
        false,
        todaySp,
        todaySp.minusDays(5).atTime(10, 0),
        List.of(),
        6,
        todaySp.minusDays(5),
        DailyRepeatType.DAILY,
        1,
        null,
        null,
        todaySp.atTime(0, 2) // Concluída hoje às 00:02 antes do cron de 00:05
    );

    stubSingleDueUser(user);
    stubUserWasActiveYesterday(user, SAO_PAULO);
    when(port.findRecurringTasksByUserIds(anyCollection())).thenReturn(List.of(completedToday));

    RolloverSummary summary = dailyResetUseCase.executeDailyRolloverSummary();

    assertEquals(1, summary.processedUsers());
    assertEquals(0, summary.updatedTasks());
    assertEquals(TaskStatus.COMPLETED, completedToday.getStatus());
    assertEquals(6, completedToday.getCurrentStreak());
    verify(port, never()).saveAll(any());
  }

  @Test
  @DisplayName("Deve quebrar streak de hábito pendente e aplicar penalidade no modo Hardcore")
  void testPendingHabitBreaksStreakAndAppliesHardcorePenalty() {
    Habit habit = new Habit(
        UUID.randomUUID(),
        UUID.randomUUID(),
        userId,
        "Ler 20 páginas",
        "Leitura diária",
        1,
        TaskPriority.HIGH,
        List.of("leitura"),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.HABIT,
        true,
        null,
        todaySp.minusDays(10).atTime(9, 0),
        List.of(),
        5,
        HabitType.POSITIVE,
        HabitResetCounter.DAILY,
        HabitImportanceType.NORMAL,
        todaySp.minusDays(2).atTime(18, 0)
    );

    stubSingleDueUser(user);
    stubUserWasActiveYesterday(user, SAO_PAULO);
    when(port.findRecurringTasksByUserIds(anyCollection())).thenReturn(List.of(habit));

    dailyResetUseCase.executeDailyRollover();

    assertEquals(0, habit.getCurrentStreak());
    assertTrue(user.getCurrentCoins().compareTo(new BigDecimal("100.00")) < 0);
    assertTrue(user.getTotalXp() < 100);

    verify(userPort).saveAll(argThat(users -> List.copyOf(users).equals(List.of(user))));

    ArgumentCaptor<TransactionHistory> captor = ArgumentCaptor.forClass(TransactionHistory.class);
    verify(transactionPort).save(captor.capture());
    assertEquals(TransactionType.TASK_FAILED, captor.getValue().getTransactionType());
    assertTrue(captor.getValue().getGoldAmount().orElse(BigDecimal.ZERO).compareTo(BigDecimal.ZERO) < 0);
    assertTrue(captor.getValue().getXpAmount() < 0);

    verify(port, times(1)).saveAll(List.of(habit));
  }

  @Test
  @DisplayName("Deve quebrar streak de Daily vencida ontem, reagendar para hoje e salvar")
  void testPendingDailyDueYesterdayBreaksStreakAndShiftsOccurrence() {
    LocalDate yesterday = todaySp.minusDays(1);
    Daily daily = new Daily(
        UUID.randomUUID(),
        UUID.randomUUID(),
        userId,
        "Fazer exercícios",
        "Treino aeróbico",
        1,
        TaskPriority.HIGH,
        List.of("fitness"),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.DAILY,
        false,
        yesterday,
        todaySp.minusDays(3).atTime(8, 0),
        List.of(),
        4,
        yesterday,
        DailyRepeatType.DAILY,
        1,
        null,
        null,
        null
    );

    stubSingleDueUser(user);
    stubUserWasActiveYesterday(user, SAO_PAULO);
    when(port.findRecurringTasksByUserIds(anyCollection())).thenReturn(List.of(daily));

    dailyResetUseCase.executeDailyRollover();

    assertEquals(0, daily.getCurrentStreak());
    assertEquals(todaySp, daily.getDueDate().orElseThrow());
    verify(port, times(1)).saveAll(List.of(daily));
    verify(transactionPort, never()).save(any());
  }

  @Test
  @DisplayName("Deve quebrar streak e descontar 50% de Gold/XP de Daily Hardcore vencida ontem no rollover")
  void testPendingHardcoreDailyDueYesterdayPenalizesCoinsAndXp() {
    LocalDate yesterday = todaySp.minusDays(1);
    Daily hardcoreDaily = new Daily(
        UUID.randomUUID(),
        UUID.randomUUID(),
        userId,
        "Estudar",
        null,
        1,
        TaskPriority.HIGH,
        List.of(),
        TaskDifficulty.MEDIUM, // recompensa: 15 XP / 2.50 coins -> multa: 7 XP / 1.25 coins
        TaskStatus.PENDING,
        TaskType.DAILY,
        true,
        yesterday,
        todaySp.minusDays(3).atTime(8, 0),
        List.of(),
        5,
        yesterday,
        DailyRepeatType.DAILY,
        1,
        null,
        null,
        null
    );

    stubSingleDueUser(user);
    stubUserWasActiveYesterday(user, SAO_PAULO);
    when(port.findRecurringTasksByUserIds(anyCollection())).thenReturn(List.of(hardcoreDaily));

    dailyResetUseCase.executeDailyRollover();

    assertEquals(0, hardcoreDaily.getCurrentStreak());
    assertEquals(todaySp, hardcoreDaily.getDueDate().orElseThrow());
    assertEquals(new BigDecimal("98.75"), user.getCurrentCoins());
    verify(transactionPort, times(1)).save(any(TransactionHistory.class));
    verify(userPort, times(1)).saveAll(any());
  }

  @Test
  @DisplayName("Não deve penalizar Daily pendente cujo vencimento é futuro")
  void testPendingDailyDueInFutureIsNotPenalized() {
    LocalDate tomorrow = todaySp.plusDays(1);
    Daily daily = new Daily(
        UUID.randomUUID(),
        UUID.randomUUID(),
        userId,
        "Revisão semanal",
        "Revisar metas",
        1,
        TaskPriority.MEDIUM,
        List.of("planejamento"),
        TaskDifficulty.EASY,
        TaskStatus.PENDING,
        TaskType.DAILY,
        true,
        tomorrow,
        todaySp.minusDays(1).atTime(8, 0),
        List.of(),
        2,
        tomorrow,
        DailyRepeatType.DAILY,
        1,
        null,
        null,
        null
    );

    stubSingleDueUser(user);
    stubUserWasActiveYesterday(user, SAO_PAULO);
    when(port.findRecurringTasksByUserIds(anyCollection())).thenReturn(List.of(daily));

    dailyResetUseCase.executeDailyRollover();

    assertEquals(2, daily.getCurrentStreak());
    verify(transactionPort, never()).save(any());
    verify(port, never()).saveAll(any());
  }

  @Test
  @DisplayName("Deve penalizar Todo hardcore pendente vencido ontem, marcar penalidade e ser idempotente no segundo ciclo")
  void testOverdueHardcoreTodoIsPenalizedOnceAndIdempotentAcrossRestarts() {
    LocalDate yesterday = todaySp.minusDays(1);
    Todo todo = new Todo(
        UUID.randomUUID(),
        UUID.randomUUID(),
        userId,
        "Entrega de Projeto",
        "Finalizar código",
        1,
        TaskPriority.HIGH,
        List.of("trabalho"),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.TODO,
        true,
        yesterday,
        todaySp.minusDays(3).atTime(9, 0),
        List.of(),
        TodoReminderType.NONE,
        null,
        null,
        false
    );

    stubSingleDueUser(user);
    stubUserWasActiveYesterday(user, SAO_PAULO);
    when(port.findRecurringTasksByUserIds(anyCollection())).thenReturn(List.of());
    when(port.findOverdueHardcoreTodosByUserIds(anyCollection(), any(LocalDate.class)))
        .thenReturn(List.of(todo));

    dailyResetUseCase.executeDailyRollover();

    assertTrue(todo.isPenaltyApplied());
    assertEquals(new BigDecimal("98.75"), user.getCurrentCoins());
    verify(transactionPort, times(1)).save(any(TransactionHistory.class));
    verify(port, times(1)).saveAll(List.of(todo));

    // Segunda execução no mesmo dia (ex: restart do servidor): usuário não é mais devido e não sofre nova cobrança
    RolloverSummary secondRun = dailyResetUseCase.executeDailyRolloverSummary();
    assertEquals(0, secondRun.processedUsers());
    assertEquals(new BigDecimal("98.75"), user.getCurrentCoins());
    verify(transactionPort, times(1)).save(any(TransactionHistory.class));
  }

  @Test
  @DisplayName("Deve zerar a ofensiva global do usuário se não completou nenhuma tarefa desde ontem no fuso dele")
  void testResetInactiveUserStreaksZerosStreak() {
    user.setCurrentStreak(7);
    stubSingleDueUser(user);
    when(transactionPort.findLastCompletedTaskAtByUserIds(anyCollection(), any(LocalDateTime.class)))
        .thenReturn(Map.of());

    RolloverSummary summary = dailyResetUseCase.executeDailyRolloverSummary();

    assertEquals(1, summary.expiredStreaks());
    assertEquals(0, user.getCurrentStreak());
    verify(userPort, times(1)).saveAll(argThat(users -> List.copyOf(users).equals(List.of(user))));
  }

  @Test
  @DisplayName("Deve executar virada de ciclo apenas para usuários cujo fuso horário já passou da meia-noite")
  void testMultiTimezoneRolloverOnlyResetsDueUserTimezone() {
    // 2026-11-13T15:05:00Z -> Tóquio já é 2026-11-14 00:05; Nova York ainda é 2026-11-13 10:05
    Clock mixedClock = Clock.fixed(Instant.parse("2026-11-13T15:05:00Z"), ZoneId.of("UTC"));
    DailyResetUseCase multiUseCase = new DailyResetUseCase(
        port, transactionPort, userPort, mixedClock, TransactionOperations.withoutTransaction());

    User tokyoUser = new User(
        UUID.randomUUID(), UserRole.USER, false, "Kenji", "kenji", "kenji@habitparty.com", "pwd",
        new BigDecimal("50.00"), BigDecimal.ZERO, LocalDate.of(1998, 4, 1), null, UserGender.MALE,
        3, 1, 20, LocalDateTime.of(2026, 1, 1, 0, 0));
    tokyoUser.setTimezone("Asia/Tokyo");
    tokyoUser.setLastDailyResetDate(LocalDate.of(2026, 11, 13));
    tokyoUser.setNextDailyResetAt(LocalDate.of(2026, 11, 14).atStartOfDay(ZoneId.of("Asia/Tokyo")).toInstant());

    User nyUser = new User(
        UUID.randomUUID(), UserRole.USER, false, "Alex", "alex", "alex@habitparty.com", "pwd",
        new BigDecimal("50.00"), BigDecimal.ZERO, LocalDate.of(1998, 4, 1), null, UserGender.MALE,
        3, 1, 20, LocalDateTime.of(2026, 1, 1, 0, 0));
    nyUser.setTimezone("America/New_York");
    nyUser.setLastDailyResetDate(LocalDate.of(2026, 11, 13));
    nyUser.setNextDailyResetAt(LocalDate.of(2026, 11, 14).atStartOfDay(ZoneId.of("America/New_York")).toInstant());

    Habit tokyoHabit = new Habit(
        UUID.randomUUID(), UUID.randomUUID(), tokyoUser.getId(), "Correr", null,
        1, TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, TaskStatus.COMPLETED,
        TaskType.HABIT, false, null, LocalDateTime.of(2026, 11, 1, 8, 0), List.of(),
        3, HabitType.POSITIVE, HabitResetCounter.DAILY, HabitImportanceType.NORMAL,
        LocalDateTime.of(2026, 11, 13, 19, 0), 1, 0);

    Habit nyHabit = new Habit(
        UUID.randomUUID(), UUID.randomUUID(), nyUser.getId(), "Estudar", null,
        1, TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, TaskStatus.COMPLETED,
        TaskType.HABIT, false, null, LocalDateTime.of(2026, 11, 1, 8, 0), List.of(),
        3, HabitType.POSITIVE, HabitResetCounter.DAILY, HabitImportanceType.NORMAL,
        LocalDateTime.of(2026, 11, 13, 9, 0), 1, 0);

    when(userPort.findUserIdsDueForDailyReset(Instant.parse("2026-11-13T15:05:00Z")))
        .thenReturn(List.of(tokyoUser.getId(), nyUser.getId()));
    when(userPort.findAllByIds(anyCollection())).thenReturn(List.of(tokyoUser, nyUser));
    when(port.findRecurringTasksByUserIds(argThat(ids -> ids.contains(tokyoUser.getId()) && !ids.contains(nyUser.getId()))))
        .thenReturn(List.of(tokyoHabit));
    when(transactionPort.findLastCompletedTaskAtByUserIds(anyCollection(), any(LocalDateTime.class)))
        .thenReturn(Map.of(tokyoUser.getId(), LocalDateTime.of(2026, 11, 13, 21, 0)
            .atZone(ZoneId.of("Asia/Tokyo"))
            .withZoneSameInstant(ZoneId.systemDefault())
            .toLocalDateTime()));

    RolloverSummary summary = multiUseCase.executeDailyRolloverSummary();

    assertEquals(1, summary.processedUsers());
    assertEquals(TaskStatus.PENDING, tokyoHabit.getStatus());
    assertEquals(LocalDate.of(2026, 11, 14), tokyoUser.getLastDailyResetDate());
    assertEquals(TaskStatus.COMPLETED, nyHabit.getStatus());
    assertEquals(LocalDate.of(2026, 11, 13), nyUser.getLastDailyResetDate());
  }

  @Test
  @DisplayName("resetUserIfDue deve executar rollover preguiçoso na janela 00:00-00:15 antes do cron")
  void lazyRolloverExecutesOnceWhenUserCrossesLocalMidnightBeforeCron() {
    Clock postMidnightClock = Clock.fixed(Instant.parse("2026-11-13T15:05:00Z"), ZoneId.of("UTC"));
    DailyResetUseCase lazyUseCase = new DailyResetUseCase(
        port, transactionPort, userPort, postMidnightClock, TransactionOperations.withoutTransaction());

    User tokyoUser = new User(
        UUID.randomUUID(), UserRole.USER, false, "Kenji", "kenji", "kenji@habitparty.com", "pwd",
        new BigDecimal("50.00"), BigDecimal.ZERO, LocalDate.of(1998, 4, 1), null, UserGender.MALE,
        2, 1, 20, LocalDateTime.of(2026, 1, 1, 0, 0));
    tokyoUser.setTimezone("Asia/Tokyo");
    tokyoUser.setLastDailyResetDate(LocalDate.of(2026, 11, 13));
    tokyoUser.setNextDailyResetAt(LocalDate.of(2026, 11, 14).atStartOfDay(ZoneId.of("Asia/Tokyo")).toInstant());

    Habit yesterdayHabit = new Habit(
        UUID.randomUUID(), UUID.randomUUID(), tokyoUser.getId(), "Ler", null,
        1, TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, TaskStatus.COMPLETED,
        TaskType.HABIT, false, null, LocalDateTime.of(2026, 11, 1, 8, 0), List.of(),
        2, HabitType.POSITIVE, HabitResetCounter.DAILY, HabitImportanceType.NORMAL,
        LocalDateTime.of(2026, 11, 13, 21, 0), 3, 0);

    when(userPort.isUserDueForDailyReset(tokyoUser.getId(), Instant.parse("2026-11-13T15:05:00Z")))
        .thenReturn(true, false);
    when(userPort.findByIdForUpdate(tokyoUser.getId())).thenReturn(Optional.of(tokyoUser));
    when(port.findRecurringTasksByUserIds(argThat(ids -> ids.contains(tokyoUser.getId()))))
        .thenReturn(List.of(yesterdayHabit));
    when(transactionPort.findLastCompletedTaskAtByUserIds(anyCollection(), any(LocalDateTime.class)))
        .thenReturn(Map.of(tokyoUser.getId(), LocalDateTime.of(2026, 11, 13, 21, 0)
            .atZone(ZoneId.of("Asia/Tokyo"))
            .withZoneSameInstant(ZoneId.systemDefault())
            .toLocalDateTime()));

    boolean firstRun = lazyUseCase.resetUserIfDue(tokyoUser.getId());
    boolean secondRun = lazyUseCase.resetUserIfDue(tokyoUser.getId());

    assertTrue(firstRun);
    assertFalse(secondRun);
    assertEquals(TaskStatus.PENDING, yesterdayHabit.getStatus());
    assertEquals(0, yesterdayHabit.getPositiveCount());
    assertEquals(LocalDate.of(2026, 11, 14), tokyoUser.getLastDailyResetDate());
  }

  @Test
  @DisplayName("Deve preservar Hábito WEEKLY concluído na sexta durante o domingo e resetar na segunda-feira (semana ISO)")
  void weeklyHabitCompletedOnFridayStaysCompletedOnSundayAndResetsOnMonday() {
    // 2026-11-15 é Domingo; 2026-11-16 é Segunda-feira
    Clock sundayClock = Clock.fixed(Instant.parse("2026-11-15T03:05:00Z"), SAO_PAULO);
    DailyResetUseCase sundayUseCase = new DailyResetUseCase(
        port, transactionPort, userPort, sundayClock, TransactionOperations.withoutTransaction());

    user.setLastDailyResetDate(LocalDate.of(2026, 11, 14));
    user.setNextDailyResetAt(LocalDate.of(2026, 11, 15).atStartOfDay(SAO_PAULO).toInstant());

    Habit weeklyHabit = new Habit(
        UUID.randomUUID(), UUID.randomUUID(), userId, "Ir à academia 3x", null,
        1, TaskPriority.HIGH, List.of(), TaskDifficulty.MEDIUM, TaskStatus.COMPLETED,
        TaskType.HABIT, true, null, LocalDateTime.of(2026, 11, 1, 8, 0), List.of(),
        4, HabitType.POSITIVE, HabitResetCounter.WEEKLY, HabitImportanceType.HIGH,
        LocalDateTime.of(2026, 11, 13, 18, 0), 3, 0);

    stubSingleDueUser(user);
    when(transactionPort.findLastCompletedTaskAtByUserIds(anyCollection(), any(LocalDateTime.class)))
        .thenReturn(Map.of(userId, LocalDateTime.of(2026, 11, 14, 15, 0)));
    when(port.findRecurringTasksByUserIds(anyCollection())).thenReturn(List.of(weeklyHabit));

    // Rollover de Sábado -> Domingo: ainda na mesma semana ISO, mantém COMPLETED
    sundayUseCase.executeDailyRolloverSummary();
    assertEquals(TaskStatus.COMPLETED, weeklyHabit.getStatus());
    assertEquals(3, weeklyHabit.getPositiveCount());
    assertEquals(4, weeklyHabit.getCurrentStreak());

    // Rollover de Domingo -> Segunda-feira: nova semana ISO, reseta para PENDING sem quebrar streak
    Clock mondayClock = Clock.fixed(Instant.parse("2026-11-16T03:05:00Z"), SAO_PAULO);
    DailyResetUseCase mondayUseCase = new DailyResetUseCase(
        port, transactionPort, userPort, mondayClock, TransactionOperations.withoutTransaction());
    when(transactionPort.findLastCompletedTaskAtByUserIds(anyCollection(), any(LocalDateTime.class)))
        .thenReturn(Map.of(userId, LocalDateTime.of(2026, 11, 15, 15, 0)));

    mondayUseCase.executeDailyRolloverSummary();
    assertEquals(TaskStatus.PENDING, weeklyHabit.getStatus());
    assertEquals(0, weeklyHabit.getPositiveCount());
    assertEquals(4, weeklyHabit.getCurrentStreak());
  }
}
