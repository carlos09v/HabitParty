package com.habitparty.application.usecases.task.checklistItem;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class DeleteChecklistItemUseCase {
  private final TaskRepository taskRepository;
  private WorkspaceWriteGuard workspaceWriteGuard;

  public DeleteChecklistItemUseCase(TaskRepository taskRepository) {
    this.taskRepository = taskRepository;
  }

  @Autowired
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  @Transactional
  public void execute(UUID itemId, UUID userIdLogado) {
    ChecklistItem item = taskRepository.findChecklistItemByIdAndUserId(itemId, userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Item não encontrada."));
    item.validateOwnership(userIdLogado);

    ChecklistItemValidationHelper.assertTaskWritable(
        taskRepository, workspaceWriteGuard, item.getTaskId(), userIdLogado);

    taskRepository.deleteChecklistItemById(itemId);
  }
}
