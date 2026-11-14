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
public class UpdateChecklistItemUseCase {
  private final TaskRepository port;
  private WorkspaceWriteGuard workspaceWriteGuard;

  public UpdateChecklistItemUseCase(TaskRepository port) {
    this.port = port;
  }

  @Autowired(required = false)
  public void setWorkspaceWriteGuard(WorkspaceWriteGuard workspaceWriteGuard) {
    this.workspaceWriteGuard = workspaceWriteGuard;
  }

  @Transactional
  public ChecklistItem execute(UUID itemId, UUID userIdLogado, String newName) {
    ChecklistItem item = port.findChecklistItemByIdAndUserId(itemId, userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado."));

    if (workspaceWriteGuard != null) {
      workspaceWriteGuard.assertTaskWritable(
          port,
          item.getTaskId(),
          userIdLogado,
          "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). Faça upgrade para Premium para editar checklists nele!");
    }

    item.updateName(newName);

    return port.saveChecklistItem(item);
  }
}
