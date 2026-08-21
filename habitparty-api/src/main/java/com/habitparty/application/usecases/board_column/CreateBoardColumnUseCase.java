package com.habitparty.application.usecases.board_column;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.CreateBoardColumnDTO;
import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class CreateBoardColumnUseCase {
  private final WorkspaceRepository workspacePort;
  private final BoardColumnRepository port;

  public CreateBoardColumnUseCase(WorkspaceRepository workspacePort, BoardColumnRepository port) {
    this.workspacePort = workspacePort;
    this.port = port;
  }

  public BoardColumn execute(CreateBoardColumnDTO dto, UUID userIdLogado) {
    // Verificar se o workspace existe.
    Workspace workspace = workspacePort.findById(dto.workspaceId())
        .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado!"));

    workspace.validateOwnership(userIdLogado);

    // Limite de Board Columns por Workspace no Plano Free
    int currentCount = port.countByWorkspaceId(dto.workspaceId());
    if (currentCount >= 6) {
      throw new LimitExceededException(
          "Limite de 6 board columns por workspace atingido no plano gratuito.");
    }

    // 1. Descobre qual é o maior índice atual desse quadro
    int maxIndex = port.getMaxOrderIndex(dto.workspaceId());

    // 2. Define o índice da nova coluna como o maior + 1
    int newIndex = maxIndex + 1;

    BoardColumn newBoard_Column = new BoardColumn(
        UUID.randomUUID(),
        userIdLogado,
        dto.workspaceId(),
        dto.name(),
        newIndex,
        dto.icon());

    return port.save(newBoard_Column);
  }
}
