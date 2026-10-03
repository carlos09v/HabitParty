package com.habitparty.application.ports;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.enums.InventoryItemStatus;

public interface InventoryItemRepository {
    InventoryItem save(InventoryItem inventoryItem);
    Optional<InventoryItem> findById(UUID id);
    List<InventoryItem> saveAll(List<InventoryItem> inventoryItems);
    int countByUserId(UUID userId);
    
    // Busca os itens na mochila para exibir no Front-end
    List<InventoryItem> findByUserIdAndStatusIn(UUID userId, List<InventoryItemStatus> statuses);
    
    // Para a criação da coluna gerar o index a partir do ultimo gerado
    int getMaxOrderIndex(UUID userId);
}
