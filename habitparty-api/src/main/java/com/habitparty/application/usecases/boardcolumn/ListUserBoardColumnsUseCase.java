package com.habitparty.application.usecases.boardcolumn;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.projections.BoardColumnSummaryDTO;
import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ListUserBoardColumnsUseCase {
  private final WorkspaceRepository workspacePort;
  private final BoardColumnRepository port;


  public ListUserBoardColumnsUseCase(WorkspaceRepository workspacePort, BoardColumnRepository port) {
    this.workspacePort = workspacePort;
    this.port = port;
  }

  public List<BoardColumnSummaryDTO> execute(UUID workspaceId, UUID userIdLogado) {
    // Verificar se o workspace existe.
    Workspace workspace = workspacePort.findById(workspaceId)
        .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado!"));

    workspace.validateOwnership(userIdLogado);

    return port.getColumnSummaries(workspaceId);
  }
}
