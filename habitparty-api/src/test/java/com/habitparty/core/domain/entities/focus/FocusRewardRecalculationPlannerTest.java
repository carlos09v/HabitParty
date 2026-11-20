package com.habitparty.core.domain.entities.focus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.core.domain.enums.FocusRecordType;

class FocusRewardRecalculationPlannerTest {

  private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");

  @Test
  @DisplayName("Deve recalcular sessões STOPWATCH antigas (0.40 -> 0.45/30m) e corrigir sessão de 92m sub-premiada")
  void shouldUpgradeOldStopwatchAndMisCappedSessionsChronologically() {
    UUID userId = UUID.randomUUID();
    UUID activityId = UUID.randomUUID();

    // 45m cronômetro salvo na regra antiga (0.40/30m -> 0.60 moedas, 11 XP)
    FocusRecord stopwatch45 = new FocusRecord(
        UUID.randomUUID(),
        userId,
        activityId,
        null,
        null,
        null,
        null,
        LocalDateTime.of(2026, 11, 17, 5, 37),
        LocalDateTime.of(2026, 11, 17, 6, 22),
        FocusRecordType.STOPWATCH,
        null,
        null,
        11,
        new BigDecimal("0.60"));

    // 1h32m (92m) em 16/11 que recebeu 50% (11 XP, 0.68) erroneamente, mas no dia só havia essa sessão (<4h)
    FocusRecord study92 = new FocusRecord(
        UUID.randomUUID(),
        userId,
        activityId,
        null,
        null,
        null,
        null,
        LocalDateTime.of(2026, 11, 16, 14, 50),
        LocalDateTime.of(2026, 11, 16, 16, 22),
        FocusRecordType.STOPWATCH,
        null,
        null,
        11,
        new BigDecimal("0.68"));

    var plan = FocusRewardRecalculationPlanner.planForUser(
        List.of(stopwatch45, study92), SAO_PAULO, SAO_PAULO);

    assertTrue(plan.hasChanges());
    assertEquals(2, plan.adjustments().size());

    // Cronologicamente: primeiro 16/11 (study92 -> 21 XP, 1.35 coins), depois 17/11 (stopwatch45 -> 11 XP, 0.68 coins)
    var adj1 = plan.adjustments().get(0);
    assertEquals(study92.getId(), adj1.recordId());
    assertEquals(21, adj1.newXp());
    assertEquals(new BigDecimal("1.35"), adj1.newCoins());
    assertEquals(10, adj1.xpDelta());
    assertEquals(new BigDecimal("0.67"), adj1.coinsDelta());

    var adj2 = plan.adjustments().get(1);
    assertEquals(stopwatch45.getId(), adj2.recordId());
    assertEquals(11, adj2.newXp());
    assertEquals(new BigDecimal("0.68"), adj2.newCoins());
    assertEquals(0, adj2.xpDelta());
    assertEquals(new BigDecimal("0.08"), adj2.coinsDelta());

    assertEquals(10, plan.totalXpDelta());
    assertEquals(new BigDecimal("0.75"), plan.totalCoinsDelta());
  }

  @Test
  @DisplayName("Nunca deve reduzir moedas ou XP de Pomodoros antigos entre 41 e 49 min nem após 4h no dia")
  void shouldNeverReduceLegacyPomoOrOverCapRecords() {
    UUID userId = UUID.randomUUID();
    UUID activityId = UUID.randomUUID();

    // Pomodoro antigo de 45 min que ganhou 15 XP e 1.00 moedas na regra anterior (>40m)
    FocusRecord legacyPomo45 = new FocusRecord(
        UUID.randomUUID(),
        userId,
        activityId,
        null,
        null,
        null,
        null,
        LocalDateTime.of(2026, 11, 15, 9, 0),
        LocalDateTime.of(2026, 11, 15, 9, 45),
        FocusRecordType.POMO,
        1,
        null,
        15,
        new BigDecimal("1.00"));

    // 4h de foco recompensável antes do próximo registro no dia 16/11 (90m + 90m + 60m = 240 min)
    FocusRecord priorMorning1 = new FocusRecord(
        UUID.randomUUID(),
        userId,
        activityId,
        null,
        null,
        null,
        null,
        LocalDateTime.of(2026, 11, 16, 7, 0),
        LocalDateTime.of(2026, 11, 16, 8, 30),
        FocusRecordType.STOPWATCH,
        null,
        null,
        21,
        new BigDecimal("1.35"));

    FocusRecord priorMorning2 = new FocusRecord(
        UUID.randomUUID(),
        userId,
        activityId,
        null,
        null,
        null,
        null,
        LocalDateTime.of(2026, 11, 16, 9, 0),
        LocalDateTime.of(2026, 11, 16, 10, 30),
        FocusRecordType.STOPWATCH,
        null,
        null,
        21,
        new BigDecimal("1.35"));

    FocusRecord priorMorning3 = new FocusRecord(
        UUID.randomUUID(),
        userId,
        activityId,
        null,
        null,
        null,
        null,
        LocalDateTime.of(2026, 11, 16, 11, 0),
        LocalDateTime.of(2026, 11, 16, 12, 0),
        FocusRecordType.STOPWATCH,
        null,
        null,
        14,
        new BigDecimal("0.90"));

    // 92m depois de já ter 4h recompensáveis no dia 16/11: deve permanecer na faixa 50% (11 XP, 0.68 coins)
    FocusRecord afterFourHours = new FocusRecord(
        UUID.randomUUID(),
        userId,
        activityId,
        null,
        null,
        null,
        null,
        LocalDateTime.of(2026, 11, 16, 14, 50),
        LocalDateTime.of(2026, 11, 16, 16, 22),
        FocusRecordType.STOPWATCH,
        null,
        null,
        11,
        new BigDecimal("0.68"));

    var plan = FocusRewardRecalculationPlanner.planForUser(
        List.of(legacyPomo45, priorMorning1, priorMorning2, priorMorning3, afterFourHours), SAO_PAULO, SAO_PAULO);

    assertFalse(plan.hasChanges());
    assertEquals(0, plan.totalXpDelta());
    assertEquals(new BigDecimal("0.00"), plan.totalCoinsDelta());
  }

  @Test
  @DisplayName("Excedente > 90 min e sessões < 10 min não devem queimar a cota diária de 100% nas sessões seguintes")
  void shouldAccumulateOnlyRewardableMinutesTowardDailyYieldCap() {
    UUID userId = UUID.randomUUID();
    UUID activityId = UUID.randomUUID();

    // Sessão 1: 9 min (sem recompensa -> 0 min na cota)
    FocusRecord short9 = new FocusRecord(
        UUID.randomUUID(), userId, activityId, null, null, null, null,
        LocalDateTime.of(2026, 11, 20, 7, 0),
        LocalDateTime.of(2026, 11, 20, 7, 9),
        FocusRecordType.STOPWATCH, null, null, 0, BigDecimal.ZERO);

    // Sessão 2: 120 min (paga por 90m -> apenas 90m na cota, não 120m)
    FocusRecord session120A = new FocusRecord(
        UUID.randomUUID(), userId, activityId, null, null, null, null,
        LocalDateTime.of(2026, 11, 20, 8, 0),
        LocalDateTime.of(2026, 11, 20, 10, 0),
        FocusRecordType.STOPWATCH, null, null, 21, new BigDecimal("1.35"));

    // Sessão 3: 120 min (acumulado elegível até aqui: 90m, embora bruto fosse 129m -> 90m na cota)
    FocusRecord session120B = new FocusRecord(
        UUID.randomUUID(), userId, activityId, null, null, null, null,
        LocalDateTime.of(2026, 11, 20, 10, 30),
        LocalDateTime.of(2026, 11, 20, 12, 30),
        FocusRecordType.STOPWATCH, null, null, 21, new BigDecimal("1.35"));

    // Sessão 4: 60 min (acumulado elegível: 180m < 240m, embora bruto fosse 249m > 240m -> deve pagar 100%: 14 XP, 0.90)
    // Simula caso em que o bug antigo havia pago apenas 50% (7 XP, 0.45)
    FocusRecord session60After = new FocusRecord(
        UUID.randomUUID(), userId, activityId, null, null, null, null,
        LocalDateTime.of(2026, 11, 20, 14, 0),
        LocalDateTime.of(2026, 11, 20, 15, 0),
        FocusRecordType.STOPWATCH, null, null, 7, new BigDecimal("0.45"));

    var plan = FocusRewardRecalculationPlanner.planForUser(
        List.of(short9, session120A, session120B, session60After), SAO_PAULO, SAO_PAULO);

    assertTrue(plan.hasChanges());
    assertEquals(1, plan.adjustments().size());
    var adj = plan.adjustments().get(0);
    assertEquals(session60After.getId(), adj.recordId());
    assertEquals(14, adj.newXp());
    assertEquals(new BigDecimal("0.90"), adj.newCoins());
  }
}
