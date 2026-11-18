package com.habitparty.application.usecases.inventory;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.habitparty.application.ports.InventoryItemRepository;
import com.habitparty.core.domain.entities.InventoryItem;
import com.habitparty.core.domain.enums.InventoryItemStatus;

@Service
public class ReorderInventoryItemUseCase {
    private final InventoryItemRepository port;

    public ReorderInventoryItemUseCase(InventoryItemRepository port) {
        this.port = port;
    }

    @Transactional
    public void execute(UUID userId, List<InventoryItemOrderCommand> orderCommands) {
        // 1. Busca os itens da mochila (tanto os disponíveis quanto os que estão em uso no foco)
        List<InventoryItemStatus> statusesToReorder = List.of(
            InventoryItemStatus.AVAILABLE, 
            InventoryItemStatus.IN_FOCUS
        );

        List<InventoryItem> items = port.findByUserIdAndStatusIn(userId, statusesToReorder);
        Map<UUID, Integer> newOrderByItemId = orderCommands.stream()
            .collect(Collectors.toMap(InventoryItemOrderCommand::itemId, InventoryItemOrderCommand::newIndex, (a, b) -> b));

        // 2. Atualiza o orderIndex apenas dos itens cuja posição realmente mudou
        List<InventoryItem> changedItems = items.stream()
            .filter(item -> {
                Integer newIndex = newOrderByItemId.get(item.getId());
                if (newIndex != null && item.getOrderIndex() != newIndex) {
                    item.setOrderIndex(newIndex);
                    return true;
                }
                return false;
            })
            .toList();

        // 3. Salva apenas os itens alterados no banco em lote
        if (!changedItems.isEmpty()) {
            port.saveAll(changedItems);
        }
    }
}
