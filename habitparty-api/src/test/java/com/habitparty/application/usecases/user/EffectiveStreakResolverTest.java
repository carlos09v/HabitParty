package com.habitparty.application.usecases.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

@ExtendWith(MockitoExtension.class)
class EffectiveStreakResolverTest {

  @Mock
  private TransactionHistoryRepository transactionPort;

  @Mock
  private FocusRecordRepository focusRecordPort;

  private User buildUser(int streak) {
    User user = new User(
        UUID.randomUUID(),
        UserRole.USER,
        true,
        "Hero Test",
        "herotest",
        "hero@habitparty.com",
        "pwd",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1995, 1, 1),
        null,
        UserGender.MALE,
        0,
        0,
        0,
        LocalDateTime.now());
    user.setCurrentStreak(streak);
    return user;
  }

  @Test
  @DisplayName("Retorna 0 sem consultar repositório quando streak do usuário já é zero")
  void returnsZeroWithoutQueryWhenStreakIsZero() {
    EffectiveStreakResolver resolver = new EffectiveStreakResolver(transactionPort);
    User user = buildUser(0);

    assertEquals(0, resolver.resolve(user));
    verifyNoInteractions(transactionPort);
  }

  @Test
  @DisplayName("Zera streak efetivo quando usuário não teve nem tarefa concluída nem >= 30m de foco desde ontem")
  void zeroesExpiredStreakWhenNoTaskOrFocusQualificationSinceYesterday() {
    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-14T15:00:00Z"), ZoneId.of("UTC"));
    EffectiveStreakResolver resolver = new EffectiveStreakResolver(transactionPort, focusRecordPort, fixedClock);
    User user = buildUser(9);
    // Sem tarefas ontem/hoje e apenas 20m de foco ontem e 0 hoje -> ofensiva expirada
    when(transactionPort.countCompletedTasksToday(eq(user.getId()), any())).thenReturn(0);
    when(transactionPort.hasCompletedTasksYesterday(eq(user.getId()), any())).thenReturn(false);
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(eq(user.getId()), eq(LocalDate.of(2026, 11, 14)), any()))
        .thenReturn(0);
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(eq(user.getId()), eq(LocalDate.of(2026, 11, 13)), any()))
        .thenReturn(20);

    assertEquals(0, resolver.resolve(user));
  }

  @Test
  @DisplayName("Mantém streak quando há >= 30m de foco ontem mesmo sem tarefas concluídas")
  void preservesStreakWhenFocusQualificationExistsSinceYesterday() {
    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-14T15:00:00Z"), ZoneId.of("UTC"));
    EffectiveStreakResolver resolver = new EffectiveStreakResolver(transactionPort, focusRecordPort, fixedClock);
    User user = buildUser(9);
    when(transactionPort.countCompletedTasksToday(eq(user.getId()), any())).thenReturn(0);
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(eq(user.getId()), eq(LocalDate.of(2026, 11, 14)), any()))
        .thenReturn(0);
    when(transactionPort.hasCompletedTasksYesterday(eq(user.getId()), any())).thenReturn(false);
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(eq(user.getId()), eq(LocalDate.of(2026, 11, 13)), any()))
        .thenReturn(30);

    assertEquals(9, resolver.resolve(user));
  }

  @Test
  @DisplayName("Deve encaminhar o ZoneId configurado no usuário ao consultar conclusões e foco recentes")
  void passesUserZoneIdToRepository() {
    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-14T15:00:00Z"), ZoneId.of("UTC"));
    EffectiveStreakResolver resolver = new EffectiveStreakResolver(transactionPort, focusRecordPort, fixedClock);
    User user = buildUser(4);
    user.setTimezone("Asia/Tokyo"); // 2026-11-15 00:00 em Tóquio
    ZoneId tokyo = ZoneId.of("Asia/Tokyo");
    when(transactionPort.countCompletedTasksToday(user.getId(), tokyo)).thenReturn(0);
    when(focusRecordPort.sumProductiveFocusMinutesOnDate(user.getId(), LocalDate.of(2026, 11, 15), tokyo))
        .thenReturn(35);

    assertEquals(4, resolver.resolve(user));
  }

  @Test
  @DisplayName("Resolve streak em lote mantendo usuário com tarefa OU >= 30m de foco desde ontem no fuso dele")
  void resolvesBatchWithTaskOrFocusOnLocalDay() {
    Clock fixedClock = Clock.fixed(
        Instant.parse("2026-11-14T15:00:00Z"),
        ZoneId.of("UTC"));
    EffectiveStreakResolver resolver = new EffectiveStreakResolver(transactionPort, focusRecordPort, fixedClock);
    User focusOnlyUser = buildUser(8);
    User taskOnlyUser = buildUser(6);
    User insufficientFocusUser = buildUser(5);
    User zero = buildUser(0);

    LocalDateTime nov14 = LocalDateTime.of(2026, 11, 14, 12, 0);
    LocalDateTime nov13 = LocalDateTime.of(2026, 11, 13, 18, 0);
    LocalDateTime sysNov14 = nov14.atZone(ZoneId.of("UTC")).withZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();
    LocalDateTime sysNov13 = nov13.atZone(ZoneId.of("UTC")).withZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime();

    when(transactionPort.findTaskCompletionsByUserIdsSince(anyCollection(), any()))
        .thenReturn(List.of(
            new TransactionHistoryRepository.TaskCompletionTimestamp(taskOnlyUser.getId(), sysNov13)));
    when(focusRecordPort.findProductiveFocusSessionsByUserIdsSince(anyCollection(), any()))
        .thenReturn(List.of(
            new FocusRecordRepository.FocusSessionSummary(focusOnlyUser.getId(), sysNov14, 15),
            new FocusRecordRepository.FocusSessionSummary(focusOnlyUser.getId(), sysNov14, 15),
            new FocusRecordRepository.FocusSessionSummary(insufficientFocusUser.getId(), sysNov14, 25)));

    Map<UUID, Integer> result = resolver.resolveBatch(List.of(focusOnlyUser, taskOnlyUser, insufficientFocusUser, zero));
    assertEquals(8, result.get(focusOnlyUser.getId()));
    assertEquals(6, result.get(taskOnlyUser.getId()));
    assertEquals(0, result.get(insufficientFocusUser.getId()));
    assertEquals(0, result.get(zero.getId()));
  }
}
