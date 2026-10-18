package com.habitparty.application.usecases.task.checklistItem;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.domain.entities.task.Task;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class AddChecklistItemUseCase {
  private final TaskRepository taskPort;

  public AddChecklistItemUseCase(TaskRepository taskPort) {
    this.taskPort = taskPort;
  }

  public ChecklistItem execute(UUID taskId, UUID userIdLogado, String itemName) {
    Task task = taskPort.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada."));
    task.validateOwnership(userIdLogado);

    ChecklistItem newItem = new ChecklistItem(
        UUID.randomUUID(),
        taskId,
        userIdLogado,
        itemName,
        false
    );

    return taskPort.saveChecklistItem(newItem);
  }
}
