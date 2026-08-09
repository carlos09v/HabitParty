package com.habitparty.application.usecases.board_column;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.WorkspaceNotFoundExeption;

@Service
public class ListUserBoardColumns {
  private final WorkspaceRepository workspacePort;
  private final BoardColumnRepository port;


  public ListUserBoardColumns(WorkspaceRepository workspacePort, BoardColumnRepository port) {
    this.workspacePort = workspacePort;
    this.port = port;
  }

  public List<BoardColumn> execute(UUID workspaceId, UUID userIdLogado) {
    // Verificar se o workspace existe.
    Workspace workspace = workspacePort.findById(workspaceId)
        .orElseThrow(() -> new WorkspaceNotFoundExeption("Workspace não encontrado!"));

    workspace.validateOwnership(userIdLogado);

    return port.findAllByWorkspaceId(workspaceId);
  }
}
