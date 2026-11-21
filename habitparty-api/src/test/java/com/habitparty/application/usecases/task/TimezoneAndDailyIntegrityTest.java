package com.habitparty.application.usecases.task;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionOperations;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.focus.CreateFocusRecordCommand;
import com.habitparty.application.usecases.focus.CreateFocusRecordUseCase;
import com.habitparty.application.usecases.user.EffectiveStreakResolver;
import com.habitparty.application.usecases.user.UpdateUserProfileCommand;
import com.habitparty.application.usecases.user.UpdateUserProfileUseCase;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.UserExperienceMode;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.DailyDaysOfWeek;
import com.habitparty.core.domain.enums.task.DailyRepeatMonthlyOption;
import com.habitparty.core.domain.enums.task.DailyRepeatType;
import com.habitparty.core.domain.enums.task.HabitImportanceType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;

class TimezoneAndDailyIntegrityTest {

  private User createUser(UUID userId, String timezone) {
    User user = new User(
        userId, UserRole.USER, false, "Carlos", "carlos", "carlos@habitparty.com",
        "hash", BigDecimal.TEN, BigDecimal.TEN, LocalDate.of(1995, 5, 20),
        null, UserGender.MALE, 100, 4, 8, LocalDateTime.now());
    user.setExperienceMode(UserExperienceMode.GAMIFIED);
    user.setTimezone(timezone);
    return user;
  }

  @Test
  @DisplayName("[S-02] Editar título/regra inalterada de Daily não reseta dueDate futuro para hoje")
  void editingDailyWithoutScheduleChangesPreservesFutureDueDate() {
    LocalDate today = LocalDate.of(2026, 11, 21);
    LocalDate futureDue = LocalDate.of(2026, 12, 1);

    Daily monthlyDaily = new Daily(
        UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
        "Pagar aluguel", null, 0, TaskPriority.HIGH, List.of(), TaskDifficulty.MEDIUM,
        TaskStatus.PENDING, TaskType.DAILY, false, futureDue, LocalDateTime.now(),
        List.of(), 3, LocalDate.of(2026, 10, 1), DailyRepeatType.MONTHLY, 1,
        null, DailyRepeatMonthlyOption.DAY_OF_THE_MONTH, LocalDateTime.of(2026, 11, 1, 10, 0));

    monthlyDaily.updateDailyDetails(
        LocalDate.of(2026, 10, 1),
        DailyRepeatType.MONTHLY,
        1,
        null,
        DailyRepeatMonthlyOption.DAY_OF_THE_MONTH,
        today);

    assertEquals(futureDue, monthlyDaily.getDueDate().orElse(null));
  }

  @Test
  @DisplayName("[S-03 + S-04] Rollover não pula ocorrência antecipada e não penaliza Daily desmarcada após concluída no ciclo")
  void rolloverPreservesEarlyDueDateAndUncheckedCompletedCycle() {
    UUID userId = UUID.randomUUID();
    ZoneId sp = ZoneId.of("America/Sao_Paulo");
    // 2026-11-18 é quarta-feira (03:05 UTC = 00:05 BRT)
    Clock rolloverClock = Clock.fixed(Instant.parse("2026-11-18T03:05:00Z"), ZoneId.of("UTC"));
    LocalDate wednesday = LocalDate.of(2026, 11, 18);
    LocalDate tuesday = LocalDate.of(2026, 11, 17);

    User user = createUser(userId, "America/Sao_Paulo");
    user.setLastDailyResetDate(tuesday);
    user.setNextDailyResetAt(Instant.parse("2026-11-18T03:00:00Z"));
    user.setLastStreakDate(tuesday);

    // [S-03] Daily Seg/Qua/Sex com dueDate Quarta, concluída antecipadamente na Terça
    Daily earlyDaily = new Daily(
        UUID.randomUUID(), UUID.randomUUID(), userId, "Treino", null, 0,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.MEDIUM, TaskStatus.COMPLETED,
        TaskType.DAILY, false, wednesday, LocalDateTime.now(), List.of(),
        5, LocalDate.of(2026, 11, 1), DailyRepeatType.WEEKLY, 1,
        List.of(DailyDaysOfWeek.MONDAY, DailyDaysOfWeek.WEDNESDAY, DailyDaysOfWeek.FRIDAY),
        null, tuesday.atTime(18, 0));

    // [S-04] Daily Hardcore devida Terça, concluída na Terça e desmarcada antes da 00h
    Daily uncheckedDaily = new Daily(
        UUID.randomUUID(), UUID.randomUUID(), userId, "Leitura", null, 1,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.MEDIUM, TaskStatus.PENDING,
        TaskType.DAILY, true, tuesday, LocalDateTime.now(), List.of(),
        6, LocalDate.of(2026, 11, 1), DailyRepeatType.DAILY, 1,
        null, null, tuesday.atTime(15, 0));

    // [S-05] Hábito negativo criado no próprio dia que está fechando (17/11 23:58) NÃO pontua ciclo limpo
    Habit newlyCreatedNegative = new Habit(
        UUID.randomUUID(), UUID.randomUUID(), userId, "Evitar doce", null, 2,
        TaskPriority.Low, List.of(), TaskDifficulty.EASY, TaskStatus.PENDING,
        TaskType.HABIT, false, null, tuesday.atTime(23, 58), List.of(),
        0, HabitType.NEGATIVE, HabitResetCounter.DAILY, HabitImportanceType.NORMAL, null);

    TaskRepository taskPort = mock(TaskRepository.class);
    TransactionHistoryRepository txPort = mock(TransactionHistoryRepository.class);
    UserRepository userPort = mock(UserRepository.class);

    when(userPort.findUserIdsDueForDailyReset(any())).thenReturn(List.of(userId));
    when(userPort.findAllByIdsForUpdate(anyCollection())).thenReturn(List.of(user));
    when(taskPort.findRecurringTasksByUserIds(anyCollection()))
        .thenReturn(List.of(earlyDaily, uncheckedDaily, newlyCreatedNegative));
    when(taskPort.findOverdueHardcoreTodosByUserIds(anyCollection(), any())).thenReturn(List.of());

    DailyResetUseCase useCase = new DailyResetUseCase(
        taskPort, txPort, userPort, rolloverClock, TransactionOperations.withoutTransaction());
    useCase.executeDailyRollover();

    // [S-03] Permanece devida na quarta-feira (não pulou para sexta)
    assertEquals(TaskStatus.PENDING, earlyDaily.getStatus());
    assertEquals(wednesday, earlyDaily.getDueDate().orElse(null));

    // [S-04] Não quebrou streak nem multou coins/XP
    assertEquals(6, uncheckedDaily.getCurrentStreak());
    assertEquals(new BigDecimal("10"), user.getCurrentCoins());
    assertEquals(100, user.getTotalXp());

    // [S-05] Sem ciclo limpo instantâneo por hábito recém-criado às 23:58
    assertEquals(0, user.getStats().getTotalCleanHabitCycles());
  }

  @Test
  @DisplayName("[T-01] Trocar fuso para leste aciona resetUserIfDue após mudança de fuso")
  void changingTimezoneEastwardTriggersDailyResetForSkippedDay() {
    UUID userId = UUID.randomUUID();
    Clock clock = Clock.fixed(Instant.parse("2026-11-14T02:00:00Z"), ZoneId.of("UTC"));
    User user = createUser(userId, "America/Sao_Paulo");
    user.initializeTimezone("America/Sao_Paulo", clock);

    UserRepository userPort = mock(UserRepository.class);
    DailyResetUseCase dailyResetUseCase = mock(DailyResetUseCase.class);
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(userPort.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    UpdateUserProfileUseCase useCase = new UpdateUserProfileUseCase(
        userPort, new EffectiveStreakResolver(null, clock), clock);
    useCase.setDailyResetUseCase(dailyResetUseCase);

    useCase.execute(userId, new UpdateUserProfileCommand(
        null, null, null, null, "Asia/Tokyo"));

    assertEquals(LocalDate.of(2026, 11, 13), user.getLastDailyResetDate());
    assertFalse(user.getNextDailyResetAt().isAfter(clock.instant()));
    // Chamado antes (em SP ainda 13/11) e depois (em Tokyo já 14/11)
    verify(dailyResetUseCase, org.mockito.Mockito.times(2)).resetUserIfDue(userId);
  }

  @Test
  @DisplayName("[T-04 + T-05 + Decisão 1] Sessão de foco que cruza meia-noite conta para o dia do endTime e dispara reset preguiçoso")
  void overMidnightFocusCountsTowardEndTimeDateAndTriggersLazyReset() {
    UUID userId = UUID.randomUUID();
    UUID activityId = UUID.randomUUID();
    ZoneId sp = ZoneId.of("America/Sao_Paulo");
    // 2026-11-21 00:15 BRT == 03:15 UTC
    Clock clock = Clock.fixed(Instant.parse("2026-11-21T03:20:00Z"), ZoneId.of("UTC"));
    LocalDate todaySp = LocalDate.of(2026, 11, 21);

    User user = createUser(userId, "America/Sao_Paulo");
    user.setLastStreakDate(LocalDate.of(2026, 11, 20));
    FocusActivity activity = new FocusActivity(
        activityId, userId, "Estudo", "book", 0, FocusRecordType.STOPWATCH, null, LocalDateTime.now());

    FocusRecordRepository focusPort = mock(FocusRecordRepository.class);
    InventoryItemRepository invPort = mock(InventoryItemRepository.class);
    FocusActivityRepository activityPort = mock(FocusActivityRepository.class);
    TransactionHistoryRepository txPort = mock(TransactionHistoryRepository.class);
    UserRepository userPort = mock(UserRepository.class);
    DailyResetUseCase dailyResetUseCase = mock(DailyResetUseCase.class);

    when(activityPort.findById(activityId)).thenReturn(Optional.of(activity));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(focusPort.sumFocusMinutesOnDate(eq(userId), eq(todaySp), eq(sp))).thenReturn(0);
    when(txPort.countCompletedTasksToday(userId, sp)).thenReturn(0);
    when(focusPort.save(any(FocusRecord.class))).thenAnswer(inv -> inv.getArgument(0));
    when(userPort.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

    CreateFocusRecordUseCase useCase = new CreateFocusRecordUseCase(
        focusPort, invPort, activityPort, txPort, userPort);
    useCase.setClock(clock);
    useCase.setDailyResetUseCase(dailyResetUseCase);

    LocalDateTime start = LocalDateTime.of(2026, 11, 20, 23, 40);
    LocalDateTime end = LocalDateTime.of(2026, 11, 21, 0, 15);
    FocusRecord saved = useCase.execute(userId, new CreateFocusRecordCommand(
        activityId, null, null, "Virada focada", start, end, FocusRecordType.STOPWATCH, 0));

    assertEquals(35, saved.getDurationMinutes());
    assertEquals(5, user.getCurrentStreak());
    assertEquals(todaySp, user.getLastStreakDate());
    assertTrue(user.getStats().getTotalFocusMinutes() >= 35);
    verify(dailyResetUseCase).resetUserIfDue(userId);
    verify(focusPort).sumFocusMinutesOnDate(userId, todaySp, sp);
  }
}
