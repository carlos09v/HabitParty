package com.habitparty.application.usecases.focus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserLevel;
import com.habitparty.core.domain.enums.UserRole;

@ExtendWith(MockitoExtension.class)
class DeleteFocusRecordUseCaseTest {

  @Mock
  private FocusRecordRepository port;

  @Mock
  private InventoryItemRepository inventoryItemPort;

  @Mock
  private TransactionHistoryRepository transactionPort;

  @Mock
  private TaskRepository taskPort;

  @Mock
  private UserRepository userPort;

  @InjectMocks
  private DeleteFocusRecordUseCase useCase;

  private UUID userId;
  private UUID recordId;
  private UUID activityId;

  @BeforeEach
  void setUp() {
    useCase.setTaskPort(taskPort);
    useCase.setUserPort(userPort);
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
    user.getStats().recordFocusCompleted(30, 1);
    return user;
  }

  @Test
  @DisplayName("Deve estornar XP e Moedas ao excluir registro de foco, respeitando piso do nível atual e saldo não negativo")
  void shouldRevertXpAndCoinsSafelyWithinLevelFloorAndNonNegativeBalance() {
    // Usuário no nível APPRENTICE (minXp = 100) com 105 XP e 0.30 moedas (já gastou parte)
    User user = createUser(105, new BigDecimal("0.30"), new BigDecimal("2.00"));
    assertEquals(UserLevel.APPRENTICE, user.getCurrentLevel());

    FocusRecord record = new FocusRecord(
        recordId,
        userId,
        activityId,
        null,
        null,
        null,
        "Sessão errada",
        LocalDateTime.of(2026, 10, 16, 10, 0),
        LocalDateTime.of(2026, 10, 16, 10, 30),
        FocusRecordType.POMO,
        1,
        15,
        new BigDecimal("1.00"));

    when(port.findById(recordId)).thenReturn(Optional.of(record));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(port.findMaxProductiveDurationMinutesExcludingRecord(userId, recordId)).thenReturn(0);

    useCase.execute(userId, recordId, true);

    // XP não cai abaixo de 100 (piso do nível APPRENTICE)
    assertEquals(100, user.getTotalXp());
    assertEquals(UserLevel.APPRENTICE, user.getCurrentLevel());
    // Moedas não ficam negativas (0.30 - 1.00 -> 0) e totalGoldEarned cai para 1.00
    assertEquals(0, BigDecimal.ZERO.compareTo(user.getCurrentCoins()));
    assertEquals(0, new BigDecimal("1.00").compareTo(user.getTotalGoldEarned()));
    // Contadores de foco estornados
    assertEquals(0, user.getStats().getTotalFocusMinutes());
    assertEquals(0, user.getStats().getTotalFocusSessions());
    assertEquals(0, user.getStats().getTotalPomodorosCompleted());
    assertEquals(0, user.getStats().getLongestFocusSessionMinutes());

    verify(userPort).save(user);
    verify(transactionPort).deleteAllByReferenceIdAndUserId(recordId, userId);
    verify(port).deleteById(recordId);
  }

  @Test
  @DisplayName("Não deve excluir transação do Histórico quando deleteHistory for false")
  void shouldNotDeleteHistoryWhenFlagIsFalse() {
    User user = createUser(200, new BigDecimal("5.00"), new BigDecimal("5.00"));
    FocusRecord record = new FocusRecord(
        recordId,
        userId,
        activityId,
        null,
        null,
        null,
        null,
        LocalDateTime.of(2026, 10, 16, 10, 0),
        LocalDateTime.of(2026, 10, 16, 10, 30),
        FocusRecordType.POMO,
        1,
        8,
        new BigDecimal("0.50"));

    when(port.findById(recordId)).thenReturn(Optional.of(record));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));

    useCase.execute(userId, recordId, false);

    assertEquals(192, user.getTotalXp());
    assertEquals(new BigDecimal("4.50"), user.getCurrentCoins());
    verify(transactionPort, never()).deleteAllByReferenceIdAndUserId(any(), any());
    verify(port).deleteById(recordId);
  }

  @Test
  @DisplayName("Deve recalcular longestFocusSessionMinutes e estornar contador noturno/madrugador ao excluir sessão")
  void shouldRecalculateLongestSessionAndRevertTimeOfDayCounters() {
    User user = createUser(200, new BigDecimal("5.00"), new BigDecimal("5.00"));
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 23, 15);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 23, 45);
    user.getStats().recordFocusCompleted(45, 1);
    user.getStats().recordFocusTimeOfDay(start, end, 45);
    assertEquals(1, user.getStats().getTotalNightFocusSessions());
    assertEquals(45, user.getStats().getLongestFocusSessionMinutes());

    FocusRecord record = new FocusRecord(
        recordId,
        userId,
        activityId,
        null,
        null,
        null,
        null,
        start,
        end.plusMinutes(15),
        FocusRecordType.POMO,
        1,
        8,
        new BigDecimal("0.50"));

    when(port.findById(recordId)).thenReturn(Optional.of(record));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(port.findMaxProductiveDurationMinutesExcludingRecord(userId, recordId)).thenReturn(30);

    useCase.execute(userId, recordId, false);

    assertEquals(30, user.getStats().getLongestFocusSessionMinutes());
    assertEquals(0, user.getStats().getTotalNightFocusSessions());
  }

  @Test
  @DisplayName("Deve reembolsar segundos exatos (não truncados para minutos) e reativar cupom esgotado")
  void shouldRefundExactSecondsForInventoryCouponRecord() {
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

    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 10, 25, 45);
    FocusRecord record = new FocusRecord(
        recordId,
        userId,
        null,
        itemId,
        "Episódio",
        start,
        end,
        FocusRecordType.STOPWATCH,
        null);

    when(port.findById(recordId)).thenReturn(Optional.of(record));
    when(inventoryItemPort.findById(itemId)).thenReturn(Optional.of(coupon));

    useCase.execute(userId, recordId, false);

    assertEquals(Optional.of(1545), coupon.getRemainingSeconds());
    assertEquals(InventoryItemStatus.AVAILABLE, coupon.getStatus());
    verify(inventoryItemPort).save(coupon);
    verify(userPort, never()).findById(any());
  }
}
