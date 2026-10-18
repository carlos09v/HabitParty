package com.habitparty.application.usecases.inventory;

import java.util.List;
import java.util.UUID;

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

        // 2. Atualiza o orderIndex de cada item cruzando com os comandos recebidos
        for (InventoryItem item : items) {
            orderCommands.stream()
                .filter(cmd -> cmd.itemId().equals(item.getId()))
                .findFirst()
                .ifPresent(cmd -> item.setOrderIndex(cmd.newIndex()));
        }

        // 3. Salva a lista atualizada no banco em lote
        port.saveAll(items);
    }
}
