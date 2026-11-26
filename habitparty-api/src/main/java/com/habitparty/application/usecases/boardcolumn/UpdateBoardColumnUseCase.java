package com.habitparty.application.usecases.boardcolumn;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class UpdateBoardColumnUseCase {
  private final BoardColumnRepository port;
  private WorkspaceWriteGuard workspaceWriteGuard;

  public UpdateBoardColumnUseCase(BoardColumnRepository port) {
    this.port = port;
  }

  @Autowired
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  public BoardColumn execute(UUID boardColumnId, UpdateBoardColumnCommand command, UUID userIdLogado) {
    return execute(boardColumnId, userIdLogado, command.name(), command.icon());
  }

  public BoardColumn execute(UUID boardColumnId, UUID userIdLogado, String name, String icon) {
    BoardColumn boardColumn = port.findById(boardColumnId)
      .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada!"));

    boardColumn.validateOwnership(userIdLogado);
    if (workspaceWriteGuard != null) {
      workspaceWriteGuard.assertWorkspaceWritable(
          boardColumn.getWorkspaceId(),
          userIdLogado,
          "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para editar listas nele!");
    }

    boardColumn.updateDetails(name, icon);

    return port.save(boardColumn);
  }
}
