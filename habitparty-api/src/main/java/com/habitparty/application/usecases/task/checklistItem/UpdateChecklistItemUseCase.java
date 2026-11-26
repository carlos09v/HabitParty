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
public class UpdateChecklistItemUseCase {
  private final TaskRepository port;
  private WorkspaceWriteGuard workspaceWriteGuard;

  public UpdateChecklistItemUseCase(TaskRepository port) {
    this.port = port;
  }

  @Autowired
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  @Transactional
  public ChecklistItem execute(UUID itemId, UUID userIdLogado, String newName) {
    return execute(itemId, userIdLogado, newName, null);
  }

  @Transactional
  public ChecklistItem execute(UUID itemId, UUID userIdLogado, String newName, Boolean isRewarded) {
    ChecklistItem item = port.findChecklistItemByIdAndUserId(itemId, userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado."));

    boolean shouldPromoteReward = Boolean.TRUE.equals(isRewarded) && !item.isRewarded();
    Task task = shouldPromoteReward
        ? ChecklistItemValidationHelper.loadOwnedWritableTask(
            port, workspaceWriteGuard, item.getTaskId(), userIdLogado)
        : null;
    if (!shouldPromoteReward) {
      ChecklistItemValidationHelper.assertTaskWritable(
          port, workspaceWriteGuard, item.getTaskId(), userIdLogado);
    }

    item.updateName(newName);

    if (isRewarded != null) {
      if (shouldPromoteReward) {
        task.validateCanRewardChecklistItem(item.getId());
      }
      item.setRewarded(isRewarded.booleanValue());
    }

    return port.saveChecklistItem(item);
  }
}
