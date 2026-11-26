package com.habitparty.application.usecases.boardcolumn;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.DomainValidationException;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class MoveBoardColumnUseCase {
  private static final int FREE_COLUMN_LIMIT = 4;
  private static final int PREMIUM_COLUMN_LIMIT = 6;
  private static final int DEFAULT_VISIBLE_COLUMN_LIMIT = 4;

  private final BoardColumnRepository port;
  private final WorkspaceRepository workspacePort;
  private final UserRepository userPort;
  private WorkspaceWriteGuard workspaceWriteGuard;

  public MoveBoardColumnUseCase(
      BoardColumnRepository port,
      WorkspaceRepository workspacePort,
      UserRepository userPort) {
    this.port = port;
    this.workspacePort = workspacePort;
    this.userPort = userPort;
  }

  @Autowired
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  public BoardColumn execute(UUID boardColumnId, MoveBoardColumnCommand command, UUID userIdLogado) {
    if (command == null || command.targetWorkspaceId() == null) {
      throw new DomainValidationException("O ID do ambiente de destino é obrigatório.");
    }

    BoardColumn column = port.findById(boardColumnId)
        .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada!"));
    column.validateOwnership(userIdLogado);

    UUID sourceWorkspaceId = column.getWorkspaceId();
    UUID targetWorkspaceId = command.targetWorkspaceId();

    if (sourceWorkspaceId.equals(targetWorkspaceId)) {
      throw new DomainValidationException("A coluna já pertence ao ambiente de destino.");
    }

    Workspace targetWorkspace = workspacePort.findById(targetWorkspaceId)
        .orElseThrow(() -> new ResourceNotFoundException("Workspace de destino não encontrado!"));
    targetWorkspace.validateOwnership(userIdLogado);

    User user = userPort.findById(userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));

    if (!user.isPremium()) {
      WorkspaceWriteGuard guard = workspaceWriteGuard != null
          ? workspaceWriteGuard
          : new WorkspaceWriteGuard(workspacePort, userPort, port);
      guard.assertWorkspaceWritable(
          user,
          sourceWorkspaceId,
          "O ambiente de origem está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para mover listas dele!");
      guard.assertWorkspaceWritable(
          user,
          targetWorkspaceId,
          "O ambiente de destino está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para mover listas para ele!");
    }

    int limit = user.isPremium() ? PREMIUM_COLUMN_LIMIT : FREE_COLUMN_LIMIT;
    int targetCount = port.countByWorkspaceId(targetWorkspaceId);

    if (targetCount >= limit) {
      throw new LimitExceededException(
          "Limite de " + limit + " listas no ambiente de destino atingido. " +
              (user.isPremium()
                  ? "O ambiente de destino já atingiu o teto máximo."
                  : "Assine o plano Premium para ter até 6 listas por ambiente!")
      );
    }

    int oldOrderIndex = column.getOrderIndex();
    port.shiftColumnsDown(sourceWorkspaceId, oldOrderIndex);

    int newOrderIndex = targetCount == 0 ? 0 : port.getMaxOrderIndex(targetWorkspaceId) + 1;
    boolean isTargetVisible = targetCount < DEFAULT_VISIBLE_COLUMN_LIMIT;

    column.moveToWorkspace(targetWorkspaceId, newOrderIndex, isTargetVisible);
    return port.save(column);
  }
}
