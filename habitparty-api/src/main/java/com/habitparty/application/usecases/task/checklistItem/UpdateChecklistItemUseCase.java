package com.habitparty.application.usecases.task.checklistItem;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.response.ChecklistItemResponseDTO;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service 
public class UpdateChecklistItemUseCase {
  private final TaskRepository port;

    public UpdateChecklistItemUseCase(TaskRepository port) {
        this.port = port;
    }

    // Recebe apenas o nome novo como parâmetro extra!
    public ChecklistItemResponseDTO execute(UUID itemId, UUID userIdLogado, String newName) {
        ChecklistItem item = port.findChecklistItemByIdAndUserId(itemId, userIdLogado)
            .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado."));

        item.updateName(newName);

        ChecklistItem savedItem = port.saveChecklistItem(item);

        return ChecklistItemResponseDTO.fromDomain(savedItem);
    }
}
