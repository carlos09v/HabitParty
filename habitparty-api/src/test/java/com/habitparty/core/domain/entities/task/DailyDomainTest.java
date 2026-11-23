package com.habitparty.core.domain.entities.task;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.enums.task.DailyDaysOfWeek;
import com.habitparty.core.domain.enums.task.DailyRepeatType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.exceptions.UnauthorizedException;

class DailyDomainTest {

  private UUID userId;
  private UUID columnId;
  private Daily daily;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    columnId = UUID.randomUUID();
    daily = new Daily(
        UUID.randomUUID(),
        columnId,
        userId,
        "Beber 2L de água",
        "Manter-se hidratado",
        1,
        TaskPriority.HIGH,
        List.of("saude"),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.DAILY,
        true, // isHardcoreModeEnabled
        LocalDate.now(),
        LocalDateTime.now(),
        List.of(),
        0, // currentStreak
        LocalDate.now(),
        DailyRepeatType.DAILY,
        1,
        null,
        null,
        null
    );
  }

  @Test
  @DisplayName("Calcula recompensa padrão para Daily MEDIUM com streak 0")
  void testCalculateRewardInitial() {
    Task.TaskReward reward = daily.calculateReward();
    assertEquals(15, reward.xp());
    assertEquals(new BigDecimal("2.50"), reward.coins());
  }

  @Test
  @DisplayName("Registra conclusão e incrementa streak")
  void testRegisterCompletion() {
    assertEquals(0, daily.getCurrentStreak());
    assertNull(daily.getLastCompletedAt());

    daily.registerCompletion();

    assertEquals(1, daily.getCurrentStreak());
    assertNotNull(daily.getLastCompletedAt());
  }

  @Test
  @DisplayName("Daily não sofre decaimento antes de atingir 14 conclusões em sequência")
  void testDailyDoesNotDecayBeforeBonusThreshold() {
    for (int i = 0; i < 13; i++) {
      daily.registerCompletion();
    }
    assertEquals(13, daily.getCurrentStreak());

    Task.TaskReward reward = daily.calculateReward();
    assertEquals(15, reward.xp());
    assertEquals(new BigDecimal("2.50"), reward.coins());
  }

  @Test
  @DisplayName("Calcula recompensa com bônus de +10% quando atinge 14 conclusões em sequência")
  void testCalculateRewardWithConsistencyBonus() {
    for (int i = 0; i < 14; i++) {
      daily.registerCompletion();
    }
    assertEquals(14, daily.getCurrentStreak());

    Task.TaskReward mediumReward = daily.calculateReward();
    // MEDIUM: 15 * 1.10 = 16.5 -> 17 XP; 2.50 * 1.10 = 2.75 coins
    assertEquals(17, mediumReward.xp());
    assertEquals(new BigDecimal("2.75"), mediumReward.coins());

    Daily easyDaily = new Daily(
        UUID.randomUUID(), columnId, userId, "Ler 5 páginas", null, 1,
        TaskPriority.MEDIUM, List.of(), TaskDifficulty.EASY, TaskStatus.PENDING,
        TaskType.DAILY, false, LocalDate.now(), LocalDateTime.now(), List.of(),
        14, LocalDate.now(), DailyRepeatType.DAILY, 1, null, null, LocalDateTime.now());
    Task.TaskReward easyReward = easyDaily.calculateReward();
    // EASY: 5 * 1.10 = 5.5 -> 6 XP; 0.75 * 1.10 = 0.825 -> 0.83 coins
    assertEquals(6, easyReward.xp());
    assertEquals(new BigDecimal("0.83"), easyReward.coins());

    Daily hardDaily = new Daily(
        UUID.randomUUID(), columnId, userId, "Treino pesado", null, 1,
        TaskPriority.HIGH, List.of(), TaskDifficulty.HARD, TaskStatus.PENDING,
        TaskType.DAILY, false, LocalDate.now(), LocalDateTime.now(), List.of(),
        21, LocalDate.now(), DailyRepeatType.DAILY, 1, null, null, LocalDateTime.now());
    Task.TaskReward hardReward = hardDaily.calculateReward();
    // HARD: 30 * 1.10 = 33 XP; 5.00 * 1.10 = 5.50 coins (flat cap, não acumula além de 10%)
    assertEquals(33, hardReward.xp());
    assertEquals(new BigDecimal("5.50"), hardReward.coins());
  }

  @Test
  @DisplayName("Quebra de sequência (breakStreak) reseta o streak para zero")
  void testBreakStreak() {
    daily.registerCompletion();
    daily.registerCompletion();
    assertEquals(2, daily.getCurrentStreak());

    daily.breakStreak();
    assertEquals(0, daily.getCurrentStreak());
  }

  @Test
  @DisplayName("Calcula penalidade no modo hardcore (50% da recompensa)")
  void testCalculatePenalty() {
    Task.TaskReward penalty = daily.calculatePenalty();
    // 15 XP * 0.5 = 7
    assertEquals(7, penalty.xp());
    // 2.50 * 0.5 = 1.25 coins
    assertEquals(new BigDecimal("1.25"), penalty.coins());
  }

  @Test
  @DisplayName("Validação de posse lança UnauthorizedException se usuário não for o dono")
  void testValidateOwnership() {
    UUID otherUserId = UUID.randomUUID();
    assertThrows(UnauthorizedException.class, () -> daily.validateOwnership(otherUserId));
    assertDoesNotThrow(() -> daily.validateOwnership(userId));
  }

  @Test
  @DisplayName("Concluir Daily atrasada sem rollover anterior deve reiniciar streak em 1 em vez de incrementar")
  void testRegisterCompletionAfterMissedDayResetsStreakToOne() {
    LocalDate twoDaysAgo = LocalDate.now().minusDays(2);
    Daily overdueDaily = new Daily(
        UUID.randomUUID(),
        columnId,
        userId,
        "Alongar",
        null,
        1,
        TaskPriority.MEDIUM,
        List.of(),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.DAILY,
        false,
        twoDaysAgo,
        LocalDateTime.now().minusDays(5),
        List.of(),
        6, // streak antigo antes da falha
        twoDaysAgo,
        DailyRepeatType.DAILY,
        1,
        null,
        null,
        LocalDateTime.now().minusDays(3)
    );

    assertEquals(0, overdueDaily.getEffectiveStreak(LocalDate.now()));
    overdueDaily.registerCompletion(LocalDateTime.now());
    assertEquals(1, overdueDaily.getCurrentStreak());
  }

  @Test
  @DisplayName("Daily WEEKLY com múltiplos dias avança para o próximo dia da mesma semana antes de pular semanas")
  void testWeeklyMultipleDaysAdvancesWithinSameWeekAndPreservesStreak() {
    LocalDate monday = LocalDate.of(2026, 3, 2); // Segunda-feira
    LocalDate wednesday = LocalDate.of(2026, 3, 4); // Quarta-feira
    LocalDate friday = LocalDate.of(2026, 3, 6); // Sexta-feira
    LocalDate nextCycleMonday = LocalDate.of(2026, 3, 16); // +2 semanas

    Daily biweeklyMultiDay = new Daily(
        UUID.randomUUID(),
        columnId,
        userId,
        "Academia",
        null,
        0,
        TaskPriority.MEDIUM,
        List.of(),
        TaskDifficulty.MEDIUM,
        TaskStatus.COMPLETED,
        TaskType.DAILY,
        false,
        monday,
        monday.atStartOfDay(),
        List.of(),
        3,
        monday,
        DailyRepeatType.WEEKLY,
        2,
        List.of(DailyDaysOfWeek.MONDAY, DailyDaysOfWeek.WEDNESDAY, DailyDaysOfWeek.FRIDAY),
        null,
        monday.atTime(19, 0)
    );

    assertEquals(wednesday, biweeklyMultiDay.calculateNextOccurrence(monday, false));
    assertEquals(friday, biweeklyMultiDay.calculateNextOccurrence(wednesday, false));
    assertEquals(nextCycleMonday, biweeklyMultiDay.calculateNextOccurrence(friday, false));

    // Na terça após concluir segunda, próxima esperada é quarta: streak permanece ativo
    assertTrue(biweeklyMultiDay.isStreakStillActive(LocalDate.of(2026, 3, 3)));
    // Na quinta após NÃO concluir quarta (última conclusão segunda), nextExpected (quarta) < quinta -> streak quebra
    assertFalse(biweeklyMultiDay.isStreakStillActive(LocalDate.of(2026, 3, 5)));
  }

  @Test
  @DisplayName("Daily WEEKLY 3x/semana (Seg/Qua/Sex) incrementa streak por execuções agendadas até alcançar bônus de 14")
  void testWeeklyThreeTimesPerWeekReachesFourteenExecutionsBonus() {
    LocalDate currentDue = LocalDate.of(2026, 3, 2); // Segunda
    Daily gymDaily = new Daily(
        UUID.randomUUID(),
        columnId,
        userId,
        "Academia Seg/Qua/Sex",
        null,
        0,
        TaskPriority.HIGH,
        List.of("saude"),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.DAILY,
        false,
        currentDue,
        currentDue.atStartOfDay(),
        List.of(),
        0,
        currentDue,
        DailyRepeatType.WEEKLY,
        1,
        List.of(DailyDaysOfWeek.MONDAY, DailyDaysOfWeek.WEDNESDAY, DailyDaysOfWeek.FRIDAY),
        null,
        null
    );

    for (int i = 0; i < 14; i++) {
      LocalDate scheduledDay = gymDaily.getDueDate().orElseThrow();
      gymDaily.refreshStreakForDate(scheduledDay);
      gymDaily.registerCompletion(scheduledDay.atTime(18, 0));
      gymDaily.changeStatus(TaskStatus.COMPLETED);

      // Simula virada do dia seguinte até a próxima ocorrência agendada
      LocalDate nextDay = scheduledDay.plusDays(1);
      assertTrue(gymDaily.isStreakStillActive(nextDay));
      gymDaily.changeStatus(TaskStatus.PENDING);
      gymDaily.advanceDueDateToAtLeast(nextDay);
    }

    assertEquals(14, gymDaily.getCurrentStreak());
    LocalDate fifteenthScheduledDay = gymDaily.getDueDate().orElseThrow();
    assertTrue(gymDaily.isStreakStillActive(fifteenthScheduledDay));
    Task.TaskReward bonusReward = gymDaily.calculateReward(fifteenthScheduledDay);
    assertEquals(17, bonusReward.xp());
    assertEquals(new BigDecimal("2.75"), bonusReward.coins());
  }

  @Test
  @DisplayName("Daily concluída antecipadamente e rolada para a próxima ocorrência preserva streak até a nova data")
  void testEarlyCompletionRolloverPreservesStreak() {
    LocalDate wednesday = LocalDate.of(2026, 3, 4);
    LocalDate friday = LocalDate.of(2026, 3, 6);

    Daily earlyCompleted = new Daily(
        UUID.randomUUID(),
        columnId,
        userId,
        "Academia",
        null,
        0,
        TaskPriority.MEDIUM,
        List.of(),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.DAILY,
        false,
        friday, // dueDate já rolada para sexta após concluir quarta antecipadamente na terça
        LocalDateTime.of(2026, 3, 1, 8, 0),
        List.of(),
        2,
        LocalDate.of(2026, 3, 2),
        DailyRepeatType.WEEKLY,
        1,
        List.of(DailyDaysOfWeek.MONDAY, DailyDaysOfWeek.WEDNESDAY, DailyDaysOfWeek.FRIDAY),
        null,
        LocalDateTime.of(2026, 3, 3, 19, 0) // concluída antecipadamente na terça
    );

    assertTrue(earlyCompleted.isStreakStillActive(wednesday));
    assertTrue(earlyCompleted.isStreakStillActive(friday));
    assertFalse(earlyCompleted.isStreakStillActive(friday.plusDays(1)));
  }

  @Test
  @DisplayName("Daily preserva highestStreak histórico quando streak atual quebra e só atualiza ao superar recorde")
  void testHighestStreakPreservedAcrossBreak() {
    LocalDate day1 = LocalDate.of(2026, 5, 1);
    daily.registerCompletion(day1.atTime(9, 0));
    daily.registerCompletion(day1.plusDays(1).atTime(9, 0));
    daily.registerCompletion(day1.plusDays(2).atTime(9, 0));

    assertEquals(3, daily.getCurrentStreak());
    assertEquals(3, daily.getHighestStreak());

    daily.breakStreak();
    assertEquals(0, daily.getCurrentStreak());
    assertEquals(3, daily.getHighestStreak());

    daily.registerCompletion(day1.plusDays(4).atTime(9, 0));
    assertEquals(1, daily.getCurrentStreak());
    assertEquals(3, daily.getHighestStreak());

    for (int offset = 5; offset <= 7; offset++) {
      daily.registerCompletion(day1.plusDays(offset).atTime(9, 0));
    }
    assertEquals(4, daily.getCurrentStreak());
    assertEquals(4, daily.getHighestStreak());
  }

  @Test
  @DisplayName("Daily Difícil com etapas recompensadas aplica +10% de streak 14 proporcionalmente e penaliza apenas pendentes")
  void hardDailyWithRewardedStepsScalesStreakBonusAndPendingOnlyPenalty() {
    UUID taskId = UUID.randomUUID();
    List<ChecklistItem> steps = List.of(
        new ChecklistItem(UUID.randomUUID(), taskId, userId, "Parte 1", true, true),
        new ChecklistItem(UUID.randomUUID(), taskId, userId, "Parte 2", true, true),
        new ChecklistItem(UUID.randomUUID(), taskId, userId, "Parte 3", false, true));

    Daily hardDailyStreak0 = new Daily(
        taskId, columnId, userId, "Bloco Deep Work", null, 1,
        TaskPriority.HIGH, List.of(), TaskDifficulty.HARD, TaskStatus.PENDING,
        TaskType.DAILY, true, LocalDate.now(), LocalDateTime.now(),
        steps, 0, LocalDate.now(), DailyRepeatType.DAILY, 1, null, null, null);

    // 4 unidades = 120 XP / $20.00
    Task.TaskReward streak0Reward = hardDailyStreak0.calculateReward(LocalDate.now());
    assertEquals(120, streak0Reward.xp());
    assertEquals(0, new BigDecimal("20.00").compareTo(streak0Reward.coins()));

    // Penalidade de falha Hardcore: base (1) + pendente (1) = 2 unidades -> 50% de 60 XP / $10.00 = 30 XP / $5.00
    Task.TaskReward penalty = hardDailyStreak0.calculatePenalty(LocalDate.now());
    assertEquals(30, penalty.xp());
    assertEquals(0, new BigDecimal("5.00").compareTo(penalty.coins()));

    Daily hardDailyStreak14 = new Daily(
        taskId, columnId, userId, "Bloco Deep Work", null, 1,
        TaskPriority.HIGH, List.of(), TaskDifficulty.HARD, TaskStatus.PENDING,
        TaskType.DAILY, true, LocalDate.now(), LocalDateTime.now(),
        steps, 14, LocalDate.now(), DailyRepeatType.DAILY, 1, null, null, null);

    // 14+ dias de consistência (+10%) sobre 120 XP / $20.00 -> 132 XP / $22.00
    Task.TaskReward streak14Reward = hardDailyStreak14.calculateReward(LocalDate.now());
    assertEquals(132, streak14Reward.xp());
    assertEquals(0, new BigDecimal("22.00").compareTo(streak14Reward.coins()));

    // Penalidade com streak 14+ não é amplificada pelo bônus de consistência (mantém 30 XP / $5.00)
    Task.TaskReward streak14Penalty = hardDailyStreak14.calculatePenalty(LocalDate.now());
    assertEquals(30, streak14Penalty.xp());
    assertEquals(0, new BigDecimal("5.00").compareTo(streak14Penalty.coins()));
  }
}
