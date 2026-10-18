package com.habitparty.application.usecases.inventory;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.exceptions.ResourceNotFoundException;

@Service
public class SendItemToFocusUseCase {
  private final InventoryItemRepository port;

    public SendItemToFocusUseCase(InventoryItemRepository port) {
        this.port = port;
    }

    @Transactional
    public void execute(UUID itemId, UUID userIdLogado) {
        InventoryItem item = port.findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("Item não encontrado"));
            
        item.validateOwnership(userIdLogado);
        
        
        item.sendToFocus();
        
        port.save(item);
    }
}
