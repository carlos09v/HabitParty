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
  @DisplayName("Pomodoro curto (15 a 24 min) concluído deve pagar 4 XP e 0.10 moedas por pomo")
  void shouldCalculateShortPomodoro() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 10, 20); // 20 min
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.POMO, 1);

    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(4, reward.xp());
    assertEquals(new BigDecimal("0.10"), reward.coins());
  }

  @Test
  @DisplayName("Pomodoro padrão (25 a 40 min) concluído deve pagar 8 XP e 0.25 moedas por pomo")
  void shouldCalculateStandardPomodoro() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 10, 30); // 30 min
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.POMO, 1);

    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(8, reward.xp());
    assertEquals(new BigDecimal("0.25"), reward.coins());
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
    assertEquals(new BigDecimal("0.50"), reward.coins());
  }

  @Test
  @DisplayName("Pomodoro longo / Deep Work (> 40 min) deve pagar 15 XP e 0.50 moedas")
  void shouldCalculateDeepWorkPomodoro() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 10, 50); // 50 min
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.POMO, 1);

    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(15, reward.xp());
    assertEquals(new BigDecimal("0.50"), reward.coins());
  }

  @Test
  @DisplayName("Cronômetro livre (Stopwatch) de 30 min deve pagar 7 XP e 0.20 moedas")
  void shouldCalculateStopwatchSession() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 10, 30); // 30 min
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.STOPWATCH, null);

    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(7, reward.xp());
    assertEquals(new BigDecimal("0.20"), reward.coins());
  }

  @Test
  @DisplayName("Cronômetro livre de 60 min deve pagar 14 XP e 0.40 moedas")
  void shouldCalculateStopwatchSixtyMinutes() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 11, 0); // 60 min
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.STOPWATCH, null);

    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(14, reward.xp());
    assertEquals(new BigDecimal("0.40"), reward.coins());
  }

  @Test
  @DisplayName("Anti-AFK: Sessão esquecida ligada por 5 horas é limitada ao teto de 90 min")
  void shouldCapSingleSessionToNinetyMinutes() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 15, 0); // 300 min (5 horas)
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.STOPWATCH, null);

    // 90 min = (90/30) * 7 = 21 XP; (90/30) * 0.20 = 0.60 moedas
    FocusReward reward = FocusRewardCalculator.calculate(record, 0);
    assertEquals(21, reward.xp());
    assertEquals(new BigDecimal("0.60"), reward.coins());
  }

  @Test
  @DisplayName("Rendimento decrescente: entre 4h e 6h diárias acumuladas aplica 50% de recompensa")
  void shouldApplyFiftyPercentInFatigueZone() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 14, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 14, 30); // 30 min (base: 8 XP, 0.25 moedas)
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.POMO, 1);

    // Usuário já tem 240 minutos hoje
    FocusReward reward = FocusRewardCalculator.calculate(record, 240);
    assertEquals(4, reward.xp()); // 8 * 0.5 = 4
    assertEquals(new BigDecimal("0.13"), reward.coins()); // 0.25 * 0.5 = 0.125 -> 0.13
  }

  @Test
  @DisplayName("Teto diário: após 6 horas (360 min) diárias acumuladas, recompensa é ZERO")
  void shouldReturnZeroAboveDailyCap() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 18, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 18, 30); // 30 min
    FocusRecord record = new FocusRecord(
        null, userId, activityId, null, null,
        start, end, FocusRecordType.POMO, 1);

    // Usuário já tem 360 minutos hoje
    FocusReward reward = FocusRewardCalculator.calculate(record, 360);
    assertEquals(0, reward.xp());
    assertEquals(new BigDecimal("0.00"), reward.coins());
  }
}
