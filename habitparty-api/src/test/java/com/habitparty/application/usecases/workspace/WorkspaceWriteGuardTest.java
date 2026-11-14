package com.habitparty.application.usecases.workspace;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
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
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.LimitExceededException;

@ExtendWith(MockitoExtension.class)
class WorkspaceWriteGuardTest {

  @Mock
  private WorkspaceRepository workspacePort;

  @Mock
  private UserRepository userPort;

  @Mock
  private BoardColumnRepository boardColumnPort;

  @Mock
  private TaskRepository taskPort;

  private WorkspaceWriteGuard guard;

  private UUID userId;
  private UUID ws1Id;
  private UUID ws2Id;
  private UUID ws3Id;
  private Workspace ws1;
  private Workspace ws2;
  private Workspace ws3;
  private User freeUser;

  @BeforeEach
  void setUp() {
    guard = new WorkspaceWriteGuard(workspacePort, userPort, boardColumnPort);
    userId = UUID.randomUUID();
    ws1Id = UUID.randomUUID();
    ws2Id = UUID.randomUUID();
    ws3Id = UUID.randomUUID();
    ws1 = new Workspace(ws1Id, userId, "Ambiente 1");
    ws2 = new Workspace(ws2Id, userId, "Ambiente 2");
    ws3 = new Workspace(ws3Id, userId, "Ambiente 3");

    freeUser = new User(
        userId, UserRole.USER, false, "Free", "free", "free@habitparty.com", "pwd",
        BigDecimal.ZERO, BigDecimal.ZERO, LocalDate.of(1995, 1, 1), null,
        UserGender.MALE, 0, 1, 0, LocalDateTime.now());
  }

  @Test
  @DisplayName("Permite escrita nos dois primeiros ambientes do plano Free e bloqueia a partir do 3º")
  void allowsFirstTwoWorkspacesAndBlocksThirdOnFreePlan() {
    when(userPort.findById(userId)).thenReturn(Optional.of(freeUser));
    when(workspacePort.findAllByUserId(userId)).thenReturn(List.of(ws1, ws2, ws3));

    assertDoesNotThrow(() -> guard.assertWorkspaceWritable(ws1Id, userId));
    assertDoesNotThrow(() -> guard.assertWorkspaceWritable(ws2Id, userId));
    assertThrows(LimitExceededException.class, () -> guard.assertWorkspaceWritable(ws3Id, userId));
  }

  @Test
  @DisplayName("Permite escrita no 3º ambiente quando o usuário é Premium")
  void allowsThirdWorkspaceForPremiumUser() {
    freeUser.activateSubscription("cus_1", "sub_1", LocalDateTime.now().plusMonths(1));
    when(userPort.findById(userId)).thenReturn(Optional.of(freeUser));

    assertDoesNotThrow(() -> guard.assertWorkspaceWritable(ws3Id, userId));
    verifyNoInteractions(workspacePort, boardColumnPort);
  }

  @Test
  @DisplayName("Bloqueia mutação de coluna e tarefa pertencentes ao 3º ambiente no plano Free")
  void blocksColumnAndTaskMutationInExcessFreeWorkspace() {
    UUID lockedColId = UUID.randomUUID();
    UUID lockedTaskId = UUID.randomUUID();
    BoardColumn lockedColumn = new BoardColumn(lockedColId, userId, ws3Id, "Bloqueada", 0, "lock", true);
    Task lockedTask = mock(Task.class);
    when(lockedTask.getBoardColumnId()).thenReturn(lockedColId);

    when(userPort.findById(userId)).thenReturn(Optional.of(freeUser));
    when(boardColumnPort.findById(lockedColId)).thenReturn(Optional.of(lockedColumn));
    when(taskPort.findById(lockedTaskId)).thenReturn(Optional.of(lockedTask));
    when(workspacePort.findAllByUserId(userId)).thenReturn(List.of(ws1, ws2, ws3));

    assertThrows(LimitExceededException.class,
        () -> guard.assertColumnWritable(lockedColId, userId));
    assertThrows(LimitExceededException.class,
        () -> guard.assertTaskWritable(taskPort, lockedTaskId, userId, "Somente leitura"));
  }
}
