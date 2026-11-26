package com.habitparty.application.usecases.task;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.entities.task.Todo;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.LimitExceededException;

@ExtendWith(MockitoExtension.class)
class MoveTaskUseCaseTest {

  @Mock
  private TaskRepository taskPort;

  @Mock
  private BoardColumnRepository boardColumnPort;

  @Mock
  private WorkspaceRepository workspacePort;

  @Mock
  private UserRepository userPort;

  private MoveTaskUseCase moveTaskUseCase;

  private UUID userId;
  private UUID ws1Id;
  private UUID ws2Id;
  private UUID ws3Id;
  private UUID colWs1Id;
  private UUID colWs3Id;
  private Workspace ws1;
  private Workspace ws2;
  private Workspace ws3;
  private User freeUser;

  @BeforeEach
  void setUp() {
    moveTaskUseCase = new MoveTaskUseCase(taskPort, boardColumnPort);
    moveTaskUseCase.setWorkspaceWriteGuard(new WorkspaceWriteGuard(workspacePort, userPort, boardColumnPort));

    userId = UUID.randomUUID();
    ws1Id = UUID.randomUUID();
    ws2Id = UUID.randomUUID();
    ws3Id = UUID.randomUUID();
    colWs1Id = UUID.randomUUID();
    colWs3Id = UUID.randomUUID();

    ws1 = new Workspace(ws1Id, userId, "Ativo 1");
    ws2 = new Workspace(ws2Id, userId, "Ativo 2");
    ws3 = new Workspace(ws3Id, userId, "Bloqueado 3");

    freeUser = new User(
        userId, UserRole.USER, false, "Free", "free", "free@habitparty.com", "pwd",
        BigDecimal.ZERO, BigDecimal.ZERO, LocalDate.of(1995, 1, 1), null,
        UserGender.MALE, 0, 1, 0, LocalDateTime.now());
  }

  @Test
  @DisplayName("Bloqueia movimentação de tarefa para coluna de ambiente em modo somente-leitura no plano Free")
  void blocksMovingTaskIntoReadOnlyWorkspace() {
    UUID taskId = UUID.randomUUID();
    Task task = mock(Todo.class);
    when(task.getBoardColumnId()).thenReturn(colWs1Id);

    BoardColumn colWs1 = new BoardColumn(colWs1Id, userId, ws1Id, "Origem", 0, "sun", true);
    BoardColumn colWs3 = new BoardColumn(colWs3Id, userId, ws3Id, "Destino", 0, "lock", true);

    when(taskPort.findById(taskId)).thenReturn(Optional.of(task));
    when(boardColumnPort.findById(colWs1Id)).thenReturn(Optional.of(colWs1));
    when(boardColumnPort.findById(colWs3Id)).thenReturn(Optional.of(colWs3));
    when(userPort.findById(userId)).thenReturn(Optional.of(freeUser));
    when(workspacePort.findAllByUserId(userId)).thenReturn(List.of(ws1, ws2, ws3));

    assertThrows(
        LimitExceededException.class,
        () -> moveTaskUseCase.execute(userId, List.of(new MoveTaskCommand(taskId, colWs3Id, 0))));

    verify(taskPort, never()).saveAll(any());
  }

  @Test
  @DisplayName("Bloqueia movimentação de tarefa saindo de ambiente em modo somente-leitura no plano Free")
  void blocksMovingTaskOutOfReadOnlyWorkspace() {
    UUID taskId = UUID.randomUUID();
    Task task = mock(Todo.class);
    when(task.getBoardColumnId()).thenReturn(colWs3Id);

    BoardColumn colWs3 = new BoardColumn(colWs3Id, userId, ws3Id, "Origem Bloqueada", 0, "lock", true);

    when(taskPort.findById(taskId)).thenReturn(Optional.of(task));
    when(boardColumnPort.findById(colWs3Id)).thenReturn(Optional.of(colWs3));
    when(userPort.findById(userId)).thenReturn(Optional.of(freeUser));
    when(workspacePort.findAllByUserId(userId)).thenReturn(List.of(ws1, ws2, ws3));

    assertThrows(
        LimitExceededException.class,
        () -> moveTaskUseCase.execute(userId, List.of(new MoveTaskCommand(taskId, colWs1Id, 0))));

    verify(taskPort, never()).saveAll(any());
  }
}
