package com.habitparty.application.usecases.boardcolumn;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.enums.HighlightType;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class DeleteBoardColumnUseCase {
  private final BoardColumnRepository port;
  private final TaskRepository taskPort;
  private final FocusRecordRepository focusRecordPort;
  private final ProfileHighlightRepository profileHighlightPort;
  private WorkspaceWriteGuard workspaceWriteGuard;

  public DeleteBoardColumnUseCase(BoardColumnRepository port, TaskRepository taskPort) {
    this(port, taskPort, null, null, null);
  }

  @Autowired
  public DeleteBoardColumnUseCase(
      BoardColumnRepository port,
      TaskRepository taskPort,
      FocusRecordRepository focusRecordPort,
      ProfileHighlightRepository profileHighlightPort,
      WorkspaceWriteGuard workspaceWriteGuard) {
    this.port = port;
    this.taskPort = taskPort;
    this.focusRecordPort = focusRecordPort;
    this.profileHighlightPort = profileHighlightPort;
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  @Transactional
  public void execute(UUID boardColumnId, UUID userIdLogado) {
    // 1. Busca a coluna e verifica posse e trava do plano Free
    BoardColumn column = port.findById(boardColumnId)
        .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada!"));

    column.validateOwnership(userIdLogado);
    if (workspaceWriteGuard != null) {
      workspaceWriteGuard.assertWorkspaceWritable(
          column.getWorkspaceId(),
          userIdLogado,
          "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para excluir listas nele!");
    }

    // 2. Salva os valores antes de deletar
    UUID workspaceId = column.getWorkspaceId();
    int deletedIndex = column.getOrderIndex();

    // 3. Limpa referências órfãs (focus_records.task_id e destaques TASK_STREAK) antes de excluir tarefas
    List<UUID> deletedTaskIds = taskPort.findIdsByBoardColumnIds(List.of(boardColumnId));
    if (!deletedTaskIds.isEmpty()) {
      if (focusRecordPort != null) {
        focusRecordPort.nullifyTaskIds(deletedTaskIds);
      }
      if (profileHighlightPort != null) {
        List<String> keys = deletedTaskIds.stream().map(UUID::toString).toList();
        profileHighlightPort.deleteByUserIdAndHighlightTypeAndHighlightKeys(
            userIdLogado,
            HighlightType.TASK_STREAK,
            keys);
      }
    }

    // 4. Deleta as tasks ANTES de deletar a coluna (Cascade manual e rápido)
    taskPort.deleteAllByBoardColumnId(boardColumnId);
    port.deleteById(boardColumnId);

    // 5. Puxa as colunas restantes para fechar o "buraco"
    port.shiftColumnsDown(workspaceId, deletedIndex);
  }
}
