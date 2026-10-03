package com.habitparty.application.usecases.board_column;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.exceptions.ResourceNotFoundException;


@Service
public class DeleteBoardColumnUseCase {
  private final BoardColumnRepository port;
  private final TaskRepository taskPort;

  public DeleteBoardColumnUseCase(BoardColumnRepository port, TaskRepository taskPort) {
    this.port = port;
    this.taskPort = taskPort;
  }

  @Transactional 
  public void execute(UUID boardColumnId, UUID userIdLogado) {
    // 1. Busca o Workspace e verifica se existe
    BoardColumn column = port.findById(boardColumnId)
        .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada!"));

    column.validateOwnership(userIdLogado);

    
    // 3. Salva os valores antes de deletar
    UUID workspaceId = column.getWorkspaceId();
    int deletedIndex = column.getOrderIndex();

    // Deleta as tasks ANTES de deletar a coluna (Cascade manual e rápido)
    taskPort.deleteAllByBoardColumnId(boardColumnId);

    port.deleteById(boardColumnId);

    // Puxa as colunas restantes para fechar o "buraco"
    port.shiftColumnsDown(workspaceId, deletedIndex);
  }
}
