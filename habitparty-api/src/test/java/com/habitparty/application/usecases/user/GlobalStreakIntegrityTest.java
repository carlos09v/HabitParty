package com.habitparty.application.usecases.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.usecases.focus.CreateFocusRecordCommand;
import com.habitparty.application.usecases.focus.CreateFocusRecordUseCase;
import com.habitparty.application.usecases.focus.DeleteFocusRecordUseCase;
import com.habitparty.application.usecases.transaction.DeleteTransactionHistoryUseCase;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.RewardPackageLevel;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.TaskDifficulty;

class GlobalStreakIntegrityTest {

  private User createUserWithStreak(UUID userId, int currentStreak, LocalDate lastStreakDate) {
    User user = new User(
        userId, UserRole.USER, false, "Carlos", "carlos", "carlos@habitparty.com",
        "hash", BigDecimal.TEN, BigDecimal.TEN, LocalDate.of(1995, 5, 20),
        null, UserGender.MALE, 100, currentStreak, Math.max(currentStreak, 5), LocalDateTime.now());
    user.setTimezone("America/Sao_Paulo");
    user.setLastStreakDate(lastStreakDate);
    return user;
  }

  @Test
  @DisplayName("[S-01] Excluir foco de hoje reverte o +1 de streak do dia e impede farm infinito no mesmo dia")
  void deletingTodayFocusRevertsIncrementAndPreventsInfiniteStreakFarming() {
    UUID userId = UUID.randomUUID();
    UUID activityId = UUID.randomUUID();
    ZoneId sp = ZoneId.of("America/Sao_Paulo");
    Clock clock = Clock.fixed(Instant.parse("2026-11-21T15:00:00Z"), ZoneId.of("UTC"));
    LocalDate todaySp = LocalDate.of(2026, 11, 21);
    LocalDate yesterdaySp = LocalDate.of(2026, 11, 20);

    User user = createUserWithStreak(userId, 5, yesterdaySp);
    FocusActivity activity = new FocusActivity(
        activityId, userId, "Deep Work", "code", 0, FocusRecordType.STOPWATCH, null, LocalDateTime.now());

    FocusRecordRepository focusPort = mock(FocusRecordRepository.class);
    InventoryItemRepository invPort = mock(InventoryItemRepository.class);
    FocusActivityRepository activityPort = mock(FocusActivityRepository.class);
    TransactionHistoryRepository txPort = mock(TransactionHistoryRepository.class);
    UserRepository userPort = mock(UserRepository.class);

    when(activityPort.findById(activityId)).thenReturn(Optional.of(activity));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(userPort.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
    when(focusPort.save(any(FocusRecord.class))).thenAnswer(inv -> inv.getArgument(0));

    CreateFocusRecordUseCase createUseCase = new CreateFocusRecordUseCase(
        focusPort, invPort, activityPort, txPort, userPort);
    createUseCase.setClock(clock);

    LocalDateTime start = LocalDateTime.of(2026, 11, 21, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 11, 21, 10, 35);
    when(focusPort.sumFocusMinutesOnDate(eq(userId), eq(todaySp), eq(sp))).thenReturn(0);
    when(txPort.countCompletedTasksToday(userId, sp)).thenReturn(0);

    FocusRecord firstSaved = createUseCase.execute(userId, new CreateFocusRecordCommand(
        activityId, null, null, "Bloco 1", start, end, FocusRecordType.STOPWATCH, 0));

    assertEquals(6, user.getCurrentStreak());
    assertEquals(todaySp, user.getLastStreakDate());

    // Agora exclui o registro no mesmo dia — deve estornar 6 -> 5 e restaurar lastStreakDate para ontem
    DeleteFocusRecordUseCase deleteUseCase = new DeleteFocusRecordUseCase(focusPort, invPort, txPort);
    deleteUseCase.setUserPort(userPort);
    deleteUseCase.setClock(clock);

    when(focusPort.findById(firstSaved.getId())).thenReturn(Optional.of(firstSaved));
    when(focusPort.sumProductiveFocusMinutesOnDate(userId, todaySp, sp)).thenReturn(35);

    deleteUseCase.execute(userId, firstSaved.getId(), false);

    assertEquals(5, user.getCurrentStreak());
    assertEquals(yesterdaySp, user.getLastStreakDate());

    // Recria outra sessão de 35 min hoje (banco volta a ter 0 min prévios): retorna a 6 (e NUNCA 7!), mesmo chamando uma terceira vez
    when(focusPort.sumProductiveFocusMinutesOnDate(userId, todaySp, sp)).thenReturn(0);
    createUseCase.execute(userId, new CreateFocusRecordCommand(
        activityId, null, null, "Bloco 2", start.plusHours(1), end.plusHours(1), FocusRecordType.STOPWATCH, 0));
    assertEquals(6, user.getCurrentStreak());

    GlobalStreakSupport.incrementTodayStreakIfYesterdayVerified(user, sp, todaySp, txPort, focusPort);
    assertEquals(6, user.getCurrentStreak());
  }

  @Test
  @DisplayName("[S-01 + Decisão 2] Apagar histórico em /history não destrói streak já ganho hoje nem permite +1 extra hoje")
  void deletingTransactionHistoryPreservesGlobalStreakAndBlocksSecondIncrementToday() {
    UUID userId = UUID.randomUUID();
    UUID txId = UUID.randomUUID();
    Clock clock = Clock.fixed(Instant.parse("2026-11-21T16:00:00Z"), ZoneId.of("UTC"));
    ZoneId sp = ZoneId.of("America/Sao_Paulo");
    LocalDate todaySp = LocalDate.of(2026, 11, 21);

    User user = createUserWithStreak(userId, 7, todaySp);
    TransactionHistory tx = new TransactionHistory(
        txId, userId, UUID.randomUUID(), BigDecimal.TEN, 20, BigDecimal.ONE,
        TransactionType.TASK_COMPLETED, "Task", null, RewardPackageLevel.BASIC, TaskDifficulty.EASY,
        List.of(), LocalDateTime.now(clock));

    TransactionHistoryRepository txPort = mock(TransactionHistoryRepository.class);
    FocusRecordRepository focusPort = mock(FocusRecordRepository.class);
    when(txPort.findById(txId)).thenReturn(Optional.of(tx));
    // Simula extrato vazio após exclusão de todas as transações de hoje e ontem
    when(txPort.countCompletedTasksToday(userId, sp)).thenReturn(0);
    when(txPort.hasCompletedTasksYesterday(userId, sp)).thenReturn(false);

    DeleteTransactionHistoryUseCase deleteTxUseCase = new DeleteTransactionHistoryUseCase(txPort);
    deleteTxUseCase.execute(txId, userId);

    EffectiveStreakResolver resolver = new EffectiveStreakResolver(txPort, focusPort, clock);
    assertEquals(7, resolver.resolve(user));
    assertEquals(7, resolver.resolveBatch(List.of(user)).get(userId));

    // Concluir nova tarefa no mesmo dia continua bloqueado pelo lastStreakDate == todaySp
    GlobalStreakSupport.incrementTodayStreakIfYesterdayVerified(user, sp, todaySp, txPort, focusPort);
    assertEquals(7, user.getCurrentStreak());

    // Se streak for explicitamente zerado, lastStreakDate volta para null
    user.resetStreak();
    assertNull(user.getLastStreakDate());
  }
}
