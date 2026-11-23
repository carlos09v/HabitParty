package com.habitparty.application.usecases.task.checklistItem;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class AddChecklistItemUseCase {
  private final TaskRepository taskPort;
  private WorkspaceWriteGuard workspaceWriteGuard;

  public AddChecklistItemUseCase(TaskRepository taskPort) {
    this.taskPort = taskPort;
  }

  @Autowired(required = false)
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  @Transactional
  public ChecklistItem execute(UUID taskId, UUID userIdLogado, String itemName) {
    return execute(taskId, userIdLogado, itemName, false);
  }

  @Transactional
  public ChecklistItem execute(UUID taskId, UUID userIdLogado, String itemName, boolean isRewarded) {
    Task task = ChecklistItemValidationHelper.loadOwnedWritableTask(
        taskPort, workspaceWriteGuard, taskId, userIdLogado);

    if (isRewarded) {
      task.validateCanRewardChecklistItem(null);
    }

    ChecklistItem newItem = new ChecklistItem(
        UUID.randomUUID(),
        taskId,
        userIdLogado,
        itemName,
        false,
        isRewarded,
        task.nextChecklistOrderIndex(),
        false
    );

    return taskPort.saveChecklistItem(newItem);
  }
}
