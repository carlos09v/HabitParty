package com.habitparty.application.usecases.task.checklistItem;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.habitparty.adapters.in.web.dtos.response.ChecklistItemResponseDTO;
import com.habitparty.application.ports.TaskRepository;
import com.habitparty.core.domain.entities.task.ChecklistItem;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class ToggleChecklistItemUseCase {
  private final TaskRepository taskPort;

    public ToggleChecklistItemUseCase(TaskRepository taskPort) {
        this.taskPort = taskPort;
    }

    public ChecklistItemResponseDTO execute(UUID itemId, UUID userIdLogado) {
        ChecklistItem item = taskPort.findChecklistItemByIdAndUserId(itemId, userIdLogado)
            .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado ou acesso negado."));

        item.toggle();

        ChecklistItem savedItem = taskPort.saveChecklistItem(item);

        return ChecklistItemResponseDTO.fromDomain(savedItem);
    }
}
