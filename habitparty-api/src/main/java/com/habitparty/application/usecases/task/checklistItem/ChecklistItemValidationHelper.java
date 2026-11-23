package com.habitparty.application.usecases.task.checklistItem;

import java.util.UUID;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.application.usecases.workspace.WorkspaceWriteGuard;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.ResourceNotFoundException;

final class ChecklistItemValidationHelper {
  static final String READ_ONLY_CHECKLIST_MESSAGE =
      "Este ambiente está em modo somente-leitura no plano Free (máximo de 2 ambientes ativos). "
          + "Faça upgrade para Premium para editar checklists nele!";

  private ChecklistItemValidationHelper() {}

  static Task loadOwnedWritableTask(
      TaskRepository taskPort,
      WorkspaceWriteGuard workspaceWriteGuard,
      UUID taskId,
      UUID userIdLogado) {
    Task task = taskPort.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
    task.validateOwnership(userIdLogado);
    if (workspaceWriteGuard != null) {
      workspaceWriteGuard.assertColumnWritable(
          task.getBoardColumnId(),
          userIdLogado,
          READ_ONLY_CHECKLIST_MESSAGE);
    }
    return task;
  }

  static void assertTaskWritable(
      TaskRepository taskPort,
      WorkspaceWriteGuard workspaceWriteGuard,
      UUID taskId,
      UUID userIdLogado) {
    if (workspaceWriteGuard != null) {
      workspaceWriteGuard.assertTaskWritable(
          taskPort,
          taskId,
          userIdLogado,
          READ_ONLY_CHECKLIST_MESSAGE);
    }
  }
}
