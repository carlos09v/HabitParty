package com.habitparty.application.usecases.workspace;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.FocusRecordRepository;
import com.habitparty.application.ports.ProfileHighlightRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.enums.HighlightType;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
@Transactional
public class DeleteWorkspaceUseCase {
  private final WorkspaceRepository port;
  private final BoardColumnRepository boardColumnPort;
  private final TaskRepository taskPort;
  private final FocusRecordRepository focusRecordPort;
  private final ProfileHighlightRepository profileHighlightPort;

  public DeleteWorkspaceUseCase(
      WorkspaceRepository port,
      BoardColumnRepository boardColumnPort,
      TaskRepository taskPort) {
    this(port, boardColumnPort, taskPort, null, null);
  }

  @Autowired
  public DeleteWorkspaceUseCase(
      WorkspaceRepository port,
      BoardColumnRepository boardColumnPort,
      TaskRepository taskPort,
      FocusRecordRepository focusRecordPort,
      ProfileHighlightRepository profileHighlightPort) {
    this.port = port;
    this.boardColumnPort = boardColumnPort;
    this.taskPort = taskPort;
    this.focusRecordPort = focusRecordPort;
    this.profileHighlightPort = profileHighlightPort;
  }

  public void execute(UUID workspaceId, UUID userIdLogado) {
    // 1. Busca o Workspace e verifica se existe
    Workspace workspace = port.findById(workspaceId)
        .orElseThrow(() -> new ResourceNotFoundException("Workspace não encontrado!"));

    // 2. Verifica se o usuário logado é o dono desse workspace (Segurança)
    workspace.validateOwnership(userIdLogado);

    // 3. Cascata manual bottom-up: referências órfãs -> checklists/tasks -> board_columns -> workspace
    List<UUID> columnIds = boardColumnPort.findAllByWorkspaceId(workspaceId).stream()
        .map(BoardColumn::getId)
        .toList();

    if (!columnIds.isEmpty()) {
      List<UUID> deletedTaskIds = taskPort.findIdsByBoardColumnIds(columnIds);
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
    }

    taskPort.deleteAllByBoardColumnIds(columnIds);
    boardColumnPort.deleteAllByWorkspaceId(workspaceId);
    port.deleteById(workspaceId);
  }
}
