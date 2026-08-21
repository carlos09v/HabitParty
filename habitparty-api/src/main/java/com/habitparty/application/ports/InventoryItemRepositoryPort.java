package com.habitparty.application.ports;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.enums.InventoryItemStatus;

public interface InventoryItemRepositoryPort {
    InventoryItem save(InventoryItem inventoryItem);
    Optional<InventoryItem> findById(UUID id);
    void reorderAll(List<InventoryItem> inventoryItems);
    int countByUserId(UUID userId);
    
    // Busca os itens na mochila para exibir no Front-end
    List<InventoryItem> findByUserIdAndStatusOrderByOrderIndexAsc(UUID userId, InventoryItemStatus status);
    
    // Para a criação da coluna gerar o index a partir do ultimo gerado
    int getMaxOrderIndex(UUID userId);
}
