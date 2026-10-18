package com.habitparty.application.usecases.task.checklistItem;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service 
public class UpdateChecklistItemUseCase {
  private final TaskRepository port;

  public UpdateChecklistItemUseCase(TaskRepository port) {
    this.port = port;
  }

  public ChecklistItem execute(UUID itemId, UUID userIdLogado, String newName) {
    ChecklistItem item = port.findChecklistItemByIdAndUserId(itemId, userIdLogado)
        .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado."));

    item.updateName(newName);

    return port.saveChecklistItem(item);
  }
}
