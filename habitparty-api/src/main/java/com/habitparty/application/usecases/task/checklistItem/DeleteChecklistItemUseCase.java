package com.habitparty.application.usecases.task.checklistItem;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class DeleteChecklistItemUseCase {
  private final TaskRepository taskRepository;

  public DeleteChecklistItemUseCase(TaskRepository taskRepository) {
    this.taskRepository = taskRepository;
  }

  public void execute(UUID itemId, UUID userIdLogado) {
    ChecklistItem item = taskRepository.findChecklistItemByIdAndUserId(itemId, userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Item não encontrada."));
    item.validateOwnership(userIdLogado);

    taskRepository.deleteChecklistItemById(itemId);
  }
}
