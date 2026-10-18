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
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.TransactionType;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;
import com.habitparty.core.exceptions.ResourceNotFoundException;
import com.habitparty.core.exceptions.UnauthorizedException;

@ExtendWith(MockitoExtension.class)
class ChangeTaskStatusUseCaseTest {

  @Mock
  private TaskRepository taskPort;

  @Mock
  private TransactionHistoryRepository transactionPort;

  @Mock
  private UserRepository userPort;

  @InjectMocks
  private ChangeTaskStatusUseCase changeTaskStatusUseCase;

  private UUID userId;
  private UUID taskId;
  private User user;
  private Todo todoTask;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    taskId = UUID.randomUUID();

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
        0, // streak
        0, // level
        0, // currentXp
        LocalDateTime.now()
    );

    todoTask = new Todo(
        taskId,
        UUID.randomUUID(),
        userId,
        "Estudar Spring Boot",
        "Praticar arquitetura hexagonal",
        1,
        TaskPriority.HIGH,
        List.of("estudo"),
        TaskDifficulty.MEDIUM,
        TaskStatus.PENDING,
        TaskType.TODO,
        false,
        LocalDate.now(),
        LocalDateTime.now(),
        List.of(),
        TodoReminderType.NONE,
        null,
        null
    );
  }

  @Test
  @DisplayName("Deve completar tarefa pela 1ª vez no dia e incrementar o streak do usuário")
  void testCompleteTaskFirstTimeTodayIncrementsStreak() {
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(userId)).thenReturn(0);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    var updated = changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);

    assertEquals(TaskStatus.COMPLETED, updated.getStatus());
    assertEquals(1, user.getCurrentStreak());
    assertTrue(user.getTotalXp() > 0);
    assertTrue(user.getCurrentCoins().compareTo(BigDecimal.ZERO) > 0);

    verify(userPort).save(user);

    ArgumentCaptor<TransactionHistory> captor = ArgumentCaptor.forClass(TransactionHistory.class);
    verify(transactionPort).save(captor.capture());
    assertEquals(TransactionType.TODO_COMPLETED, captor.getValue().getTransactionType());
    assertEquals(taskId, captor.getValue().getReferenceId().orElse(null));
  }

  @Test
  @DisplayName("Deve completar tarefa no mesmo dia mantendo o streak já incrementado anteriormente")
  void testCompleteTaskSubsequentTimeTodayDoesNotIncrementStreakTwice() {
    user.incrementStreak(); // Já estava streak = 1
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(userId)).thenReturn(1);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    var updated = changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);

    assertEquals(TaskStatus.COMPLETED, updated.getStatus());
    assertEquals(1, user.getCurrentStreak()); // Streak continua 1, não incrementa novamente
    verify(userPort).save(user);
    verify(transactionPort).save(any(TransactionHistory.class));
  }

  @Test
  @DisplayName("Não deve conceder recompensas duplicadas se a tarefa já estava COMPLETED")
  void testCompleteAlreadyCompletedTaskIsIdempotent() {
    todoTask.changeStatus(TaskStatus.COMPLETED);
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    var updated = changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);

    assertEquals(TaskStatus.COMPLETED, updated.getStatus());
    verifyNoInteractions(userPort);
    verifyNoInteractions(transactionPort);
  }

  @Test
  @DisplayName("Deve lançar UnauthorizedException se usuário não for o proprietário da tarefa")
  void testThrowsUnauthorizedExceptionWhenUserIsNotOwner() {
    UUID otherUserId = UUID.randomUUID();
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));

    assertThrows(UnauthorizedException.class, () ->
        changeTaskStatusUseCase.execute(taskId, otherUserId, TaskStatus.COMPLETED)
    );

    verifyNoInteractions(userPort);
    verifyNoInteractions(transactionPort);
  }

  @Test
  @DisplayName("Deve lançar ResourceNotFoundException se a tarefa não for encontrada")
  void testThrowsResourceNotFoundWhenTaskDoesNotExist() {
    when(taskPort.findById(taskId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class, () ->
        changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED)
    );
  }

  @Test
  @DisplayName("Deve conceder 50% de recompensa ao completar To-do Hardcore atrasado que já tinha penalidade aplicada")
  void testCompleteOverdueHardcoreTodoWithPenaltyAlreadyApplied() {
    Todo overdueTodo = new Todo(
        taskId, UUID.randomUUID(), userId, "Todo Atrasado", "Hardcore", 1,
        TaskPriority.HIGH, List.of(), TaskDifficulty.MEDIUM, TaskStatus.PENDING,
        TaskType.TODO, true, LocalDate.now().minusDays(1), LocalDateTime.now(), List.of(),
        TodoReminderType.NONE, null, null, true
    );

    when(taskPort.findById(taskId)).thenReturn(Optional.of(overdueTodo));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(userId)).thenReturn(0);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    var updated = changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);

    assertEquals(TaskStatus.COMPLETED, updated.getStatus());
    // Dificuldade MEDIUM com 50%: 7 XP e $1.25
    assertEquals(7, user.getTotalXp());
    assertEquals(new BigDecimal("1.25"), user.getCurrentCoins());
    verify(transactionPort, times(1)).save(any(TransactionHistory.class));
  }

  @Test
  @DisplayName("Deve aplicar penalidade pendente e conceder 50% ao completar To-do Hardcore atrasado sem penalidade prévia")
  void testCompleteOverdueHardcoreTodoWithoutPriorPenaltyAppliesPenaltyAndAwardsHalf() {
    user.addCoins(new BigDecimal("10.00"));
    user.addXp(50);

    Todo overdueTodo = new Todo(
        taskId, UUID.randomUUID(), userId, "Todo Atrasado Não Penalizado", "Hardcore", 1,
        TaskPriority.HIGH, List.of(), TaskDifficulty.MEDIUM, TaskStatus.PENDING,
        TaskType.TODO, true, LocalDate.now().minusDays(1), LocalDateTime.now(), List.of(),
        TodoReminderType.NONE, null, null, false
    );

    when(taskPort.findById(taskId)).thenReturn(Optional.of(overdueTodo));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
    when(transactionPort.countCompletedTasksToday(userId)).thenReturn(0);
    when(taskPort.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

    var updated = changeTaskStatusUseCase.execute(taskId, userId, TaskStatus.COMPLETED);

    assertEquals(TaskStatus.COMPLETED, updated.getStatus());
    assertTrue(overdueTodo.isPenaltyApplied());
    // 2 transações: 1 de penalidade (TASK_FAILED) e 1 de conclusão tardia (TASK_COMPLETED)
    verify(transactionPort, times(2)).save(any(TransactionHistory.class));
    // Saldo: 10.00 - 1.25 (multa de 50% de 2.50) + 1.25 (ganho tardio de 50%) = 10.00
    assertEquals(new BigDecimal("10.00"), user.getCurrentCoins());
  }
}
