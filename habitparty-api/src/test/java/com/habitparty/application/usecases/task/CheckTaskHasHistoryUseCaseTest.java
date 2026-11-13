package com.habitparty.application.usecases.task;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
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
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;
import com.habitparty.core.exceptions.ResourceNotFoundException;
import com.habitparty.core.exceptions.UnauthorizedException;

@ExtendWith(MockitoExtension.class)
class CheckTaskHasHistoryUseCaseTest {

  @Mock
  private TaskRepository taskPort;

  @Mock
  private TransactionHistoryRepository transactionPort;

  @Mock
  private FocusRecordRepository focusRecordPort;

  @InjectMocks
  private CheckTaskHasHistoryUseCase useCase;

  private UUID userId;
  private UUID taskId;
  private Todo todoTask;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    taskId = UUID.randomUUID();

    todoTask = new Todo(
        taskId,
        UUID.randomUUID(),
        userId,
        "Estudar Testes",
        null,
        0,
        TaskPriority.MEDIUM,
        List.of(),
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
  @DisplayName("Deve retornar true quando existir registro em transaction_history para a tarefa")
  void shouldReturnTrueWhenTransactionHistoryExists() {
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(transactionPort.existsByReferenceIdAndUserId(taskId, userId)).thenReturn(true);

    boolean result = useCase.execute(taskId, userId);

    assertTrue(result);
    verify(focusRecordPort, never()).existsStandaloneByTaskId(taskId);
  }

  @Test
  @DisplayName("Deve retornar true quando existir registro de foco avulso vinculado à tarefa")
  void shouldReturnTrueWhenStandaloneFocusRecordExists() {
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(transactionPort.existsByReferenceIdAndUserId(taskId, userId)).thenReturn(false);
    when(focusRecordPort.existsStandaloneByTaskId(taskId)).thenReturn(true);

    boolean result = useCase.execute(taskId, userId);

    assertTrue(result);
  }

  @Test
  @DisplayName("Deve retornar false quando não houver histórico vinculado à tarefa")
  void shouldReturnFalseWhenNoHistoryExists() {
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(transactionPort.existsByReferenceIdAndUserId(taskId, userId)).thenReturn(false);
    when(focusRecordPort.existsStandaloneByTaskId(taskId)).thenReturn(false);

    boolean result = useCase.execute(taskId, userId);

    assertFalse(result);
  }

  @Test
  @DisplayName("Deve lançar ResourceNotFoundException quando tarefa não existir")
  void shouldThrowWhenTaskNotFound() {
    when(taskPort.findById(taskId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class, () -> useCase.execute(taskId, userId));
  }

  @Test
  @DisplayName("Deve lançar UnauthorizedException quando tarefa pertencer a outro usuário")
  void shouldThrowWhenNotOwner() {
    UUID otherUserId = UUID.randomUUID();
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));

    assertThrows(UnauthorizedException.class, () -> useCase.execute(taskId, otherUserId));
  }
}
