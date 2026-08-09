package com.habitparty.application.usecases.board_column;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.request.UpdateColumnOrderDTO;
import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.WorkspaceNotFoundExeption;

@Service
public class ReorderBoardColumnUseCase {
  private final BoardColumnRepository boardColumnPort;
  private final WorkspaceRepository workspacePort;

  public ReorderBoardColumnUseCase(BoardColumnRepository boardColumnPort, WorkspaceRepository workspacePort) {
    this.boardColumnPort = boardColumnPort;
    this.workspacePort = workspacePort;
  }

  public void execute(UUID workspaceId, List<UpdateColumnOrderDTO> newOrderList, UUID userIdLogado) {
    // Verificar se o workspace existe.
    Workspace workspace = workspacePort.findById(workspaceId)
        .orElseThrow(() -> new WorkspaceNotFoundExeption("Workspace não encontrado!"));
    workspace.validateOwnership(userIdLogado); // Validar identidade

    // 2. Busca as colunas reais do domínio
    List<BoardColumn> columns = boardColumnPort.findAllByWorkspaceId(workspaceId);

    // (Percorre as colunas e atualiza o atributo 'index' com base no DTO que o
    // frontend enviou)
    for (BoardColumn column : columns) {
      newOrderList.stream()
          .filter(dto -> dto.board_column_id().equals(column.getId()))
          .findFirst()
          .ifPresent(dto -> column.setOrderIndex(dto.newIndex()));
    }

    boardColumnPort.reorderAll(columns);
  }
}
