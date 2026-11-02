package com.habitparty.application.usecases.boardcolumn;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

  @Transactional
  public void execute(UUID workspaceId, UUID userIdLogado, List<BoardColumnOrderCommand> newOrderList) {
    // Verificar se o workspace existe.
    Workspace workspace = workspacePort.findById(workspaceId)
        .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado!"));
    workspace.validateOwnership(userIdLogado); // Validar identidade

    // 2. Busca as colunas reais do domínio
    List<BoardColumn> columns = port.findAllByWorkspaceId(workspaceId);
    Map<UUID, Integer> newOrderByColumnId = newOrderList.stream()
        .collect(Collectors.toMap(BoardColumnOrderCommand::columnId, BoardColumnOrderCommand::newIndex, (a, b) -> b));

    // (Percorre as colunas em O(N) e atualiza o atributo 'index' com base no mapa)
    for (BoardColumn column : columns) {
      Integer newIndex = newOrderByColumnId.get(column.getId());
      if (newIndex != null) {
        column.setOrderIndex(newIndex);
      }
    }

    port.reorderAll(columns);
  }
}
