package com.habitparty.application.usecases.task;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.ports.UserRepository;
import com.habitparty.application.ports.WorkspaceRepository;
import com.habitparty.application.ports.projections.FocusableTaskDTO;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.User;
import com.habitparty.core.domain.entities.Workspace;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ListFocusableTasksUseCase {
  private final UserRepository userRepository;
  private final WorkspaceRepository workspaceRepository;
  private final TaskRepository taskRepository;

  public ListFocusableTasksUseCase(
      UserRepository userRepository,
      WorkspaceRepository workspaceRepository,
      TaskRepository taskRepository) {
    this.userRepository = userRepository;
    this.workspaceRepository = workspaceRepository;
    this.taskRepository = taskRepository;
  }

  @Transactional(readOnly = true)
  public List<FocusableTaskDTO> execute(UUID userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado!"));
    List<Workspace> workspaces = workspaceRepository.findAllByUserId(userId);
    if (workspaces == null || workspaces.isEmpty()) {
      return List.of();
    }

    List<UUID> allowedWorkspaceIds = (user.isPremium()
        ? workspaces.stream()
        : workspaces.stream().limit(WorkspaceWriteGuard.FREE_ACTIVE_WORKSPACE_LIMIT))
        .map(Workspace::getId)
        .filter(id -> id != null)
        .toList();

    if (allowedWorkspaceIds.isEmpty()) {
      return List.of();
    }

    return taskRepository.findFocusableTasksByWorkspaceIds(userId, allowedWorkspaceIds);
  }
}
