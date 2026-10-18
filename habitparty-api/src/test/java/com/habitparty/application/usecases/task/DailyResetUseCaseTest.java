package com.habitparty.application.usecases.task;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import com.habitparty.core.domain.entities.task.Daily;
import com.habitparty.core.domain.entities.task.Habit;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.DailyRepeatType;
import com.habitparty.core.domain.enums.task.HabitImportanceType;
import com.habitparty.core.domain.enums.task.HabitResetCounter;
import com.habitparty.core.domain.enums.task.HabitType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;

@ExtendWith(MockitoExtension.class)
class DailyResetUseCaseTest {

  @Mock
  private TaskRepository port;

  @Mock
  private TransactionHistoryRepository transactionPort;

  @Mock
  private UserRepository userPort;

  @InjectMocks
  private DailyResetUseCase dailyResetUseCase;

  private UUID userId;
  private User user;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    user = new User(
        userId,
        UserRole.USER,
        false,
        "Aventureiro",
        "aventureiro",
        "aventureiro@habitparty.com",
        "hashed_pwd",
        new BigDecimal("100.00"), // gold
        BigDecimal.ZERO,
        LocalDate.of(1995, 1, 1),
        null,
        UserGender.MALE,
        5, // streak
        2, // level
        100, // currentXp
        LocalDateTime.now()
    );
  }

  @Test
  @DisplayName("Deve resetar tarefa recorrente concluída para PENDING e salvar todas de uma única vez")
  void testCompletedRecurringTaskIsResetToPending() {
    Daily daily = new Daily(
        UUID.randomUUID(),
        UUID.randomUUID(),
        userId,
        "Meditar 10 minutos",
        "Atenção plena",
        1,
        TaskPriority.HIGH,
        List.of("mindfulness"),
        TaskDifficulty.MEDIUM,
        TaskStatus.COMPLETED,
        TaskType.DAILY,
        false,
        LocalDate.now().minusDays(1),
        LocalDateTime.now().minusDays(2),
        List.of(),
        3,
        LocalDate.now().minusDays(1),
        DailyRepeatType.DAILY,
        1,
        null,
        null,
        null
    );

    when(port.findAllRecurringTasks()).thenReturn(List.of(daily));

    dailyResetUseCase.executeDailyRollover();

    assertEquals(TaskStatus.PENDING, daily.getStatus());
    verify(port, times(1)).saveAll(List.of(daily));
    verify(port, never()).save(any());
    verifyNoInteractions(userPort);
    verifyNoInteractions(transactionPort);
  }

  @Test
  @DisplayName("Deve quebrar streak de hábito pendente e aplicar penalidade no modo Hardcore")
  void testPendingHabitBreaksStreakAndAppliesHardcorePenalty() {
    Habit habit = new Habit(
        UUID.randomUUID(),
        UUID.randomUUID(),
        userId,
        "Ler 20 páginas",
        "Leitura diária",
        1,
        TaskPriority.HIGH,
        List.of("leitura"),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.HABIT,
        true, // isHardcoreModeEnabled = true
        null,
        LocalDateTime.now().minusDays(10),
        List.of(),
        5, // currentStreak
        HabitType.POSITIVE,
        HabitResetCounter.DAILY,
        HabitImportanceType.NORMAL,
        LocalDateTime.now().minusDays(2)
    );

    when(port.findAllRecurringTasks()).thenReturn(List.of(habit));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));

    dailyResetUseCase.executeDailyRollover();

    assertEquals(0, habit.getCurrentStreak());
    // Penalidade aplicada ao usuário
    assertTrue(user.getCurrentCoins().compareTo(new BigDecimal("100.00")) < 0);
    assertTrue(user.getTotalXp() < 100);

    verify(userPort).save(user);

    ArgumentCaptor<TransactionHistory> captor = ArgumentCaptor.forClass(TransactionHistory.class);
    verify(transactionPort).save(captor.capture());
    assertEquals(TransactionType.TASK_FAILED, captor.getValue().getTransactionType());
    assertTrue(captor.getValue().getGoldAmount().orElse(BigDecimal.ZERO).compareTo(BigDecimal.ZERO) < 0);
    assertTrue(captor.getValue().getXpAmount() < 0);

    verify(port, times(1)).saveAll(List.of(habit));
  }

  @Test
  @DisplayName("Deve quebrar streak de Daily vencida ontem, reagendar e salvar")
  void testPendingDailyDueYesterdayBreaksStreakAndShiftsOccurrence() {
    LocalDate yesterday = LocalDate.now().minusDays(1);
    Daily daily = new Daily(
        UUID.randomUUID(),
        UUID.randomUUID(),
        userId,
        "Fazer exercícios",
        "Treino aeróbico",
        1,
        TaskPriority.HIGH,
        List.of("fitness"),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.DAILY,
        false, // not hardcore
        yesterday,
        LocalDateTime.now().minusDays(3),
        List.of(),
        4, // currentStreak
        yesterday,
        DailyRepeatType.DAILY,
        1,
        null,
        null,
        null
    );

    when(port.findAllRecurringTasks()).thenReturn(List.of(daily));

    dailyResetUseCase.executeDailyRollover();

    assertEquals(0, daily.getCurrentStreak());
    // Data foi empurrada para frente a partir de hoje
    assertTrue(!daily.getDueDate().get().isBefore(LocalDate.now()));
    verify(port, times(1)).saveAll(List.of(daily));
    verifyNoInteractions(userPort);
    verifyNoInteractions(transactionPort);
  }

  @Test
  @DisplayName("Não deve penalizar Daily pendente cujo vencimento é futuro")
  void testPendingDailyDueInFutureIsNotPenalized() {
    LocalDate tomorrow = LocalDate.now().plusDays(1);
    Daily daily = new Daily(
        UUID.randomUUID(),
        UUID.randomUUID(),
        userId,
        "Revisão semanal",
        "Revisar metas",
        1,
        TaskPriority.MEDIUM,
        List.of("planejamento"),
        TaskDifficulty.EASY,
        TaskStatus.PENDING,
        TaskType.DAILY,
        true, // hardcore mode
        tomorrow,
        LocalDateTime.now().minusDays(1),
        List.of(),
        2,
        tomorrow,
        DailyRepeatType.DAILY,
        1,
        null,
        null,
        null
    );

    when(port.findAllRecurringTasks()).thenReturn(List.of(daily));

    dailyResetUseCase.executeDailyRollover();

    assertEquals(2, daily.getCurrentStreak()); // streak mantido
    verifyNoInteractions(userPort);
    verifyNoInteractions(transactionPort);
    verify(port, times(1)).saveAll(List.of(daily));
  }

  @Test
  @DisplayName("Deve penalizar Todo hardcore pendente que venceu ontem e marcar penalidade aplicada")
  void testOverdueHardcoreTodoIsPenalizedAndMarked() {
    LocalDate yesterday = LocalDate.now().minusDays(1);
    Todo todo = new Todo(
        UUID.randomUUID(),
        UUID.randomUUID(),
        userId,
        "Entrega de Projeto",
        "Finalizar código",
        1,
        TaskPriority.HIGH,
        List.of("trabalho"),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.TODO,
        true, // hardcore mode
        yesterday,
        LocalDateTime.now().minusDays(3),
        List.of(),
        TodoReminderType.NONE,
        null,
        null,
        false // penalty not yet applied
    );

    when(port.findAllRecurringTasks()).thenReturn(List.of());
    when(port.findOverdueHardcoreTodos(any(LocalDate.class))).thenReturn(List.of(todo));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));

    dailyResetUseCase.executeDailyRollover();

    assertTrue(todo.isPenaltyApplied());
    verify(userPort, times(1)).save(user);
    verify(transactionPort, times(1)).save(any(TransactionHistory.class));
    verify(port, times(1)).saveAll(List.of(todo));
  }
}
