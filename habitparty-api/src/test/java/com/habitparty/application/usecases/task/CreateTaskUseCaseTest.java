package com.habitparty.application.usecases.task;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.EmailDispatchLogRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.domain.enums.task.TaskDifficulty;
import com.habitparty.core.domain.enums.task.TaskPriority;
import com.habitparty.core.domain.enums.task.TaskType;
import com.habitparty.core.domain.enums.task.TodoReminderType;

@ExtendWith(MockitoExtension.class)
class CreateTaskUseCaseTest {

  @Mock
  private TaskRepository taskPort;

  @Mock
  private BoardColumnRepository boardColumnPort;

  @Mock
  private UserRepository userPort;

  @Mock
  private EmailDispatchLogRepository emailLogPort;

  @Mock
  private WorkspaceRepository workspacePort;

  private CreateTaskUseCase useCase;

  private UUID userId;
  private UUID workspaceId;
  private UUID columnId;
  private User user;
  private BoardColumn column;

  @BeforeEach
  void setUp() {
    Clock fixedClock = Clock.fixed(Instant.parse("2026-11-16T15:00:00Z"), ZoneOffset.UTC);
    useCase = new CreateTaskUseCase(
        taskPort, boardColumnPort, userPort, emailLogPort, workspacePort, fixedClock);

    userId = UUID.randomUUID();
    workspaceId = UUID.randomUUID();
    columnId = UUID.randomUUID();

    user = new User(
        userId, UserRole.USER, true, "Hero", "hero", "hero@test.com", "pwd",
        java.math.BigDecimal.ZERO, java.math.BigDecimal.ZERO, LocalDate.of(1995, 1, 1),
        null, UserGender.MALE, 0, 0, 0, LocalDateTime.now());
    column = new BoardColumn(columnId, userId, workspaceId, "Hoje", 0, "sun", true);

    when(boardColumnPort.findById(columnId)).thenReturn(Optional.of(column));
    when(userPort.findById(userId)).thenReturn(Optional.of(user));
  }

  @Test
  @DisplayName("Deve inserir tarefa duplicada logo abaixo da tarefa referente e deslocar as seguintes em lote")
  void shouldInsertTaskRightAfterReferenceTaskAndShiftFollowingTasks() {
    UUID refTaskId = UUID.randomUUID();

    when(taskPort.findOrderIndexByIdAndBoardColumnIdAndUserId(refTaskId, columnId, userId))
        .thenReturn(Optional.of(1));
    when(taskPort.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

    CreateTaskCommand command = new CreateTaskCommand(
        "Original (Cópia)", null, TaskPriority.NONE, List.of(),
        TaskDifficulty.MEDIUM, TaskType.TODO, false, null,
        null, null, null, null, null, null, null, null,
        TodoReminderType.NONE, null, false, null, null, null, false, refTaskId);

    Task created = useCase.execute(userId, columnId, command);

    assertEquals(2, created.getOrderIndex());
    verify(taskPort).shiftOrderIndexUpAfter(columnId, 1);
    verify(taskPort, never()).findMaxOrderIndexByBoardColumnId(any());
  }

  @Test
  @DisplayName("Deve inserir no fim da coluna quando afterTaskId não pertencer à coluna ou ao usuário")
  void shouldAppendToEndWhenReferenceTaskIsNotFoundInColumn() {
    UUID missingTaskId = UUID.randomUUID();

    when(taskPort.findOrderIndexByIdAndBoardColumnIdAndUserId(missingTaskId, columnId, userId))
        .thenReturn(Optional.empty());
    when(taskPort.findMaxOrderIndexByBoardColumnId(columnId)).thenReturn(4);
    when(taskPort.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

    CreateTaskCommand command = new CreateTaskCommand(
        "Original (Cópia)", null, TaskPriority.NONE, List.of(),
        TaskDifficulty.MEDIUM, TaskType.TODO, false, null,
        null, null, null, null, null, null, null, null,
        TodoReminderType.NONE, null, false, null, null, null, false, missingTaskId);

    Task created = useCase.execute(userId, columnId, command);

    assertEquals(5, created.getOrderIndex());
    verify(taskPort, never()).shiftOrderIndexUpAfter(any(), anyInt());
  }
}
