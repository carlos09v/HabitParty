package com.habitparty.application.usecases.focus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.exceptions.LimitExceededException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.FocusActivityRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.focus.FocusActivity;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.InventoryItemStatus;
import com.habitparty.core.domain.enums.RewardType;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;

@ExtendWith(MockitoExtension.class)
class CreateFocusRecordUseCaseTest {

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

  @InjectMocks
  private CreateFocusRecordUseCase useCase;

  private UUID userId;
  private UUID activityId;
  private UUID inventoryItemId;
  private User user;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    activityId = UUID.randomUUID();
    inventoryItemId = UUID.randomUUID();

    user = new User(
        userId,
        UserRole.USER,
        false,
        "Hero Test",
        "herotest",
        "hero@habitparty.com",
        "hashed_pwd",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1995, 1, 1),
        null,
        UserGender.MALE,
        0,
        0,
        0,
        LocalDateTime.now());
  }

  @Test
  @DisplayName("Sessão de atividade produtiva deve calcular XP/Gold, creditar no User e registrar transação")
  void shouldCreditUserAndLogTransactionForProductiveFocus() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 9, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 9, 30); // 30 min, 1 pomo -> 8 XP, 0.25 moedas

    CreateFocusRecordCommand command = new CreateFocusRecordCommand(
        activityId,
        null,
        "Estudo de Java",
        start,
        end,
        FocusRecordType.POMO,
        1);

    FocusActivity activity = new FocusActivity(
        activityId,
        userId,
        "Estudos",
        "book",
        0,
        FocusRecordType.POMO,
        30,
        LocalDateTime.now());

    when(port.sumFocusMinutesToday(userId)).thenReturn(0);
    when(port.save(any(FocusRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(focusActivityPort.findById(activityId)).thenReturn(Optional.of(activity));
    when(focusActivityPort.findAllByUserIdOrderByOrderIndex(userId)).thenReturn(List.of(activity));

    FocusRecord result = useCase.execute(userId, command);

    assertNotNull(result);
    assertEquals(8, result.getXpEarned().orElse(0));
    assertEquals(new BigDecimal("0.25"), result.getCoinsEarned().orElse(BigDecimal.ZERO));

    // Verifica que o User recebeu o XP e as moedas
    assertEquals(8, user.getTotalXp());
    assertEquals(new BigDecimal("0.25"), user.getCurrentCoins());
    verify(userPort).save(user);

    // Verifica que a transação foi salva com os valores corretos
    ArgumentCaptor<TransactionHistory> txCaptor = ArgumentCaptor.forClass(TransactionHistory.class);
    verify(transactionHistoryPort).save(txCaptor.capture());
    TransactionHistory tx = txCaptor.getValue();
    assertEquals(TransactionType.FOCUS_COMPLETED, tx.getTransactionType());
    assertEquals(8, tx.getXpAmount());
    assertEquals(Optional.of(new BigDecimal("0.25")), tx.getGoldAmount());
    assertEquals("Estudos", tx.getNameSnapshot());
  }

  @Test
  @DisplayName("Deve lançar LimitExceededException quando usuário Free tentar focar em atividade além da cota de 4")
  void shouldThrowLimitExceededWhenActivityIsBeyondFreeLimit() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 9, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 9, 30);

    CreateFocusRecordCommand command = new CreateFocusRecordCommand(
        activityId,
        null,
        "Estudo Excedente",
        start,
        end,
        FocusRecordType.POMO,
        1);

    FocusActivity activity = new FocusActivity(
        activityId,
        userId,
        "Atividade 5",
        "book",
        4,
        FocusRecordType.POMO,
        30,
        LocalDateTime.now());

    when(focusActivityPort.findById(activityId)).thenReturn(Optional.of(activity));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));

    List<FocusActivity> activities = List.of(
        new FocusActivity(UUID.randomUUID(), userId, "A1", "book", 0, FocusRecordType.POMO, 30, LocalDateTime.now()),
        new FocusActivity(UUID.randomUUID(), userId, "A2", "book", 1, FocusRecordType.POMO, 30, LocalDateTime.now()),
        new FocusActivity(UUID.randomUUID(), userId, "A3", "book", 2, FocusRecordType.POMO, 30, LocalDateTime.now()),
        new FocusActivity(UUID.randomUUID(), userId, "A4", "book", 3, FocusRecordType.POMO, 30, LocalDateTime.now()),
        activity
    );
    when(focusActivityPort.findAllByUserIdOrderByOrderIndex(userId)).thenReturn(activities);

    assertThrows(LimitExceededException.class, () -> useCase.execute(userId, command));
  }

  @Test
  @DisplayName("Uso de item de inventário (mochila) deve deduzir tempo e NÃO deve creditar XP/moedas")
  void shouldDeductTimeAndNotCreditUserForInventoryItem() {
    LocalDateTime start = LocalDateTime.of(2026, 10, 16, 10, 0);
    LocalDateTime end = LocalDateTime.of(2026, 10, 16, 10, 20); // 20 min = 1200 seg

    CreateFocusRecordCommand command = new CreateFocusRecordCommand(
        null,
        inventoryItemId,
        "Jogando switch",
        start,
        end,
        FocusRecordType.STOPWATCH,
        null);

    InventoryItem item = new InventoryItem(
        inventoryItemId,
        userId,
        UUID.randomUUID(),
        "Jogar Videogame",
        new BigDecimal("10.00"),
        RewardType.TIME_BASED,
        InventoryItemStatus.IN_FOCUS,
        0,
        "gamepad",
        null,
        1800, // 30 min disponíveis
        LocalDateTime.now());

    when(inventoryItemPort.findById(inventoryItemId)).thenReturn(Optional.of(item));
    when(port.save(any(FocusRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));

    FocusRecord result = useCase.execute(userId, command);

    assertNotNull(result);
    assertEquals(0, result.getXpEarned().orElse(0));
    assertEquals(new BigDecimal("0.00"), result.getCoinsEarned().orElse(BigDecimal.ZERO));

    // Item deve ter perdido 1200 segundos (1800 - 1200 = 600 segundos)
    assertEquals(600, item.getRemainingSeconds().orElse(0));
    verify(inventoryItemPort).save(item);

    // Usuário NUNCA deve ser alterado
    verify(userPort, never()).save(any());
    // Transação FOCUS_COMPLETED não é gerada para itens de inventário
    verify(transactionHistoryPort, never()).save(any());
  }
}
