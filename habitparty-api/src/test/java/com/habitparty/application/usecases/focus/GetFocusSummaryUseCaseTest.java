package com.habitparty.application.usecases.focus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.FocusRecordRepository.FocusAnalyticsEntry;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.user.UserTimeResolver;

class GetFocusSummaryUseCaseTest {

  private static final UUID USER_ID = UUID.randomUUID();
  private static final UUID ACT_A = UUID.randomUUID();
  private static final UUID ACT_B = UUID.randomUUID();

  @Test
  @DisplayName("Deve calcular métricas globais, ofensiva, rendimento diário e mapa diário respeitando o fuso do usuário")
  void shouldCalculateGlobalSummaryRespectingUserTimezone() {
    // 2026-11-26 15:00 UTC -> 12:00 America/Sao_Paulo (hoje = 2026-11-26)
    Clock utcClock = Clock.fixed(Instant.parse("2026-11-26T15:00:00Z"), ZoneOffset.UTC);
    FocusRecordRepository focusPort = mock(FocusRecordRepository.class);
    UserRepository userPort = mock(UserRepository.class);
    when(userPort.findTimezoneById(USER_ID)).thenReturn(Optional.of("America/Sao_Paulo"));

    UserTimeResolver timeResolver = new UserTimeResolver(userPort, utcClock);
    GetFocusSummaryUseCase useCase = new GetFocusSummaryUseCase(focusPort, timeResolver);

    when(focusPort.findProductiveAnalyticsEntriesByUserId(USER_ID)).thenReturn(List.of(
        // Hoje (2026-11-26 09:00 SP = 12:00 UTC): 110m -> rewardable cap 90m
        new FocusAnalyticsEntry(ACT_A, LocalDateTime.of(2026, 11, 26, 12, 0), 110, 2, 22, new BigDecimal("1.25")),
        // Hoje (2026-11-26 11:00 SP = 14:00 UTC): 8m -> rewardable 0m (< 10m), mas produtivo 8m
        new FocusAnalyticsEntry(ACT_B, LocalDateTime.of(2026, 11, 26, 14, 0), 8, 0, 0, BigDecimal.ZERO),
        // Ontem em SP (2026-11-25 22:30 SP = 2026-11-26 01:30 UTC!): deve contar em 2026-11-25, não hoje!
        new FocusAnalyticsEntry(ACT_A, LocalDateTime.of(2026, 11, 26, 1, 30), 35, 1, 8, new BigDecimal("0.50")),
        // Anteontem em SP (2026-11-24 14:00 SP = 17:00 UTC): completa streak de 3 dias
        new FocusAnalyticsEntry(ACT_B, LocalDateTime.of(2026, 11, 24, 17, 0), 25, 1, 8, new BigDecimal("0.50")),
        // Dia isolado 10 dias atrás (2026-11-16): entra no total e totalActiveDays, mas não no streak
        new FocusAnalyticsEntry(ACT_A, LocalDateTime.of(2026, 11, 16, 15, 0), 40, 1, 8, new BigDecimal("0.50")),
        // Registro zerado: ignorado
        new FocusAnalyticsEntry(ACT_A, LocalDateTime.of(2026, 11, 26, 13, 0), 0, 0, 0, BigDecimal.ZERO)));

    var result = useCase.execute(USER_ID, null);

    assertEquals(2, result.todayRecordsCount());
    assertEquals(5, result.totalRecordsCount());
    assertEquals(3, result.activeStreakDays());
    assertEquals(4, result.totalActiveDays());
    assertEquals(22, result.todayXp());
    assertEquals(46, result.totalXp());
    assertEquals(new BigDecimal("1.25"), result.todayGold());
    assertEquals(new BigDecimal("2.75"), result.totalGold());
    assertEquals(118, result.todayFocusMinutes());
    assertEquals(218, result.totalFocusMinutes());
    assertEquals(2, result.todayPomosCount());
    assertEquals(5, result.totalPomosCount());
    assertEquals(59, result.todayAverageMinutes());
    assertEquals(44, result.totalAverageMinutes());
    assertEquals(118, result.globalTodayProductiveMinutes());
    assertEquals(90, result.globalTodayRewardableMinutes());
    assertEquals(Map.of(ACT_A, 110, ACT_B, 8), result.todayDurationByActivityId());
    assertEquals(Map.of(
        "2026-11-16", 40,
        "2026-11-24", 25,
        "2026-11-25", 35,
        "2026-11-26", 118), result.dailyMinutes());
  }

  @Test
  @DisplayName("Deve filtrar métricas e ofensiva por activityId mantendo os totais globais do dia intactos")
  void shouldFilterMetricsByActivityWhileKeepingGlobalTodayTotals() {
    Clock utcClock = Clock.fixed(Instant.parse("2026-11-26T15:00:00Z"), ZoneOffset.UTC);
    FocusRecordRepository focusPort = mock(FocusRecordRepository.class);
    UserRepository userPort = mock(UserRepository.class);
    when(userPort.findTimezoneById(USER_ID)).thenReturn(Optional.of("UTC"));

    GetFocusSummaryUseCase useCase = new GetFocusSummaryUseCase(
        focusPort, new UserTimeResolver(userPort, utcClock));

    when(focusPort.findProductiveAnalyticsEntriesByUserId(USER_ID)).thenReturn(List.of(
        new FocusAnalyticsEntry(ACT_A, LocalDateTime.of(2026, 11, 26, 10, 0), 30, 1, 8, new BigDecimal("0.50")),
        new FocusAnalyticsEntry(ACT_B, LocalDateTime.of(2026, 11, 26, 12, 0), 45, 1, 8, new BigDecimal("0.50")),
        new FocusAnalyticsEntry(ACT_B, LocalDateTime.of(2026, 11, 25, 12, 0), 25, 1, 8, new BigDecimal("0.50"))));

    var result = useCase.execute(USER_ID, ACT_A);

    assertEquals(1, result.todayRecordsCount());
    assertEquals(1, result.totalRecordsCount());
    assertEquals(1, result.activeStreakDays());
    assertEquals(1, result.totalActiveDays());
    assertEquals(30, result.todayFocusMinutes());
    assertEquals(30, result.totalFocusMinutes());
    // Globais do dia permanecem somando ACT_A + ACT_B
    assertEquals(75, result.globalTodayProductiveMinutes());
    assertEquals(75, result.globalTodayRewardableMinutes());
    assertEquals(Map.of(ACT_A, 30, ACT_B, 45), result.todayDurationByActivityId());
    assertEquals(Map.of("2026-11-26", 30), result.dailyMinutes());
  }

  @Test
  @DisplayName("Deve preservar ofensiva a partir de ontem quando ainda não houve sessão hoje")
  void shouldPreserveStreakFromYesterdayWhenNoSessionToday() {
    Clock utcClock = Clock.fixed(Instant.parse("2026-11-26T15:00:00Z"), ZoneOffset.UTC);
    FocusRecordRepository focusPort = mock(FocusRecordRepository.class);
    UserRepository userPort = mock(UserRepository.class);
    when(userPort.findTimezoneById(USER_ID)).thenReturn(Optional.of(ZoneId.of("UTC").getId()));

    GetFocusSummaryUseCase useCase = new GetFocusSummaryUseCase(
        focusPort, new UserTimeResolver(userPort, utcClock));

    when(focusPort.findProductiveAnalyticsEntriesByUserId(USER_ID)).thenReturn(List.of(
        new FocusAnalyticsEntry(ACT_A, LocalDateTime.of(2026, 11, 25, 14, 0), 35, 1, 8, new BigDecimal("0.50")),
        new FocusAnalyticsEntry(ACT_A, LocalDateTime.of(2026, 11, 24, 14, 0), 35, 1, 8, new BigDecimal("0.50"))));

    var result = useCase.execute(USER_ID, null);

    assertEquals(0, result.todayRecordsCount());
    assertEquals(2, result.activeStreakDays());
    assertEquals(2, result.totalActiveDays());
    assertTrue(result.todayDurationByActivityId().isEmpty());
  }
}
