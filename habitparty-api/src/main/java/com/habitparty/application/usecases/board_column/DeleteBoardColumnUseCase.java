package com.habitparty.application.usecases.board_column;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.exceptions.ResourceNotFoundException;


@Service
public class DeleteBoardColumnUseCase {
  private final BoardColumnRepository port;

  public DeleteBoardColumnUseCase(BoardColumnRepository port, WorkspaceRepository workspacePort) {
    this.port = port;
  }

  public void execute(UUID boardColumnId, UUID userIdLogado) {
    // 1. Busca o Workspace e verifica se existe
    BoardColumn column = port.findById(boardColumnId)
        .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada!"));

    column.validateOwnership(userIdLogado);

    
    // 3. Salva os valores antes de deletar
    UUID workspaceId = column.getWorkspaceId();
    int deletedIndex = column.getOrderIndex();

    port.deleteById(boardColumnId);

    // Puxa as colunas restantes para fechar o "buraco"
    port.shiftColumnsDown(workspaceId, deletedIndex);

    // Pra depois: garantir que ao deletar isso, tambem delete Tasks
  }
}
