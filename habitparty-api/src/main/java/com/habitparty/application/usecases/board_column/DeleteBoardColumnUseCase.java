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
    BoardColumn board_Column = port.findById(boardColumnId)
        .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada!"));

    board_Column.validateOwnership(userIdLogado);

    // Pra depois: garantir que ao deletar isso, tambem delete Tasks

    port.deleteById(boardColumnId);
  }
}
