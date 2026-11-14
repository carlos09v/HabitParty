package com.habitparty.application.usecases.boardcolumn;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.exceptions.ResourceNotFoundException;


@Service
public class DeleteBoardColumnUseCase {
  private final BoardColumnRepository port;
  private final TaskRepository taskPort;
  private WorkspaceWriteGuard workspaceWriteGuard;

  public DeleteBoardColumnUseCase(BoardColumnRepository port, TaskRepository taskPort) {
    this.port = port;
    this.taskPort = taskPort;
  }

  @Autowired(required = false)
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  @Transactional 
  public void execute(UUID boardColumnId, UUID userIdLogado) {
    // 1. Busca o Workspace e verifica se existe
    BoardColumn column = port.findById(boardColumnId)
        .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada!"));

    column.validateOwnership(userIdLogado);
    if (workspaceWriteGuard != null) {
      workspaceWriteGuard.assertWorkspaceWritable(
          column.getWorkspaceId(),
          userIdLogado,
          "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para excluir listas nele!");
    }

    
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
