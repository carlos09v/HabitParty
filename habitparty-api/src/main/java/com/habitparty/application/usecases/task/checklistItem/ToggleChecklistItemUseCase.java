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
public class ToggleChecklistItemUseCase {
  private final TaskRepository taskPort;
  private WorkspaceWriteGuard workspaceWriteGuard;

  public ToggleChecklistItemUseCase(TaskRepository taskPort) {
    this.taskPort = taskPort;
  }

  @Autowired(required = false)
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  @Transactional
  public ChecklistItem execute(UUID itemId, UUID userIdLogado) {
    ChecklistItem item = taskPort.findChecklistItemByIdAndUserId(itemId, userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado ou acesso negado."));

    ChecklistItemValidationHelper.assertTaskWritable(
        taskPort, workspaceWriteGuard, item.getTaskId(), userIdLogado);

    item.toggle();

    return taskPort.saveChecklistItem(item);
  }
}
