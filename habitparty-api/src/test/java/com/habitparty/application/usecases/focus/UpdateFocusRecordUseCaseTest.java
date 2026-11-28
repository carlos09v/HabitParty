package com.habitparty.application.usecases.focus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.achievement.EvaluateUserAchievementsUseCase;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserLevel;
import com.habitparty.core.domain.enums.UserRole;
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

@ExtendWith(MockitoExtension.class)
class UpdateFocusRecordUseCaseTest {

  @Mock
  private FocusRecordRepository port;

  @Mock
  private InventoryItemRepository inventoryItemPort;

  @Mock
  private FocusActivityRepository focusActivityPort;

  @Mock
  private TransactionHistoryRepository transactionHistoryPort;

  @Mock
  private UserRepository userPort;

  @Mock
  private TaskRepository taskPort;

  @Mock
  private EvaluateUserAchievementsUseCase evaluateUserAchievementsUseCase;

  @InjectMocks
  private UpdateFocusRecordUseCase useCase;

  private static final ZoneId UTC_ZONE = ZoneId.of("UTC");
  private UUID userId;
  private UUID recordId;
  private UUID activityId;

  @BeforeEach
  void setUp() {
    useCase.setTaskPort(taskPort);
    useCase.setEvaluateUserAchievementsUseCase(evaluateUserAchievementsUseCase);
    useCase.setClock(Clock.fixed(Instant.parse("2026-10-16T15:00:00Z"), ZoneOffset.UTC));
    userId = UUID.randomUUID();
    recordId = UUID.randomUUID();
    activityId = UUID.randomUUID();
  }

  private User createUser(int totalXp, BigDecimal currentCoins, BigDecimal totalGoldEarned) {
    User user = new User(
        userId,
        UserRole.USER,
        false,
        "Hero Test",
        "herotest",
        "hero@habitparty.com",
        "pwd",
        currentCoins,
        totalGoldEarned,
        LocalDate.of(1995, 1, 1),
        null,
        UserGender.MALE,
        totalXp,
        0,
        0,
        LocalDateTime.now());
    user.setTimezone("UTC");
    return user;
  }

  private FocusActivity createActivity(UUID id, String name, FocusRecordType type, Integer targetMins) {
    return new FocusActivity(
        id,
        userId,
        name,
        "book",
        0,
        type,
        targetMins,
        LocalDateTime.now());
  }

  private Todo createTodo(UUID id, String name) {
    return new Todo(
        id,
        UUID.randomUUID(),
        userId,
        name,
        null,
        0,
        TaskPriority.MEDIUM,
        List.of(),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.TODO,
        false,
        LocalDate.of(2026, 10, 20),
        LocalDateTime.now(),
        List.of(),
        TodoReminderType.NONE,
        null,
        null);
  }

  @Test
  @DisplayName("Atualização apenas de notas deve preservar duração, recompensas e sincronizar descrição no histórico")
  void shouldSupportNotesOnlyUpdateWithoutRecalculatingRewards() {
    FocusRecord existing = new FocusRecord(
        recordId,
        userId,
        activityId,
        null,
        null,
        null,
        "Nota antiga",
        LocalDateTime.of(2026, 10, 16, 10, 0),
        LocalDateTime.of(2026, 10, 16, 10, 30),
        FocusRecordType.POMO,
        1,
        8,
        new BigDecimal("0.50"));

    when(port.findById(recordId)).thenReturn(Optional.of(existing));
    when(port.save(any(FocusRecord.class))).thenAnswer(inv -> inv.getArgument(0));

    FocusRecord result = useCase.execute(userId, recordId, "  Nota atualizada  ");

    assertEquals("  Nota atualizada  ", result.getNotes().orElse(null));
    assertEquals(8, result.getXpEarned().orElse(0));
    verify(userPort, never()).findById(any());
    verify(transactionHistoryPort).updateFocusDescriptionSnapshot(recordId, userId, "Nota atualizada");
  }

  @Test
  @DisplayName("Aumentar duração de sessão existente deve creditar apenas o delta líquido de XP/moedas respeitando cota diária excluindo o próprio registro")
  void shouldCreditNetDeltaAndRespectDailyCapExcludingSelfOnIncrease() {
    // Usuário no nível APPRENTICE (minXp = 100) com 105 XP e 0.20 moedas
    // Sessão original: 30m POMO (1 pomo) -> 8 XP, 0.50 coins
    User user = createUser(105, new BigDecimal("0.20"), new BigDecimal("2.00"));
    user.getStats().recordFocusCompleted(30, 1);

    LocalDate targetDate = LocalDate.of(2026, 10, 16);
    FocusRecord existing = new FocusRecord(
        recordId,
        userId,
        activityId,
        null,
        null,
        null,
        "Estudo",
        targetDate.atTime(9, 0),
        targetDate.atTime(9, 30),
        FocusRecordType.POMO,
        1,
        30,
        8,
        new BigDecimal("0.50"));

    FocusActivity activity = createActivity(activityId, "Estudos", FocusRecordType.POMO, 30);

    // Outras sessões no mesmo dia somam 210 min (então editar para 60m => 210..270: 30m a 100% + 30m a 50% -> mult 0.75)
    // 60m, 2 pomos (30m/pomo): base = 16 XP, 1.00 coins. Com mult 0.75 -> 12 XP, 0.75 coins.
    // Delta líquido: +4 XP (105 -> 109), +0.25 coins (0.20 -> 0.45)
    when(port.findById(recordId)).thenReturn(Optional.of(existing));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(focusActivityPort.findById(activityId)).thenReturn(Optional.of(activity));
    when(port.sumFocusMinutesOnDateExcludingRecord(userId, targetDate, UTC_ZONE, recordId))
        .thenReturn(210);
    when(port.sumProductiveFocusMinutesOnDateExcludingRecord(userId, targetDate, UTC_ZONE, recordId))
        .thenReturn(210);
    when(port.save(any(FocusRecord.class))).thenAnswer(inv -> inv.getArgument(0));

    UpdateFocusRecordCommand command = new UpdateFocusRecordCommand(
        activityId,
        null,
        null,
        "Estudo ampliado",
        targetDate.atTime(9, 0),
        targetDate.atTime(10, 0),
        FocusRecordType.POMO,
        2,
        30);

    FocusRecord updated = useCase.execute(userId, recordId, command);

    assertEquals(12, updated.getXpEarned().orElse(0));
    assertEquals(0, new BigDecimal("0.75").compareTo(updated.getCoinsEarned().orElse(BigDecimal.ZERO)));
    assertEquals(60, updated.getDurationMinutes());

    // Delta aplicado (sem exploit de piso de nível ou saldo zerado)
    assertEquals(109, user.getTotalXp());
    assertEquals(0, new BigDecimal("0.45").compareTo(user.getCurrentCoins()));
    assertEquals(0, new BigDecimal("2.25").compareTo(user.getTotalGoldEarned()));
    assertEquals(60, user.getStats().getTotalFocusMinutes());
    assertEquals(1, user.getStats().getTotalFocusSessions());
    assertEquals(2, user.getStats().getTotalPomodorosCompleted());
    assertEquals(60, user.getStats().getLongestFocusSessionMinutes());

    verify(transactionHistoryPort).updateFocusCompletedSnapshot(
        eq(recordId),
        eq(userId),
        eq("Estudos"),
        eq("book"),
        eq(new BigDecimal("0.75")),
        eq(12),
        eq(List.of("60 min")),
        eq("Estudo ampliado"),
        eq(targetDate.atTime(10, 0)));
  }

  @Test
  @DisplayName("Reduzir duração ou perder recompensa deve estornar delta negativo respeitando piso do nível e saldo não negativo")
  void shouldRevertNegativeDeltaWithinLevelFloorAndZeroCoinBalance() {
    // Usuário no nível APPRENTICE (minXp = 100) com 103 XP e 0.30 coins
    // Sessão original: 60m, 2 pomos -> 16 XP, 1.00 coins
    User user = createUser(103, new BigDecimal("0.30"), new BigDecimal("2.00"));
    user.getStats().recordFocusCompleted(60, 2);

    LocalDate retroDate = LocalDate.of(2026, 10, 10);
    FocusRecord existing = new FocusRecord(
        recordId,
        userId,
        activityId,
        null,
        null,
        null,
        null,
        retroDate.atTime(10, 0),
        retroDate.atTime(11, 0),
        FocusRecordType.POMO,
        2,
        30,
        16,
        new BigDecimal("1.00"));

    FocusActivity activity = createActivity(activityId, "Estudos", FocusRecordType.POMO, 30);

    when(port.findById(recordId)).thenReturn(Optional.of(existing));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(focusActivityPort.findById(activityId)).thenReturn(Optional.of(activity));
    when(port.sumFocusMinutesOnDateExcludingRecord(userId, retroDate, UTC_ZONE, recordId))
        .thenReturn(0);
    when(port.findMaxProductiveDurationMinutesExcludingRecord(userId, recordId))
        .thenReturn(45);
    when(port.save(any(FocusRecord.class))).thenAnswer(inv -> inv.getArgument(0));

    // Edita para apenas 8m (< 10m -> 0 XP, 0 coins)
    UpdateFocusRecordCommand command = new UpdateFocusRecordCommand(
        activityId,
        null,
        null,
        null,
        retroDate.atTime(10, 0),
        retroDate.atTime(10, 8),
        FocusRecordType.STOPWATCH,
        null,
        null);

    FocusRecord updated = useCase.execute(userId, recordId, command);

    assertEquals(0, updated.getXpEarned().orElse(0));
    assertEquals(0, BigDecimal.ZERO.compareTo(updated.getCoinsEarned().orElse(BigDecimal.ZERO)));
    assertEquals(UserLevel.APPRENTICE, user.getCurrentLevel());
    assertEquals(100, user.getTotalXp());
    assertEquals(0, BigDecimal.ZERO.compareTo(user.getCurrentCoins()));
    assertEquals(0, new BigDecimal("1.00").compareTo(user.getTotalGoldEarned()));
    // Como caiu abaixo de 10m, a sessão deixa de contar como foco produtivo nas estatísticas e recorde volta para 45m
    assertEquals(0, user.getStats().getTotalFocusMinutes());
    assertEquals(0, user.getStats().getTotalFocusSessions());
    assertEquals(0, user.getStats().getTotalPomodorosCompleted());
    assertEquals(45, user.getStats().getLongestFocusSessionMinutes());
  }

  @Test
  @DisplayName("Deve transferir métricas entre tarefas vinculadas e validar tarefa não-hábito")
  void shouldTransferMetricsBetweenLinkedTasksAndRejectHabit() {
    UUID oldTaskId = UUID.randomUUID();
    UUID newTaskId = UUID.randomUUID();
    Todo oldTask = createTodo(oldTaskId, "Tarefa Antiga");
    oldTask.addFocusSession(30, 1);
    Todo newTask = createTodo(newTaskId, "Tarefa Nova");
    User user = createUser(200, BigDecimal.ONE, BigDecimal.ONE);
    FocusActivity activity = createActivity(activityId, "Código", FocusRecordType.POMO, 25);

    LocalDate targetDate = LocalDate.of(2026, 10, 16);
    FocusRecord existing = new FocusRecord(
        recordId,
        userId,
        activityId,
        null,
        oldTaskId,
        "Tarefa Antiga",
        null,
        targetDate.atTime(10, 0),
        targetDate.atTime(10, 30),
        FocusRecordType.POMO,
        1,
        25,
        8,
        new BigDecimal("0.50"));

    when(port.findById(recordId)).thenReturn(Optional.of(existing));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(focusActivityPort.findById(activityId)).thenReturn(Optional.of(activity));
    when(taskPort.findById(oldTaskId)).thenReturn(Optional.of(oldTask));
    when(taskPort.findById(newTaskId)).thenReturn(Optional.of(newTask));
    when(port.save(any(FocusRecord.class))).thenAnswer(inv -> inv.getArgument(0));

    UpdateFocusRecordCommand command = new UpdateFocusRecordCommand(
        activityId,
        null,
        newTaskId,
        "Migrado",
        targetDate.atTime(10, 0),
        targetDate.atTime(10, 45),
        FocusRecordType.POMO,
        1,
        25);

    FocusRecord updated = useCase.execute(userId, recordId, command);

    assertEquals(Optional.of(newTaskId), updated.getTaskId());
    assertEquals(Optional.of("Tarefa Nova"), updated.getTaskNameSnapshot());
    assertEquals(0, oldTask.getTotalFocusMinutes());
    assertEquals(0, oldTask.getFocusCyclesCount());
    assertEquals(45, newTask.getTotalFocusMinutes());
    assertEquals(1, newTask.getFocusCyclesCount());
    verify(taskPort).save(oldTask);
    verify(taskPort).save(newTask);

    // Rejeita vínculo com Hábito
    UUID habitId = UUID.randomUUID();
    Habit habit = new Habit(
        habitId, UUID.randomUUID(), userId, "Água", null, 0,
        TaskPriority.NONE, List.of(), TaskDifficulty.EASY, TaskStatus.PENDING,
        TaskType.HABIT, false, null, LocalDateTime.now(), List.of(), 0,
        HabitType.POSITIVE, HabitResetCounter.DAILY, HabitImportanceType.NORMAL, null);
    when(taskPort.findById(habitId)).thenReturn(Optional.of(habit));

    assertThrows(DomainValidationException.class, () -> useCase.execute(userId, recordId,
        new UpdateFocusRecordCommand(
            activityId, null, habitId, null,
            targetDate.atTime(10, 0), targetDate.atTime(10, 30),
            FocusRecordType.POMO, 1, 25)));
  }

  @Test
  @DisplayName("Deve ajustar ofensiva global de hoje ao cruzar 30m para cima ou para baixo")
  void shouldAdjustTodayStreakWhenCrossing30MinutesThreshold() {
    LocalDate today = LocalDate.of(2026, 10, 16);
    User user = createUser(200, BigDecimal.ONE, BigDecimal.ONE);
    FocusActivity activity = createActivity(activityId, "Estudos", FocusRecordType.POMO, 25);

    FocusRecord existing = new FocusRecord(
        recordId,
        userId,
        activityId,
        null,
        null,
        null,
        null,
        today.atTime(10, 0),
        today.atTime(10, 20),
        FocusRecordType.STOPWATCH,
        null,
        null,
        5,
        new BigDecimal("0.30"));

    when(port.findById(recordId)).thenReturn(Optional.of(existing));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(focusActivityPort.findById(activityId)).thenReturn(Optional.of(activity));
    when(port.sumFocusMinutesOnDateExcludingRecord(userId, today, UTC_ZONE, recordId))
        .thenReturn(0);
    when(port.sumProductiveFocusMinutesOnDateExcludingRecord(userId, today, UTC_ZONE, recordId))
        .thenReturn(0);
    when(transactionHistoryPort.countCompletedTasksToday(userId, UTC_ZONE)).thenReturn(0);
    when(port.save(any(FocusRecord.class))).thenAnswer(inv -> inv.getArgument(0));

    // Aumenta de 20m para 35m -> deve ganhar +1 streak hoje
    FocusRecord grown = useCase.execute(userId, recordId, new UpdateFocusRecordCommand(
        activityId, null, null, null,
        today.atTime(10, 0), today.atTime(10, 35),
        FocusRecordType.STOPWATCH, null, null));

    assertEquals(1, user.getCurrentStreak());
    assertEquals(today, user.getLastStreakDate());

    // Agora edita de volta para 15m -> deve estornar o streak ganho hoje
    when(port.findById(recordId)).thenReturn(Optional.of(grown));
    useCase.execute(userId, recordId, new UpdateFocusRecordCommand(
        activityId, null, null, null,
        today.atTime(10, 0), today.atTime(10, 15),
        FocusRecordType.STOPWATCH, null, null));

    assertEquals(0, user.getCurrentStreak());
    assertNull(user.getLastStreakDate());
  }

  @Test
  @DisplayName("Deve ajustar saldo de segundos em item de inventário (inclusive cupom consumido) e travar troca de aba")
  void shouldAdjustInventoryItemSecondsAndBlockTabConversion() {
    UUID itemId = UUID.randomUUID();
    InventoryItem coupon = new InventoryItem(
        itemId,
        userId,
        UUID.randomUUID(),
        "Cupom Série",
        new BigDecimal("5.00"),
        RewardType.TIME_BASED,
        InventoryItemStatus.CONSUMED,
        0,
        "tv",
        null,
        0,
        LocalDateTime.of(2026, 10, 15, 10, 0));

    FocusRecord existingItemRecord = new FocusRecord(
        recordId,
        userId,
        null,
        itemId,
        "Episódio",
        LocalDateTime.of(2026, 10, 16, 10, 0),
        LocalDateTime.of(2026, 10, 16, 10, 30),
        FocusRecordType.STOPWATCH,
        null);

    when(port.findById(recordId)).thenReturn(Optional.of(existingItemRecord));
    when(inventoryItemPort.findById(itemId)).thenReturn(Optional.of(coupon));
    when(port.save(any(FocusRecord.class))).thenAnswer(inv -> inv.getArgument(0));

    // Tentar converter registro de item em sessão produtiva deve falhar
    assertThrows(DomainValidationException.class, () -> useCase.execute(userId, recordId,
        new UpdateFocusRecordCommand(
            activityId, null, null, null,
            LocalDateTime.of(2026, 10, 16, 10, 0),
            LocalDateTime.of(2026, 10, 16, 10, 20),
            FocusRecordType.STOPWATCH, null, null)));

    // Reduz duração de 30m (1800s) para 20m (1200s): devolve 600s e reativa cupom como AVAILABLE
    FocusRecord updated = useCase.execute(userId, recordId, new UpdateFocusRecordCommand(
        null, itemId, null, "Meio episódio",
        LocalDateTime.of(2026, 10, 16, 10, 0),
        LocalDateTime.of(2026, 10, 16, 10, 20),
        FocusRecordType.STOPWATCH, null, null));

    assertNotNull(updated);
    assertEquals(20, updated.getDurationMinutes());
    assertEquals(Optional.of(600), coupon.getRemainingSeconds());
    assertEquals(InventoryItemStatus.AVAILABLE, coupon.getStatus());
    verify(inventoryItemPort).save(coupon);
    verify(transactionHistoryPort).deleteAllByReferenceIdAndUserIdAndType(
        itemId, userId, TransactionType.ITEM_CONSUMED);
    verify(transactionHistoryPort, never()).updateFocusCompletedSnapshot(
        any(), any(), any(), any(), any(), any(Integer.class), any(), any(), any());

    // Tentar aumentar acima do saldo restaurado (35m > 30m disponíveis) deve falhar
    when(port.findById(recordId)).thenReturn(Optional.of(updated));
    assertThrows(DomainValidationException.class, () -> useCase.execute(userId, recordId,
        new UpdateFocusRecordCommand(
            null, itemId, null, null,
            LocalDateTime.of(2026, 10, 16, 10, 0),
            LocalDateTime.of(2026, 10, 16, 10, 35),
            FocusRecordType.STOPWATCH, null, null)));
  }

  @Test
  @DisplayName("Deve bloquear troca para atividade pausada no plano Free")
  void shouldBlockSwitchingToPausedActivityOnFreePlan() {
    UUID pausedActivityId = UUID.randomUUID();
    User freeUser = createUser(100, BigDecimal.ZERO, BigDecimal.ZERO);
    FocusActivity currentAct = createActivity(activityId, "A1", FocusRecordType.POMO, 25);
    FocusActivity pausedAct = new FocusActivity(
        pausedActivityId, userId, "A5", "book", 4, FocusRecordType.POMO, 25, LocalDateTime.now());

    FocusRecord existing = new FocusRecord(
        recordId,
        userId,
        activityId,
        null,
        null,
        null,
        null,
        LocalDateTime.of(2026, 10, 16, 10, 0),
        LocalDateTime.of(2026, 10, 16, 10, 25),
        FocusRecordType.POMO,
        1,
        25,
        8,
        new BigDecimal("0.50"));

    when(port.findById(recordId)).thenReturn(Optional.of(existing));
    when(userPort.findById(userId)).thenReturn(Optional.of(freeUser));
    when(focusActivityPort.findById(pausedActivityId)).thenReturn(Optional.of(pausedAct));
    when(focusActivityPort.findAllByUserIdOrderByOrderIndex(userId)).thenReturn(List.of(
        currentAct,
        createActivity(UUID.randomUUID(), "A2", FocusRecordType.POMO, 25),
        createActivity(UUID.randomUUID(), "A3", FocusRecordType.POMO, 25),
        createActivity(UUID.randomUUID(), "A4", FocusRecordType.POMO, 25),
        pausedAct));

    assertThrows(LimitExceededException.class, () -> useCase.execute(userId, recordId,
        new UpdateFocusRecordCommand(
            pausedActivityId, null, null, null,
            LocalDateTime.of(2026, 10, 16, 10, 0),
            LocalDateTime.of(2026, 10, 16, 10, 25),
            FocusRecordType.POMO, 1, 25)));
  }

  @Test
  @DisplayName("Deve estornar streak ganho hoje quando sessão produtiva >= 30m for movida para ontem")
  void shouldRevertTodayStreakWhenSessionMovesFromTodayToYesterday() {
    LocalDate today = LocalDate.of(2026, 10, 16);
    LocalDate yesterday = today.minusDays(1);
    User user = createUser(200, BigDecimal.ONE, BigDecimal.ONE);
    FocusActivity activity = createActivity(activityId, "Estudos", FocusRecordType.POMO, 25);

    FocusRecord existing = new FocusRecord(
        recordId,
        userId,
        activityId,
        null,
        null,
        null,
        null,
        today.atTime(12, 0),
        today.atTime(12, 20),
        FocusRecordType.STOPWATCH,
        null,
        null,
        5,
        new BigDecimal("0.30"));

    when(port.findById(recordId)).thenReturn(Optional.of(existing));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(focusActivityPort.findById(activityId)).thenReturn(Optional.of(activity));
    when(port.sumFocusMinutesOnDateExcludingRecord(userId, today, UTC_ZONE, recordId)).thenReturn(0);
    when(port.sumProductiveFocusMinutesOnDateExcludingRecord(userId, today, UTC_ZONE, recordId))
        .thenReturn(0);
    when(port.sumFocusMinutesOnDateExcludingRecord(userId, yesterday, UTC_ZONE, recordId))
        .thenReturn(0);
    when(transactionHistoryPort.countCompletedTasksToday(userId, UTC_ZONE)).thenReturn(0);
    when(port.save(any(FocusRecord.class))).thenAnswer(inv -> inv.getArgument(0));

    // Primeiro cresce para 35m hoje -> ganha streak hoje
    FocusRecord grown = useCase.execute(userId, recordId, new UpdateFocusRecordCommand(
        activityId, null, null, null,
        today.atTime(12, 0), today.atTime(12, 35),
        FocusRecordType.STOPWATCH, null, null));

    assertEquals(1, user.getCurrentStreak());
    assertEquals(today, user.getLastStreakDate());

    // Agora move a sessão de 35m para ontem -> foco produtivo de hoje cai para 0 e estorna o streak
    when(port.findById(recordId)).thenReturn(Optional.of(grown));
    useCase.execute(userId, recordId, new UpdateFocusRecordCommand(
        activityId, null, null, null,
        yesterday.atTime(12, 0), yesterday.atTime(12, 35),
        FocusRecordType.STOPWATCH, null, null));

    assertEquals(0, user.getCurrentStreak());
    assertNull(user.getLastStreakDate());
  }

  @Test
  @DisplayName("Deve estornar item antigo, deduzir novo item IN_FOCUS e avaliar conquista ao esgotar cupom")
  void shouldSwitchInventoryItemsRefundOldDeductNewAndEvaluateCouponDepletion() {
    UUID oldItemId = UUID.randomUUID();
    UUID newItemId = UUID.randomUUID();
    User user = createUser(200, BigDecimal.ONE, BigDecimal.ONE);

    InventoryItem oldItem = new InventoryItem(
        oldItemId,
        userId,
        UUID.randomUUID(),
        "Cupom Antigo",
        new BigDecimal("5.00"),
        RewardType.TIME_BASED,
        InventoryItemStatus.IN_FOCUS,
        0,
        "tv",
        null,
        600,
        LocalDateTime.of(2026, 10, 15, 10, 0));

    InventoryItem newItem = new InventoryItem(
        newItemId,
        userId,
        UUID.randomUUID(),
        "Cupom Novo",
        new BigDecimal("5.00"),
        RewardType.TIME_BASED,
        InventoryItemStatus.IN_FOCUS,
        1,
        "gamepad",
        null,
        1800,
        LocalDateTime.of(2026, 10, 15, 10, 0));

    FocusRecord existingItemRecord = new FocusRecord(
        recordId,
        userId,
        null,
        oldItemId,
        "Episódio antigo",
        LocalDateTime.of(2026, 10, 16, 12, 0),
        LocalDateTime.of(2026, 10, 16, 12, 20),
        FocusRecordType.STOPWATCH,
        null);

    when(port.findById(recordId)).thenReturn(Optional.of(existingItemRecord));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(inventoryItemPort.findById(oldItemId)).thenReturn(Optional.of(oldItem));
    when(inventoryItemPort.findById(newItemId)).thenReturn(Optional.of(newItem));
    when(port.save(any(FocusRecord.class))).thenAnswer(inv -> inv.getArgument(0));

    FocusRecord updated = useCase.execute(userId, recordId, new UpdateFocusRecordCommand(
        null, newItemId, null, "Novo episódio",
        LocalDateTime.of(2026, 10, 16, 12, 0),
        LocalDateTime.of(2026, 10, 16, 12, 30),
        FocusRecordType.STOPWATCH, null, null));

    assertNotNull(updated);
    assertEquals(Optional.of(newItemId), updated.getInventoryItemId());
    assertEquals(30, updated.getDurationMinutes());
    // Item antigo recebe estorno de 20m (600s + 1200s = 1800s)
    assertEquals(Optional.of(1800), oldItem.getRemainingSeconds());
    // Item novo consome todos os 30m (1800s -> 0s) e dispara conquista de cupom esgotado
    assertEquals(Optional.of(0), newItem.getRemainingSeconds());
    assertEquals(InventoryItemStatus.IN_FOCUS, newItem.getStatus());
    assertEquals(1, user.getStats().getTotalCouponsDepleted());
    verify(inventoryItemPort).save(oldItem);
    verify(inventoryItemPort).save(newItem);
    verify(evaluateUserAchievementsUseCase).execute(user);
  }
}
