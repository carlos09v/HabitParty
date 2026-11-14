package com.habitparty.application.usecases.boardcolumn;

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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.enums.UserGender;
import com.habitparty.core.domain.enums.UserRole;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.UnauthorizedException;

@ExtendWith(MockitoExtension.class)
class MoveBoardColumnUseCaseTest {

  @Mock
  private BoardColumnRepository port;

  @Mock
  private WorkspaceRepository workspacePort;

  @Mock
  private UserRepository userPort;

  private MoveBoardColumnUseCase moveBoardColumnUseCase;

  private UUID userId;
  private UUID ws1Id;
  private UUID ws2Id;
  private UUID ws3Id;
  private UUID columnId;
  private User freeUser;
  private Workspace ws1;
  private Workspace ws2;
  private Workspace ws3;
  private BoardColumn column;

  @BeforeEach
  void setUp() {
    moveBoardColumnUseCase = new MoveBoardColumnUseCase(port, workspacePort, userPort);

    userId = UUID.randomUUID();
    ws1Id = UUID.randomUUID();
    ws2Id = UUID.randomUUID();
    ws3Id = UUID.randomUUID();
    columnId = UUID.randomUUID();

    freeUser = new User(
        userId,
        UserRole.USER,
        false,
        "Aventureiro",
        "aventureiro",
        "aventureiro@habitparty.com",
        "hashed_pwd",
        BigDecimal.ZERO,
        BigDecimal.ZERO,
        LocalDate.of(1995, 1, 1),
        null,
        UserGender.MALE,
        0,
        1,
        0,
        LocalDateTime.now()
    );

    ws1 = new Workspace(ws1Id, userId, "Principal");
    ws2 = new Workspace(ws2Id, userId, "Estudos");
    ws3 = new Workspace(ws3Id, userId, "Arquivo Extra");

    column = new BoardColumn(columnId, userId, ws1Id, "Manhã", 1, "sun", false);
  }

  @Test
  @DisplayName("Move coluna para ambiente de destino vazio usando orderIndex 0 e isVisible true")
  void movesColumnToEmptyTargetWorkspace() {
    when(port.findById(columnId)).thenReturn(Optional.of(column));
    when(workspacePort.findById(ws2Id)).thenReturn(Optional.of(ws2));
    when(userPort.findById(userId)).thenReturn(Optional.of(freeUser));
    when(workspacePort.findAllByUserId(userId)).thenReturn(List.of(ws1, ws2));
    when(port.countByWorkspaceId(ws2Id)).thenReturn(0);
    when(port.save(any(BoardColumn.class))).thenAnswer(inv -> inv.getArgument(0));

    BoardColumn moved = moveBoardColumnUseCase.execute(columnId, new MoveBoardColumnCommand(ws2Id), userId);

    assertEquals(ws2Id, moved.getWorkspaceId());
    assertEquals(0, moved.getOrderIndex());
    assertTrue(moved.isVisible());
    verify(port).shiftColumnsDown(ws1Id, 1);
    verify(port, never()).getMaxOrderIndex(ws2Id);
    verify(port).save(column);
  }

  @Test
  @DisplayName("Move coluna para ambiente populado aplicando maxOrderIndex + 1 e ocultando quando >= 4 para Premium")
  void movesColumnToPopulatedTargetWorkspaceForPremium() {
    freeUser.activateSubscription("cus_1", "sub_1", LocalDateTime.now().plusMonths(1));
    BoardColumn hiddenCol = new BoardColumn(columnId, userId, ws1Id, "Projetos", 2, "wand", true);

    when(port.findById(columnId)).thenReturn(Optional.of(hiddenCol));
    when(workspacePort.findById(ws3Id)).thenReturn(Optional.of(ws3));
    when(userPort.findById(userId)).thenReturn(Optional.of(freeUser));
    when(port.countByWorkspaceId(ws3Id)).thenReturn(4);
    when(port.getMaxOrderIndex(ws3Id)).thenReturn(3);
    when(port.save(any(BoardColumn.class))).thenAnswer(inv -> inv.getArgument(0));

    BoardColumn moved = moveBoardColumnUseCase.execute(columnId, new MoveBoardColumnCommand(ws3Id), userId);

    assertEquals(ws3Id, moved.getWorkspaceId());
    assertEquals(4, moved.getOrderIndex());
    assertFalse(moved.isVisible());
    verify(port).shiftColumnsDown(ws1Id, 2);
  }

  @Test
  @DisplayName("Bloqueia movimentação quando ambiente de destino já pertence à coluna")
  void rejectsSameWorkspaceMove() {
    when(port.findById(columnId)).thenReturn(Optional.of(column));

    assertThrows(
        DomainValidationException.class,
        () -> moveBoardColumnUseCase.execute(columnId, new MoveBoardColumnCommand(ws1Id), userId)
    );
    verify(port, never()).save(any());
  }

  @Test
  @DisplayName("Bloqueia usuário Free de mover coluna para ambiente em modo somente-leitura (3º workspace)")
  void rejectsMovingIntoReadOnlyWorkspaceOnFreePlan() {
    when(port.findById(columnId)).thenReturn(Optional.of(column));
    when(workspacePort.findById(ws3Id)).thenReturn(Optional.of(ws3));
    when(userPort.findById(userId)).thenReturn(Optional.of(freeUser));
    when(workspacePort.findAllByUserId(userId)).thenReturn(List.of(ws1, ws2, ws3));

    assertThrows(
        LimitExceededException.class,
        () -> moveBoardColumnUseCase.execute(columnId, new MoveBoardColumnCommand(ws3Id), userId)
    );
    verify(port, never()).shiftColumnsDown(any(), anyInt());
    verify(port, never()).save(any());
  }

  @Test
  @DisplayName("Bloqueia usuário Free de mover coluna saindo de ambiente em modo somente-leitura (3º workspace)")
  void rejectsMovingOutOfReadOnlyWorkspaceOnFreePlan() {
    BoardColumn readOnlyCol = new BoardColumn(columnId, userId, ws3Id, "Bloqueada", 0, "lock", true);

    when(port.findById(columnId)).thenReturn(Optional.of(readOnlyCol));
    when(workspacePort.findById(ws1Id)).thenReturn(Optional.of(ws1));
    when(userPort.findById(userId)).thenReturn(Optional.of(freeUser));
    when(workspacePort.findAllByUserId(userId)).thenReturn(List.of(ws1, ws2, ws3));

    assertThrows(
        LimitExceededException.class,
        () -> moveBoardColumnUseCase.execute(columnId, new MoveBoardColumnCommand(ws1Id), userId)
    );
    verify(port, never()).shiftColumnsDown(any(), anyInt());
    verify(port, never()).save(any());
  }

  @Test
  @DisplayName("Bloqueia movimentação quando ambiente de destino atingiu o limite de listas do plano")
  void rejectsWhenTargetWorkspaceReachedColumnLimit() {
    when(port.findById(columnId)).thenReturn(Optional.of(column));
    when(workspacePort.findById(ws2Id)).thenReturn(Optional.of(ws2));
    when(userPort.findById(userId)).thenReturn(Optional.of(freeUser));
    when(workspacePort.findAllByUserId(userId)).thenReturn(List.of(ws1, ws2));
    when(port.countByWorkspaceId(ws2Id)).thenReturn(4);

    assertThrows(
        LimitExceededException.class,
        () -> moveBoardColumnUseCase.execute(columnId, new MoveBoardColumnCommand(ws2Id), userId)
    );
    verify(port, never()).save(any());
  }

  @Test
  @DisplayName("Bloqueia quando usuário logado não é dono do workspace de destino")
  void rejectsWhenTargetWorkspaceBelongsToAnotherUser() {
    Workspace otherUserWorkspace = new Workspace(ws2Id, UUID.randomUUID(), "Alheio");
    when(port.findById(columnId)).thenReturn(Optional.of(column));
    when(workspacePort.findById(ws2Id)).thenReturn(Optional.of(otherUserWorkspace));

    assertThrows(
        UnauthorizedException.class,
        () -> moveBoardColumnUseCase.execute(columnId, new MoveBoardColumnCommand(ws2Id), userId)
    );
    verify(port, never()).save(any());
  }
}
