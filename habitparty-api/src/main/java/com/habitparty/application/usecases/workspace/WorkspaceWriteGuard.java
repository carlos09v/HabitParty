package com.habitparty.application.usecases.workspace;

import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.habitparty.application.ports.BoardColumnRepository;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.core.domain.entities.BoardColumn;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.LimitExceededException;
import com.habitparty.core.exceptions.ResourceNotFoundException;

/**
 * Centralizes Free-plan read-only workspace enforcement (excess workspaces at index >= 2
 * cannot be mutated across column, task, or checklist operations).
 */
@Component
public class WorkspaceWriteGuard {
  public static final int FREE_ACTIVE_WORKSPACE_LIMIT = 2;
  private static final String DEFAULT_READ_ONLY_MESSAGE =
      "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). "
          + "Faça upgrade para Premium para editar este ambiente!";

  private final WorkspaceRepository workspacePort;
  private final UserRepository userPort;
  private BoardColumnRepository boardColumnPort;

  @Autowired
  public WorkspaceWriteGuard(
      WorkspaceRepository workspacePort,
      UserRepository userPort,
      BoardColumnRepository boardColumnPort) {
    this.workspacePort = workspacePort;
    this.userPort = userPort;
    this.boardColumnPort = boardColumnPort;
  }

  public WorkspaceWriteGuard(WorkspaceRepository workspacePort, UserRepository userPort) {
    this(workspacePort, userPort, null);
  }

  public void assertWorkspaceWritable(UUID workspaceId, UUID userId) {
    assertWorkspaceWritable(workspaceId, userId, DEFAULT_READ_ONLY_MESSAGE);
  }

  public void assertWorkspaceWritable(UUID workspaceId, UUID userId, String message) {
    if (workspaceId == null || userId == null) {
      return;
    }
    User user = userPort.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));
    assertWorkspaceWritable(user, workspaceId, message);
  }

  public void assertWorkspaceWritable(User user, UUID workspaceId, String message) {
    if (user == null || user.isPremium() || workspaceId == null) {
      return;
    }

    List<Workspace> userWorkspaces = workspacePort.findAllByUserId(user.getId());
    int wsIndex = -1;
    for (int i = 0; i < userWorkspaces.size(); i++) {
      if (userWorkspaces.get(i).getId().equals(workspaceId)) {
        wsIndex = i;
        break;
      }
    }

    if (wsIndex >= FREE_ACTIVE_WORKSPACE_LIMIT) {
      throw new LimitExceededException(
          message != null && !message.isBlank() ? message : DEFAULT_READ_ONLY_MESSAGE);
    }
  }

  public void assertColumnWritable(UUID boardColumnId, UUID userId) {
    assertColumnWritable(boardColumnId, userId, DEFAULT_READ_ONLY_MESSAGE);
  }

  public void assertColumnWritable(UUID boardColumnId, UUID userId, String message) {
    if (boardColumnPort == null || boardColumnId == null || userId == null) {
      return;
    }
    User user = userPort.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));
    assertColumnWritable(user, boardColumnId, message);
  }

  public void assertColumnWritable(User user, UUID boardColumnId) {
    assertColumnWritable(user, boardColumnId, DEFAULT_READ_ONLY_MESSAGE);
  }

  public void assertColumnWritable(User user, UUID boardColumnId, String message) {
    if (boardColumnPort == null || user == null || user.isPremium() || boardColumnId == null) {
      return;
    }
    BoardColumn column = boardColumnPort.findById(boardColumnId)
        .orElseThrow(() -> new ResourceNotFoundException("Coluna não encontrada!"));
    assertWorkspaceWritable(user, column.getWorkspaceId(), message);
  }

  public void assertTaskWritable(TaskRepository taskPort, UUID taskId, UUID userId, String message) {
    if (boardColumnPort == null || taskPort == null || taskId == null || userId == null) {
      return;
    }
    User user = userPort.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));
    if (user.isPremium()) {
      return;
    }
    UUID boardColumnId = taskPort.findBoardColumnIdById(taskId)
        .or(() -> taskPort.findById(taskId).map(Task::getBoardColumnId))
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
    assertColumnWritable(user, boardColumnId, message);
  }
}
