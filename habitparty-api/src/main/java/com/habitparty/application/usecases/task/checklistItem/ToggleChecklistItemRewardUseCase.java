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
public class ToggleChecklistItemRewardUseCase {
  private final TaskRepository port;
  private WorkspaceWriteGuard workspaceWriteGuard;

  public ToggleChecklistItemRewardUseCase(TaskRepository port) {
    this.port = port;
  }

  @Autowired
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  @Transactional
  public ChecklistItem execute(UUID itemId, UUID userIdLogado) {
    ChecklistItem item = port.findChecklistItemByIdAndUserId(itemId, userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado."));

    boolean nextRewarded = !item.isRewarded();
    if (nextRewarded) {
      Task task = ChecklistItemValidationHelper.loadOwnedWritableTask(
          port, workspaceWriteGuard, item.getTaskId(), userIdLogado);
      task.validateCanRewardChecklistItem(item.getId());
    } else {
      ChecklistItemValidationHelper.assertTaskWritable(
          port, workspaceWriteGuard, item.getTaskId(), userIdLogado);
    }

    item.toggleRewarded();
    return port.saveChecklistItem(item);
  }
}
