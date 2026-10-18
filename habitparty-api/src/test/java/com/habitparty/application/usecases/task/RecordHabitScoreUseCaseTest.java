package com.habitparty.application.usecases.task;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.core.domain.entities.TransactionHistory;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.HabitImportanceType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
class RecordHabitScoreUseCaseTest {

  @Mock
  private TaskRepository taskPort;

  @Mock
  private TransactionHistoryRepository transactionPort;

  @Mock
  private UserRepository userPort;

  @InjectMocks
  private RecordHabitScoreUseCase recordHabitScoreUseCase;

  private UUID userId;
  private UUID taskId;
  private User user;
  private Habit habit;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    taskId = UUID.randomUUID();

    user = new User(
        userId, UserRole.USER, false, null, null, null, null,
        "Carlos", "carlos", "carlos@test.com", "pass",
        new BigDecimal("10.00"), new BigDecimal("10.00"),
        null, null, UserGender.MALE, 100, 0, 0, LocalDateTime.now());

    habit = new Habit(
        taskId, UUID.randomUUID(), userId, "Beber Água", "2L por dia",
        0, TaskPriority.HIGH, List.of("Saúde"), TaskDifficulty.EASY,
        TaskStatus.PENDING, TaskType.HABIT, false, null,
        LocalDateTime.now(), List.of(), 0, HabitType.BOTH,
        HabitResetCounter.DAILY, HabitImportanceType.NORMAL, null, 0, 0);
  }

  @Test
  @DisplayName("Deve registrar pontuação positiva: adiciona XP, Moedas, incrementa repetições e gera transação")
  void testPositiveDeltaIncrementsScoreAndRewardsUser() {
    when(taskPort.findById(taskId)).thenReturn(Optional.of(habit));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(userId)).thenReturn(0);
    when(taskPort.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

    Task result = recordHabitScoreUseCase.execute(taskId, userId, 1);

    assertTrue(result instanceof Habit);
    Habit updated = (Habit) result;
    assertEquals(1, updated.getPositiveCount());
    assertEquals(0, updated.getNegativeCount());
    assertEquals(1, updated.getCurrentStreak());

    assertTrue(user.getCurrentCoins().compareTo(new BigDecimal("10.00")) > 0);
    assertTrue(user.getTotalXp() > 100);

    ArgumentCaptor<TransactionHistory> txCaptor = ArgumentCaptor.forClass(TransactionHistory.class);
    verify(transactionPort).save(txCaptor.capture());
    assertEquals(TransactionType.HABIT_COMPLETED, txCaptor.getValue().getTransactionType());
  }

  @Test
  @DisplayName("Deve registrar pontuação negativa: aplica penalidade, incrementa negativeCount e gera BAD_HABIT_PENALTY")
  void testNegativeDeltaDecrementsScoreAndPenalizesUser() {
    when(taskPort.findById(taskId)).thenReturn(Optional.of(habit));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(taskPort.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

    Task result = recordHabitScoreUseCase.execute(taskId, userId, -1);

    assertTrue(result instanceof Habit);
    Habit updated = (Habit) result;
    assertEquals(0, updated.getPositiveCount());
    assertEquals(1, updated.getNegativeCount());

    assertTrue(user.getCurrentCoins().compareTo(new BigDecimal("10.00")) < 0);

    ArgumentCaptor<TransactionHistory> txCaptor = ArgumentCaptor.forClass(TransactionHistory.class);
    verify(transactionPort).save(txCaptor.capture());
    TransactionHistory tx = txCaptor.getValue();
    assertEquals(TransactionType.BAD_HABIT_PENALTY, tx.getTransactionType());
    assertTrue(tx.getGoldAmount().isPresent() && tx.getGoldAmount().get().compareTo(BigDecimal.ZERO) < 0);
  }

  @Test
  @DisplayName("Deve falhar ao tentar registrar pontuação positiva em hábito exclusivamente negativo")
  void testNegativeHabitRejectsPositiveScore() {
    Habit negativeHabit = new Habit(
        taskId, UUID.randomUUID(), userId, "Fumar", "Não fumar",
        0, TaskPriority.HIGH, List.of("Saúde"), TaskDifficulty.EASY,
        TaskStatus.PENDING, TaskType.HABIT, false, null,
        LocalDateTime.now(), List.of(), 0, HabitType.NEGATIVE,
        HabitResetCounter.DAILY, HabitImportanceType.NORMAL, null, 0, 0);

    when(taskPort.findById(taskId)).thenReturn(Optional.of(negativeHabit));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));

    assertThrows(DomainValidationException.class, () ->
        recordHabitScoreUseCase.execute(taskId, userId, 1));
  }

  @Test
  @DisplayName("Deve falhar ao tentar registrar pontuação negativa em hábito exclusivamente positivo")
  void testPositiveHabitRejectsNegativeScore() {
    Habit positiveHabit = new Habit(
        taskId, UUID.randomUUID(), userId, "Beber Água", "2L por dia",
        0, TaskPriority.HIGH, List.of("Saúde"), TaskDifficulty.EASY,
        TaskStatus.PENDING, TaskType.HABIT, false, null,
        LocalDateTime.now(), List.of(), 0, HabitType.POSITIVE,
        HabitResetCounter.DAILY, HabitImportanceType.NORMAL, null, 0, 0);

    when(taskPort.findById(taskId)).thenReturn(Optional.of(positiveHabit));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));

    assertThrows(DomainValidationException.class, () ->
        recordHabitScoreUseCase.execute(taskId, userId, -1));
  }

  @Test
  @DisplayName("Deve falhar se a tarefa não for encontrada")
  void testNotFoundThrowsException() {
    when(taskPort.findById(taskId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class, () ->
        recordHabitScoreUseCase.execute(taskId, userId, 1));
  }
}
