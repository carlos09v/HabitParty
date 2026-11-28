package com.habitparty.core.domain.entities.focus;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.enums.FocusRecordType;

class FocusRewardCalculatorTest {

  private final UUID userId = UUID.randomUUID();
  private final UUID activityId = UUID.randomUUID();
  private final UUID inventoryId = UUID.randomUUID();

  @Test
  @DisplayName("Sessão nula deve retornar ZERO")
  void shouldReturnZeroForNullRecord() {
    FocusReward reward = FocusRewardCalculator.calculate(null, 0);
    assertEquals(0, reward.xp());
    assertEquals(new BigDecimal("0.00"), reward.coins());
  }

  @Test
  @DisplayName("Sessão atrelada a item de inventário (mochila/lazer) NUNCA deve gerar recompensa")
  void shouldReturnZeroForInventoryItemSession() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 10, 30); // 30 min
    FocusRecord record = new FocusRecord(
        null, userId, null, inventoryId, "Jogando videogame",
        start, end, FocusRecordType.STOPWATCH, null);

    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(0, reward.xp());
    assertEquals(new BigDecimal("0.00"), reward.coins());
  }

  @Test
  @DisplayName("Sessão inferior a 10 minutos não deve gerar recompensa (anti-spam)")
  void shouldReturnZeroForSessionUnderTenMinutes() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 10, 9); // 9 min
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.POMO, 0);

    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(0, reward.xp());
    assertEquals(new BigDecimal("0.00"), reward.coins());
  }

  @Test
  @DisplayName("Pomodoro curto (15 a 24 min) concluído deve pagar 4 XP e 0.25 moedas por pomo")
  void shouldCalculateShortPomodoro() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 10, 20); // 20 min
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.POMO, 1);

    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(4, reward.xp());
    assertEquals(new BigDecimal("0.25"), reward.coins());
  }

  @Test
  @DisplayName("Pomodoro padrão (25 a 49 min) concluído deve pagar 8 XP e 0.50 moedas por pomo")
  void shouldCalculateStandardPomodoro() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 10, 30); // 30 min
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.POMO, 1);

    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(8, reward.xp());
    assertEquals(new BigDecimal("0.50"), reward.coins());
  }

  @Test
  @DisplayName("Pomodoro de 45 min e 49 min ainda contam como Padrão (8 XP e 0.50 moedas)")
  void shouldKeepFortyFiveAndFortyNineMinutesAsStandardPomodoro() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);

    FocusRecord record45 = new FocusRecord(
        null, userId, activityId, null, null,
        start, start.plusMinutes(45), FocusRecordType.POMO, 1);
    FocusReward reward45 = FocusRewardCalculator.calculate(record45, 0);
    assertEquals(8, reward45.xp());
    assertEquals(new BigDecimal("0.50"), reward45.coins());

    FocusRecord record49 = new FocusRecord(
        null, userId, activityId, null, null,
        start, start.plusMinutes(49), FocusRecordType.POMO, 1);
    FocusReward reward49 = FocusRewardCalculator.calculate(record49, 0);
    assertEquals(8, reward49.xp());
    assertEquals(new BigDecimal("0.50"), reward49.coins());
  }

  @Test
  @DisplayName("Múltiplos pomodoros padrão na mesma sessão multiplicam a recompensa")
  void shouldCalculateMultipleStandardPomodoros() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 11, 0); // 60 min, 2 pomos de 30m
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.POMO, 2);

    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(16, reward.xp());
    assertEquals(new BigDecimal("1.00"), reward.coins());
  }

  @Test
  @DisplayName("Pomodoro longo / Deep Work (>= 50 min) deve pagar 15 XP e 1.00 moeda")
  void shouldCalculateDeepWorkPomodoro() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 10, 50); // 50 min
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.POMO, 1);

    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(15, reward.xp());
    assertEquals(new BigDecimal("1.00"), reward.coins());
  }

  @Test
  @DisplayName("Cronômetro livre (Stopwatch) de 30 min deve pagar 7 XP e 0.45 moedas")
  void shouldCalculateStopwatchSession() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 10, 30); // 30 min
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.STOPWATCH, null);

    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(7, reward.xp());
    assertEquals(new BigDecimal("0.45"), reward.coins());
  }

  @Test
  @DisplayName("Cronômetro livre de 60 min deve pagar 14 XP e 0.90 moedas")
  void shouldCalculateStopwatchSixtyMinutes() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 11, 0); // 60 min
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.STOPWATCH, null);

    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(14, reward.xp());
    assertEquals(new BigDecimal("0.90"), reward.coins());
  }

  @Test
  @DisplayName("Anti-AFK: Sessão esquecida ligada por 5 horas é limitada ao teto de 120 min")
  void shouldCapSingleSessionToOneHundredTwentyMinutes() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 15, 0); // 300 min (5 horas)
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.STOPWATCH, null);

    // 120 min = (120/30) * 7 = 28 XP; (120/30) * 0.45 = 1.80 moedas
    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(28, reward.xp());
    assertEquals(new BigDecimal("1.80"), reward.coins());
  }

  @Test
  @DisplayName("Rendimento decrescente: entre 4h e 6h diárias acumuladas aplica 50% de recompensa")
  void shouldApplyFiftyPercentInFatigueZone() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 14, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 14, 30); // 30 min (base: 8 XP, 0.50 moedas)
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.POMO, 1);

    // Usuário já tem 240 minutos hoje
    FocusReward reward = FocusRewardCalculator.calculate(record, 240);
    assertEquals(4, reward.xp()); // 8 * 0.5 = 4
    assertEquals(new BigDecimal("0.25"), reward.coins()); // 0.50 * 0.5 = 0.25
  }

  @Test
  @DisplayName("Escada diária: entre 6h e 8h diárias acumuladas aplica 25% de recompensa")
  void shouldApplyTwentyFivePercentInThirdTierZone() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 16, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 16, 30); // 30 min (base: 8 XP, 0.50 moedas -> 25%: 2 XP, 0.13)
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.POMO, 1);

    FocusReward reward = FocusRewardCalculator.calculate(record, 360);
    assertEquals(2, reward.xp());
    assertEquals(new BigDecimal("0.13"), reward.coins());
  }

  @Test
  @DisplayName("Teto diário: após 8 horas (480 min) diárias acumuladas, recompensa é ZERO")
  void shouldReturnZeroAboveDailyCap() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 18, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 18, 30); // 30 min
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.POMO, 1);

    // Usuário já tem 480 minutos hoje
    FocusReward reward = FocusRewardCalculator.calculate(record, 480);
    assertEquals(0, reward.xp());
    assertEquals(new BigDecimal("0.00"), reward.coins());
  }

  @Test
  @DisplayName("Pomodoro continuativo: mantém 1 pomo configurado e calcula excedente como Cronômetro")
  void shouldRewardConfiguredPomodoroPlusStopwatchOvertime() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 10, 55); // 55 min = 25m pomo + 30m excedente
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null, null, null,
        start, end, FocusRecordType.POMO, 1, 25, 0, BigDecimal.ZERO);

    // 25m pomo (8 XP, 0.50) + 30m stopwatch (7 XP, 0.45) = 15 XP e 0.95 moedas
    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(15, reward.xp());
    assertEquals(new BigDecimal("0.95"), reward.coins());
  }

  @Test
  @DisplayName("Pomodoro continuativo de 2h30 respeita teto de 120 min somando 1 pomo + excedente até 120m")
  void shouldCapOvertimePomodoroAtOneHundredTwentyMinutesTotal() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 12, 30); // 150 min -> cap 120m (25m pomo + 95m excedente)
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null, null, null,
        start, end, FocusRecordType.POMO, 1, 25, 0, BigDecimal.ZERO);

    // 25m pomo = 8 XP, 0.50 | 95m stopwatch = 22.1667 XP, 1.425 | total = 30 XP, 1.93
    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(30, reward.xp());
    assertEquals(new BigDecimal("1.93"), reward.coins());
  }

  @Test
  @DisplayName("Dois pomodoros Deep Work de 60m na mesma sessão de 2h pagam integralmente 30 XP e 2.00 moedas")
  void shouldRewardTwoSixtyMinuteDeepWorkPomosWithinTwoHourCap() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 12, 0); // 120 min = 2 x 60m
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null, null, null,
        start, end, FocusRecordType.POMO, 2, 60, 0, BigDecimal.ZERO);

    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(30, reward.xp());
    assertEquals(new BigDecimal("2.00"), reward.coins());
  }

  @Test
  @DisplayName("calculateRewardableMinutes deve ignorar sessões < 10 min e limitar sessões > 120 min a 120 min")
  void shouldComputeRewardableMinutesWithoutCountingUnrewardedTime() {
    assertEquals(0, FocusRewardCalculator.calculateRewardableMinutes(0));
    assertEquals(0, FocusRewardCalculator.calculateRewardableMinutes(9));
    assertEquals(10, FocusRewardCalculator.calculateRewardableMinutes(10));
    assertEquals(45, FocusRewardCalculator.calculateRewardableMinutes(45));
    assertEquals(90, FocusRewardCalculator.calculateRewardableMinutes(90));
    assertEquals(99, FocusRewardCalculator.calculateRewardableMinutes(99));
    assertEquals(120, FocusRewardCalculator.calculateRewardableMinutes(120));
    assertEquals(120, FocusRewardCalculator.calculateRewardableMinutes(121));
    assertEquals(120, FocusRewardCalculator.calculateRewardableMinutes(300));
  }
}
