package com.habitparty.application.usecases.task;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.TransactionHistoryRepository;
import com.habitparty.core.domain.entities.focus.FocusRecord;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.FocusRecordType;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskStatus;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;

@ExtendWith(MockitoExtension.class)
class DeleteTaskUseCaseTest {

  @Mock
  private TaskRepository taskPort;

  @Mock
  private TransactionHistoryRepository transactionPort;

  @Mock
  private FocusRecordRepository focusRecordPort;

  private DeleteTaskUseCase useCase;

  private UUID userId;
  private UUID taskId;
  private Todo todoTask;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    taskId = UUID.randomUUID();
    useCase = new DeleteTaskUseCase(taskPort, transactionPort);
    useCase.setFocusRecordPort(focusRecordPort);

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
  @DisplayName("Deve remover registros de foco avulsos em lote quando deleteHistory=true")
  void shouldBatchDeleteStandaloneFocusRecordsWhenDeleteHistoryIsTrue() {
    UUID standaloneId1 = UUID.randomUUID();
    UUID standaloneId2 = UUID.randomUUID();
    UUID activityLinkedId = UUID.randomUUID();
    UUID activityId = UUID.randomUUID();
    LocalDateTime start = LocalDateTime.now().minusMinutes(30);
    LocalDateTime end = LocalDateTime.now();

    FocusRecord standalone1 = new FocusRecord(
        standaloneId1, userId, null, null, taskId, "Estudar Testes", null, start, end,
        FocusRecordType.POMO, 1);
    FocusRecord standalone2 = new FocusRecord(
        standaloneId2, userId, null, null, taskId, "Estudar Testes", null, start, end,
        FocusRecordType.STOPWATCH, null);
    FocusRecord activityLinked = new FocusRecord(
        activityLinkedId, userId, activityId, null, taskId, "Estudar Testes", null, start, end,
        FocusRecordType.POMO, 1);

    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(focusRecordPort.findAllByTaskId(taskId))
        .thenReturn(List.of(standalone1, activityLinked, standalone2));

    useCase.execute(taskId, userId, true);

    List<UUID> expectedStandaloneIds = List.of(standaloneId1, standaloneId2);
    verify(transactionPort).deleteAllByReferenceIdsAndUserId(expectedStandaloneIds, userId);
    verify(focusRecordPort, times(1)).deleteAllByIds(expectedStandaloneIds);
    verify(focusRecordPort, never()).deleteById(standaloneId1);
    verify(focusRecordPort, never()).deleteById(standaloneId2);
    verify(focusRecordPort).nullifyTaskId(taskId);
    verify(transactionPort).deleteAllByReferenceIdAndUserId(taskId, userId);
    verify(taskPort).deleteById(taskId);
  }

  @Test
  @DisplayName("Não deve chamar exclusão em lote quando houver apenas registros ligados a atividade")
  void shouldSkipBatchDeleteWhenOnlyActivityLinkedFocusRecordsExist() {
    UUID activityLinkedId = UUID.randomUUID();
    UUID activityId = UUID.randomUUID();
    LocalDateTime start = LocalDateTime.now().minusMinutes(20);
    LocalDateTime end = LocalDateTime.now();

    FocusRecord activityLinked = new FocusRecord(
        activityLinkedId, userId, activityId, null, taskId, "Estudar Testes", null, start, end,
        FocusRecordType.POMO, 1);

    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));
    when(focusRecordPort.findAllByTaskId(taskId)).thenReturn(List.of(activityLinked));

    useCase.execute(taskId, userId, true);

    verify(focusRecordPort, never()).deleteAllByIds(anyList());
    verify(transactionPort, never()).deleteAllByReferenceIdsAndUserId(anyList(), eq(userId));
    verify(focusRecordPort).nullifyTaskId(taskId);
    verify(transactionPort).deleteAllByReferenceIdAndUserId(taskId, userId);
    verify(taskPort).deleteById(taskId);
  }

  @Test
  @DisplayName("Quando deleteHistory=false, apenas desvincula taskId sem excluir histórico")
  void shouldOnlyNullifyTaskIdWhenDeleteHistoryIsFalse() {
    when(taskPort.findById(taskId)).thenReturn(Optional.of(todoTask));

    useCase.execute(taskId, userId, false);

    verify(focusRecordPort).nullifyTaskId(taskId);
    verify(focusRecordPort, never()).findAllByTaskId(taskId);
    verify(focusRecordPort, never()).deleteAllByIds(anyList());
    verify(transactionPort, never()).deleteAllByReferenceIdAndUserId(taskId, userId);
    verify(taskPort).deleteById(taskId);
  }
}
