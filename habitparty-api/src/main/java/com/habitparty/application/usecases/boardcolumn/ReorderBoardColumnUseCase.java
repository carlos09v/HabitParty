package com.habitparty.application.usecases.boardcolumn;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ReorderBoardColumnUseCase {
  private final BoardColumnRepository port;
  private final WorkspaceRepository workspacePort;

  public ReorderBoardColumnUseCase(BoardColumnRepository port, WorkspaceRepository workspacePort) {
    this.port = port;
    this.workspacePort = workspacePort;
  }

  public void execute(UUID workspaceId, UUID userIdLogado, List<BoardColumnOrderCommand> newOrderList) {
    // Verificar se o workspace existe.
    Workspace workspace = workspacePort.findById(workspaceId)
        .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado!"));
    workspace.validateOwnership(userIdLogado); // Validar identidade
    
    // 2. Busca as colunas reais do domínio
    List<BoardColumn> columns = port.findAllByWorkspaceId(workspaceId);

    // (Percorre as colunas e atualiza o atributo 'index' com base nos comandos)
    for (BoardColumn column : columns) {
      newOrderList.stream()
          .filter(cmd -> cmd.columnId().equals(column.getId()))
          .findFirst()
          .ifPresent(cmd -> column.setOrderIndex(cmd.newIndex()));
    }

    port.reorderAll(columns);
  }
}
